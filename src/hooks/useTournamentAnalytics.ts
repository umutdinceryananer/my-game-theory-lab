import { useCallback, useMemo } from "react";

import type { HeadToHeadSummary, TournamentResult } from "@/core/tournament";

export interface HeadToHeadAnalytics extends HeadToHeadSummary {
  scoreDifferential: number;
  winRate: number;
  lossRate: number;
  drawRate: number;
}

export interface StrategyAnalytics {
  name: string;
  rating: number | null;
  totalScore: number;
  averageScore: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  stdDeviation: number;
  headToHead: HeadToHeadAnalytics[];
}

export interface TournamentAnalyticsValue {
  summaries: StrategyAnalytics[];
  summaryByName: Map<string, StrategyAnalytics>;
  hasResults: boolean;
  getSummary: (name: string | null | undefined) => StrategyAnalytics | null;
}

function enhanceHeadToHead(entry: HeadToHeadSummary): HeadToHeadAnalytics {
  const { matches, wins, draws, losses, playerScore, opponentScore } = entry;
  const winRate = matches > 0 ? wins / matches : 0;
  const drawRate = matches > 0 ? draws / matches : 0;
  const lossRate = matches > 0 ? losses / matches : 0;

  return {
    ...entry,
    scoreDifferential: playerScore - opponentScore,
    winRate,
    drawRate,
    lossRate,
  };
}

function summarizeResult(result: TournamentResult): StrategyAnalytics {
  const aggregates = result.headToHead.reduce(
    (acc, entry) => {
      acc.draws += entry.draws;
      acc.losses += entry.losses;
      acc.matches += entry.matches;
      return acc;
    },
    { draws: 0, losses: 0, matches: 0 },
  );

  const matches = result.matchesPlayed || aggregates.matches;
  const draws = aggregates.draws;
  const losses = aggregates.losses;
  const wins = result.wins;
  const winRate = matches > 0 ? wins / matches : 0;
  const drawRate = matches > 0 ? draws / matches : 0;
  const lossRate = matches > 0 ? losses / matches : 0;

  return {
    name: result.name,
    rating: result.rating ?? null,
    totalScore: result.totalScore,
    averageScore: result.averageScore,
    matchesPlayed: matches,
    wins,
    draws,
    losses,
    winRate,
    drawRate,
    lossRate,
    stdDeviation: result.stdDeviation,
    headToHead: result.headToHead.map(enhanceHeadToHead),
  };
}

export function useTournamentAnalytics(results: TournamentResult[] | null): TournamentAnalyticsValue {
  const summaries = useMemo<StrategyAnalytics[]>(() => {
    if (!results || results.length === 0) return [];
    return results.map(summarizeResult);
  }, [results]);

  const summaryByName = useMemo(() => {
    const lookup = new Map<string, StrategyAnalytics>();
    for (const summary of summaries) {
      lookup.set(summary.name, summary);
    }
    return lookup;
  }, [summaries]);

  const getSummary = useCallback(
    (name: string | null | undefined) => {
      if (!name) return null;
      return summaryByName.get(name) ?? null;
    },
    [summaryByName],
  );

  return {
    summaries,
    summaryByName,
    hasResults: summaries.length > 0,
    getSummary,
  };
}
