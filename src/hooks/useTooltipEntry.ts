import { useMemo } from "react";

import { getTooltipEntry, type TooltipIdentifier } from "@/lib/tooltip/registry";

export function useTooltipEntry(id: TooltipIdentifier) {
  return useMemo(() => getTooltipEntry(id), [id]);
}
