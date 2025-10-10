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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">Evolution snapshot</CardTitle>
          <span className="text-xs uppercase text-muted-foreground">
            {hasData ? `Generation ${latest?.generation ?? 0}` : 'No history'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasData ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              <SummaryMetric label="Best fitness" value={formatMetric(data.bestFitness)} highlight />
              <SummaryMetric label="Average fitness" value={formatMetric(latest?.averageFitness ?? null)} />
              <SummaryMetric label="Median fitness" value={formatMetric(latest?.medianFitness ?? null)} />
              <SummaryMetric label="Mutation events" value={data.mutationTotal.toString()} />
              <SummaryMetric label="Crossover events" value={data.crossoverTotal.toString()} />
            </div>
            {data.bestIndividual && (
              <div className="rounded-md border border-border bg-background px-3 py-2 text-xs">
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


function formatMetric(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '-';
  return formatter.format(value);
}

function SummaryMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs">
      <span className="block text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold text-foreground', highlight && 'text-primary')}>{value}</span>
    </div>
  );
}


