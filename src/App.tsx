import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dna, Menu, X } from "lucide-react";

import { LandingScreen } from "@/components/landing-screen";
import { SimulationParametersPanel } from "@/components/panels/simulation-parameters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_PAYOFF_MATRIX, type PayoffMatrix, type Strategy } from "@/core/types";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TOURNAMENT_FORMAT,
  type TournamentFormat,
  type TournamentOutcome,
  type TournamentResult,
} from "@/core/tournament";
import { simulateTournament } from "@/test-game";
import { baseStrategies } from "@/strategies";
import { StrategyInfoBadge } from "@/components/strategy-info";
import { useEvolutionAnalytics } from "@/hooks/useEvolutionAnalytics";
import { EvolutionToggleCard } from "@/components/evolution/evolution-toggle-card";
import { EvolutionConfigPanel } from "@/components/evolution/evolution-config-panel";
import { EvolutionInsights } from "@/components/evolution/evolution-insights";
import type { GeneticStrategyConfig } from "@/strategies/genetic";
import { createGeneticStrategy, geneticStrategyConfigs } from "@/strategies/genetic";
import { cloneGeneticConfigMap } from "@/strategies/genetic/utils";
import { GeneticStrategyEditor } from "@/components/genetic/genetic-strategy-editor";
import { createBasicEvolutionEngine } from "@/core/evolution";
import type { EvolutionSettings, EvolutionSummary } from "@/core/evolution";

type StrategyType = Strategy;

