import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, Play, Trophy, X } from 'lucide-react';

import '@/index.css';
import { LandingScreen } from '@/components/landing-screen';
import { SimulationParametersPanel } from '@/components/panels/simulation-parameters';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DEFAULT_PAYOFF_MATRIX, type PayoffMatrix } from '@/core/types';
import { cn } from '@/lib/utils';
import type { TournamentResult } from '@/core/tournament';
import { simulateTournament } from '@/test-game';
import { defaultStrategies } from '@/strategies';
import { StrategyInfoBadge } from '@/components/strategy-info';

type StrategyType = typeof defaultStrategies[number];

type DashboardProps = {
  results: TournamentResult[] | null;
  onRunTournament: () => void;
  roundsPerMatch: number;
  onRoundsChange: (value: number) => void;
  noiseEnabled: boolean;
  onNoiseToggle: (enabled: boolean) => void;
  noisePercent: number;
  onNoisePercentChange: (value: number) => void;
  payoffMatrix: PayoffMatrix;
  onPayoffMatrixChange: (matrix: PayoffMatrix) => void;
  seedEnabled: boolean;
  seedValue: string;
  onSeedToggle: (enabled: boolean) => void;
  onSeedChange: (value: string) => void;
  doubleRoundRobin: boolean;
  onDoubleRoundRobinToggle: (enabled: boolean) => void;
  strategySearch: string;
  onStrategySearch: (value: string) => void;
  selectedStrategyNames: string[];
  onToggleStrategy: (name: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  activeStrategyCount: number;
};

function TournamentDashboard({
  results,
  onRunTournament,
  roundsPerMatch,
  onRoundsChange,
  noiseEnabled,
  onNoiseToggle,
  noisePercent,
  onNoisePercentChange,
  payoffMatrix,
  onPayoffMatrixChange,
  seedEnabled,
  seedValue,
  onSeedToggle,
  onSeedChange,
  doubleRoundRobin,
  onDoubleRoundRobinToggle,
  strategySearch,
  onStrategySearch,
  selectedStrategyNames,
  onToggleStrategy,
  onSelectAll,
  onClearAll,
  activeStrategyCount,
}: DashboardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const champion = results?.[0];

  const filteredSelectedStrategies = useMemo(() => {
    const query = strategySearch.trim().toLowerCase();

    return defaultStrategies.filter((strategy) => {
      if (!selectedStrategyNames.includes(strategy.name)) return false;
      if (!query) return true;

      return (
        strategy.name.toLowerCase().includes(query) ||
        strategy.description.toLowerCase().includes(query)
      );
    });
  }, [selectedStrategyNames, strategySearch]);

  const filteredAvailableStrategies = useMemo(() => {
    const query = strategySearch.trim().toLowerCase();

    return defaultStrategies.filter((strategy) => {
      if (selectedStrategyNames.includes(strategy.name)) return false;
      if (!query) return true;

      return (
        strategy.name.toLowerCase().includes(query) ||
        strategy.description.toLowerCase().includes(query)
      );
    });
  }, [selectedStrategyNames, strategySearch]);

  const totalMatches = filteredSelectedStrategies.length + filteredAvailableStrategies.length;
  const hasSearch = strategySearch.trim().length > 0;

  const closeSettings = () => setSettingsOpen(false);

  const StrategyCardItem = ({ strategy, isSelected }: { strategy: StrategyType; isSelected: boolean }) => {
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
      }, 150);
    };

    return (
      <button
        type='button'
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-md border p-2 text-left text-sm transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0',
          isSelected
            ? 'border-primary bg-secondary/30 text-foreground'
            : 'border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground',
        )}
        aria-pressed={isSelected}
      >
        <span className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground'>
          {strategy.name.slice(0, 2).toUpperCase()}
        </span>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <p className='font-medium leading-none'>{strategy.name}</p>
          <div className='flex items-center gap-1'>
            <StrategyInfoBadge strategy={strategy} />
            
          </div>
        </div>
      </button>
    );
  };

  return (
    <Card className={cn('transition-opacity duration-500', isVisible ? 'opacity-100' : 'opacity-0')}>
      <CardHeader className='space-y-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='space-y-2'>
            <CardTitle>Game Theory Lab</CardTitle>
            <CardDescription>
              Explore the Iterated Prisoner&apos;s Dilemma with pluggable strategies.
            </CardDescription>
          </div>
          <div className='flex items-center gap-3'>
            <Button variant='outline' onClick={() => setSettingsOpen(true)} className='flex items-center gap-2'>
              <Menu className='h-4 w-4' />
              Simulation Settings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <section className='space-y-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h2 className='text-sm font-semibold uppercase text-muted-foreground'>Strategy roster</h2>
              <p className='text-xs text-muted-foreground'>Pick the strategies that should participate in the tournament.</p>
            </div>
            <Input
              value={strategySearch}
              onChange={(event) => onStrategySearch(event.target.value)}
              placeholder='Search strategies...'
              className='sm:w-64'
              aria-label='Search strategies'
            />
          </div>

          <div className='flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
            <span>Selected {selectedStrategyNames.length} / {defaultStrategies.length}</span>
            <div className='flex flex-wrap items-center gap-2'>
              <span>{totalMatches} match{totalMatches === 1 ? '' : 'es'}</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={onSelectAll}
                disabled={selectedStrategyNames.length === defaultStrategies.length}
              >
                Select all
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={onClearAll}
                disabled={selectedStrategyNames.length === 0}
              >
                Clear all
              </Button>
            </div>
          </div>

          <div className='grid gap-4 lg:grid-cols-2'>
            <div className='space-y-3 rounded-lg border border-dashed border-muted p-4'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-semibold uppercase'>Selected</span>
                {hasSearch && (
                  <span>{filteredSelectedStrategies.length} match{filteredSelectedStrategies.length === 1 ? '' : 'es'}</span>
                )}
              </div>

              {selectedStrategyNames.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No strategies selected.</p>
              ) : filteredSelectedStrategies.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No selected strategies match your search.</p>
              ) : (
                <ul className='grid max-h-[18rem] gap-2 overflow-y-auto sm:grid-cols-2 scrollbar-hidden scroll-gradient'>
                  {filteredSelectedStrategies.map((strategy) => (
                    <li key={strategy.name}><StrategyCardItem strategy={strategy} isSelected={true} /></li>
                  ))}
                </ul>
              )}
            </div>

            <div className='space-y-3 rounded-lg border border-dashed border-muted p-4'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-semibold uppercase'>Available</span>
                {hasSearch && (
                  <span>{filteredAvailableStrategies.length} match{filteredAvailableStrategies.length === 1 ? '' : 'es'}</span>
                )}
              </div>

              {filteredAvailableStrategies.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  {hasSearch
                    ? 'No available strategies match your search.'
                    : selectedStrategyNames.length === defaultStrategies.length
                      ? 'All strategies are currently selected.'
                      : 'No additional strategies available.'}
                </p>
              ) : (
                <ul className='grid max-h-[18rem] gap-2 overflow-y-auto sm:grid-cols-2 scrollbar-hidden scroll-gradient'>
                  {filteredAvailableStrategies.map((strategy) => (
                    <li key={strategy.name}><StrategyCardItem strategy={strategy} isSelected={false} /></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className='space-y-3 rounded-lg border border-dashed border-muted p-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h2 className='text-sm font-semibold uppercase text-muted-foreground'>Latest standings</h2>
              <p className='text-xs text-muted-foreground'>Sorted by cumulative score; average shows match-level performance.</p>
            </div>
            {champion ? (
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Trophy className='h-3.5 w-3.5' />
                {champion.name}
              </Badge>
            ) : (
              <Badge variant='outline'>Run to populate</Badge>
            )}
          </div>

          {results ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-28'>Rank</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead className='w-24 text-right'>Score</TableHead>
                  <TableHead className='w-24 text-right'>Average</TableHead>
                  <TableHead className='w-20 text-right'>Wins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={result.name} data-state={index === 0 ? 'selected' : undefined}>
                    <TableCell className='font-medium'>#{index + 1}</TableCell>
                    <TableCell className={cn('text-sm', index === 0 && 'font-semibold text-foreground')}>
                      {result.name}
                    </TableCell>
                    <TableCell className='text-right font-mono text-sm'>{result.totalScore}</TableCell>
                    <TableCell className='text-right font-mono text-sm'>
                      {result.averageScore.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right font-mono text-sm'>{result.wins}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className='text-sm text-muted-foreground'>Run the tournament to populate the standings table.</p>
          )}
        </section>
      </CardContent>
      <CardFooter className='flex justify-end'>
        <Button size='lg' onClick={onRunTournament} className='w-full sm:w-auto' disabled={activeStrategyCount < 2}>
          <Play className='mr-2 h-4 w-4' />
          Run Tournament
        </Button>
      </CardFooter>

      <div
        className='fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200'
        aria-hidden={!settingsOpen}
        style={{ pointerEvents: settingsOpen ? 'auto' : 'none', opacity: settingsOpen ? 1 : 0 }}
      >
        <div
          className='absolute inset-0 bg-black/60 transition-opacity duration-200'
          onClick={closeSettings}
          style={{ opacity: settingsOpen ? 1 : 0 }}
        />
        <Card
          className='relative z-10 w-full max-w-3xl overflow-hidden shadow-lg transition-transform duration-200'
          style={{ transform: settingsOpen ? 'scale(1)' : 'scale(0.97)' }}
        >
          <div className='flex items-center justify-between border-b px-6 py-4'>
            <h2 className='text-lg font-semibold'>Simulation Settings</h2>
            <Button variant='ghost' size='icon' onClick={closeSettings}>
              <X className='h-5 w-5' />
              <span className='sr-only'>Close</span>
            </Button>
          </div>
          <div className='max-h-[75vh] overflow-y-auto px-6 py-4'>
            <SimulationParametersPanel
              rounds={roundsPerMatch}
              onRoundsChange={onRoundsChange}
              noiseEnabled={noiseEnabled}
              onNoiseToggle={onNoiseToggle}
              noisePercent={noisePercent}
              onNoisePercentChange={onNoisePercentChange}
              payoffMatrix={payoffMatrix}
              onPayoffMatrixChange={onPayoffMatrixChange}
              seedEnabled={seedEnabled}
              seedValue={seedValue}
              onSeedToggle={onSeedToggle}
              onSeedChange={onSeedChange}
              doubleRoundRobin={doubleRoundRobin}
              onDoubleRoundRobinToggle={onDoubleRoundRobinToggle}
            />
          </div>
        </Card>
      </div>
    </Card>
  );
}

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLandingFading, setIsLandingFading] = useState(false);
  const [results, setResults] = useState<TournamentResult[] | null>(null);
  const [roundsPerMatch, setRoundsPerMatch] = useState(100);
  const [noiseEnabled, setNoiseEnabled] = useState(false);
  const [noisePercent, setNoisePercent] = useState(10);
  const [payoffMatrix, setPayoffMatrix] = useState<PayoffMatrix>(() => ({ ...DEFAULT_PAYOFF_MATRIX }));
  const [seedEnabled, setSeedEnabled] = useState(false);
  const [seedValue, setSeedValue] = useState('');
  const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);
  const [strategySearch, setStrategySearch] = useState('');
  const [selectedStrategyNames, setSelectedStrategyNames] = useState<string[]>(() =>
    defaultStrategies.map((strategy) => strategy.name),
  );

  const activeStrategies = useMemo(
    () => defaultStrategies.filter((strategy) => selectedStrategyNames.includes(strategy.name)),
    [selectedStrategyNames],
  );

  const runTournament = () => {
    if (activeStrategies.length < 2) return;

    const errorRate = noiseEnabled ? noisePercent / 100 : 0;
    const seed = seedEnabled && seedValue.trim().length > 0 ? seedValue.trim() : undefined;
    const outcome = simulateTournament(
      roundsPerMatch,
      errorRate,
      payoffMatrix,
      seed,
      doubleRoundRobin,
      activeStrategies,
    );
    setResults(outcome);
  };

  const handleEnterLab = () => {
    if (isLandingFading) return;
    setIsLandingFading(true);
  };

  useEffect(() => {
    if (!isLandingFading) return undefined;

    const timeout = window.setTimeout(() => {
      setHasStarted(true);
      setIsLandingFading(false);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [isLandingFading]);

  const toggleStrategy = (name: string) => {
    setSelectedStrategyNames((previous) => {
      const next = new Set(previous);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return defaultStrategies
        .map((strategy) => strategy.name)
        .filter((strategyName) => next.has(strategyName));
    });
  };

  const selectAll = () => {
    setSelectedStrategyNames(defaultStrategies.map((strategy) => strategy.name));
  };

  const clearAll = () => {
    setSelectedStrategyNames([]);
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <main className='mx-auto flex min-h-screen w-full max-w-4xl lg:max-w-6xl flex-col justify-center px-6 py-12'>
        {hasStarted ? (
          <TournamentDashboard
            results={results}
            onRunTournament={runTournament}
            roundsPerMatch={roundsPerMatch}
            onRoundsChange={setRoundsPerMatch}
            noiseEnabled={noiseEnabled}
            onNoiseToggle={setNoiseEnabled}
            noisePercent={noisePercent}
            onNoisePercentChange={setNoisePercent}
            payoffMatrix={payoffMatrix}
            onPayoffMatrixChange={setPayoffMatrix}
            seedEnabled={seedEnabled}
            seedValue={seedValue}
            onSeedToggle={setSeedEnabled}
            onSeedChange={setSeedValue}
            doubleRoundRobin={doubleRoundRobin}
            onDoubleRoundRobinToggle={setDoubleRoundRobin}
            strategySearch={strategySearch}
            onStrategySearch={setStrategySearch}
            selectedStrategyNames={selectedStrategyNames}
            onToggleStrategy={toggleStrategy}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            activeStrategyCount={activeStrategies.length}
          />
        ) : (
          <LandingScreen onStart={handleEnterLab} isFadingOut={isLandingFading} />
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);















