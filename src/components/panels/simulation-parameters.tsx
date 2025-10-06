import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { PayoffMatrix } from '@/core/types';
import type { TournamentFormat } from '@/core/tournament';
import { cn } from '@/lib/utils';

import { PayoffMatrixEditor } from './payoff-matrix-editor';

export type SimulationParametersProps = {
  rounds: number;
  onRoundsChange: (value: number) => void;
  noiseEnabled: boolean;
  onNoiseToggle: (enabled: boolean) => void;
  noisePercent: number;
  onNoisePercentChange: (value: number) => void;
  payoffMatrix: PayoffMatrix;
  onPayoffMatrixChange: (matrix: PayoffMatrix) => void;
  seedEnabled: boolean;
  seedValue: string;
  onSeedToggle: (enabled: boolean) => void;
  onSeedChange: (value: string) => void;
  activeStrategyCount: number;
  tournamentFormat: TournamentFormat;
  onTournamentFormatChange: (format: TournamentFormat) => void;
};

export function SimulationParametersPanel({
  rounds,
  onRoundsChange,
  noiseEnabled,
  onNoiseToggle,
  noisePercent,
  onNoisePercentChange,
  payoffMatrix,
  onPayoffMatrixChange,
  seedEnabled,
  seedValue,
  onSeedToggle,
  onSeedChange,
  activeStrategyCount,
  tournamentFormat,
  onTournamentFormatChange,
}: SimulationParametersProps) {
  const [showNoiseSettings, setShowNoiseSettings] = useState(false);
  const [showPayoffSettings, setShowPayoffSettings] = useState(false);

  const payoffSummary = useMemo(
    () =>
      `T=${payoffMatrix.temptation}, R=${payoffMatrix.reward}, P=${payoffMatrix.punishment}, S=${payoffMatrix.sucker}`,
    [payoffMatrix],
  );

  const suggestedSwissRounds = useMemo(() => {
    const participants = Math.max(2, activeStrategyCount);
    return Math.max(1, Math.ceil(Math.log2(participants)) + 1);
  }, [activeStrategyCount]);

  const swissRounds =
    tournamentFormat.kind === 'swiss'
      ? tournamentFormat.rounds ?? suggestedSwissRounds
      : suggestedSwissRounds;

  const activeTieBreaker =
    tournamentFormat.kind === 'swiss' ? tournamentFormat.tieBreaker ?? 'total-score' : 'total-score';

  const tieBreakerOptions = [
    { value: 'total-score', label: 'Total score' },
    { value: 'buchholz', label: 'Buchholz' },
    { value: 'sonneborn-berger', label: 'Sonneborn-Berger' },
  ] as const;

  const handleRoundsInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (Number.isNaN(next)) {
      onRoundsChange(1);
      return;
    }

    const clamped = Math.min(1000, Math.max(1, Math.floor(next)));
    onRoundsChange(clamped);
  };

  const handleNoiseInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (Number.isNaN(next)) {
      onNoisePercentChange(0);
      return;
    }

    const clamped = Math.min(100, Math.max(0, Math.round(next)));
    onNoisePercentChange(clamped);
  };

  const handleNoiseSlider = (event: React.ChangeEvent<HTMLInputElement>) => {
    const clamped = Number(event.target.value);
    onNoisePercentChange(clamped);
  };

  const handlePayoffChange = (next: PayoffMatrix) => {
    onPayoffMatrixChange(next);
  };

  const handleSeedInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSeedChange(event.target.value);
  };

  const handleSwissRoundsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (tournamentFormat.kind !== 'swiss') return;
    const next = Number(event.target.value);
    if (Number.isNaN(next)) return;
    const clamped = Math.max(1, Math.min(20, Math.floor(next)));
    onTournamentFormatChange({
      kind: 'swiss',
      rounds: clamped,
      tieBreaker: tournamentFormat.tieBreaker ?? 'total-score',
    });
  };

  return (
    <section className="space-y-3 rounded-lg border border-dashed border-muted p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Simulation parameters</h2>
          <p className="text-xs text-muted-foreground">
            Tune match length, noise, randomness and payoff matrix before running the tournament.
          </p>
        </div>
        <Badge variant="outline" className="uppercase">Lab setup</Badge>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <label htmlFor="rounds" className="text-sm font-medium text-muted-foreground">
          Rounds per match
        </label>
        <Input
          id="rounds"
          type="number"
          min={1}
          max={1000}
          step={1}
          inputMode="numeric"
          pattern="[0-9]*"
          value={rounds}
          onChange={handleRoundsInput}
          className="w-full sm:w-32"
        />
      </div>

      <div className="space-y-3 rounded-md border border-dashed border-muted p-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Deterministic seed</p>
            <p className="text-xs text-muted-foreground">
              Use a fixed seed to reproduce random strategy behavior and noise flips.
            </p>
          </div>
          <Switch checked={seedEnabled} onCheckedChange={onSeedToggle} aria-label="Toggle seed" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor="seed" className="text-xs font-medium text-muted-foreground">
            Seed value (number or text)
          </label>
          <Input
            id="seed"
            type="text"
            value={seedValue}
            onChange={handleSeedInput}
            disabled={!seedEnabled}
            placeholder="e.g. 42 or lab-session-1"
            className="w-full sm:w-64"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-dashed border-muted p-3">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tournament format</p>
            <p className="text-xs text-muted-foreground">
              Choose how strategies pair up; Swiss adds round-based pairings with configurable depth.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant={tournamentFormat.kind === 'single-round-robin' ? 'default' : 'outline'}
              aria-pressed={tournamentFormat.kind === 'single-round-robin'}
              onClick={() => onTournamentFormatChange({ kind: 'single-round-robin' })}
            >
              Single round-robin
            </Button>
            <Button
              type="button"
              variant={tournamentFormat.kind === 'double-round-robin' ? 'default' : 'outline'}
              aria-pressed={tournamentFormat.kind === 'double-round-robin'}
              onClick={() => onTournamentFormatChange({ kind: 'double-round-robin' })}
            >
              Double round-robin
            </Button>
            <Button
              type="button"
              variant={tournamentFormat.kind === 'swiss' ? 'default' : 'outline'}
              aria-pressed={tournamentFormat.kind === 'swiss'}
              onClick={() =>
                onTournamentFormatChange({
                  kind: 'swiss',
                  rounds:
                    tournamentFormat.kind === 'swiss'
                      ? tournamentFormat.rounds ?? suggestedSwissRounds
                      : suggestedSwissRounds,
                  tieBreaker: activeTieBreaker,
                })
              }
            >
              Swiss pairing
            </Button>
          </div>
          {tournamentFormat.kind === 'swiss' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="swiss-rounds" className="text-xs font-medium text-muted-foreground">
                  Rounds
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="swiss-rounds"
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={swissRounds}
                    onChange={handleSwissRoundsChange}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">
                    Suggested: {suggestedSwissRounds}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Tie-breaker</p>
                <div className="flex flex-wrap gap-2">
                  {tieBreakerOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={
                        activeTieBreaker === option.value
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() =>
                        onTournamentFormatChange({
                          kind: 'swiss',
                          rounds: swissRounds,
                          tieBreaker: option.value,
                        })
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Adjust Swiss rounds and tie-breakers to experiment with ranking sensitivity.
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-dashed border-muted p-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Noise (error flips)</p>
            <p className="text-xs text-muted-foreground">Simulate miscommunication by randomly inverting moves.</p>
          </div>
          <Switch checked={noiseEnabled} onCheckedChange={onNoiseToggle} aria-label="Toggle noise" />
        </div>
        <Card className="border border-muted bg-background/50">
          <Button
            type="button"
            variant="ghost"
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
            onClick={() => setShowNoiseSettings((prev) => !prev)}
          >
            <span>Advanced noise settings</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showNoiseSettings ? 'rotate-180' : 'rotate-0')}
            />
          </Button>
          {showNoiseSettings && (
            <div className="space-y-3 px-4 pb-4 text-sm">
              <p className="text-xs text-muted-foreground">
                Select a custom error rate. Each move has this probability of being flipped.
              </p>
              <div className="space-y-2">
                <label htmlFor="noise-percent" className="text-xs font-medium text-muted-foreground">
                  Noise level (% chance to flip a move)
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    id="noise-percent"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={noisePercent}
                    onChange={handleNoiseSlider}
                    disabled={!noiseEnabled}
                    className="accent-foreground"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={noisePercent}
                    onChange={handleNoiseInput}
                    disabled={!noiseEnabled}
                    className="w-full sm:w-24"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-3 rounded-md border border-dashed border-muted p-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Payoff matrix (T, R, P, S)</p>
            <p className="text-xs text-muted-foreground">Control the reward structure for each round of play.</p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{payoffSummary}</span>
        </div>
        <Card className="border border-muted bg-background/50">
          <Button
            type="button"
            variant="ghost"
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
            onClick={() => setShowPayoffSettings((prev) => !prev)}
          >
            <span>Adjust payoff values</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showPayoffSettings ? 'rotate-180' : 'rotate-0')}
            />
          </Button>
          {showPayoffSettings && (
            <div className="space-y-3 px-4 pb-4 text-sm">
              <p className="text-xs text-muted-foreground">
                Classic dilemma ordering is T &gt; R &gt; P &gt; S. Experiment with different values to explore other games.
              </p>
              <PayoffMatrixEditor value={payoffMatrix} onChange={handlePayoffChange} />
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}