type DashboardProps = {
  availableStrategies: StrategyType[];
  geneticConfigs: Record<string, GeneticStrategyConfig>;
  onGeneticConfigsChange: (nextConfigs: Record<string, GeneticStrategyConfig>) => void;
  evolutionEnabled: boolean;
  onEvolutionEnabledChange: (enabled: boolean) => void;
  evolutionSettings: EvolutionSettings;
  onEvolutionSettingsChange: (settings: EvolutionSettings) => void;
  evolutionSeedNames: string[];
  onEvolutionSeedsChange: (names: string[]) => void;
  evolutionSummary: EvolutionSummary | null;
  isRunning: boolean;
  results: TournamentResult[] | null;
  onRunTournament: () => Promise<void>;
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

type GeneticConfigMap = Record<string, GeneticStrategyConfig>;

function getEvolutionSettingsIssues(settings: EvolutionSettings): string[] {
  const issues: string[] = [];
  if (!Number.isFinite(settings.populationSize) || settings.populationSize < 2) {
    issues.push("Population size must be at least 2.");
  }
  if (!Number.isFinite(settings.generations) || settings.generations < 1) {
    issues.push("Generations must be at least 1.");
  }
  if (!Number.isFinite(settings.elitismCount) || settings.elitismCount < 0) {
    issues.push("Elitism count cannot be negative.");
  } else if (settings.elitismCount >= settings.populationSize) {
    issues.push("Elitism count must be less than population size.");
  }
  if (!Number.isFinite(settings.mutationRate) || settings.mutationRate < 0 || settings.mutationRate > 1) {
    issues.push("Mutation rate must be between 0 and 1.");
  }
  if (!Number.isFinite(settings.crossoverRate) || settings.crossoverRate < 0 || settings.crossoverRate > 1) {
    issues.push("Crossover rate must be between 0 and 1.");
  }
  if (settings.selectionMethod === "tournament") {
    const size = settings.tournamentSize ?? 0;
    if (!Number.isFinite(size) || size < 2) {
      issues.push("Tournament size must be at least 2.");
    } else if (size > settings.populationSize) {
      issues.push("Tournament size cannot exceed population size.");
    }
  }
  return issues;
}

function buildStrategies(base: StrategyType[], configs: GeneticConfigMap): StrategyType[] {
  const geneticList = Object.values(configs).map((config) => createGeneticStrategy(config));
  return [...base, ...geneticList];
}

function buildStrategyMap(strategies: StrategyType[]): Map<string, StrategyType> {
  return strategies.reduce<Map<string, StrategyType>>((map, strategy) => {
    map.set(strategy.name, strategy);
    return map;
  }, new Map());
}

function TournamentDashboard({
  availableStrategies,
  geneticConfigs,
  onGeneticConfigsChange,
  evolutionEnabled,
  onEvolutionEnabledChange,
  evolutionSettings,
  onEvolutionSettingsChange,
  evolutionSeedNames,
  onEvolutionSeedsChange,
  evolutionSummary,
  isRunning,
  results,
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
  const [geneticEditorOpen, setGeneticEditorOpen] = useState(false);
  const [evolutionConfigCollapsed, setEvolutionConfigCollapsed] = useState(true);
  const [expandedStrategyName, setExpandedStrategyName] = useState<string | null>(null);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!results || results.length === 0) {
      setExpandedStrategyName(null);
      return;
    }

    const hasExpanded = results.some((item) => item.name === expandedStrategyName);
  
    if (!expandedStrategyName || !hasExpanded) {
      setExpandedStrategyName(results[0].name);
    }
  }, [results, expandedStrategyName]);
  const minParticipants = evolutionEnabled ? 1 : 2;
  const evolutionAnalytics = useEvolutionAnalytics(evolutionSummary);
  const evolutionSettingsErrors = useMemo(
    () => (evolutionEnabled ? getEvolutionSettingsIssues(evolutionSettings) : []),
    [evolutionEnabled, evolutionSettings],
  );  const geneticSeedOptions = useMemo(
    () => Object.values(geneticConfigs).sort((a, b) => a.name.localeCompare(b.name)),
    [geneticConfigs],
  );
  const selectedSeedConfigs = useMemo(
    () =>
      evolutionSeedNames
        .map((name) => geneticConfigs[name])
        .filter((config): config is GeneticStrategyConfig => Boolean(config)),
    [evolutionSeedNames, geneticConfigs],
  );
  const evolutionSeedIssues = useMemo(() => {
    if (!evolutionEnabled) return [];
    if (geneticSeedOptions.length === 0) {
      return ["Create at least one genetic configuration to seed the evolutionary run."];
    }
    if (selectedSeedConfigs.length === 0) {
      return ["Select at least one genetic configuration for the seed pool."];
    }
    return [];
  }, [evolutionEnabled, geneticSeedOptions, selectedSeedConfigs]);
  const evolutionConfigurationErrors = useMemo(
    () => [...evolutionSettingsErrors, ...evolutionSeedIssues],
    [evolutionSettingsErrors, evolutionSeedIssues],
  );
  const allSeedNames = useMemo(
    () => geneticSeedOptions.map((config) => config.name),
    [geneticSeedOptions],
  );
  const handleSeedToggle = useCallback(
    (name: string) => {
      const nameSet = new Set(evolutionSeedNames);
      if (nameSet.has(name)) {
        nameSet.delete(name);
      } else {
        nameSet.add(name);
      }
      const ordered = allSeedNames.filter((seedName) => nameSet.has(seedName));
      onEvolutionSeedsChange(ordered);
    },
    [allSeedNames, evolutionSeedNames, onEvolutionSeedsChange],
  );
  const handleSelectAllSeeds = useCallback(() => {
    onEvolutionSeedsChange(allSeedNames);
  }, [allSeedNames, onEvolutionSeedsChange]);
  const handleClearSeeds = useCallback(() => {
    onEvolutionSeedsChange([]);
  }, [onEvolutionSeedsChange]);

  const filteredSelectedStrategies = useMemo(() => {
    const query = strategySearch.trim().toLowerCase();
    return availableStrategies.filter((strategy) => {
      if (!selectedStrategyNames.includes(strategy.name)) return false;
      if (!query) return true;
      return (
        strategy.name.toLowerCase().includes(query) ||
        strategy.description.toLowerCase().includes(query)
      );
    });
  }, [availableStrategies, selectedStrategyNames, strategySearch]);

  const filteredAvailableStrategies = useMemo(() => {
    const query = strategySearch.trim().toLowerCase();
    return availableStrategies.filter((strategy) => {
      if (selectedStrategyNames.includes(strategy.name)) return false;
      if (!query) return true;
      return (
        strategy.name.toLowerCase().includes(query) ||
        strategy.description.toLowerCase().includes(query)
      );
    });
  }, [availableStrategies, selectedStrategyNames, strategySearch]);

  const totalMatches = filteredSelectedStrategies.length + filteredAvailableStrategies.length;
  const hasSearch = strategySearch.trim().length > 0;
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  useEffect(() => {
    if (evolutionEnabled) {
      setEvolutionConfigCollapsed(false);
    }
  }, [evolutionEnabled]);

  const handleDragStart = useCallback(
    (
      event: React.DragEvent<HTMLElement>,
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
      (event: React.DragEvent<HTMLDivElement>) => {
        handleDragStart(event, strategy.name, isSelected ? "selected" : "available");
      },
      [isSelected, strategy.name] // handleDragStart baÄŸÄ±mlÄ±lÄ±ÄŸÄ±nÄ± koru
    );

    const handleDragEnd = useCallback(() => {
      if (exitTimeout.current !== null) {
        window.clearTimeout(exitTimeout.current);
        exitTimeout.current = null;
      }
      setVisible(true);
    }, []);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleToggle();
        }
      },
      [handleToggle],
    );

    const geneticConfig = geneticConfigs[strategy.name];

    return (
      <div
        role="button"
        tabIndex={0}
        draggable
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onDragStart={handleDragStartLocal}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border p-2 text-left text-sm transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          visible ? "opacity-100" : "opacity-0",
          isSelected
            ? "border-primary bg-secondary/30 text-foreground"
            : "border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
        )}
        aria-pressed={isSelected}
      >
        <div className="flex flex-1 items-center gap-3">
          <StrategyInfoBadge
            strategy={strategy}
            geneticConfig={geneticConfig}
            triggerVariant="ghost"
            triggerSize="icon"
            triggerClassName="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            triggerAriaLabel={`Strategy details for ${strategy.name}`}
          >
            {geneticConfig ? (
              <Dna className="h-4 w-4" aria-hidden="true" />
            ) : (
              <span className="font-semibold">{strategy.name.slice(0, 2).toUpperCase()}</span>
            )}
          </StrategyInfoBadge>
          <p className="max-w-[16rem] truncate text-left text-sm font-medium leading-tight md:max-w-xs">
            {strategy.name}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Input
                value={strategySearch}
                onChange={(event) => onStrategySearch(event.target.value)}
                placeholder="Search strategies..."
                className="sm:w-64"
                aria-label="Search strategies"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setGeneticEditorOpen(true)}
              >
                <Dna className="h-4 w-4" aria-hidden="true" />
                Genetic editor
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Selected {selectedStrategyNames.length} / {availableStrategies.length}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {totalMatches} match{totalMatches === 1 ? "" : "es"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                disabled={selectedStrategyNames.length === availableStrategies.length}
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
                    : selectedStrategyNames.length === availableStrategies.length
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

        <div className="space-y-4 rounded-lg border border-dashed border-muted p-4">
          <EvolutionToggleCard
            enabled={evolutionEnabled}
            onToggle={onEvolutionEnabledChange}
            toggleDisabled={isRunning}
            runDisabled={evolutionEnabled && evolutionConfigurationErrors.length > 0}
            isRunning={isRunning}
            onRun={() => void onRunTournament()}
            minParticipants={minParticipants}
            activeStrategyCount={activeStrategyCount}
          />
          <EvolutionConfigPanel
            settings={evolutionSettings}
            onSettingsChange={onEvolutionSettingsChange}
            seedOptions={geneticSeedOptions}
            selectedSeedNames={evolutionSeedNames}
            onSeedToggle={handleSeedToggle}
            onSeedSelectAll={handleSelectAllSeeds}
            onSeedClear={handleClearSeeds}
            collapsed={evolutionConfigCollapsed}
            onToggleCollapse={() => setEvolutionConfigCollapsed((previous) => !previous)}
            errors={evolutionConfigurationErrors}
          />
          <EvolutionInsights
            analytics={evolutionAnalytics}
            roundsPerMatch={roundsPerMatch}
            enabled={evolutionEnabled}
          />
        </div>
        </CardContent>
      </Card>

      {geneticEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-200">
          <div
            className="absolute inset-0 bg-black/60 transition-opacity duration-200"
            onClick={() => setGeneticEditorOpen(false)}
          />
          <GeneticStrategyEditor
            configs={geneticConfigs}
            onClose={() => setGeneticEditorOpen(false)}
            onSave={onGeneticConfigsChange}
          />
        </div>
      )}

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
    </>
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
  const [, setLastRunFormat] = useState<TournamentFormat | null>(null);
  const [strategySearch, setStrategySearch] = useState("");
    const [geneticConfigs, setGeneticConfigs] = useState<GeneticConfigMap>(() =>
      cloneGeneticConfigMap(geneticStrategyConfigs)
    );
    const [evolutionSeedNames, setEvolutionSeedNames] = useState<string[]>(() =>
      Object.keys(geneticStrategyConfigs).sort((a, b) => a.localeCompare(b))
    );
    const [evolutionEnabled, setEvolutionEnabled] = useState(false);
    const [evolutionSettings, setEvolutionSettings] = useState<EvolutionSettings>({
      populationSize: 12,
      generations: 5,
      selectionMethod: "tournament",
      mutationOperator: "per-gene",
      crossoverOperator: "single-point",
      mutationRate: 0.1,
      crossoverRate: 0.7,
      elitismCount: 1,
      tournamentSize: 3,
      randomSeed: undefined,
    });
    const [evolutionSummary, setEvolutionSummary] = useState<EvolutionSummary | null>(null);
    const [isRunning, setIsRunning] = useState(false);
  const baseStrategyList = useMemo<StrategyType[]>(() => [...baseStrategies], []);
  const [selectedStrategyNames, setSelectedStrategyNames] = useState<string[]>([]);

  const results = tournamentOutcome?.results ?? null;
  const availableStrategies = useMemo(
    () => buildStrategies(baseStrategyList, geneticConfigs),
    [baseStrategyList, geneticConfigs],
  );

  const strategyMap = useMemo(
    () => buildStrategyMap(availableStrategies),
    [availableStrategies],
  );

  const strategyOrder = useMemo(
    () => availableStrategies.map((strategy) => strategy.name),
    [availableStrategies],
  );

  useEffect(() => {
    setSelectedStrategyNames((previous) => {
      const ordered = strategyOrder.filter((name) => previous.includes(name));
      if (
        ordered.length === previous.length &&
        ordered.every((name, index) => name === previous[index])
      ) {
        return previous;
      }
      return ordered;
    });
  }, [strategyOrder]);

  useEffect(() => {
    setEvolutionSeedNames((previous) => {
      const availableNames = Object.keys(geneticConfigs).sort((a, b) => a.localeCompare(b));
      const previousSet = new Set(previous);
      let next = availableNames.filter((name) => previousSet.has(name));
      if (next.length === 0 && availableNames.length > 0) {
        next = [...availableNames];
      } else if (next.length > 0) {
        const additions = availableNames.filter((name) => !previousSet.has(name));
        next = [...next, ...additions];
      }
      if (next.length === previous.length && next.every((name, index) => name === previous[index])) {
        return previous;
      }
      return next;
    });
  }, [geneticConfigs]);

  const activeStrategies = useMemo(
    () =>
      selectedStrategyNames
        .map((name) => strategyMap.get(name))
        .filter((strategy): strategy is StrategyType => Boolean(strategy)),
    [selectedStrategyNames, strategyMap]
  );

    const runTournament = useCallback(async () => {
      if (isRunning) return;
      const minimumRequired = evolutionEnabled ? 1 : 2;
      if (activeStrategies.length < minimumRequired) return;
      const seedPool = evolutionSeedNames
        .map((name) => geneticConfigs[name])
        .filter((config): config is GeneticStrategyConfig => Boolean(config));
      if (evolutionEnabled) {
        const issues = getEvolutionSettingsIssues(evolutionSettings);
        if (Object.keys(geneticConfigs).length === 0) {
          issues.push("Create at least one genetic configuration to seed the evolutionary run.");
        } else if (seedPool.length === 0) {
          issues.push("Select at least one genetic configuration for the seed pool.");
        }
        if (issues.length > 0) {
          console.warn("Evolution run blocked due to invalid settings:", issues);
          return;
        }
      }

      setIsRunning(true);
      try {
        const errorRate = noiseEnabled ? noisePercent / 100 : 0;
        const seed =
          seedEnabled && seedValue.trim().length > 0
            ? seedValue.trim()
            : undefined;

        if (evolutionEnabled) {
          try {
            if (seedPool.length > 0 && activeStrategies.length >= 1) {
              const engine = createBasicEvolutionEngine({
                settings: evolutionSettings,
                seedPool,
                opponents: activeStrategies,
                fitness: {
                  rounds: roundsPerMatch,
                  errorRate,
                  payoffMatrix,
                  format: tournamentFormat,
                },
              });
              const summary = await engine.run({});
              setEvolutionSummary(summary);

              const best =
                summary.bestIndividual ?? summary.finalPopulation[0] ?? null;
              if (best) {
                const bestStrategy = createGeneticStrategy({
                  ...best.config,
                  name: best.strategyName,
                });
                const finalStrategies = [bestStrategy, ...activeStrategies];
                const outcome = simulateTournament({
                  rounds: roundsPerMatch,
                  errorRate,
                  payoffMatrix,
                  seed,
                  format: tournamentFormat,
                  strategies: finalStrategies,
                });
                setTournamentOutcome(outcome);
                setLastRunFormat(outcome.format);
                return;
              }
            }
          } catch (error) {
            console.error("Evolution run failed:", error);
          }
        } else {
          setEvolutionSummary(null);
        }

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
      } finally {
        setIsRunning(false);
      }
    }, [
      activeStrategies,
      evolutionEnabled,
      evolutionSettings,
      geneticConfigs,
      isRunning,
      tournamentFormat,
      noiseEnabled,
      noisePercent,
      payoffMatrix,
      roundsPerMatch,
      seedEnabled,
      seedValue,
      evolutionSeedNames,
    ]);

    const handleGeneticConfigsChange = useCallback(
      (nextConfigs: GeneticConfigMap) => {
        setGeneticConfigs(cloneGeneticConfigMap(nextConfigs));
        setEvolutionSummary(null);
      },
      []
    );

    const handleEvolutionSeedsChange = useCallback((names: string[]) => {
      setEvolutionSeedNames(names);
      setEvolutionSummary(null);
    }, []);

    const handleEvolutionSettingsChange = useCallback(
      (nextSettings: EvolutionSettings) => {
        setEvolutionSettings(nextSettings);
        setEvolutionSummary(null);
      },
      []
    );

    useEffect(() => {
      if (!evolutionEnabled) {
        setEvolutionSummary(null);
      }
    }, [evolutionEnabled]);

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
            availableStrategies={availableStrategies}
            geneticConfigs={geneticConfigs}
            onGeneticConfigsChange={handleGeneticConfigsChange}
            evolutionEnabled={evolutionEnabled}
            onEvolutionEnabledChange={setEvolutionEnabled}
            evolutionSettings={evolutionSettings}
            onEvolutionSettingsChange={handleEvolutionSettingsChange}
            evolutionSeedNames={evolutionSeedNames}
            onEvolutionSeedsChange={handleEvolutionSeedsChange}
            evolutionSummary={evolutionSummary}
            isRunning={isRunning}
            results={results}            onRunTournament={runTournament}
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
            onSeedChange={setSeedValue}            tournamentFormat={tournamentFormat}
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





