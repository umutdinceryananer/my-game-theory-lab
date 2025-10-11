import { useCallback, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { Chart as ChartJS } from 'chart.js';

import { EvolutionSummaryCard } from '@/components/analytics/evolution-summary';
import { EvolutionLineChart } from '@/components/analytics/evolution-line-chart';
import type { EvolutionRuntimeMetrics } from '@/core/evolution';
import type { EvolutionAnalytics } from '@/hooks/useEvolutionAnalytics';
import { Button } from '@/components/ui/button';

interface EvolutionInsightsProps {
  analytics: EvolutionAnalytics;
  roundsPerMatch: number;
  enabled: boolean;
  runtimeMetrics?: EvolutionRuntimeMetrics | null;
  profilingEnabled?: boolean;
}

export function EvolutionInsights({
  analytics,
  roundsPerMatch,
  enabled,
  runtimeMetrics,
  profilingEnabled,
}: EvolutionInsightsProps) {
  const chartRef = useRef<ChartJS<'line'> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  const handleChartReady = useCallback((chart: ChartJS<'line'> | null) => {
    chartRef.current = chart;
    setIsChartReady(Boolean(chart));
  }, []);

  const handleExport = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    const dataUrl = chart.toBase64Image('image/png', 1);
    if (!dataUrl) {
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `evolution-trend-${timestamp}.png`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  if (!enabled || !analytics.hasHistory) {
    return null;
  }

  const hasRuntimeMetrics = Boolean(
    profilingEnabled && runtimeMetrics && runtimeMetrics.generationDurations.length > 0,
  );

  const exportDisabled = !isChartReady;

  return (
    <div className='space-y-4'>
      <EvolutionSummaryCard data={analytics} />
      <EvolutionLineChart
        points={analytics.points}
        roundsPerMatch={roundsPerMatch}
        onReady={handleChartReady}
        actions={
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='gap-1.5'
            onClick={handleExport}
            disabled={exportDisabled}
          >
            <Download className='h-4 w-4' aria-hidden='true' />
            Download PNG
          </Button>
        }
      />
      {hasRuntimeMetrics && runtimeMetrics && (
        <div className='rounded-lg border border-muted bg-card/80 p-4'>
          <p className='text-sm font-semibold text-foreground'>Profiling metrics</p>
          <div className='mt-2 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3'>
            <MetricBlock label='Total runtime' value={formatMs(runtimeMetrics.totalRuntimeMs)} />
            <MetricBlock
              label='Avg generation'
              value={formatMs(runtimeMetrics.averageGenerationMs)}
            />
            <MetricBlock
              label='Generations'
              value={`${runtimeMetrics.generationDurations.length}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function formatMs(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0.00s';
  }
  return `${(value / 1000).toFixed(2)}s`;
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-md border border-muted bg-background/80 px-3 py-2'>
      <p className="text-[0.65rem] uppercase">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

