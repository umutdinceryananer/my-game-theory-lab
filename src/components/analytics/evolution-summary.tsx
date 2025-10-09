import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EvolutionAnalytics } from '@/hooks/useEvolutionAnalytics';

interface EvolutionSummaryProps {
  data: EvolutionAnalytics;
}

const formatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

export function EvolutionSummaryCard({ data }: EvolutionSummaryProps) {
  const latest = data.latestPoint;
  const hasData = data.hasHistory && latest;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">Evolution snapshot</CardTitle>
          <span className="text-xs uppercase text-muted-foreground">
            {hasData ? `Generation ${latest?.generation ?? 0}` : 'No history'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {hasData ? (
          <>
            <SummaryRow label="Best fitness" value={formatMetric(data.bestFitness)} highlight />
            <SummaryRow label="Average fitness" value={formatMetric(latest?.averageFitness ?? null)} />
            <SummaryRow label="Median fitness" value={formatMetric(latest?.medianFitness ?? null)} />
            <SummaryRow label="Mutation events" value={data.mutationTotal.toString()} />
            <SummaryRow label="Crossover events" value={data.crossoverTotal.toString()} />
            {data.bestIndividual && (
              <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs">
                <p className="text-muted-foreground">Top individual</p>
                <p className="font-medium text-foreground">{data.bestIndividual.strategyName}</p>
                <p className="text-muted-foreground">
                  Fitness {formatMetric(data.bestIndividual.fitness ?? null)} - Introduction gen{' '}
                  {data.bestIndividual.generationIntroduced}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Run the evolutionary loop to populate fitness metrics and history.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium text-foreground', highlight && 'text-primary')}>{value}</span>
    </div>
  );
}

function formatMetric(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '-';
  return formatter.format(value);
}
