import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { GeneticStrategyConfig } from '@/strategies/genetic';
import { cn } from '@/lib/utils';

interface EvolutionSeedManagerProps {
  options: GeneticStrategyConfig[];
  selectedNames: string[];
  onToggle: (name: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export function EvolutionSeedManager({ options, selectedNames, onToggle, onSelectAll, onClear }: EvolutionSeedManagerProps) {
  const selectedSet = useMemo(() => new Set(selectedNames), [selectedNames]);
  return (
    <div className="space-y-2 rounded-md border border-muted/50 bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground">
          Seed pool ({selectedNames.length}/{options.length})
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="px-2 py-1"
            onClick={onSelectAll}
            disabled={options.length === 0 || selectedNames.length === options.length}
          >
            Select all
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="px-2 py-1"
            onClick={onClear}
            disabled={selectedNames.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Choose which genetic configurations seed the evolutionary population. Seeds are cloned and mutated when the run starts.
      </p>
      <div className="space-y-2">
        {options.map((config) => {
          const checked = selectedSet.has(config.name);
          return (
            <label
              key={config.name}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 text-xs transition-colors',
                checked ? 'border-primary/40 bg-primary/10' : 'hover:border-muted-foreground/20 hover:bg-muted/40',
              )}
            >
              <input
                type="checkbox"
                className="mt-1 h-3.5 w-3.5 accent-primary"
                checked={checked}
                onChange={() => onToggle(config.name)}
              />
              <div className="space-y-1">
                <p className="font-medium text-foreground">{config.name}</p>
                <p className="text-[0.7rem] text-muted-foreground">{config.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-muted-foreground">
                  <span>
                    {config.genome.length} {config.genome.length === 1 ? 'gene' : 'genes'}
                  </span>
                  {typeof config.mutationRate === 'number' && (
                    <Badge variant="outline" className="text-[0.65rem]">
                      µ {config.mutationRate.toFixed(2)}
                    </Badge>
                  )}
                  {typeof config.crossoverRate === 'number' && (
                    <Badge variant="outline" className="text-[0.65rem]">
                      ? {config.crossoverRate.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
            </label>
          );
        })}
        {options.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No genetic configurations available. Open the genetic editor to add seed strategies.
          </p>
        )}
      </div>
    </div>
  );
}
