import type { TournamentFormat, TournamentOutcome, TournamentResult } from "@/core/tournament";
import type { PayoffMatrix } from "@/core/types";

export interface TournamentExportParameters {
  roundsPerMatch: number;
  noiseEnabled: boolean;
  noisePercent: number;
  payoffMatrix: PayoffMatrix;
  seedEnabled: boolean;
  seedValue: string;
  format: TournamentFormat;
  strategyNames: string[];
}

export interface TournamentExportPayload {
  outcome: TournamentOutcome;
  parameters: TournamentExportParameters;
}

export function serializeTournamentToJSON(payload: TournamentExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function serializeTournamentToCSV(payload: TournamentExportPayload): string {
  const sections: string[] = [];
  sections.push(renderSection("Standings", buildStandingsRows(payload.outcome.results)));
  sections.push(renderSection("Simulation Parameters", buildParameterRows(payload.parameters)));
  sections.push(
    renderSection("Head-to-Head Matrix", buildHeadToHeadMatrixRows(payload.outcome.results)),
  );
  return sections.join("\n\n");
}

function renderSection(title: string, rows: string[][]): string {
  const lines = [title, ...rows.map((row) => row.map(escapeCsvValue).join(","))];
  return lines.join("\n");
}

function buildStandingsRows(results: TournamentResult[]): string[][] {
  const header = [
    "Rank",
    "Strategy",
    "Elo",
    "Total Score",
    "Average Score",
    "Wins",
    "Matches Played",
    "Std Dev",
  ];

  const rows = results.map((result, index) => [
    String(index + 1),
    result.name,
    result.rating === undefined || result.rating === null ? "—" : formatNumber(result.rating),
    formatNumber(result.totalScore),
    formatNumber(result.averageScore),
    formatNumber(result.wins),
    formatNumber(result.matchesPlayed),
    formatNumber(result.stdDeviation),
  ]);

  return [header, ...rows];
}

function buildParameterRows(parameters: TournamentExportParameters): string[][] {
  const formatLabel = describeFormat(parameters.format);
  return [
    ["Rounds per match", formatNumber(parameters.roundsPerMatch)],
    ["Noise enabled", parameters.noiseEnabled ? "true" : "false"],
    ["Noise percent", formatNumber(parameters.noisePercent)],
    ["Seed enabled", parameters.seedEnabled ? "true" : "false"],
    ["Seed value", parameters.seedEnabled ? parameters.seedValue || "—" : "—"],
    ["Tournament format", formatLabel],
    ["Payoff: temptation", formatNumber(parameters.payoffMatrix.temptation)],
    ["Payoff: reward", formatNumber(parameters.payoffMatrix.reward)],
    ["Payoff: punishment", formatNumber(parameters.payoffMatrix.punishment)],
    ["Payoff: sucker", formatNumber(parameters.payoffMatrix.sucker)],
    ["Active strategies", parameters.strategyNames.join(" | ") || "—"],
  ];
}

function buildHeadToHeadMatrixRows(results: TournamentResult[]): string[][] {
  const strategyNames = results.map((result) => result.name);
  const header = ["Strategy", ...strategyNames];
  const lookup = new Map<string, Map<string, string>>();

  for (const result of results) {
    const map = new Map<string, string>();
    for (const opponent of result.headToHead) {
      map.set(opponent.opponent, formatHeadToHeadCell(opponent));
    }
    lookup.set(result.name, map);
  }

  const rows = strategyNames.map((name) => {
    const cells = strategyNames.map((opponent) => {
      if (opponent === name) {
        return "—";
      }
      const formatted = lookup.get(name)?.get(opponent);
      return formatted ?? "0-0-0 (0-0)";
    });
    return [name, ...cells];
  });

  return [header, ...rows];
}

function describeFormat(format: TournamentFormat): string {
  switch (format.kind) {
    case "single-round-robin":
      return "Single round-robin";
    case "double-round-robin":
      return "Double round-robin";
    case "swiss": {
      const roundLabel =
        format.rounds !== undefined ? `${format.rounds} rounds` : "auto rounds";
      const tieBreaker = format.tieBreaker ?? "total-score";
      return `Swiss (${roundLabel}, tie-breaker: ${tieBreaker})`;
    }
    default:
      return format.kind;
  }
}

function formatHeadToHeadCell(entry: TournamentResult["headToHead"][number]): string {
  const winsLossesDraws = `${entry.wins}-${entry.draws}-${entry.losses}`;
  const scoreLine = `${formatNumber(entry.playerScore)}-${formatNumber(entry.opponentScore)}`;
  return `${winsLossesDraws} (${scoreLine})`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
