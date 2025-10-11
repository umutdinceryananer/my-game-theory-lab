export interface EloOptions {
  /** Base rating applied when no existing rating is supplied */
  baseRating?: number;
  /** K-factor controlling update sensitivity */
  kFactor?: number;
}

export interface EloPlayer {
  name: string;
  rating: number;
}

export interface EloMatchResult {
  player: string;
  opponent: string;
  outcome: 'win' | 'loss' | 'draw';
}

const DEFAULT_ELO_OPTIONS: Required<EloOptions> = {
  baseRating: 1500,
  kFactor: 24,
};

function expectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

export function updateEloRating(
  currentRating: number | undefined,
  opponentRating: number | undefined,
  outcome: 'win' | 'loss' | 'draw',
  options: EloOptions = {},
): number {
  const { baseRating, kFactor } = { ...DEFAULT_ELO_OPTIONS, ...options };
  const playerRating = currentRating ?? baseRating;
  const oppRating = opponentRating ?? baseRating;

  const score = outcome === 'win' ? 1 : outcome === 'loss' ? 0 : 0.5;
  const expected = expectedScore(playerRating, oppRating);
  return playerRating + kFactor * (score - expected);
}

export function processEloMatches(
  initialRatings: Record<string, number | undefined>,
  matches: EloMatchResult[],
  options: EloOptions = {},
): Record<string, number> {
  const ratings = new Map<string, number>();
  for (const [name, rating] of Object.entries(initialRatings)) {
    if (rating !== undefined) {
      ratings.set(name, rating);
    }
  }

  const getRating = (name: string): number =>
    ratings.get(name) ?? options.baseRating ?? DEFAULT_ELO_OPTIONS.baseRating;

  for (const match of matches) {
    const playerRating = getRating(match.player);
    const opponentRating = getRating(match.opponent);

    const playerNext = updateEloRating(playerRating, opponentRating, match.outcome, options);
    const opponentOutcome =
      match.outcome === 'win' ? 'loss' : match.outcome === 'loss' ? 'win' : 'draw';
    const opponentNext = updateEloRating(opponentRating, playerRating, opponentOutcome, options);

    ratings.set(match.player, playerNext);
    ratings.set(match.opponent, opponentNext);
  }

  const result: Record<string, number> = {};
  for (const [name, rating] of ratings.entries()) {
    result[name] = rating;
  }
  return result;
}
