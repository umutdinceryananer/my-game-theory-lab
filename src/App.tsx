import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Menu, Play, Trophy, X } from "lucide-react";

import { LandingScreen } from "@/components/landing-screen";
import { SimulationParametersPanel } from "@/components/panels/simulation-parameters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DEFAULT_PAYOFF_MATRIX, type PayoffMatrix } from "@/core/types";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TOURNAMENT_FORMAT,
  type TournamentFormat,
  type TournamentOutcome,
  type TournamentResult,
  type SwissRoundSummary,
} from "@/core/tournament";
import { simulateTournament } from "@/test-game";
import { defaultStrategies } from "@/strategies";
import { StrategyInfoBadge } from "@/components/strategy-info";
import { StrategySummaryInlineCard } from "@/components/analytics/StrategySummaryInlineCard";
import { useTournamentAnalytics } from "@/hooks/useTournamentAnalytics";

type StrategyType = (typeof defaultStrategies)[number];

type DashboardProps = {
  results: TournamentResult[] | null;
  swissRounds: SwissRoundSummary[] | null;
  onRunTournament: () => void;
  roundsPerMatch: number;
  onRoundsChange: (value: number) => void;
  noiseEnabled: boolean;
  onNoiseToggle: (enabled: boolean) => void;
  noisePercent: number;
  onNoisePercentChange: (value: number) => void;
  payoffMatrix: PayoffMatrix;
  onPayoffMatrixChange: (matrix: PayoffMatrix) => void;
  seedEnabled: boolean;
  seedValue: string;
  onSeedToggle: (enabled: boolean) => void;
  onSeedChange: (value: string) => void;
  lastRunFormat: TournamentFormat | null;
  tournamentFormat: TournamentFormat;
  onTournamentFormatChange: (format: TournamentFormat) => void;
  strategySearch: string;
  onStrategySearch: (value: string) => void;
  selectedStrategyNames: string[];
  onToggleStrategy: (name: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onAddStrategy: (name: string) => void;
  onRemoveStrategy: (name: string) => void;
  activeStrategyCount: number;
};

function TournamentDashboard({
  results,
  swissRounds,
  onRunTournament,
  roundsPerMatch,
  onRoundsChange,
  noiseEnabled,
  onNoiseToggle,
  noisePercent,
  onNoisePercentChange,
  payoffMatrix,
  onPayoffMatrixChange,
  seedEnabled,
  seedValue,
  onSeedToggle,
  onSeedChange,
  lastRunFormat,
  tournamentFormat,
  onTournamentFormatChange,
  strategySearch,
  onStrategySearch,
  selectedStrategyNames,
  onToggleStrategy,
  onSelectAll,
  onClearAll,
  onAddStrategy,
  onRemoveStrategy,
  activeStrategyCount,
}: DashboardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { getSummary } = useTournamentAnalytics(results);
  const [expandedStrategyName, setExpandedStrategyName] = useState<string | null>(null);
  const [roundsExpanded, setRoundsExpanded] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!results || results.length === 0) {
      setExpandedStrategyName(null);
      return;
    }

    if (!expandedStrategyName || !results.some((item) => item.name === expandedStrategyName)) {
      setExpandedStrategyName(results[0].name);
    }
  }, [results, expandedStrategyName]);

  const champion = results?.[0] ?? null;

  const filteredSelectedStrategies = useMemo(() => {
    const query = strategySearch.trim().toLowerCase();
    return defaultStrategies.filter((strategy) => {
      if (!selectedStrategyNames.includes(strategy.name)) return false;
      if (!query) return true;
      return (
        strategy.name.toLowerCase().includes(query) ||
        strategy.description.toLowerCase().includes(query)
      );
    });
  }, [selectedStrategyNames, strategySearch]);

  const filteredAvailableStrategies = useMemo(() => {
    const query = strategySearch.trim().toLowerCase();
    return defaultStrategies.filter((strategy) => {
      if (selectedStrategyNames.includes(strategy.name)) return false;
      if (!query) return true;
      return (
        strategy.name.toLowerCase().includes(query) ||
        strategy.description.toLowerCase().includes(query)
      );
    });
  }, [selectedStrategyNames, strategySearch]);

  const totalMatches =
    filteredSelectedStrategies.length + filteredAvailableStrategies.length;
  const hasSearch = strategySearch.trim().length > 0;

  const effectiveFormat = useMemo(
    () => (results ? lastRunFormat ?? tournamentFormat : tournamentFormat),
    [lastRunFormat, results, tournamentFormat],
  );

  const formatLabel = useMemo(() => {
    switch (effectiveFormat.kind) {
      case 'single-round-robin':
        return 'Single round-robin';
      case 'double-round-robin':
        return 'Double round-robin';
      case 'swiss': {
        const participants = Math.max(2, activeStrategyCount || 0);
        const defaultRounds = Math.max(1, Math.ceil(Math.log2(participants)) + 1);
        const inferredRounds =
          results && results.length > 0
            ? Math.max(...results.map((result) => result.matchesPlayed))
            : undefined;
        const roundCount = effectiveFormat.rounds ?? inferredRounds ?? defaultRounds;
        return `Swiss pairing - ${roundCount} round${roundCount === 1 ? '' : 's'}`;
      }
      default:
        return 'Custom format';
    }
  }, [activeStrategyCount, effectiveFormat, results]);

  const swissTieBreaker =
    effectiveFormat.kind === 'swiss' ? effectiveFormat.tieBreaker ?? 'total-score' : null;

  const formatScore = useCallback(
    (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(2)),
    [],
  );

  useEffect(() => {
    setRoundsExpanded(false);
  }, [swissRounds?.length ?? 0, effectiveFormat.kind]);

  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const handleDragStart = useCallback(
    (
      event: React.DragEvent<HTMLButtonElement>,
      name: string,
      source: "selected" | "available"
    ) => {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "application/x-strategy",
        JSON.stringify({ name, source })
      );
    },
    []
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>, target: "selected" | "available") => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/x-strategy");
      if (!raw) return;
      try {
        const { name } = JSON.parse(raw) as { name: string };
        if (!name) return;
        if (target === "selected") {
          onAddStrategy(name);
        } else if (target === "available") {
          onRemoveStrategy(name);
        }
      } catch {
        // ignore malformed payloads
      }
    },
    [onAddStrategy, onRemoveStrategy]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const StrategyCardItem = ({
    strategy,
    isSelected,
  }: {
    strategy: StrategyType;
    isSelected: boolean;
  }) => {
    const [visible, setVisible] = useState(false);
    const exitTimeout = useRef<number | null>(null);

    useEffect(() => {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
      setVisible(true);
      return () => {
        if (exitTimeout.current !== null) {
          window.clearTimeout(exitTimeout.current);
          exitTimeout.current = null;
        }
      };
    }, [isSelected]);

    const handleToggle = useCallback(() => {
        setVisible(false);
        if (exitTimeout.current !== null) {
          window.clearTimeout(exitTimeout.current);
        }
        exitTimeout.current = window.setTimeout(() => {
          onToggleStrategy(strategy.name);
          exitTimeout.current = null;
        }, 120);
      }, [strategy.name]);

      const handleDragStartLocal = useCallback(
        (event: React.DragEvent<HTMLButtonElement>) => {
          handleDragStart(event, strategy.name, isSelected ? "selected" : "available");
        },
        [isSelected, strategy.name] // handleDragStart bağımlılığını koru
      );

    const handleDragEnd = useCallback(() => {
      if (exitTimeout.current !== null) {
        window.clearTimeout(exitTimeout.current);
        exitTimeout.current = null;
      }
      setVisible(true);
    }, []);

    return (
      <button
        type="button"
        draggable
        onClick={handleToggle}
        onDragStart={handleDragStartLocal}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border p-2 text-left text-sm transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
          isSelected
            ? "border-primary bg-secondary/30 text-foreground"
            : "border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
        )}
        aria-pressed={isSelected}
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          {strategy.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="flex flex-1 items-center justify-between gap-3">
          <p className="truncate text-sm font-medium leading-none">{strategy.name}</p>
          <StrategyInfoBadge strategy={strategy} />
        </div>
      </button>
    );
  };

  return (
    <Card
      className={cn(
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Game Theory Lab</CardTitle>
            <CardDescription>
              Explore the Iterated Prisoner&apos;s Dilemma with pluggable strategies.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2"
            >
              <Menu className="h-4 w-4" />
              Simulation Settings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                Strategy roster
              </h2>
              <p className="text-xs text-muted-foreground">
                Pick the strategies that should participate in the tournament.
              </p>
            </div>
            <Input
              value={strategySearch}
              onChange={(event) => onStrategySearch(event.target.value)}
              placeholder="Search strategies..."
              className="sm:w-64"
              aria-label="Search strategies"
            />
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Selected {selectedStrategyNames.length} / {defaultStrategies.length}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {totalMatches} match{totalMatches === 1 ? "" : "es"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                disabled={selectedStrategyNames.length === defaultStrategies.length}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                disabled={selectedStrategyNames.length === 0}
              >
                Clear all
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div
              className="space-y-3 rounded-lg border border-dashed border-muted p-4"
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, "selected")}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase">Selected</span>
                {hasSearch && (
                  <span>
                    {filteredSelectedStrategies.length} match
                    {filteredSelectedStrategies.length === 1 ? "" : "es"}
                  </span>
                )}
              </div>
              {selectedStrategyNames.length === 0 ? (
                <p className="text-sm text-muted-foreground">No strategies selected.</p>
              ) : filteredSelectedStrategies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No selected strategies match your search.
                </p>
              ) : (
                <ul className="grid max-h-[18rem] gap-2 overflow-y-auto sm:grid-cols-2 scrollbar-hidden scroll-gradient">
                  {filteredSelectedStrategies.map((strategy) => (
                    <li key={strategy.name}>
                      <StrategyCardItem strategy={strategy} isSelected />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="space-y-3 rounded-lg border border-dashed border-muted p-4"
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, "available")}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase">Available</span>
                {hasSearch && (
                  <span>
                    {filteredAvailableStrategies.length} match
                    {filteredAvailableStrategies.length === 1 ? "" : "es"}
                  </span>
                )}
              </div>
              {filteredAvailableStrategies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {hasSearch
                    ? "No available strategies match your search."
                    : selectedStrategyNames.length === defaultStrategies.length
                    ? "All strategies are currently selected."
                    : "No additional strategies available."}
                </p>
              ) : (
                <ul className="grid max-h-[18rem] gap-2 overflow-y-auto sm:grid-cols-2 scrollbar-hidden scroll-gradient">
                  {filteredAvailableStrategies.map((strategy) => (
                    <li key={strategy.name}>
                      <StrategyCardItem strategy={strategy} isSelected={false} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-dashed border-muted p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                Latest standings
              </h2>
              <p className="text-xs text-muted-foreground">
                Sorted by cumulative score; average shows match-level performance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {formatLabel}
              </Badge>
              {champion ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  {champion.name}
                </Badge>
              ) : (
                <Badge variant="outline">Run to populate</Badge>
              )}
            </div>
          </div>

          {results ? (
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
                {results.map((result, index) => {
                  const isExpanded = result.name === expandedStrategyName;
                  const summary = getSummary(result.name);

                  const baseRow = (
                    <TableRow
                      key={result.name}
                      data-state={isExpanded ? "selected" : undefined}
                      className={cn("cursor-pointer", isExpanded && "bg-muted")}
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
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell
                        className={cn(
                          "text-sm",
                          index === 0 && "font-semibold text-foreground"
                        )}
                      >
                        {result.name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.totalScore}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.averageScore.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {result.wins}
                      </TableCell>
                    </TableRow>
                  );

                  if (!isExpanded || !summary) {
                    return baseRow;
                  }

                  return (
                    <TableRow key={result.name} data-variant="summary">
                      <TableCell colSpan={5} className="bg-muted/30 p-0">
                        <div className="px-4 py-3">
                          <StrategySummaryInlineCard summary={summary} rank={index + 1} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run the tournament to populate the standings table.
            </p>
          )}
          {effectiveFormat.kind === 'swiss' && swissRounds && swissRounds.length > 0 && (
            <div className="rounded-md border border-dashed border-muted p-3">
              <Button
                type="button"
                variant="ghost"
                className="flex w-full items-center justify-between px-2 py-1 text-sm font-semibold"
                onClick={() => setRoundsExpanded((prev) => !prev)}
              >
                <span>Swiss round breakdown</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    roundsExpanded ? 'rotate-180' : 'rotate-0',
                  )}
                />
              </Button>
              {roundsExpanded && (
                <div className="mt-3 space-y-4">
                  {swissRounds.map((round) => (
                    <div
                      key={round.round}
                      className="space-y-2 rounded-md border border-muted bg-muted/10 p-3"
                    >
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
                              {formatScore(match.playerScore)} - {formatScore(match.opponentScore)}{' '}
                              {match.winner === 'draw'
                                ? '(draw)'
                                : `(${match.winner === 'player' ? match.player : match.opponent} win)`}
                            </span>
                          </div>
                        ))}
                        {round.matches.length === 0 && (
                          <p className="text-xs text-muted-foreground">No pairings recorded.</p>
                        )}
                      </div>
                      {round.byes.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Bye:{' '}
                          {round.byes
                            .map((bye) => `${bye.player} (+${formatScore(bye.awardedScore)})`)
                            .join(', ')}
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Leaderboard snapshot
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {round.leaderboard.slice(0, 5).map((entry, index) => {
                            const tieDetail =
                              swissTieBreaker === 'buchholz' && typeof entry.buchholz === 'number'
                                ? ' - Buchholz ' + formatScore(entry.buchholz)
                                : swissTieBreaker === 'sonneborn-berger' &&
                                    typeof entry.sonnebornBerger === 'number'
                                  ? ' - Sonneborn-Berger ' + formatScore(entry.sonnebornBerger)
                                  : '';
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
        </section>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          size="lg"
          onClick={onRunTournament}
          className="w-full sm:w-auto"
          disabled={activeStrategyCount < 2}
        >
          <Play className="mr-2 h-4 w-4" />
          Run Tournament
        </Button>
      </CardFooter>


      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200"
        aria-hidden={!settingsOpen}
        style={{
          pointerEvents: settingsOpen ? "auto" : "none",
          opacity: settingsOpen ? 1 : 0,
        }}
      >
        <div
          className="absolute inset-0 bg-black/60 transition-opacity duration-200"
          onClick={closeSettings}
          style={{ opacity: settingsOpen ? 1 : 0 }}
        />
        <Card
          className="relative z-10 w-full max-w-3xl overflow-hidden shadow-lg transition-transform duration-200"
          style={{ transform: settingsOpen ? "scale(1)" : "scale(0.97)" }}
        >
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Simulation Settings</h2>
            <Button variant="ghost" size="icon" onClick={closeSettings}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-6 py-4">
            <SimulationParametersPanel
              rounds={roundsPerMatch}
              onRoundsChange={onRoundsChange}
              noiseEnabled={noiseEnabled}
              onNoiseToggle={onNoiseToggle}
              noisePercent={noisePercent}
              onNoisePercentChange={onNoisePercentChange}
              payoffMatrix={payoffMatrix}
              onPayoffMatrixChange={onPayoffMatrixChange}
              seedEnabled={seedEnabled}
              seedValue={seedValue}
              onSeedToggle={onSeedToggle}
              onSeedChange={onSeedChange}
              activeStrategyCount={activeStrategyCount}
              tournamentFormat={tournamentFormat}
              onTournamentFormatChange={onTournamentFormatChange}
            />
          </div>
        </Card>
      </div>
    </Card>
  );
}

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLandingFading, setIsLandingFading] = useState(false);
  const [tournamentOutcome, setTournamentOutcome] = useState<TournamentOutcome | null>(null);
  const [roundsPerMatch, setRoundsPerMatch] = useState(100);
  const [noiseEnabled, setNoiseEnabled] = useState(false);
  const [noisePercent, setNoisePercent] = useState(10);
  const [payoffMatrix, setPayoffMatrix] = useState<PayoffMatrix>(() => ({
    ...DEFAULT_PAYOFF_MATRIX,
  }));
  const [seedEnabled, setSeedEnabled] = useState(false);
  const [seedValue, setSeedValue] = useState("");
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>(
    DEFAULT_TOURNAMENT_FORMAT,
  );
  const [lastRunFormat, setLastRunFormat] = useState<TournamentFormat | null>(null);
  const [strategySearch, setStrategySearch] = useState("");
  const [selectedStrategyNames, setSelectedStrategyNames] = useState<string[]>(
    []
  );

  const results = tournamentOutcome?.results ?? null;
  const swissRounds = tournamentOutcome?.swissRounds ?? null;

  const strategyOrder = useMemo(
    () => defaultStrategies.map((strategy) => strategy.name),
    []
  );

  const activeStrategies = useMemo(
    () =>
      defaultStrategies.filter((strategy) =>
        selectedStrategyNames.includes(strategy.name)
      ),
    [selectedStrategyNames]
  );

  const runTournament = useCallback(() => {
    if (activeStrategies.length < 2) return;

    const errorRate = noiseEnabled ? noisePercent / 100 : 0;
    const seed =
      seedEnabled && seedValue.trim().length > 0
        ? seedValue.trim()
        : undefined;
    const outcome = simulateTournament({
      rounds: roundsPerMatch,
      errorRate,
      payoffMatrix,
      seed,
      format: tournamentFormat,
      strategies: activeStrategies,
    });
    setTournamentOutcome(outcome);
    setLastRunFormat(outcome.format);
  }, [
    activeStrategies,
    tournamentFormat,
    noiseEnabled,
    noisePercent,
    payoffMatrix,
    roundsPerMatch,
    seedEnabled,
    seedValue,
  ]);

  const handleEnterLab = useCallback(() => {
    if (isLandingFading) return;
    setIsLandingFading(true);
  }, [isLandingFading]);

  useEffect(() => {
    if (!isLandingFading) return undefined;

    const timeout = window.setTimeout(() => {
      setHasStarted(true);
      setIsLandingFading(false);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [isLandingFading]);

  const toggleStrategy = useCallback(
    (name: string) => {
      setSelectedStrategyNames((previous) => {
        const next = new Set(previous);
        if (next.has(name)) {
          next.delete(name);
        } else {
          next.add(name);
        }
        return strategyOrder.filter((strategyName) => next.has(strategyName));
      });
    },
    [strategyOrder]
  );

  const selectAll = useCallback(() => {
    setSelectedStrategyNames(strategyOrder);
  }, [strategyOrder]);

  const clearAll = useCallback(() => {
    setSelectedStrategyNames([]);
  }, []);

  const addStrategy = useCallback(
    (name: string) => {
      if (!strategyOrder.includes(name)) return;
      setSelectedStrategyNames((previous) => {
        if (previous.includes(name)) return previous;
        const next = new Set(previous);
        next.add(name);
        return strategyOrder.filter((strategyName) => next.has(strategyName));
      });
    },
    [strategyOrder]
  );

  const removeStrategy = useCallback((name: string) => {
    setSelectedStrategyNames((previous) =>
      previous.filter((strategyName) => strategyName !== name)
    );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl lg:max-w-6xl flex-col justify-center px-6 py-12">
        {hasStarted ? (
          <TournamentDashboard
            results={results}
            swissRounds={swissRounds}
            onRunTournament={runTournament}
            roundsPerMatch={roundsPerMatch}
            onRoundsChange={setRoundsPerMatch}
            noiseEnabled={noiseEnabled}
            onNoiseToggle={setNoiseEnabled}
            noisePercent={noisePercent}
            onNoisePercentChange={setNoisePercent}
            payoffMatrix={payoffMatrix}
            onPayoffMatrixChange={setPayoffMatrix}
            seedEnabled={seedEnabled}
            seedValue={seedValue}
            onSeedToggle={setSeedEnabled}
            onSeedChange={setSeedValue}
            lastRunFormat={lastRunFormat}
            tournamentFormat={tournamentFormat}
            onTournamentFormatChange={setTournamentFormat}
            strategySearch={strategySearch}
            onStrategySearch={setStrategySearch}
            selectedStrategyNames={selectedStrategyNames}
            onToggleStrategy={toggleStrategy}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            onAddStrategy={addStrategy}
            onRemoveStrategy={removeStrategy}
            activeStrategyCount={activeStrategies.length}
          />
        ) : (
          <LandingScreen onStart={handleEnterLab} isFadingOut={isLandingFading} />
        )}
      </main>
    </div>
  );
}
