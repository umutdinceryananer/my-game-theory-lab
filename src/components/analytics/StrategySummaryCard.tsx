import { ShieldCheck, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StrategyAnalytics } from "@/hooks/useTournamentAnalytics";

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});

type StrategySummaryCardProps = {
  summary: StrategyAnalytics | null;
};

export function StrategySummaryCard({ summary }: StrategySummaryCardProps) {
  if (!summary) {
    return (
      <Card className="border border-dashed border-muted">
        <CardHeader>
          <CardTitle className="text-base">Select a strategy</CardTitle>
          <CardDescription>
            Choose a strategy from the standings table to review its detailed metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Analytics will appear here once a strategy is selected.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{summary.name}</span>
          <Badge variant="secondary" className="gap-1 uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            {summary.wins}-{summary.draws}-{summary.losses}
          </Badge>
        </CardTitle>
        <CardDescription>
          {summary.matchesPlayed} matches · {integerFormatter.format(summary.totalScore)} total points
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Score per match</span>
          <span className="font-semibold">{decimalFormatter.format(summary.averageScore)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Standard deviation</span>
          <span className="font-semibold">{decimalFormatter.format(summary.stdDeviation)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Win rate</span>
          <span className="font-semibold">{percentFormatter.format(summary.winRate)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Draw / loss rate</span>
          <span>
            {percentFormatter.format(summary.drawRate)} / {percentFormatter.format(summary.lossRate)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Score differential
          </span>
          <span className="font-semibold">
            {decimalFormatter.format(summary.headToHead.reduce((acc, entry) => acc + entry.scoreDifferential, 0))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}