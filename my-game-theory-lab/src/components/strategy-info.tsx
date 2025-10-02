import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

import type { Strategy } from '@/core/types';
import { Button } from '@/components/ui/button';

interface StrategyInfoBadgeProps {
  strategy: Strategy;
}

export function StrategyInfoBadge({ strategy }: StrategyInfoBadgeProps) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const close = () => setOpen(false);

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
        variant='ghost'
        size='icon'
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label={`More info about ${strategy.name}`}
      >
        <Info className='h-4 w-4' />
      </Button>
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/50 transition-opacity duration-150' />
          <div
            ref={overlayRef}
            className='relative z-10 w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-lg transition-opacity duration-150'
          >
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h3 className='text-lg font-semibold'>{strategy.name}</h3>
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
