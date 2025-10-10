import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions, TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EvolutionMetricPoint } from '@/hooks/useEvolutionAnalytics';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export interface EvolutionLineChartProps {
  points: EvolutionMetricPoint[];
  roundsPerMatch: number;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

export function EvolutionLineChart({ points, roundsPerMatch }: EvolutionLineChartProps) {
  const labels = useMemo(() => points.map((p) => p.generation), [points]);
  const divisor = roundsPerMatch > 0 ? roundsPerMatch : 1;

  const best = useMemo(
    () => points.map((p) => (p.bestFitness ?? 0) / divisor),
    [points, divisor],
  );
  const avg = useMemo(
    () => points.map((p) => (p.averageFitness ?? 0) / divisor),
    [points, divisor],
  );
  const median = useMemo(
    () => points.map((p) => (p.medianFitness ?? 0) / divisor),
    [points, divisor],
  );

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Best',
          data: best,
          borderColor: 'rgb(59, 130, 246)', // tailwind blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          pointRadius: 2,
          fill: false,
          tension: 0.2,
        },
        {
          label: 'Average',
          data: avg,
          borderColor: 'rgb(107, 114, 128)', // gray-500
          backgroundColor: 'rgba(107, 114, 128, 0.15)',
          pointRadius: 0,
          fill: false,
          borderDash: [4, 4],
          tension: 0.2,
        },
        {
          label: 'Median',
          data: median,
          borderColor: 'rgb(16, 185, 129)', // emerald-500
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          pointRadius: 0,
          fill: false,
          borderDash: [2, 4],
          tension: 0.2,
        },
      ],
    }),
    [labels, best, avg, median],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false as const,
      interaction: { mode: 'nearest' as const, intersect: false },
      scales: {
        x: {
          title: { display: true, text: 'Generation' },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: 'Avg score per round' },
          grid: { color: 'rgba(148, 163, 184, 0.15)' },
          ticks: {
            callback: (value: number | string) => {
              const numericValue = typeof value === 'string' ? Number(value) : value;
              return formatNumber(Number.isNaN(numericValue) ? 0 : numericValue);
            },
          },
        },
      },
      plugins: {
        legend: { position: 'top' as const, labels: { usePointStyle: true } },
        tooltip: {
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => {
              const label = items[0]?.label;
              if (label === undefined || label === null) {
                return '';
              }
              return `Gen ${label}`;
            },
            label: (ctx: TooltipItem<'line'>) => {
              const datasetLabel = ctx.dataset.label ?? 'Value';
              const parsed = ctx.parsed;
              let value: number;
              if (typeof parsed === 'object' && parsed !== null && 'y' in parsed) {
                const parsedY = (parsed as { y?: unknown }).y;
                value =
                  typeof parsedY === 'number'
                    ? parsedY
                    : Number(parsedY ?? Number.NaN);
              } else {
                value = typeof parsed === 'number' ? parsed : Number(parsed ?? Number.NaN);
              }
              return `${datasetLabel}: ${formatNumber(Number.isNaN(value) ? 0 : value)}`;
            },
          },
        },
      },
      elements: { point: { hoverRadius: 4 } },
    }),
    [],
  );

  const hasData = points.length > 0;

  return (
    <Card className="border-primary/30 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">Evolution fitness trend</CardTitle>
          <span className="text-xs uppercase text-muted-foreground">
            {hasData ? `${points.length} points` : 'No history'}
          </span>
        </div>
      </CardHeader>
      <CardContent className={hasData ? 'h-64 sm:h-72' : 'py-6'}>
        {hasData ? (
          <Line data={data} options={options} role="img" aria-label="Evolution fitness trend" />
        ) : (
          <p className="text-xs text-muted-foreground">Run the evolutionary loop to see fitness trends.</p>
        )}
      </CardContent>
    </Card>
  );
}

