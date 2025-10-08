import { useEffect, useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Dna, Info, X } from 'lucide-react';

import type { Strategy } from '@/core/types';
import type { Gene, GeneticStrategyConfig } from '@/strategies/genetic';
import { geneticStrategyConfigs } from '@/strategies/genetic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StrategyInfoBadgeProps {
  strategy: Strategy;
  geneticConfig?: GeneticStrategyConfig;
  triggerVariant?: ComponentProps<typeof Button>['variant'];
  triggerSize?: ComponentProps<typeof Button>['size'];
  triggerClassName?: string;
  triggerAriaLabel?: string;
  children?: ReactNode;
}

export function StrategyInfoBadge({
  strategy,
  geneticConfig: geneticConfigOverride,
  triggerVariant = 'ghost',
  triggerSize = 'icon',
  triggerClassName,
  triggerAriaLabel,
  children,
}: StrategyInfoBadgeProps) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const geneticConfig = geneticConfigOverride ?? geneticStrategyConfigs[strategy.name];
  const close = () => setOpen(false);
  const ariaLabel = triggerAriaLabel ?? `More info about ${strategy.name}`;
  const triggerContent = children ?? <Info className='h-4 w-4' />;

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || !overlayRef.current) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (!overlayRef.current) return;
      if (!overlayRef.current.contains(event.target as Node)) {
        close();
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label={ariaLabel}
      >
        {triggerContent}
      </Button>
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/50 transition-opacity duration-150'
            onMouseDown={(event) => {
              event.stopPropagation();
              close();
            }}
          />
          <div
            ref={overlayRef}
            className='relative z-10 w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-lg transition-opacity duration-150'
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between gap-4'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <h3 className='text-lg font-semibold'>{strategy.name}</h3>
                  {geneticConfig && (
                    <Badge variant='secondary' className='gap-1 px-2 py-1 text-[0.65rem] uppercase'>
                      <Dna className='h-3 w-3' aria-hidden='true' />
                      Genetic
                    </Badge>
                  )}
                </div>
                <p className='text-xs uppercase text-muted-foreground'>Strategy details</p>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={(event) => {
                  event.stopPropagation();
                  close();
                }}
                aria-label='Close strategy info'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
            <p className='text-sm text-muted-foreground'>{strategy.description}</p>
            {geneticConfig && <GeneticDetails config={geneticConfig} />}
            <div className='flex justify-end'>
              <Button
                variant='secondary'
                size='sm'
                onClick={(event) => {
                  event.stopPropagation();
                  close();
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GeneticDetails({ config }: { config: GeneticStrategyConfig }) {
  return (
    <div className='space-y-3 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-3'>
      <div className='flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground'>
        <Dna className='h-3 w-3' aria-hidden='true' />
        Genomic rules
      </div>
      <ul className='space-y-2 text-xs text-muted-foreground'>
        {config.genome.map((gene, index) => (
          <li key={gene.id ?? `${config.name}-gene-${index}`} className='flex items-start gap-2'>
            <span className='mt-0.5 text-[0.65rem] font-semibold text-primary'>
              #{String(index + 1).padStart(2, '0')}
            </span>
            <span className='leading-snug'>{describeGene(gene)}</span>
          </li>
        ))}
      </ul>
      {(config.mutationRate !== undefined || config.crossoverRate !== undefined) && (
        <p className='text-[0.65rem] uppercase text-muted-foreground'>
          Mutation {formatRate(config.mutationRate)} / Crossover {formatRate(config.crossoverRate)}
        </p>
      )}
    </div>
  );
}

function describeGene(gene: Gene): string {
  const { condition, response } = gene;
  const parts: string[] = [];

  if (condition.roundRange) {
    const [start, end] = condition.roundRange;
    parts.push(start === end ? `round ${start}` : `rounds ${start}-${end}`);
  }

  if (condition.selfLastMove) {
    parts.push(`I played ${condition.selfLastMove.toLowerCase()}`);
  }

  if (condition.opponentLastMove) {
    parts.push(`opponent played ${condition.opponentLastMove.toLowerCase()}`);
  }

  if (parts.length === 0) {
    return `Default response -> ${response.toLowerCase()}.`;
  }

  return `If ${parts.join(' and ')} -> ${response.toLowerCase()}.`;
}

function formatRate(value: number | undefined): string {
  if (value === undefined) return 'n/a';
  return `${Math.round(value * 100)}%`;
}
