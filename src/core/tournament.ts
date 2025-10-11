import type { Strategy, PayoffMatrix } from './types';
import { DEFAULT_PAYOFF_MATRIX } from './types';
import { PrisonersDilemmaGame } from './game';
import { createRandomSource } from './random';
import type { EloMatchResult } from '@/lib/rating/elo';
import { processEloMatches } from '@/lib/rating/elo';

export type TournamentFormatKind = 'single-round-robin' | 'double-round-robin' | 'swiss';

export type RoundRobinTournamentFormat =
  | { kind: 'single-round-robin' }
  | { kind: 'double-round-robin' };

export interface SwissTournamentFormat {
  kind: 'swiss';
  rounds?: number;
  tieBreaker?: 'buchholz' | 'sonneborn-berger' | 'total-score';
}

export type TournamentFormat = RoundRobinTournamentFormat | SwissTournamentFormat;

export const DEFAULT_TOURNAMENT_FORMAT: TournamentFormat = { kind: 'single-round-robin' };

const assertUnreachable = (value: never): never => {
  throw new Error(`Unsupported tournament format: ${String(value)}`);
};
export interface SwissRoundMatchSummary {
  player: string;
  opponent: string;
  playerScore: number;
  opponentScore: number;
  winner: 'player' | 'opponent' | 'draw';
}

export interface SwissByeSummary {
  player: string;
  awardedScore: number;
}

export interface SwissLeaderboardEntry {
  name: string;
  totalScore: number;
  wins: number;
  matchesPlayed: number;
  buchholz?: number;
  sonnebornBerger?: number;
}

export interface SwissRoundSummary {
  round: number;
  matches: SwissRoundMatchSummary[];
  byes: SwissByeSummary[];
  leaderboard: SwissLeaderboardEntry[];
}

export interface TournamentOutcome {
  format: TournamentFormat;
  results: TournamentResult[];
  swissRounds?: SwissRoundSummary[];
  ratings: Record<string, number>;
}
export interface HeadToHeadSummary {
  opponent: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  playerScore: number;
  opponentScore: number;
  averageScore: number;
}

export interface TournamentResult {
  name: string;
  totalScore: number;
  averageScore: number;
  matchesPlayed: number;
  wins: number;
  stdDeviation: number;
  headToHead: HeadToHeadSummary[];
  rating?: number;
}

interface HeadToHeadStats {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  playerScore: number;
  opponentScore: number;
}

const createHeadStats = (): HeadToHeadStats => ({
  matches: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  playerScore: 0,
  opponentScore: 0,
});

// Simple tournament - just what we need
export class Tournament {
  private game = new PrisonersDilemmaGame();

  private initializeState(
    strategies: Strategy[],
  ): {
    results: TournamentResult[];
    scores: number[][];
    headToHeadMaps: Map<string, HeadToHeadStats>[];
    eloMatches: EloMatchResult[];
  } {
    const scores: number[][] = strategies.map(() => []);
    const headToHeadMaps: Map<string, HeadToHeadStats>[] = strategies.map(() => new Map());
    const eloMatches: EloMatchResult[] = [];
    const results: TournamentResult[] = strategies.map((strategy) => ({
      name: strategy.name,
      totalScore: 0,
      averageScore: 0,
      matchesPlayed: 0,
      wins: 0,
      stdDeviation: 0,
      headToHead: [],
    }));

    return { results, scores, headToHeadMaps, eloMatches };
  }

  private updateHeadToHead(
    map: Map<string, HeadToHeadStats>,
    opponent: string,
    playerScore: number,
    opponentScore: number,
  ) {
    const entry = map.get(opponent) ?? createHeadStats();
    entry.matches += 1;
    entry.playerScore += playerScore;
    entry.opponentScore += opponentScore;
    if (playerScore > opponentScore) entry.wins += 1;
    else if (playerScore === opponentScore) entry.draws += 1;
    else entry.losses += 1;
    map.set(opponent, entry);
  }

