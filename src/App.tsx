import { useCallback, useEffect, useMemo, useState } from "react";

import { LandingScreen } from "@/components/landing-screen";
import { DEFAULT_PAYOFF_MATRIX, type PayoffMatrix, type Strategy } from "@/core/types";
import {
  DEFAULT_TOURNAMENT_FORMAT,
  type TournamentFormat,
  type TournamentOutcome,
} from "@/core/tournament";
import { simulateTournament } from "@/test-game";
import { baseStrategies } from "@/strategies";
import type { GeneticStrategyConfig } from "@/strategies/genetic";
import { createGeneticStrategy, geneticStrategyConfigs } from "@/strategies/genetic";
import { cloneGeneticConfigMap } from "@/strategies/genetic/utils";
import { createBasicEvolutionEngine } from "@/core/evolution";
import type { EvolutionSettings, EvolutionSummary } from "@/core/evolution";
import { TournamentDashboard } from "@/components/dashboard/tournament-dashboard";
import {
  buildStrategies,
  buildStrategyMap,
  getEvolutionSettingsIssues,
  type GeneticConfigMap,
} from "@/lib/tournament";

type StrategyType = Strategy;

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
    mutationOperator: "bit-flip",
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
  const swissRounds = tournamentOutcome?.swissRounds ?? null;
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



