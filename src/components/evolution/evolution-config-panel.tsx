import { useMemo, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TooltipHint } from "@/components/ui/tooltip-hint";
import { cn } from "@/lib/utils";
import type { EvolutionSettings } from "@/core/evolution";

interface EvolutionConfigPanelProps {
  settings: EvolutionSettings;
  onSettingsChange: (settings: EvolutionSettings) => void;
  errors: string[];
  evolutionEnabled: boolean;
}

export function EvolutionConfigPanel({
  settings,
  onSettingsChange,
  errors,
  evolutionEnabled,
}: EvolutionConfigPanelProps) {
  const mutationOperatorOptions = useMemo(
    () => [
      { value: 'bit-flip', label: 'Bit flip', helper: 'Flips gene responses with a given probability.' },
      { value: 'gaussian', label: 'Gaussian', helper: 'Perturbs gene weights using Gaussian noise.' },
      { value: 'swap', label: 'Swap', helper: 'Swaps the positions of two genes when triggered.' },
    ],
    [],
  );

  const elitismInvalid = settings.elitismCount >= settings.populationSize || settings.elitismCount < 0;
  const tournamentSizeValue = settings.tournamentSize ?? 3;
  const tournamentSizeInvalid =
    settings.selectionMethod === 'tournament' &&
    (tournamentSizeValue > settings.populationSize || tournamentSizeValue < 2);
  const activeMutationOption = useMemo(
    () => mutationOperatorOptions.find((option) => option.value === settings.mutationOperator) ?? mutationOperatorOptions[0],
    [mutationOperatorOptions, settings.mutationOperator],
  );

  const handleSetting = useCallback(
    <K extends keyof EvolutionSettings>(key: K, value: EvolutionSettings[K]) => {
      onSettingsChange({ ...settings, [key]: value });
    },
    [onSettingsChange, settings],
  );

  useEffect(() => {
    if (!evolutionEnabled && settings.profilingEnabled) {
      onSettingsChange({ ...settings, profilingEnabled: false });
    }
  }, [evolutionEnabled, onSettingsChange, settings]);

  const coreFields = useMemo(
    () => (
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
          <span className="flex items-center gap-1">
            Population size
            <TooltipHint id="evolution.population-size" />
          </span>
          <Input
            type="number"
            min={2}
            value={settings.populationSize}
            onChange={(event) =>
              handleSetting(
                'populationSize',
                Math.max(2, Number.parseInt(event.target.value, 10) || settings.populationSize),
              )
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
          <span className="flex items-center gap-1">
            Generations
            <TooltipHint id="evolution.generations" />
          </span>
          <Input
            type="number"
            min={1}
            value={settings.generations}
            onChange={(event) =>
              handleSetting(
                'generations',
                Math.max(1, Number.parseInt(event.target.value, 10) || settings.generations),
              )
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
          <span className="flex items-center gap-1">
            Mutation rate (0-1)
            <TooltipHint id="evolution.mutation-rate" />
          </span>
          <Input
            type="number"
            min={0}
            max={1}
            step="0.01"
            value={settings.mutationRate}
            onChange={(event) =>
              handleSetting(
                'mutationRate',
                Math.min(Math.max(Number.parseFloat(event.target.value) || 0, 0), 1),
              )
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
          <span className="flex items-center gap-1">
            Crossover rate (0-1)
            <TooltipHint id="evolution.crossover-rate" />
          </span>
          <Input
            type="number"
            min={0}
            max={1}
            step="0.01"
            value={settings.crossoverRate}
            onChange={(event) =>
              handleSetting(
                'crossoverRate',
                Math.min(Math.max(Number.parseFloat(event.target.value) || 0, 0), 1),
              )
            }
          />
        </label>
      </div>
    ),
    [settings, handleSetting],
  );

  const advancedFields = useMemo(
    () => (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
            <span className="flex items-center gap-1">
              Selection method
              <TooltipHint id="evolution.selection-method" />
            </span>
            <select
              className="rounded-md border border-muted bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              value={settings.selectionMethod}
              onChange={(event) =>
                handleSetting('selectionMethod', event.target.value as EvolutionSettings['selectionMethod'])
              }
            >
              <option value="tournament">Tournament</option>
              <option value="roulette-wheel">Roulette wheel</option>
              <option value="rank">Rank</option>
              <option value="elitist">Elitist</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
            <span className="flex items-center gap-1">
              Elitism count
              <TooltipHint id="evolution.elitism-count" />
            </span>
            <Input
              type="number"
              min={0}
              value={settings.elitismCount}
              aria-invalid={elitismInvalid}
              className={cn(elitismInvalid && 'border-destructive focus-visible:ring-destructive focus-visible:ring-1')}
              onChange={(event) =>
                handleSetting(
                  'elitismCount',
                  Math.max(0, Number.parseInt(event.target.value, 10) || settings.elitismCount),
                )
              }
            />
            <div className="space-y-1">
              {elitismInvalid && (
                <p className="text-[0.65rem] text-destructive">Elitism count must be lower than population size.</p>
              )}
            </div>
          </label>
          <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
            <span className="flex items-center gap-1">
              Mutation operator
              <TooltipHint id="evolution.mutation-operator" />
            </span>
            <select
              className="rounded-md border border-muted bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              value={settings.mutationOperator}
              onChange={(event) =>
                handleSetting('mutationOperator', event.target.value as EvolutionSettings['mutationOperator'])
              }
            >
              {mutationOperatorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-[0.65rem] text-muted-foreground">{activeMutationOption.helper}</span>
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-muted bg-background/70 px-3 py-2">
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-[0.65rem] font-semibold uppercase text-muted-foreground">
              Performance profiling
              <TooltipHint id="evolution.profiling" />
            </p>
            <p className="text-xs text-muted-foreground">
              Capture runtime metrics for each generation. Enabling this adds minimal overhead.
              {!evolutionEnabled && ' (Enable evolutionary mode first.)'}
            </p>
          </div>
          <Switch
            checked={Boolean(settings.profilingEnabled)}
            onCheckedChange={(value) => handleSetting('profilingEnabled', value)}
            aria-label="Toggle performance profiling"
            disabled={!evolutionEnabled}
          />
        </div>
        {settings.selectionMethod === 'tournament' && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
              <span className="flex items-center gap-1">
                Tournament size
                <TooltipHint id="evolution.tournament-size" />
              </span>
              <Input
                type="number"
                min={2}
                value={tournamentSizeValue}
                aria-invalid={tournamentSizeInvalid}
                className={cn(
                  tournamentSizeInvalid && 'border-destructive focus-visible:ring-destructive focus-visible:ring-1',
                )}
                onChange={(event) =>
                  handleSetting(
                    'tournamentSize',
                    Math.max(2, Number.parseInt(event.target.value, 10) || settings.tournamentSize || 2),
                  )
                }
              />
              <div className="space-y-1">
                <p className="text-[0.65rem] text-muted-foreground">
                  Number of contenders sampled per selection (cannot exceed population size).
                </p>
                {tournamentSizeInvalid && (
                  <p className="text-[0.65rem] text-destructive">Tournament size cannot exceed population size.</p>
                )}
              </div>
            </label>
            <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
              <span className="flex items-center gap-1">
                Random seed (optional)
                <TooltipHint id="evolution.random-seed" />
              </span>
              <Input
                value={settings.randomSeed?.toString() ?? ''}
                onChange={(event) =>
                  handleSetting(
                    'randomSeed',
                    event.target.value.trim().length > 0 ? event.target.value.trim() : undefined,
                  )
                }
              />
            </label>
          </div>
        )}
      </div>
    ),
    [
      settings,
      tournamentSizeValue,
      tournamentSizeInvalid,
      elitismInvalid,
      activeMutationOption,
      mutationOperatorOptions,
      handleSetting,
      evolutionEnabled,
    ],
  );

  return (
    <div className="space-y-4">
      {coreFields}
      {advancedFields}
      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <p className="font-semibold">Evolution settings need attention:</p>
          <ul className="mt-2 space-y-1 list-disc pl-4 text-destructive">
            {errors.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}









