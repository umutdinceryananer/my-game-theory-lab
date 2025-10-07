import { useMemo } from "react";

import type { TournamentResult } from "@/core/tournament";
import { cn } from "@/lib/utils";
import {
  buildHeadToHeadMatrix,
  type HeadToHeadMatrixCell,
} from "@/lib/analytics/headToHeadMatrix";

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
    <div className={cn("overflow-x-auto", className)}>
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
            {strategies.map((strategy) => (
              <th
                key={strategy}
                className="px-0 py-0 text-center font-semibold text-muted-foreground"
                style={cellDimensions}
              >
                <div className="flex h-[72px] w-full items-end justify-center break-words px-1 text-[11px] font-medium leading-tight">
                  {strategy}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {strategies.map((rowStrategy, rowIndex) => (
            <tr key={rowStrategy}>
              <th
                className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-medium"
                style={{ minWidth: "11rem", border: "none" }}
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

                return (
                  <td key={cellKey} className="p-0 text-center font-semibold" style={cellDimensions}>
                    <div
                      title={tooltip}
                      className="flex h-full w-full items-center justify-center transition-colors"
                      style={{
                        height: `${CELL_SIZE}px`,
                        backgroundColor: background,
                        color: foreground,
                      }}
                    >
                      {formatDifferential(value)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