  private finalizeResults(
    results: TournamentResult[],
    scores: number[][],
    headToHeadMaps: Map<string, HeadToHeadStats>[],
    sortResults: (a: TournamentResult, b: TournamentResult) => number = (a, b) =>
      b.totalScore - a.totalScore,
  ): TournamentResult[] {
    results.forEach((result, index) => {
      if (result.matchesPlayed > 0) {
        result.averageScore = result.totalScore / result.matchesPlayed;
        const playerScores = scores[index];
        if (playerScores.length > 1) {
          const mean = result.averageScore;
          const variance =
            playerScores.reduce((acc, score) => acc + (score - mean) ** 2, 0) / playerScores.length;
          result.stdDeviation = Math.sqrt(variance);
        } else {
          result.stdDeviation = 0;
        }
      }

      const headSummaries: HeadToHeadSummary[] = [];
      headToHeadMaps[index].forEach((stats, opponent) => {
        headSummaries.push({
          opponent,
          matches: stats.matches,
          wins: stats.wins,
          draws: stats.draws,
          losses: stats.losses,
          playerScore: stats.playerScore,
          opponentScore: stats.opponentScore,
          averageScore: stats.playerScore / stats.matches,
        });
      });
      headSummaries.sort((a, b) => b.averageScore - a.averageScore);
      result.headToHead = headSummaries;
    });

    results.sort(sortResults);

    return results;
  }

  runWithFormat(
    format: TournamentFormat,
    strategies: Strategy[],
    roundsPerMatch: number = 100,
    errorRate: number = 0,
    payoffMatrix: PayoffMatrix = DEFAULT_PAYOFF_MATRIX,
    seed?: number | string,
  ): TournamentOutcome {
    switch (format.kind) {
      case 'single-round-robin': {
        const { results, ratings } = this.run(strategies, roundsPerMatch, errorRate, payoffMatrix, seed, false);
        return { format, results, ratings };
      }
      case 'double-round-robin': {
        const { results, ratings } = this.run(strategies, roundsPerMatch, errorRate, payoffMatrix, seed, true);
        return { format, results, ratings };
      }
      case 'swiss': {
        const { results, rounds, ratings } = this.runSwiss(
          format,
          strategies,
          roundsPerMatch,
          errorRate,
          payoffMatrix,
          seed,
        );
        return { format, results, swissRounds: rounds, ratings };
      }
      default:
        return assertUnreachable(format as never);
    }
  }

