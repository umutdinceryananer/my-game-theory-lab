import { EvolutionSummaryCard } from '@/components/analytics/evolution-summary';
import { EvolutionLineChart } from '@/components/analytics/evolution-line-chart';
import type { EvolutionAnalytics } from '@/hooks/useEvolutionAnalytics';

interface EvolutionInsightsProps {
  analytics: EvolutionAnalytics;
  roundsPerMatch: number;
  enabled: boolean;
}

export function EvolutionInsights({ analytics, roundsPerMatch, enabled }: EvolutionInsightsProps) {
  if (!enabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      <EvolutionSummaryCard data={analytics} />
      <EvolutionLineChart points={analytics.points} roundsPerMatch={roundsPerMatch} />
    </div>
  );
}
