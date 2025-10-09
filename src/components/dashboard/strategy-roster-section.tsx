import { useEffect, useRef, useState } from "react";
import { Dna, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Strategy } from "@/core/types";
import type { GeneticStrategyConfig } from "@/strategies/genetic";
import { StrategyInfoBadge } from "@/components/strategy-info";

interface StrategyRosterSectionProps {
  strategySearch: string;
  onStrategySearch: (value: string) => void;
  selectedStrategyNames: string[];
  filteredSelectedStrategies: Strategy[];
  filteredAvailableStrategies: Strategy[];
  totalStrategyCount: number;
  geneticConfigs: Record<string, GeneticStrategyConfig>;
  onToggleStrategy: (name: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onAddStrategy: (name: string) => void;
  onRemoveStrategy: (name: string) => void;
  onRunTournament: () => void;
  runButtonDisabled: boolean;
  isRunning: boolean;
  evolutionEnabled: boolean;
}

export function StrategyRosterSection({
  strategySearch,
  onStrategySearch,
  selectedStrategyNames,
  filteredSelectedStrategies,
  filteredAvailableStrategies,
  totalStrategyCount,
  geneticConfigs,
  onToggleStrategy,
  onSelectAll,
  onClearAll,
  onAddStrategy,
  onRemoveStrategy,
  onRunTournament,
  runButtonDisabled,
  isRunning,
  evolutionEnabled,
}: StrategyRosterSectionProps) {
  const hasSearch = strategySearch.trim().length > 0;
  const runButtonLabel = isRunning
    ? "Running..."
    : evolutionEnabled
    ? "Run Evolution + Tournament"
    : "Run Tournament";
  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    name: string,
    source: "selected" | "available",
  ) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/x-strategy",
      JSON.stringify({ name, source }),
    );
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, target: "selected" | "available") => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/x-strategy");
    if (!raw) return;

    try {
      const { name, source } = JSON.parse(raw) as { name: string; source: "selected" | "available" };
      if (!name) return;

      if (target === "selected" && source !== "selected") {
        onAddStrategy(name);
      } else if (target === "available" && source !== "available") {
        onRemoveStrategy(name);
      }
    } catch {
      // ignore malformed payloads
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const StrategyCardItem = ({
    strategy,
    isSelected,
  }: {
    strategy: Strategy;
    isSelected: boolean;
  }) => {
    const [visible, setVisible] = useState(false);
    const exitTimeout = useRef<number | null>(null);

    useEffect(() => {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
      setVisible(true);
      return () => {
        if (exitTimeout.current !== null) {
          window.clearTimeout(exitTimeout.current);
          exitTimeout.current = null;
        }
      };
    }, [isSelected]);

    const handleToggle = () => {
      setVisible(false);
      if (exitTimeout.current !== null) {
        window.clearTimeout(exitTimeout.current);
      }
      exitTimeout.current = window.setTimeout(() => {
        onToggleStrategy(strategy.name);
        exitTimeout.current = null;
      }, 120);
    };

    const handleDragStartLocal = (event: React.DragEvent<HTMLDivElement>) => {
      handleDragStart(event, strategy.name, isSelected ? "selected" : "available");
    };

    const handleDragEnd = () => {
      if (exitTimeout.current !== null) {
        window.clearTimeout(exitTimeout.current);
        exitTimeout.current = null;
      }
      setVisible(true);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToggle();
      }
    };

    const geneticConfig = geneticConfigs[strategy.name];

    return (
      <div
        role="button"
        tabIndex={0}
        draggable
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onDragStart={handleDragStartLocal}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border p-2 text-left text-sm transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          visible ? "opacity-100" : "opacity-0",
          isSelected
            ? "border-primary bg-secondary/30 text-foreground"
            : "border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground",
        )}
        aria-pressed={isSelected}
      >
        <div className="flex flex-1 items-center gap-3">
          <StrategyInfoBadge
            strategy={strategy}
            geneticConfig={geneticConfig}
            triggerVariant="ghost"
            triggerSize="icon"
            triggerClassName="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            triggerAriaLabel={`Strategy details for ${strategy.name}`}
          >
            {geneticConfig ? (
              <Dna className="h-4 w-4" aria-hidden="true" />
            ) : (
              <span className="font-semibold">{strategy.name.slice(0, 2).toUpperCase()}</span>
            )}
          </StrategyInfoBadge>
          <p className="max-w-[16rem] truncate text-left text-sm font-medium leading-tight md:max-w-xs">
            {strategy.name}
          </p>
        </div>
      </div>
    );
  };

  const totalSelected = selectedStrategyNames.length;
  const allStrategiesSelected = totalSelected === totalStrategyCount && totalStrategyCount > 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Strategy roster</h2>
          <p className="text-xs text-muted-foreground">Pick the strategies that should participate in the tournament.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Input
            value={strategySearch}
            onChange={(event) => onStrategySearch(event.target.value)}
            placeholder="Search strategies..."
            className="sm:w-64"
            aria-label="Search strategies"
          />
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={onRunTournament}
            disabled={runButtonDisabled}
          >
            {!isRunning && <Play className="h-4 w-4" aria-hidden="true" />}
            {runButtonLabel}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Selected {totalSelected} / {totalStrategyCount}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSelectAll} disabled={allStrategiesSelected}>
            Select all
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearAll} disabled={totalSelected === 0}>
            Clear all
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className="space-y-3 rounded-lg border border-dashed border-muted p-4"
          onDragOver={handleDragOver}
          onDrop={(event) => handleDrop(event, "selected")}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase">Selected</span>
            {hasSearch && (
              <span>
                {filteredSelectedStrategies.length} match
                {filteredSelectedStrategies.length === 1 ? "" : "es"}
              </span>
            )}
          </div>
          {totalSelected === 0 ? (
            <p className="text-sm text-muted-foreground">No strategies selected.</p>
          ) : filteredSelectedStrategies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No selected strategies match your search.</p>
          ) : (
            <ul className="grid max-h-[18rem] gap-2 overflow-y-auto sm:grid-cols-2 scrollbar-hidden scroll-gradient">
              {filteredSelectedStrategies.map((strategy) => (
                <li key={strategy.name}>
                  <StrategyCardItem strategy={strategy} isSelected />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="space-y-3 rounded-lg border border-dashed border-muted p-4"
          onDragOver={handleDragOver}
          onDrop={(event) => handleDrop(event, "available")}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase">Available</span>
            {hasSearch && (
              <span>
                {filteredAvailableStrategies.length} match
                {filteredAvailableStrategies.length === 1 ? "" : "es"}
              </span>
            )}
          </div>
          {filteredAvailableStrategies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasSearch
                ? "No available strategies match your search."
                : allStrategiesSelected
                ? "All strategies are currently selected."
                : "No additional strategies available."}
            </p>
          ) : (
            <ul className="grid max-h-[18rem] gap-2 overflow-y-auto sm:grid-cols-2 scrollbar-hidden scroll-gradient">
              {filteredAvailableStrategies.map((strategy) => (
                <li key={strategy.name}>
                  <StrategyCardItem strategy={strategy} isSelected={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
