import { useMemo } from 'react';

import type {
  EvolutionSummary,
  GenerationSnapshot,
  PopulationIndividual,
} from '@/core/evolution';

export interface EvolutionMetricPoint {
  generation: number;
  bestFitness: number | null;
  averageFitness: number | null;
  medianFitness: number | null;
  mutationCount: number;
  crossoverCount: number;
  createdAt: number;
}

export interface EvolutionAnalytics {
  points: EvolutionMetricPoint[];
  bestFitness: number | null;
  bestGeneration: number | null;
  bestIndividual: PopulationIndividual | null;
  mutationTotal: number;
  crossoverTotal: number;
  latestPoint: EvolutionMetricPoint | null;
  hasHistory: boolean;
}

const toMetricPoint = (snapshot: GenerationSnapshot): EvolutionMetricPoint => ({
  generation: snapshot.generation,
  bestFitness: snapshot.metrics.bestFitness ?? null,
  averageFitness: snapshot.metrics.averageFitness ?? null,
  medianFitness: snapshot.metrics.medianFitness ?? null,
  mutationCount: snapshot.metrics.mutationCount ?? 0,
  crossoverCount: snapshot.metrics.crossoverCount ?? 0,
  createdAt: snapshot.createdAt,
});

const sumMetric = (points: EvolutionMetricPoint[], key: 'mutationCount' | 'crossoverCount') =>
  points.reduce((sum, point) => sum + (point[key] ?? 0), 0);

const findBestIndividual = (
  summary: EvolutionSummary | null,
  bestGeneration: number | null,
): PopulationIndividual | null => {
  if (!summary || summary.history.length === 0) return null;
  if (summary.bestIndividual) {
    return summary.bestIndividual;
  }

  if (bestGeneration === null) {
    return null;
  }

  const snapshot = summary.history.find((entry) => entry.generation === bestGeneration);
  if (!snapshot) return null;
  const bestFitness = snapshot.metrics.bestFitness;
  if (bestFitness === null) return null;

  return snapshot.population.find(
    (individual) => individual.fitness !== null && individual.fitness >= bestFitness,
  ) ?? null;
};

export function useEvolutionAnalytics(summary: EvolutionSummary | null): EvolutionAnalytics {
  const points = useMemo(() => {
    if (!summary || summary.history.length === 0) return [];
    return summary.history.map(toMetricPoint);
  }, [summary]);

  const latestPoint = useMemo(() => (points.length > 0 ? points[points.length - 1] : null), [points]);

  const bestPoint = useMemo(() => {
    let candidate: EvolutionMetricPoint | null = null;
    for (const point of points) {
      if (point.bestFitness === null) continue;
      if (!candidate || (candidate.bestFitness ?? Number.NEGATIVE_INFINITY) < point.bestFitness) {
        candidate = point;
      }
    }
    return candidate;
  }, [points]);

  const mutationTotal = useMemo(() => sumMetric(points, 'mutationCount'), [points]);
  const crossoverTotal = useMemo(() => sumMetric(points, 'crossoverCount'), [points]);

  const bestIndividual = useMemo(
    () => findBestIndividual(summary, bestPoint?.generation ?? null),
    [summary, bestPoint],
  );

  return {
    points,
    bestFitness: bestPoint?.bestFitness ?? null,
    bestGeneration: bestPoint?.generation ?? null,
    bestIndividual,
    mutationTotal,
    crossoverTotal,
    latestPoint,
    hasHistory: points.length > 0,
  };
}

