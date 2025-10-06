import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import type { StrategyAnalytics } from "@/hooks/useTournamentAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StrategySummaryCard } from "@/components/analytics";

type StrategyOverviewDialogProps = {
  open: boolean;
  summary: StrategyAnalytics | null;
  onClose: () => void;
};

export function StrategyOverviewDialog({ open, summary, onClose }: StrategyOverviewDialogProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !overlayRef.current) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (!overlayRef.current) return;
      if (!overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <Card
        ref={overlayRef}
        className="relative z-10 w-full max-w-2xl overflow-hidden border border-muted bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-muted px-6 py-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Strategy overview</p>
            <h2 className="text-lg font-semibold">{summary.name}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close strategy overview">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="p-6">
          <StrategySummaryCard summary={summary} />
        </CardContent>
        <div className="flex justify-end gap-2 border-t border-muted bg-muted/30 px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
