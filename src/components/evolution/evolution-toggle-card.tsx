import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dna } from "lucide-react";

interface EvolutionToggleCardProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  toggleDisabled?: boolean;
  minParticipants: number;
  activeStrategyCount: number;
  onOpenGeneticEditor: () => void;
}

export function EvolutionToggleCard({
  enabled,
  onToggle,
  toggleDisabled,
  minParticipants,
  activeStrategyCount,
  onOpenGeneticEditor,
}: EvolutionToggleCardProps) {
  const insufficientOpponents = activeStrategyCount < minParticipants;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
        <div className="flex h-full items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
          <div className="space-y-1">
            <span className="block text-xs font-semibold uppercase text-muted-foreground">
              Evolutionary mode
            </span>
            <span className="block text-xs text-muted-foreground">
              Run genetic strategies before the tournament.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {enabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              aria-label="Toggle evolutionary mode"
              disabled={toggleDisabled}
            />
          </div>
        </div>
        <div className="flex h-full items-center justify-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
          <Button
            variant="outline"
            size="lg"
            className="h-full w-full justify-center sm:w-auto"
            onClick={onOpenGeneticEditor}
          >
            <Dna className="mr-2 h-4 w-4" aria-hidden="true" />
            Genetic editor
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Select strategies, configure settings, and run evolution to discover high-performing genomes.
      </p>
      {enabled && insufficientOpponents && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2">
          <p className="text-xs text-destructive">
            Select at least {minParticipants} opponent
            {minParticipants === 1 ? "" : "s"} to run the evolutionary cycle.
          </p>
        </div>
      )}
    </div>
  );
}
