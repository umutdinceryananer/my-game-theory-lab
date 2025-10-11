import { Badge } from '@/components/ui/badge';
import type { StrategyAnalytics } from '@/hooks/useTournamentAnalytics';

const integerFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });
const ratingFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

type StrategySummaryInlineCardProps = {
  summary: StrategyAnalytics;
  rank: number;
};

export function StrategySummaryInlineCard({ summary, rank }: StrategySummaryInlineCardProps) {
  const scoreDifferential = summary.headToHead.reduce(
    (total, entry) => total + entry.scoreDifferential,
    0,
  );

  return (
    <div className="flex flex-nowrap items-center gap-4 overflow-x-auto rounded-lg border border-border/60 bg-background/80 px-4 py-3 text-xs shadow-sm">
      <div className="flex items-center gap-2 pr-4 text-sm font-semibold text-foreground">
        <span className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-primary/10 px-2 text-[0.65rem] font-semibold text-primary">#{rank}</span>
        <span>{summary.name}</span>
        <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-wide">
          {summary.wins}-{summary.draws}-{summary.losses}
        </Badge>
      </div>

      <Metric label="Avg" value={decimalFormatter.format(summary.averageScore)} />
      {summary.rating !== null ? <Metric label="Elo" value={ratingFormatter.format(summary.rating)} /> : null}
      <Metric label="Std Dev" value={decimalFormatter.format(summary.stdDeviation)} />
      <Metric label="Win %" value={percentFormatter.format(summary.winRate)} />
      <Metric label="Draw %" value={percentFormatter.format(summary.drawRate)} />
      <Metric label="Loss %" value={percentFormatter.format(summary.lossRate)} />
      <Metric label="Matches" value={integerFormatter.format(summary.matchesPlayed)} />
      <Metric label="Total" value={integerFormatter.format(summary.totalScore)} />
      <Metric label="Diff" value={decimalFormatter.format(scoreDifferential)} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 whitespace-nowrap text-left">
      <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
