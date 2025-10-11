import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Dna, Menu, X } from "lucide-react";

import { SimulationParametersPanel } from "@/components/panels/simulation-parameters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PayoffMatrix, Strategy } from "@/core/types";
import type { TournamentFormat, TournamentResult, SwissRoundSummary } from "@/core/tournament";
import { cn } from "@/lib/utils";
import { getEvolutionSettingsIssues } from "@/lib/tournament";
import { StrategyRosterSection } from "@/components/dashboard/strategy-roster-section";
import { TournamentInsightsSection } from "@/components/dashboard/tournament-insights-section";
import { EvolutionConfigPanel } from "@/components/evolution/evolution-config-panel";
import { EvolutionInsights } from "@/components/evolution/evolution-insights";
import { GeneticStrategyEditor } from "@/components/genetic/genetic-strategy-editor";
import { useEvolutionAnalytics } from "@/hooks/useEvolutionAnalytics";
import type { GeneticStrategyConfig } from "@/strategies/genetic";
import type { EvolutionSettings, EvolutionSummary } from "@/core/evolution";

type TournamentDashboardProps = {
  availableStrategies: Strategy[];
  geneticConfigs: Record<string, GeneticStrategyConfig>;
  onGeneticConfigsChange: (nextConfigs: Record<string, GeneticStrategyConfig>) => void;
  evolutionEnabled: boolean;
  onEvolutionEnabledChange: (enabled: boolean) => void;
  evolutionSettings: EvolutionSettings;
  onEvolutionSettingsChange: (settings: EvolutionSettings) => void;
  evolutionSummary: EvolutionSummary | null;
  isRunning: boolean;
  results: TournamentResult[] | null;
  swissRounds: SwissRoundSummary[] | null;
  onRunTournament: () => Promise<void>;
  roundsPerMatch: number;
  onExportResults?: (format: "csv" | "json") => void;
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

export function TournamentDashboard({
  availableStrategies,
  geneticConfigs,
  onGeneticConfigsChange,
  evolutionEnabled,
  onEvolutionEnabledChange,
  evolutionSettings,
  onEvolutionSettingsChange,
  evolutionSummary,
  isRunning,
  results,
  swissRounds,
  onRunTournament,
  roundsPerMatch,
  onRoundsChange,
  onExportResults,
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
}: TournamentDashboardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"simulation" | "evolution">("simulation");
  const [insightsVisible, setInsightsVisible] = useState(() => !isRunning && Boolean(results?.length));
  const [geneticEditorOpen, setGeneticEditorOpen] = useState(false);
  const [expandedStrategyName, setExpandedStrategyName] = useState<string | null>(null);
  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setSettingsTab("simulation");
  }, [setSettingsTab]);

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

  useEffect(() => {
    setSettingsTab(evolutionEnabled ? "evolution" : "simulation");
  }, [evolutionEnabled]);

  const minParticipants = evolutionEnabled ? 1 : 2;
  const evolutionAnalytics = useEvolutionAnalytics(evolutionSummary);
  const evolutionSettingsErrors = useMemo(
    () => (evolutionEnabled ? getEvolutionSettingsIssues(evolutionSettings) : []),
    [evolutionEnabled, evolutionSettings],
  );
  const evolutionConfigurationErrors = evolutionSettingsErrors;
  const runtimeMetrics = evolutionSummary?.runtimeMetrics ?? null;
  const totalRuntimeDisplay = formatDuration(runtimeMetrics?.totalRuntimeMs);
  const averageGenerationDisplay = formatDuration(runtimeMetrics?.averageGenerationMs);
  const generationCountDisplay = runtimeMetrics
    ? runtimeMetrics.generationDurations.length.toString()
    : "0";
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
  const runBlocked = evolutionEnabled && evolutionConfigurationErrors.length > 0;
  const insufficientOpponents = activeStrategyCount < minParticipants;
  const runButtonDisabled = runBlocked || insufficientOpponents || isRunning;

  const handleRunTournament = useCallback(() => {
    setInsightsVisible(false);
    void onRunTournament();
  }, [onRunTournament]);

  useEffect(() => {
    if (isRunning) {
      setInsightsVisible(false);
      return;
    }
    if (results && results.length > 0) {
      setInsightsVisible(true);
    }
  }, [isRunning, results]);

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
                onClick={() => {
                  setSettingsTab("simulation");
                  setSettingsOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Menu className="h-4 w-4" />
                Simulation Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <StrategyRosterSection
            strategySearch={strategySearch}
            onStrategySearch={onStrategySearch}
            selectedStrategyNames={selectedStrategyNames}
            filteredSelectedStrategies={filteredSelectedStrategies}
            filteredAvailableStrategies={filteredAvailableStrategies}
            totalStrategyCount={availableStrategies.length}
            geneticConfigs={geneticConfigs}
            onToggleStrategy={onToggleStrategy}
          onSelectAll={onSelectAll}
          onClearAll={onClearAll}
          onAddStrategy={onAddStrategy}
          onRemoveStrategy={onRemoveStrategy}
          onRunTournament={handleRunTournament}
          runButtonDisabled={runButtonDisabled}
          isRunning={isRunning}
          evolutionEnabled={evolutionEnabled}
        />
        <FadeSection active={insightsVisible}>
          <TournamentInsightsSection
            results={results}
            swissRounds={swissRounds}
            tournamentFormat={tournamentFormat}
            lastRunFormat={lastRunFormat}
            activeStrategyCount={activeStrategyCount}
            onExport={onExportResults}
          />
        </FadeSection>

        <FadeSection active={insightsVisible}>
          <div className="space-y-4 rounded-lg border border-dashed border-muted p-4">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Evolution overview</p>
                <p>Configure evolutionary mode inside the Simulation Settings modal.</p>
              </div>
              <div className="grid gap-2 text-right text-xs sm:grid-cols-3 sm:text-left">
                <RuntimeMetric label="Total" value={totalRuntimeDisplay} />
                <RuntimeMetric label="Avg gen" value={averageGenerationDisplay} />
                <RuntimeMetric label="Generations" value={generationCountDisplay} />
              </div>
            </div>
            <EvolutionInsights
              analytics={evolutionAnalytics}
              roundsPerMatch={roundsPerMatch}
              enabled={evolutionEnabled}
              runtimeMetrics={runtimeMetrics}
              profilingEnabled={evolutionSettings.profilingEnabled ?? false}
            />
          </div>
        </FadeSection>
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
            <Tabs
              value={settingsTab}
              onValueChange={(value) => setSettingsTab(value as "simulation" | "evolution")}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simulation">Simulation</TabsTrigger>
                <TabsTrigger value="evolution">Evolution</TabsTrigger>
              </TabsList>
              <TabsContent value="simulation" className="focus-visible:outline-none">
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
              </TabsContent>
              <TabsContent value="evolution" className="focus-visible:outline-none">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-lg border border-dashed border-muted/60 bg-muted/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Evolutionary mode</p>
                        <p className="text-xs text-muted-foreground">
                          Run genetic strategies prior to the tournament to evolve stronger contenders.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {evolutionEnabled ? "Enabled" : "Disabled"}
                        </span>
                        <Switch
                          checked={evolutionEnabled}
                          onCheckedChange={onEvolutionEnabledChange}
                          aria-label="Toggle evolutionary mode"
                          disabled={isRunning}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setGeneticEditorOpen(true)}
                        disabled={!evolutionEnabled}
                      >
                        <Dna className="h-4 w-4" aria-hidden="true" />
                        Open genetic editor
                      </Button>
                      {isRunning && (
                        <span className="text-xs text-muted-foreground">
                          Evolution settings are locked while a tournament is running.
                        </span>
                      )}
                    </div>
                {evolutionEnabled && insufficientOpponents && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    Select at least {minParticipants} opponent
                    {minParticipants === 1 ? "" : "s"} to run the evolutionary cycle.
                  </div>
                )}
              </div>
              {evolutionEnabled ? (
                <EvolutionConfigPanel
                  settings={evolutionSettings}
                  onSettingsChange={onEvolutionSettingsChange}
                  errors={evolutionConfigurationErrors}
                  evolutionEnabled={evolutionEnabled}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-muted/60 bg-muted/10 p-4 text-xs text-muted-foreground">
                  Enable evolutionary mode to access population, selection, and seed settings.
                </div>
              )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
      </div>
    </>
  );
}

interface FadeSectionProps {
  active: boolean;
  children: ReactNode;
}

function FadeSection({ active, children }: FadeSectionProps) {
  const [shouldRender, setShouldRender] = useState(active);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (active) {
      setShouldRender(true);
    } else if (shouldRender) {
      timeoutId = setTimeout(() => setShouldRender(false), 250);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [active, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        "transform transition-all duration-300",
        active ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2",
      )}
    >
      {children}
    </div>
  );
}

function formatDuration(value?: number | null): string {
  if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
    return '0.00s';
  }
  return `${(value / 1000).toFixed(2)}s`;
}

type RuntimeMetricProps = {
  label: string;
  value: string;
};

function RuntimeMetric({ label, value }: RuntimeMetricProps) {
  return (
    <div className="rounded-md border border-muted bg-background/70 px-2 py-1 text-right sm:text-left">
      <p className="text-[0.65rem] uppercase leading-none">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
