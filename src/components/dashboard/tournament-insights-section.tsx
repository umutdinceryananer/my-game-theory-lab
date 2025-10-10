import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeadToHeadHeatMap, StrategySummaryInlineCard } from "@/components/analytics";
import { useTournamentAnalytics } from "@/hooks/useTournamentAnalytics";
import type { TournamentFormat, TournamentResult, SwissRoundSummary } from "@/core/tournament";
import { cn } from "@/lib/utils";

interface TournamentInsightsSectionProps {
  results: TournamentResult[] | null;
  swissRounds: SwissRoundSummary[] | null;
  tournamentFormat: TournamentFormat;
  lastRunFormat: TournamentFormat | null;
  activeStrategyCount: number;
}

export function TournamentInsightsSection({
  results,
  swissRounds,
  tournamentFormat,
  lastRunFormat,
  activeStrategyCount,
}: TournamentInsightsSectionProps) {
  const [activeInsightsPanel, setActiveInsightsPanel] = useState<"standings" | "heatmap">("standings");
  const [expandedStrategyName, setExpandedStrategyName] = useState<string | null>(null);
  const [roundsExpanded, setRoundsExpanded] = useState(false);

  const { getSummary } = useTournamentAnalytics(results);

  const normalizedResults = useMemo(() => results ?? [], [results]);
  const hasResults = normalizedResults.length > 0;
  const champion = normalizedResults[0] ?? null;
  const effectiveFormat = useMemo(
    () => (results ? lastRunFormat ?? tournamentFormat : tournamentFormat),
    [lastRunFormat, results, tournamentFormat],
  );

  const swissRoundCount = swissRounds?.length ?? 0;

  const formatLabel = useMemo(() => {
    switch (effectiveFormat.kind) {
      case "single-round-robin":
        return "Single round-robin";
      case "double-round-robin":
        return "Double round-robin";
      case "swiss": {
        const participants = Math.max(2, activeStrategyCount || 0);
        const defaultRounds = Math.max(1, Math.ceil(Math.log2(participants)) + 1);
        const inferredRounds = hasResults
          ? Math.max(...normalizedResults.map((result) => result.matchesPlayed))
          : undefined;
        const roundCount = effectiveFormat.rounds ?? inferredRounds ?? defaultRounds;
        return `Swiss pairing - ${roundCount} round${roundCount === 1 ? "" : "s"}`;
      }
      default:
        return "Custom format";
    }
  }, [activeStrategyCount, effectiveFormat, hasResults, normalizedResults]);

  const swissTieBreaker =
    effectiveFormat.kind === "swiss" ? effectiveFormat.tieBreaker ?? "total-score" : null;

  const formatScore = useCallback(
    (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(2)),
    [],
  );

  useEffect(() => {
    if (normalizedResults.length === 0) {
      setExpandedStrategyName(null);
      return;
    }

    const hasExpanded = normalizedResults.some((item) => item.name === expandedStrategyName);
    if (!expandedStrategyName || !hasExpanded) {
      setExpandedStrategyName(normalizedResults[0].name);
    }
  }, [normalizedResults, expandedStrategyName]);

  useEffect(() => {
    setRoundsExpanded(false);
  }, [swissRoundCount, effectiveFormat.kind]);

  useEffect(() => {
    if (activeInsightsPanel !== "standings") {
      setRoundsExpanded(false);
    }
  }, [activeInsightsPanel]);

  useEffect(() => {
    if (!hasResults) {
      setActiveInsightsPanel("standings");
    }
  }, [hasResults]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase">Latest champion</span>
            {champion ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                {champion.name}
              </Badge>
            ) : (
              <Badge variant="outline">Run to populate</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatLabel}</p>
        </div>
      </div>

      <Tabs
        value={activeInsightsPanel}
        onValueChange={(value) => setActiveInsightsPanel(value as "standings" | "heatmap")}
        className="w-full"
      >
        <TabsList className="mb-4 w-full max-w-full justify-start gap-2 overflow-x-auto">
          <TabsTrigger value="standings" className="whitespace-nowrap px-4">
            Standings overview
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="whitespace-nowrap px-4" disabled={!hasResults}>
            H2H heat map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings">
          {hasResults ? (
            <>
              <div className="min-h-[320px] rounded-lg border border-muted bg-card p-4 shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Rank</TableHead>
                        <TableHead>Strategy</TableHead>
                        <TableHead className="w-24 text-right">Score</TableHead>
                        <TableHead className="w-24 text-right">Average</TableHead>
                        <TableHead className="w-20 text-right">Wins</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {normalizedResults.map((result, index) => {
                          const isExpanded = result.name === expandedStrategyName;
                          const summary = getSummary(result.name);

                        const renderBaseRow = () => (
                          <TableRow
                            key={`${result.name}-base`}
                            data-state={isExpanded ? "selected" : undefined}
                            className={cn(
                              "cursor-pointer transition-colors duration-300 ease-out",
                              isExpanded ? "bg-muted/60 shadow-inner" : "hover:bg-muted/40",
                            )}
                            onClick={() => setExpandedStrategyName(result.name)}
                            onFocus={() => setExpandedStrategyName(result.name)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setExpandedStrategyName(result.name);
                              }
                            }}
                            tabIndex={0}
                            aria-selected={isExpanded}
                          >
                            <TableCell className="font-medium transition-colors duration-300">
                              #{index + 1}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-sm transition-colors duration-300",
                                index === 0 && "font-semibold text-foreground",
                                isExpanded && "font-semibold text-foreground",
                              )}
                            >
                              {result.name}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm transition-colors duration-300">
                              {result.totalScore}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm transition-colors duration-300">
                              {result.averageScore.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm transition-colors duration-300">
                              {result.wins}
                            </TableCell>
                          </TableRow>
                        );

                        if (!summary || !isExpanded) {
                          return renderBaseRow();
                        }

                        return (
                          <Fragment key={result.name}>
                            {renderBaseRow()}
                            <TableRow key={`${result.name}-summary`} data-variant="summary" className="bg-muted/30">
                              <TableCell colSpan={5} className="p-0">
                                <div className="summary-fade px-4 py-3">
                                  <StrategySummaryInlineCard summary={summary} rank={index + 1} />
                                </div>
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {effectiveFormat.kind === "swiss" && swissRounds && swissRounds.length > 0 && (
                <div className="mt-6 space-y-3 rounded-md border border-dashed border-muted p-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex w-full items-center justify-between px-2 py-1 text-sm font-semibold"
                    onClick={() => setRoundsExpanded((prev) => !prev)}
                  >
                    <span>Swiss round breakdown</span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", roundsExpanded ? "rotate-180" : "rotate-0")}
                    />
                  </Button>
                  {roundsExpanded && (
                    <div className="space-y-4">
                      {swissRounds.map((round) => (
                        <div key={round.round} className="space-y-2 rounded-md border border-muted bg-muted/10 p-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm font-semibold">Round {round.round}</span>
                            {round.leaderboard[0] ? (
                              <span className="text-xs text-muted-foreground">
                                Leader: {round.leaderboard[0].name} ({formatScore(round.leaderboard[0].totalScore)} pts)
                              </span>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            {round.matches.map((match, index) => (
                              <div
                                key={`${round.round}-${match.player}-${match.opponent}-${index}`}
                                className="flex flex-col gap-1 rounded border border-dashed border-muted bg-background/80 p-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                              >
                                <span className="font-medium">
                                  {match.player} vs {match.opponent}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatScore(match.playerScore)} - {formatScore(match.opponentScore)}{" "}
                                  {match.winner === "draw"
                                    ? "(draw)"
                                    : `(${match.winner === "player" ? match.player : match.opponent} win)`}
                                </span>
                              </div>
                            ))}
                            {round.matches.length === 0 && (
                              <p className="text-xs text-muted-foreground">No pairings were recorded for this round.</p>
                            )}
                          </div>
                          {round.byes.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Bye:{" "}
                              {round.byes
                                .map((bye) => `${bye.player} (+${formatScore(bye.awardedScore)})`)
                                .join(", ")}
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Top five snapshot</p>
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              {round.leaderboard.slice(0, 5).map((entry, index) => {
                                const tieDetail =
                                  swissTieBreaker === "buchholz" && typeof entry.buchholz === "number"
                                    ? " - Buchholz " + formatScore(entry.buchholz)
                                    : swissTieBreaker === "sonneborn-berger" && typeof entry.sonnebornBerger === "number"
                                      ? " - Sonneborn-Berger " + formatScore(entry.sonnebornBerger)
                                      : "";
                                return (
                                  <li key={`${round.round}-leader-${entry.name}`}>
                                    {index + 1}. {entry.name} - {formatScore(entry.totalScore)} pts - {entry.wins} wins
                                    {tieDetail}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-muted bg-muted/10 p-4 text-sm text-muted-foreground">
              Run a tournament to populate the standings table.
            </div>
          )}
        </TabsContent>

        <TabsContent value="heatmap">
          {hasResults ? (
            <div className="min-h-[320px] rounded-lg border border-muted bg-card p-4 shadow-sm">
              <HeadToHeadHeatMap results={normalizedResults} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-muted bg-muted/10 p-4 text-sm text-muted-foreground">
              Run a tournament to see the head-to-head heat map.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
