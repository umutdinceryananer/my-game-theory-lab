import { cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTooltipEntry } from "@/hooks/useTooltipEntry";
import type { TooltipIdentifier } from "@/lib/tooltip/registry";
import { cn } from "@/lib/utils";

interface TooltipReferenceProps {
  id: TooltipIdentifier;
  children: ReactElement;
  className?: string;
}

export function TooltipReference({ id, children, className }: TooltipReferenceProps) {
  const entry = useTooltipEntry(id);

  if (!isValidElement(children)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("TooltipReference expects a single React element child.");
    }
    return children as unknown as ReactNode;
  }

  const childWithClass =
    className !== undefined
      ? cloneElement(children, {
          className: cn(children.props.className, className),
        })
      : children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{childWithClass}</TooltipTrigger>
      <TooltipContent side={entry.side} align={entry.align}>
        {entry.title ? <p className="text-xs font-semibold">{entry.title}</p> : null}
        <div className="text-xs text-muted-foreground">{entry.description}</div>
      </TooltipContent>
    </Tooltip>
  );
}