  /**
   * Run a round-robin tournament
   */
  run(
    strategies: Strategy[],
    roundsPerMatch: number = 100,
    errorRate: number = 0,
    payoffMatrix: PayoffMatrix = DEFAULT_PAYOFF_MATRIX,
    seed?: number | string,
    doubleRoundRobin: boolean = false,
  ): { results: TournamentResult[]; ratings: Record<string, number> } {
    if (strategies.length < 2) {
      throw new Error('Need at least 2 strategies');
    }

    const seededRandom = seed !== undefined ? createRandomSource(seed) : undefined;

    const { results, scores, headToHeadMaps, eloMatches } = this.initializeState(strategies);

    for (let i = 0; i < strategies.length; i++) {
      for (let j = i + 1; j < strategies.length; j++) {
        const randomSource = seededRandom ?? createRandomSource();
        const match = this.game.playMatch(
          strategies[i],
          strategies[j],
          roundsPerMatch,
          errorRate,
          payoffMatrix,
          randomSource,
        );

        results[i].totalScore += match.player1Score;
        results[j].totalScore += match.player2Score;
        results[i].matchesPlayed += 1;
        results[j].matchesPlayed += 1;

        scores[i].push(match.player1Score);
        scores[j].push(match.player2Score);

        this.updateHeadToHead(headToHeadMaps[i], strategies[j].name, match.player1Score, match.player2Score);
        this.updateHeadToHead(headToHeadMaps[j], strategies[i].name, match.player2Score, match.player1Score);

        if (match.player1Score > match.player2Score) results[i].wins += 1;
        else if (match.player2Score > match.player1Score) results[j].wins += 1;

        const outcome: EloMatchResult['outcome'] =
          match.player1Score > match.player2Score
            ? 'win'
            : match.player2Score > match.player1Score
            ? 'loss'
            : 'draw';
        eloMatches.push({
          player: strategies[i].name,
          opponent: strategies[j].name,
          outcome,
        });

        if (doubleRoundRobin) {
          const randomSourceRematch = seededRandom ?? createRandomSource();
          const rematch = this.game.playMatch(
            strategies[j],
            strategies[i],
            roundsPerMatch,
            errorRate,
            payoffMatrix,
            randomSourceRematch,
          );

          results[i].totalScore += rematch.player2Score;
          results[j].totalScore += rematch.player1Score;
          results[i].matchesPlayed += 1;
          results[j].matchesPlayed += 1;

          scores[i].push(rematch.player2Score);
          scores[j].push(rematch.player1Score);

          this.updateHeadToHead(headToHeadMaps[i], strategies[j].name, rematch.player2Score, rematch.player1Score);
          this.updateHeadToHead(headToHeadMaps[j], strategies[i].name, rematch.player1Score, rematch.player2Score);

          if (rematch.player2Score > rematch.player1Score) results[i].wins += 1;
          else if (rematch.player1Score > rematch.player2Score) results[j].wins += 1;

          const rematchOutcome: EloMatchResult['outcome'] =
            rematch.player2Score > rematch.player1Score
              ? 'win'
              : rematch.player1Score > rematch.player2Score
              ? 'loss'
              : 'draw';
          eloMatches.push({
            player: strategies[j].name,
            opponent: strategies[i].name,
            outcome: rematchOutcome,
          });
        }
      }
    }

    const finalized = this.finalizeResults(results, scores, headToHeadMaps);
    const ratings = processEloMatches(
      Object.fromEntries(finalized.map((result) => [result.name, result.rating ?? undefined])),
      eloMatches,
    );

    const enriched = finalized.map((result) => ({
      ...result,
      rating: ratings[result.name] ?? result.rating ?? null,
    }));

    return { results: enriched, ratings };
  }

