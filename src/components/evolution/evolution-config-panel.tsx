import { useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EvolutionSettings } from "@/core/evolution";
import type { GeneticStrategyConfig } from "@/strategies/genetic";
import { EvolutionSeedManager } from "./evolution-seed-manager";

interface EvolutionConfigPanelProps {
  settings: EvolutionSettings;
  onSettingsChange: (settings: EvolutionSettings) => void;
  seedOptions: GeneticStrategyConfig[];
  selectedSeedNames: string[];
  onSeedToggle: (name: string) => void;
  onSeedSelectAll: () => void;
  onSeedClear: () => void;
  errors: string[];
}

export function EvolutionConfigPanel({
  settings,
  onSettingsChange,
  seedOptions,
  selectedSeedNames,
  onSeedToggle,
  onSeedSelectAll,
  onSeedClear,
  errors,
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

  const coreFields = useMemo(
    () => (
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
          Population size
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
          Generations
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
          Mutation rate (0-1)
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
          Crossover rate (0-1)
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
            Selection method
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
            Elitism count
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
              <p className="text-[0.65rem] text-muted-foreground">
                Preserve top performers each generation (must be less than population size).
              </p>
              {elitismInvalid && (
                <p className="text-[0.65rem] text-destructive">Elitism count must be lower than population size.</p>
              )}
            </div>
          </label>
          <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
            Mutation operator
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
        {settings.selectionMethod === 'tournament' && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
              Tournament size
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
              Random seed (optional)
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
        <EvolutionSeedManager
          options={seedOptions}
          selectedNames={selectedSeedNames}
          onToggle={onSeedToggle}
          onSelectAll={onSeedSelectAll}
          onClear={onSeedClear}
        />
      </div>
    ),
    [
      settings,
      tournamentSizeValue,
      tournamentSizeInvalid,
      elitismInvalid,
      seedOptions,
      selectedSeedNames,
      activeMutationOption,
      mutationOperatorOptions,
      handleSetting,
      onSeedToggle,
      onSeedSelectAll,
      onSeedClear,
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









