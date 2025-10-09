import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play } from 'lucide-react';

interface EvolutionToggleCardProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  toggleDisabled?: boolean;
  runDisabled?: boolean;
  isRunning: boolean;
  onRun: () => void;
  minParticipants: number;
  activeStrategyCount: number;
}

export function EvolutionToggleCard({
  enabled,
  onToggle,
  toggleDisabled,
  runDisabled,
  isRunning,
  onRun,
  minParticipants,
  activeStrategyCount,
}: EvolutionToggleCardProps) {
  const insufficientOpponents = activeStrategyCount < minParticipants;
  const runButtonDisabled = runDisabled || insufficientOpponents || isRunning;
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
              Evolutionary mode
            </CardTitle>
            <CardDescription className="text-xs">
              Run genetic strategies through an evolutionary loop before the tournament.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{enabled ? 'Enabled' : 'Disabled'}</span>
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              aria-label="Toggle evolutionary mode"
              disabled={toggleDisabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Select strategies, configure settings, and run evolution to discover high-performing genomes.
        </p>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={onRun}
          disabled={runButtonDisabled}
        >
          {!isRunning && <Play className="mr-2 h-4 w-4" />}
          {isRunning
            ? 'Running...'
            : enabled
            ? 'Run Evolution + Tournament'
            : 'Run Tournament'}
        </Button>
      </CardContent>
      {enabled && insufficientOpponents && (
        <div className="border-t px-6 py-3">
          <p className="text-xs text-destructive">
            Select at least {minParticipants} opponent
            {minParticipants === 1 ? '' : 's'} to run the evolutionary cycle.
          </p>
        </div>
      )}
    </Card>
  );
}
