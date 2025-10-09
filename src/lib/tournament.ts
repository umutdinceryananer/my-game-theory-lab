import type { EvolutionSettings } from "@/core/evolution";
import type { Strategy } from "@/core/types";
import { createGeneticStrategy } from "@/strategies/genetic";
import type { GeneticStrategyConfig } from "@/strategies/genetic";

export type GeneticConfigMap = Record<string, GeneticStrategyConfig>;

export function getEvolutionSettingsIssues(settings: EvolutionSettings): string[] {
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

export function buildStrategies(base: Strategy[], configs: GeneticConfigMap): Strategy[] {
  const geneticList = Object.values(configs).map((config) => createGeneticStrategy(config));
  return [...base, ...geneticList];
}

export function buildStrategyMap(strategies: Strategy[]): Map<string, Strategy> {
  return strategies.reduce<Map<string, Strategy>>((map, strategy) => {
    map.set(strategy.name, strategy);
    return map;
  }, new Map());
}