  private runSwiss(
    format: SwissTournamentFormat,
    strategies: Strategy[],
    roundsPerMatch: number,
    errorRate: number,
    payoffMatrix: PayoffMatrix,
    seed?: number | string,
  ): { results: TournamentResult[]; rounds: SwissRoundSummary[]; ratings: Record<string, number> } {
    if (strategies.length < 2) {
      throw new Error('Need at least 2 strategies');
    }

    const seededRandom = seed !== undefined ? createRandomSource(seed) : undefined;
    const { results, scores, headToHeadMaps, eloMatches } = this.initializeState(strategies);

    const pairHistory: Array<Set<number>> = strategies.map(() => new Set<number>());
    const byeHistory = new Set<number>();
    const opponentRecords: Array<Array<{ opponent: number; result: 'win' | 'loss' | 'draw' }>> = strategies.map(
      () => [],
    );
    const roundSummaries: SwissRoundSummary[] = [];

    const totalRounds = Math.max(1, format.rounds ?? Math.ceil(Math.log2(strategies.length)) + 1);
    const tieBreaker = format.tieBreaker ?? 'total-score';

    const computeTieBreakers = () => {
      const buchholz = results.map(() => 0);
      const sonneborn = results.map(() => 0);

      opponentRecords.forEach((records, index) => {
        let buchholzSum = 0;
        let sonnebornSum = 0;

        records.forEach(({ opponent, result }) => {
          if (opponent < 0) return;
          const opponentScore = results[opponent]?.totalScore ?? 0;
          buchholzSum += opponentScore;

          if (result === 'win') sonnebornSum += opponentScore;
          else if (result === 'draw') sonnebornSum += opponentScore / 2;
        });

        buchholz[index] = buchholzSum;
        sonneborn[index] = sonnebornSum;
      });

      return { buchholz, sonneborn };
    };

    const compareIndices = (
      aIndex: number,
      bIndex: number,
      buchholz: number[],
      sonneborn: number[],
    ) => {
      const scoreDiff = results[bIndex].totalScore - results[aIndex].totalScore;
      if (scoreDiff !== 0) return scoreDiff;

      if (tieBreaker === 'buchholz') {
        const diff = buchholz[bIndex] - buchholz[aIndex];
        if (diff !== 0) return diff;
      } else if (tieBreaker === 'sonneborn-berger') {
        const diff = sonneborn[bIndex] - sonneborn[aIndex];
        if (diff !== 0) return diff;
      }

      const winDiff = results[bIndex].wins - results[aIndex].wins;
      if (winDiff !== 0) return winDiff;

      return strategies[aIndex].name.localeCompare(strategies[bIndex].name);
    };

    for (let round = 0; round < totalRounds; round++) {
      const { buchholz: preRoundBuchholz, sonneborn: preRoundSonneborn } = computeTieBreakers();
      const ranked = [...Array(strategies.length).keys()].sort((a, b) =>
        compareIndices(a, b, preRoundBuchholz, preRoundSonneborn),
      );
      const available = [...ranked];
      const pairings: Array<[number, number]> = [];
      const roundMatches: SwissRoundMatchSummary[] = [];
      const roundByes: SwissByeSummary[] = [];

      let byePlayer: number | null = null;
      if (available.length % 2 !== 0) {
        const candidate =
          [...available].reverse().find((index) => !byeHistory.has(index)) ?? available[available.length - 1];
        available.splice(available.indexOf(candidate), 1);
        byePlayer = candidate;
        byeHistory.add(candidate);
      }

      while (available.length > 0) {
        const player = available.shift()!;
        let opponentIdx = available.findIndex((index) => !pairHistory[player].has(index));
        if (opponentIdx === -1) {
          opponentIdx = 0;
        }
        const opponent = available.splice(opponentIdx, 1)[0];
        pairings.push([player, opponent]);
      }

      pairings.forEach(([playerIndex, opponentIndex]) => {
        const randomSource = seededRandom ?? createRandomSource();
        const match = this.game.playMatch(
          strategies[playerIndex],
          strategies[opponentIndex],
          roundsPerMatch,
          errorRate,
          payoffMatrix,
          randomSource,
        );

        results[playerIndex].totalScore += match.player1Score;
        results[opponentIndex].totalScore += match.player2Score;
        results[playerIndex].matchesPlayed += 1;
        results[opponentIndex].matchesPlayed += 1;

        scores[playerIndex].push(match.player1Score);
        scores[opponentIndex].push(match.player2Score);

        this.updateHeadToHead(
          headToHeadMaps[playerIndex],
          strategies[opponentIndex].name,
          match.player1Score,
          match.player2Score,
        );
        this.updateHeadToHead(
          headToHeadMaps[opponentIndex],
          strategies[playerIndex].name,
          match.player2Score,
          match.player1Score,
        );

        let playerResult: 'win' | 'loss' | 'draw' = 'draw';
        if (match.player1Score > match.player2Score) {
          results[playerIndex].wins += 1;
          playerResult = 'win';
        } else if (match.player2Score > match.player1Score) {
          results[opponentIndex].wins += 1;
          playerResult = 'loss';
        }

        const opponentResult: 'win' | 'loss' | 'draw' =
          playerResult === 'win' ? 'loss' : playerResult === 'loss' ? 'win' : 'draw';

        opponentRecords[playerIndex].push({ opponent: opponentIndex, result: playerResult });
        opponentRecords[opponentIndex].push({ opponent: playerIndex, result: opponentResult });

        pairHistory[playerIndex].add(opponentIndex);
        pairHistory[opponentIndex].add(playerIndex);

        const winner: 'player' | 'opponent' | 'draw' =
          match.player1Score > match.player2Score
            ? 'player'
            : match.player2Score > match.player1Score
            ? 'opponent'
            : 'draw';

        roundMatches.push({
          player: strategies[playerIndex].name,
          opponent: strategies[opponentIndex].name,
          playerScore: match.player1Score,
          opponentScore: match.player2Score,
          winner,
        });
        const outcome: EloMatchResult['outcome'] =
          winner === 'player' ? 'win' : winner === 'opponent' ? 'loss' : 'draw';
        eloMatches.push({
          player: strategies[playerIndex].name,
          opponent: strategies[opponentIndex].name,
          outcome,
        });
      });

      if (byePlayer !== null) {
        const byeScore = roundsPerMatch * payoffMatrix.reward;
        results[byePlayer].totalScore += byeScore;
        results[byePlayer].matchesPlayed += 1;
        results[byePlayer].wins += 1;
        scores[byePlayer].push(byeScore);
        roundByes.push({ player: strategies[byePlayer].name, awardedScore: byeScore });
      }

      const { buchholz, sonneborn } = computeTieBreakers();
      const leaderboardOrder = [...Array(strategies.length).keys()].sort((a, b) =>
        compareIndices(a, b, buchholz, sonneborn),
      );
      const leaderboard: SwissLeaderboardEntry[] = leaderboardOrder.map((index) => ({
        name: strategies[index].name,
        totalScore: results[index].totalScore,
        wins: results[index].wins,
        matchesPlayed: results[index].matchesPlayed,
        ...(tieBreaker === 'buchholz'
          ? { buchholz: buchholz[index] }
          : tieBreaker === 'sonneborn-berger'
          ? { sonnebornBerger: sonneborn[index] }
          : {}),
      }));

      roundSummaries.push({
        round: round + 1,
        matches: roundMatches,
        byes: roundByes,
        leaderboard,
      });
    }

    const { buchholz, sonneborn } = computeTieBreakers();
    const referenceResults = results.slice();
    const resultIndexMap = new Map<TournamentResult, number>();
    referenceResults.forEach((result, index) => {
      resultIndexMap.set(result, index);
    });

    const sortResults = (a: TournamentResult, b: TournamentResult) => {
      const aIndex = resultIndexMap.get(a);
      const bIndex = resultIndexMap.get(b);
      if (aIndex === undefined || bIndex === undefined) {
        return 0;
      }

      const scoreDiff = referenceResults[bIndex].totalScore - referenceResults[aIndex].totalScore;
      if (scoreDiff !== 0) return scoreDiff;

      if (tieBreaker === 'buchholz') {
        const diff = buchholz[bIndex] - buchholz[aIndex];
        if (diff !== 0) return diff;
      } else if (tieBreaker === 'sonneborn-berger') {
        const diff = sonneborn[bIndex] - sonneborn[aIndex];
        if (diff !== 0) return diff;
      } else {
        const winDiff = referenceResults[bIndex].wins - referenceResults[aIndex].wins;
        if (winDiff !== 0) return winDiff;
      }

      const winDiff = referenceResults[bIndex].wins - referenceResults[aIndex].wins;
      if (winDiff !== 0) return winDiff;

      return strategies[aIndex].name.localeCompare(strategies[bIndex].name);
    };

    const finalized = this.finalizeResults(results, scores, headToHeadMaps, sortResults);
    const ratings = processEloMatches(
      Object.fromEntries(finalized.map((result) => [result.name, result.rating ?? undefined])),
      eloMatches,
    );
    const enriched = finalized.map((result) => ({
      ...result,
      rating: ratings[result.name] ?? result.rating ?? null,
    }));

    return { results: enriched, rounds: roundSummaries, ratings };
  }


  /**
   * Format results into displayable strings
   */
  formatResults(results: TournamentResult[]): string[] {
    const lines: string[] = [
      '=== TOURNAMENT RESULTS ===',
      'Rank | Strategy          | Score | Avg   | Std   | Wins | Matches',
      '-----|-------------------|-------|-------|-------|------|--------',
    ];

    results.forEach((result, index) => {
      const rank = (index + 1).toString().padStart(4);
      const name = result.name.padEnd(17);
      const score = result.totalScore.toString().padStart(5);
      const average = result.averageScore.toFixed(2).padStart(5);
      const std = result.stdDeviation.toFixed(2).padStart(5);
      const wins = result.wins.toString().padStart(4);
      const matches = result.matchesPlayed.toString().padStart(6);
      lines.push(`${rank} | ${name} | ${score} | ${average} | ${std} | ${wins} | ${matches}`);
    });

    return lines;
  }
}





