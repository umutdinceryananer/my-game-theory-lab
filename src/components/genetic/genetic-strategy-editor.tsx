import { useEffect, useMemo, useState } from 'react';
import { Dna, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Gene, GeneticStrategyConfig } from '@/strategies/genetic';
import { cloneGeneticConfigMap, createGeneTemplate, ensureGeneIds } from '@/strategies/genetic/utils';
import type { Move } from '@/core/types';

const MOVES: Move[] = ['COOPERATE', 'DEFECT'];

interface GeneticStrategyEditorProps {
  configs: Record<string, GeneticStrategyConfig>;
  onClose: () => void;
  onSave: (nextConfigs: Record<string, GeneticStrategyConfig>) => void;
}

export function GeneticStrategyEditor({ configs, onClose, onSave }: GeneticStrategyEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, GeneticStrategyConfig>>(() =>
    cloneGeneticConfigMap(configs),
  );

  useEffect(() => {
    setDrafts(cloneGeneticConfigMap(configs));
  }, [configs]);

  const draftList = useMemo(
    () => Object.values(drafts).sort((a, b) => a.name.localeCompare(b.name)),
    [drafts],
  );
  const canonicalOriginal = useMemo(() => canonicalizeConfigMap(configs), [configs]);
  const canonicalDraft = useMemo(() => canonicalizeConfigMap(drafts), [drafts]);
  const changedStrategies = useMemo(() => {
    const names = new Set([
      ...Object.keys(canonicalOriginal),
      ...Object.keys(canonicalDraft),
    ]);
    const changed = new Set<string>();
    for (const name of names) {
      const original = canonicalOriginal[name];
      const updated = canonicalDraft[name];
      if (JSON.stringify(original) !== JSON.stringify(updated)) {
        changed.add(name);
      }
    }
    return changed;
  }, [canonicalOriginal, canonicalDraft]);
  const hasChanges = changedStrategies.size > 0;

  const handleRateChange = (
    name: string,
    field: 'mutationRate' | 'crossoverRate',
    value: string,
  ) => {
    const parsed = Number.parseFloat(value);
    const normalized = Number.isFinite(parsed) ? clamp(parsed, 0, 1) : undefined;
    setDrafts((previous) => {
      const existing = previous[name];
      if (!existing) return previous;
      return {
        ...previous,
        [name]: {
          ...existing,
          [field]: normalized,
        },
      };
    });
  };

  const updateGene = (strategyName: string, geneId: string, updater: (gene: Gene) => Gene | null) => {
    setDrafts((previous) => {
      const strategy = previous[strategyName];
      if (!strategy) return previous;

      const nextGenome: Gene[] = [];
      let changed = false;

      for (const gene of strategy.genome) {
        if (gene.id !== geneId) {
          nextGenome.push(gene);
          continue;
        }

        const nextGene = updater(gene);
        changed = true;

        if (nextGene) {
          nextGenome.push(nextGene);
        }
      }

      if (!changed) return previous;

      return {
        ...previous,
        [strategyName]: {
          ...strategy,
          genome: nextGenome.length > 0 ? ensureGeneIds(nextGenome) : [createGeneTemplate()],
        },
      };
    });
  };

  const handleGeneFieldChange = (
    strategyName: string,
    geneId: string,
    field: 'response' | 'weight',
    value: string,
  ) => {
    updateGene(strategyName, geneId, (gene) => {
      if (field === 'response') {
        return {
          ...gene,
          response: (value as Move) ?? gene.response,
        };
      }

      const parsed = Number.parseFloat(value);
      return {
        ...gene,
        weight: Number.isFinite(parsed) ? Math.max(0, parsed) : undefined,
      };
    });
  };

  const handleMoveCondition = (
    strategyName: string,
    geneId: string,
    field: 'opponentLastMove' | 'selfLastMove',
    value: string,
  ) => {
    updateGene(strategyName, geneId, (gene) => {
      const nextMove = value.length === 0 ? undefined : (value as Move);
      return {
        ...gene,
        condition: {
          ...gene.condition,
          [field]: nextMove,
        },
      };
    });
  };

  const handleRoundRangeChange = (
    strategyName: string,
    geneId: string,
    position: 'start' | 'end',
    value: string,
  ) => {
    updateGene(strategyName, geneId, (gene) => {
      const [currentStart, currentEnd] = gene.condition.roundRange ?? [undefined, undefined];
      const parsed = Number.parseInt(value, 10);
      const nextValue = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
      const nextStart = position === 'start' ? nextValue : currentStart;
      const nextEnd = position === 'end' ? nextValue : currentEnd;

      let nextRange: [number, number] | undefined;
      if (nextStart === undefined && nextEnd === undefined) {
        nextRange = undefined;
      } else {
        const startValue = nextStart ?? nextEnd ?? 1;
        const endValue = nextEnd !== undefined ? Math.max(startValue, nextEnd) : startValue;
        nextRange = [startValue, endValue];
      }

      return {
        ...gene,
        condition: {
          ...gene.condition,
          roundRange: nextRange,
        },
      };
    });
  };

  const handleRemoveGene = (strategyName: string, geneId: string) => {
    updateGene(strategyName, geneId, () => null);
  };

  const handleAddGene = (strategyName: string) => {
    setDrafts((previous) => {
      const strategy = previous[strategyName];
      if (!strategy) return previous;

      return {
        ...previous,
        [strategyName]: {
          ...strategy,
          genome: [...strategy.genome, createGeneTemplate()],
        },
      };
    });
  };

  const handleReset = () => {
    setDrafts(cloneGeneticConfigMap(configs));
  };

  const handleSave = () => {
    onSave(cloneGeneticConfigMap(drafts));
    onClose();
  };

  return (
    <Card className='relative z-10 w-full max-w-3xl'>
      <CardHeader className='gap-2'>
        <CardTitle className='flex items-center gap-2 text-xl'>
          <Dna className='h-5 w-5 text-primary' aria-hidden='true' />
          Genetic Strategy Editor
        </CardTitle>
        <CardDescription>
          Adjust mutation and crossover rates, and review the encoded genes for each genetic
          strategy. Changes apply globally once saved.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {hasChanges && (
          <div className='rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary'>
            Unsaved genetic changes will apply to all future simulations once you save.
          </div>
        )}
        {draftList.map((config) => (
          <section
            key={config.name}
            className='rounded-lg border border-dashed border-muted-foreground/40 p-4'
          >
            <header className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <h3 className='flex items-center gap-2 text-lg font-semibold leading-tight'>
                  {config.name}
                  <Badge variant='secondary' className='gap-1 uppercase'>
                    <Dna className='h-3 w-3' aria-hidden='true' />
                    Genetic
                  </Badge>
                  {changedStrategies.has(config.name) && (
                    <Badge variant='outline' className='text-[0.6rem] uppercase text-primary'>
                      Edited
                    </Badge>
                  )}
                </h3>
                <p className='text-sm text-muted-foreground'>{config.description}</p>
              </div>
              <div className='grid w-full gap-2 sm:w-72'>
                <label className='flex flex-col gap-1 text-xs font-medium uppercase text-muted-foreground'>
                  Mutation rate (0-1)
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    max='1'
                    value={config.mutationRate ?? ''}
                    onChange={(event) =>
                      handleRateChange(config.name, 'mutationRate', event.target.value)
                    }
                  />
                </label>
                <label className='flex flex-col gap-1 text-xs font-medium uppercase text-muted-foreground'>
                  Crossover rate (0-1)
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    max='1'
                    value={config.crossoverRate ?? ''}
                    onChange={(event) =>
                      handleRateChange(config.name, 'crossoverRate', event.target.value)
                    }
                  />
                </label>
              </div>
            </header>
            <div className='mt-4 space-y-3 text-xs text-muted-foreground'>
              <div className='flex items-center justify-between'>
                <p className='font-semibold uppercase tracking-wide text-foreground'>Genes</p>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-2'
                  onClick={() => handleAddGene(config.name)}
                >
                  <Plus className='h-4 w-4' aria-hidden='true' />
                  Add gene
                </Button>
              </div>
              <ul className='space-y-3'>
                {config.genome.map((gene, index) => (
                  <li
                    key={gene.id}
                    className='rounded-lg border border-muted-foreground/40 bg-background/80 p-3 space-y-3'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground'>
                        <span className='font-semibold text-primary'>
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <span className='font-mono text-xs text-muted-foreground/80'>{gene.id}</span>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground hover:text-destructive'
                        onClick={() => handleRemoveGene(config.name, gene.id)}
                        aria-label={`Remove gene ${index + 1}`}
                      >
                        <Trash2 className='h-4 w-4' aria-hidden='true' />
                      </Button>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <label className='flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground'>
                        Response
                        <select
                          className='rounded-md border border-muted bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background'
                          value={gene.response}
                          onChange={(event) =>
                            handleGeneFieldChange(config.name, gene.id, 'response', event.target.value)
                          }
                        >
                          {MOVES.map((move) => (
                            <option key={move} value={move}>
                              {move}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className='flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground'>
                        Weight
                        <Input
                          type='number'
                          step='0.1'
                          min='0'
                          value={gene.weight ?? ''}
                          onChange={(event) =>
                            handleGeneFieldChange(config.name, gene.id, 'weight', event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <label className='flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground'>
                        Opponent last move
                        <select
                          className='rounded-md border border-muted bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background'
                          value={gene.condition.opponentLastMove ?? ''}
                          onChange={(event) =>
                            handleMoveCondition(config.name, gene.id, 'opponentLastMove', event.target.value)
                          }
                        >
                          <option value=''>Any</option>
                          {MOVES.map((move) => (
                            <option key={move} value={move}>
                              {move}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className='flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground'>
                        Self last move
                        <select
                          className='rounded-md border border-muted bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background'
                          value={gene.condition.selfLastMove ?? ''}
                          onChange={(event) =>
                            handleMoveCondition(config.name, gene.id, 'selfLastMove', event.target.value)
                          }
                        >
                          <option value=''>Any</option>
                          {MOVES.map((move) => (
                            <option key={move} value={move}>
                              {move}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <label className='flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground'>
                        Round start
                        <Input
                          type='number'
                          min='1'
                          value={gene.condition.roundRange?.[0] ?? ''}
                          onChange={(event) =>
                            handleRoundRangeChange(config.name, gene.id, 'start', event.target.value)
                          }
                        />
                      </label>
                      <label className='flex flex-col gap-1 text-[0.65rem] font-medium uppercase text-muted-foreground'>
                        Round end
                        <Input
                          type='number'
                          min='1'
                          value={gene.condition.roundRange?.[1] ?? ''}
                          onChange={(event) =>
                            handleRoundRangeChange(config.name, gene.id, 'end', event.target.value)
                          }
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </CardContent>
      <CardFooter className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-4'>
        <div className='flex gap-2'>
          <Button
            variant='ghost'
            onClick={handleReset}
            className='flex items-center gap-2'
            disabled={!hasChanges}
          >
            <RefreshCcw className='h-4 w-4' aria-hidden='true' />
            Reset
          </Button>
          <Button variant='ghost' onClick={onClose} className='flex items-center gap-2'>
            <X className='h-4 w-4' aria-hidden='true' />
            Cancel
          </Button>
        </div>
        <Button onClick={handleSave} className='flex items-center gap-2' disabled={!hasChanges}>
          <Save className='h-4 w-4' aria-hidden='true' />
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}

function describeGene(gene: Gene): string {
  const parts: string[] = [];

  if (gene.condition.roundRange) {
    const [start, end] = gene.condition.roundRange;
    parts.push(start === end ? `round ${start}` : `rounds ${start}-${end}`);
  }

  if (gene.condition.selfLastMove) {
    parts.push(`self played ${gene.condition.selfLastMove.toLowerCase()}`);
  }

  if (gene.condition.opponentLastMove) {
    parts.push(`opponent played ${gene.condition.opponentLastMove.toLowerCase()}`);
  }

  const description = parts.length > 0 ? `If ${parts.join(' and ')}` : 'Default response';
  return `${description} -> ${gene.response.toLowerCase()}.`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type CanonicalGene = {
  id: string;
  response: Move;
  weight: number | null;
  condition: {
    opponentLastMove: Move | null;
    selfLastMove: Move | null;
    roundRange: [number, number] | null;
  };
};

type CanonicalConfig = {
  name: string;
  description: string;
  mutationRate: number | null;
  crossoverRate: number | null;
  genome: CanonicalGene[];
};

function canonicalizeConfig(config: GeneticStrategyConfig): CanonicalConfig {
  return {
    name: config.name,
    description: config.description,
    mutationRate: config.mutationRate ?? null,
    crossoverRate: config.crossoverRate ?? null,
    genome: config.genome.map((gene, index) => ({
      id: gene.id ?? `gene-${index}`,
      response: gene.response,
      weight: gene.weight ?? null,
      condition: {
        opponentLastMove: gene.condition.opponentLastMove ?? null,
        selfLastMove: gene.condition.selfLastMove ?? null,
        roundRange: gene.condition.roundRange
          ? [gene.condition.roundRange[0], gene.condition.roundRange[1]]
          : null,
      },
    })),
  };
}

function canonicalizeConfigMap(
  configs: Record<string, GeneticStrategyConfig>,
): Record<string, CanonicalConfig> {
  const entries = Object.entries(configs).map<[string, CanonicalConfig]>(([name, config]) => [
    name,
    canonicalizeConfig(config),
  ]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return Object.fromEntries(entries);
}


