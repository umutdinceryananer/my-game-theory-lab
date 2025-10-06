import { useEffect, useId, useRef } from "react";
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

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type=\"hidden\"])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])"
].join(", ");

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (element) =>
      !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
  );

export function StrategyOverviewDialog({ open, summary, onClose }: StrategyOverviewDialogProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!overlayRef.current) return undefined;

    const focusableElements = getFocusableElements(overlayRef.current);
    const elementToFocus = focusableElements[0] ?? overlayRef.current;

    const focusTimeout = window.setTimeout(() => {
      elementToFocus.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!overlayRef.current) return;

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(overlayRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        overlayRef.current.focus();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;
      const isShift = event.shiftKey;

      if (!activeElement || !overlayRef.current.contains(activeElement)) {
        event.preventDefault();
        (isShift ? lastElement : firstElement).focus();
        return;
      }

      if (!isShift && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (isShift && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimeout);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;

    const previouslyFocusedElement = previouslyFocusedElementRef.current;
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElementRef.current = null;
    }
  }, [open]);

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
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-2xl overflow-hidden border border-muted bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-muted px-6 py-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Strategy overview</p>
            <h2 id={headingId} className="text-lg font-semibold">
              {summary.name}
            </h2>
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
