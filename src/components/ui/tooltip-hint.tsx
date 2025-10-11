import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTooltipEntry } from "@/hooks/useTooltipEntry";
import type { TooltipIdentifier } from "@/lib/tooltip/registry";
import { cn } from "@/lib/utils";

interface TooltipHintProps {
  id: TooltipIdentifier;
  children?: ReactNode;
  /**
   * Optional className for the trigger wrapper.
   */
  className?: string;
}

export function TooltipHint({ id, children, className }: TooltipHintProps) {
  const entry = useTooltipEntry(id);
  const triggerContent =
    children ??
    (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex cursor-help", className)}>{triggerContent}</span>
      </TooltipTrigger>
      <TooltipContent side={entry.side} align={entry.align}>
        {entry.title ? <p className="text-xs font-semibold">{entry.title}</p> : null}
        <div className="text-xs text-muted-foreground">{entry.description}</div>
      </TooltipContent>
    </Tooltip>
  );
}
