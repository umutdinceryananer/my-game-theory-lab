import { useEffect, useMemo, useState } from 'react';
import { Dna, RefreshCcw, Save, X } from 'lucide-react';

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
import { cloneGeneticConfigMap } from '@/strategies/genetic/utils';

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
              <p className='font-semibold uppercase tracking-wide text-foreground'>Genes</p>
              <ul className='space-y-2'>
                {config.genome.map((gene, index) => (
                  <li key={gene.id ?? `${config.name}-gene-${index}`} className='flex items-start gap-2'>
                    <span className='mt-0.5 text-[0.65rem] font-semibold text-primary'>
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <span className='leading-snug'>{describeGene(gene)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </CardContent>
      <CardFooter className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-4'>
        <div className='flex gap-2'>
          <Button variant='ghost' onClick={handleReset} className='flex items-center gap-2'>
            <RefreshCcw className='h-4 w-4' aria-hidden='true' />
            Reset
          </Button>
          <Button variant='ghost' onClick={onClose} className='flex items-center gap-2'>
            <X className='h-4 w-4' aria-hidden='true' />
            Cancel
          </Button>
        </div>
        <Button onClick={handleSave} className='flex items-center gap-2'>
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
  return `${description} → ${gene.response.toLowerCase()}.`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
