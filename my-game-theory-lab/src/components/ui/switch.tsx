import * as React from 'react';

import { cn } from '@/lib/utils';

type SwitchProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }

      onCheckedChange?.(!checked);
      props.onClick?.(event);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
          'inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
          checked && 'bg-primary/90',
          className,
        )}
        onClick={handleClick}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-background shadow-sm transition-transform',
            checked && 'translate-x-[1.375rem] bg-primary-foreground',
          )}
        />
      </button>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch };