import { useMemo, useState } from "react";

import type { TournamentResult } from "@/core/tournament";
import { cn } from "@/lib/utils";
import {
  buildHeadToHeadMatrix,
  type HeadToHeadMatrixCell,
} from "@/lib/analytics/headToHeadMatrix";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HeadToHeadHeatMapProps = {
  results: TournamentResult[] | null;
  className?: string;
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});

const CELL_SIZE = 56;
const cellDimensions = {
  width: `${CELL_SIZE}px`,
  minWidth: `${CELL_SIZE}px`,
  border: "none",
  padding: 0,
  height: `${CELL_SIZE}px`,
};

function formatDifferential(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "0.0";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${numberFormatter.format(value)}`;
}

function getCellColor(
  value: number | null,
  maxMagnitude: number,
): { background: string; foreground: string } {
  if (value === null || maxMagnitude === 0) {
    return { background: "transparent", foreground: "var(--foreground)" };
  }

  const intensity = Math.min(1, Math.abs(value) / maxMagnitude);
  const baseOpacity = 0.18;
  const dynamicOpacity = 0.55 * intensity;
  const alpha = (baseOpacity + dynamicOpacity).toFixed(2);

  if (value > 0) {
    return {
      background: `rgba(59, 130, 90, ${alpha})`,
      foreground: intensity > 0.65 ? "#0f172a" : "var(--foreground)",
    };
  }

  return {
    background: `rgba(220, 76, 70, ${alpha})`,
    foreground: intensity > 0.65 ? "#0f172a" : "var(--foreground)",
  };
}

function buildTooltip(cell: HeadToHeadMatrixCell | null): string | undefined {
  if (!cell) return undefined;
  const { matches, wins, draws, losses, playerScore, opponentScore, averageScore } = cell;
  const winRate = matches > 0 ? wins / matches : 0;
  const drawRate = matches > 0 ? draws / matches : 0;
  const lossRate = matches > 0 ? losses / matches : 0;

  return [
    `${cell.strategy} vs ${cell.opponent}`,
    `${wins}-${draws}-${losses} (W-D-L)`,
    `Win %: ${percentFormatter.format(winRate)}, Draw %: ${percentFormatter.format(drawRate)}, Loss %: ${percentFormatter.format(lossRate)}`,
    `Total score: ${playerScore} - ${opponentScore}`,
    `Avg points: ${numberFormatter.format(averageScore)}`,
  ].join("\n");
}

export function HeadToHeadHeatMap({ results, className }: HeadToHeadHeatMapProps) {
  const [hoveredPosition, setHoveredPosition] = useState<{ row: number; column: number } | null>(
    null,
  );

  const matrixData = useMemo(() => {
    if (!results || results.length === 0) {
      return null;
    }
    return buildHeadToHeadMatrix(results);
  }, [results]);

  if (!matrixData) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-muted p-6 text-sm text-muted-foreground",
          className,
        )}
      >
        Run a tournament to view head-to-head performance across strategies.
      </div>
    );
  }

  const { strategies, matrix, minDifferential, maxDifferential } = matrixData;
  const maxMagnitude = Math.max(Math.abs(minDifferential), Math.abs(maxDifferential));

  if (strategies.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-muted p-6 text-sm text-muted-foreground",
          className,
        )}
      >
        No matches were recorded for this tournament.
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn("overflow-x-auto", className)}
        onMouseLeave={() => setHoveredPosition(null)}
      >
        <table
        className="min-w-full border-separate text-xs sm:text-sm"
        style={{ borderSpacing: 0, border: "none" }}
      >
        <thead>
          <tr>
            <th
              className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-semibold text-muted-foreground"
              style={{ minWidth: "11rem", border: "none" }}
            >
              Strategy
            </th>
            {strategies.map((strategy, columnIndex) => {
              const isActive = hoveredPosition?.column === columnIndex;
              const dimmed = hoveredPosition !== null && !isActive;

              return (
              <th
                key={strategy}
                className="px-0 py-0 text-center font-semibold text-muted-foreground"
                style={cellDimensions}
              >
                <div
                  className="flex h-[68px] w-full items-end justify-center break-words px-1 pb-1 text-[11px] font-medium leading-tight transition-all duration-200 ease-out"
                  style={{
                    opacity: dimmed ? 0.4 : 1,
                    filter: dimmed ? "grayscale(35%)" : "none",
                  }}
                >
                  {strategy}
                </div>
              </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {strategies.map((rowStrategy, rowIndex) => (
            <tr key={rowStrategy}>
              <th
                className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-medium transition-all duration-200 ease-out"
                style={{
                  minWidth: "11rem",
                  border: "none",
                  opacity:
                    hoveredPosition !== null && hoveredPosition.row !== rowIndex ? 0.45 : 1,
                  filter:
                    hoveredPosition !== null && hoveredPosition.row !== rowIndex
                      ? "grayscale(35%)"
                      : "none",
                }}
              >
                {rowStrategy}
              </th>
              {strategies.map((columnStrategy, columnIndex) => {
                const cellKey = `${rowStrategy}-${columnStrategy}`;

                if (rowIndex === columnIndex) {
                  return (
                    <td key={cellKey} className="p-0 text-center text-muted-foreground" style={cellDimensions}>
                      <div
                        className="flex h-full w-full items-center justify-center text-base"
                        style={{ height: `${CELL_SIZE}px` }}
                      >
                        -
                      </div>
                    </td>
                  );
                }

                const cell = matrix[rowIndex]?.[columnIndex] ?? null;
                const value = cell ? cell.scoreDifferential : null;
                const { background, foreground } = getCellColor(value, maxMagnitude);
                const tooltip = buildTooltip(cell);
                const isRowActive = hoveredPosition?.row === rowIndex;
                const isColumnActive = hoveredPosition?.column === columnIndex;
                const dimmed =
                  hoveredPosition !== null && !isRowActive && !isColumnActive;
                const dimmingStyle = dimmed
                  ? { opacity: 0.35, filter: "grayscale(45%)" }
                  : { opacity: 1, filter: "none" };

                const isActiveCell = isRowActive && isColumnActive;

                return (
                  <td key={cellKey} className="p-0 text-center font-semibold" style={cellDimensions}>
                    <Tooltip open={isActiveCell}>
                      <TooltipTrigger asChild>
                        <div
                          className="relative flex h-full w-full items-center justify-center transition-all duration-200 ease-out will-change-transform cursor-pointer"
                          onMouseEnter={() => setHoveredPosition({ row: rowIndex, column: columnIndex })}
                          onMouseLeave={() => setHoveredPosition(null)}
                          style={{
                            height: `${CELL_SIZE}px`,
                            backgroundColor: background,
                            color: foreground,
                            ...dimmingStyle,
                            transition:
                              "opacity 160ms ease-out, filter 200ms ease-out, transform 180ms ease-out, box-shadow 220ms ease-out",
                          }}
                        >
                          {formatDifferential(value)}
                        </div>
                      </TooltipTrigger>
                      {tooltip ? (
                        <TooltipContent className="max-w-sm p-0">
                          <div className="min-w-[220px]">
                            <div className="flex items-start justify-between gap-3 border-b border-muted px-3 py-2">
                              <div className="space-y-1">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  Matchup
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                  {cell.strategy}
                                </p>
                                <p className="text-xs text-muted-foreground">vs {cell.opponent}</p>
                              </div>
                              <div
                                className={cn(
                                  "rounded-md border px-2 py-1 text-xs font-semibold",
                                  value === null || value === 0
                                    ? "border-muted bg-muted text-muted-foreground"
                                    : value > 0
                                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                                    : "border-rose-500/40 bg-rose-500/15 text-rose-400",
                                )}
                              >
                                {formatDifferential(value)}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 px-3 py-2 text-[11px] leading-tight">
                              <div className="space-y-1">
                                <p className="text-muted-foreground uppercase tracking-wide">
                                  Record
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                  {cell.wins}-{cell.draws}-{cell.losses}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground uppercase tracking-wide">
                                  Avg points
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                  {numberFormatter.format(cell.averageScore)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground uppercase tracking-wide">
                                  Total score
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                  {cell.playerScore} - {cell.opponentScore}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground uppercase tracking-wide">
                                  Matches
                                </p>
                                <p className="text-sm font-medium text-foreground">{cell.matches}</p>
                              </div>
                            </div>
                          </div>
                          <TooltipArrow width={12} height={6} />
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </TooltipProvider>
  );
}
