import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TournamentResult } from "@/core/tournament";
import { useTournamentAnalytics } from "@/hooks/useTournamentAnalytics";

import { StrategySummaryCard } from "./StrategySummaryCard";

type AnalyticsPanelProps = {
  results: TournamentResult[] | null;
  selectedStrategyName: string | null;
  onSelectStrategy?: (name: string) => void;
  className?: string;
};

export function AnalyticsPanel({
  results,
  selectedStrategyName,
  onSelectStrategy,
  className,
}: AnalyticsPanelProps) {
  const { summaries, getSummary, hasResults } = useTournamentAnalytics(results);

  const activeSummary = selectedStrategyName ? getSummary(selectedStrategyName) : null;
  const fallbackSummary = !activeSummary && summaries.length > 0 ? summaries[0] : null;
  const summaryToRender = activeSummary ?? fallbackSummary;

  if (!activeSummary && fallbackSummary && onSelectStrategy) {
    onSelectStrategy(fallbackSummary.name);
  }

  return (
    <Card className={cn("space-y-6", className)}>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg">Analytics overview</CardTitle>
        <CardDescription>
          Select a strategy from the standings table to inspect its aggregate performance metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StrategySummaryCard summary={summaryToRender} />

        {hasResults && summaryToRender ? (
          <div className="rounded-lg border border-dashed border-muted p-4 text-xs text-muted-foreground">
            <Badge variant="secondary" className="uppercase">{summaryToRender.name}</Badge>
            <p className="mt-3">
              Head-to-head analytics have been disabled. Run the leaderboard to compare total scores and averages, or
              re-enable detailed match breakdowns in a future update.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-muted p-6 text-sm text-muted-foreground">
            Run a tournament and then pick a strategy from the standings to view its aggregate metrics.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
