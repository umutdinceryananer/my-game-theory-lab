import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Trophy } from 'lucide-react';

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
import { DEFAULT_PAYOFF_MATRIX, type PayoffMatrix } from '@/core/types';
import { cn } from '@/lib/utils';
import type { TournamentResult } from '@/core/tournament';
import { simulateTournament } from '@/test-game';
import { defaultStrategies } from '@/strategies';

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
}: DashboardProps) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const champion = results?.[0];

  return (
    <Card className={cn('transition-opacity duration-500', isVisible ? 'opacity-100' : 'opacity-0')}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Game Theory Lab</CardTitle>
            <CardDescription>
              Explore the Iterated Prisoner&apos;s Dilemma with pluggable strategies.
            </CardDescription>
          </div>
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-dashed px-4 py-2 sm:flex">
            <Play className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">Tournament</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <SimulationParametersPanel
          rounds={roundsPerMatch}
          onRoundsChange={onRoundsChange}
          noiseEnabled={noiseEnabled}
          onNoiseToggle={onNoiseToggle}
          noisePercent={noisePercent}
          onNoisePercentChange={onNoisePercentChange}
          payoffMatrix={payoffMatrix}
          onPayoffMatrixChange={onPayoffMatrixChange}
        />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Included strategies</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {defaultStrategies.map((strategy) => (
              <li
                key={strategy.name}
                className="flex items-center gap-3 rounded-md border border-dashed border-muted p-3 text-sm hover:bg-muted/40"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {strategy.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-medium text-foreground">{strategy.name}</p>
                  <p className="text-xs text-muted-foreground">{strategy.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 rounded-lg bg-secondary/20 p-4 text-sm text-muted-foreground">
          <p>Click the button to simulate a round robin tournament with the configured parameters.</p>
          <p>The detailed scores and rankings still log to the console, and the table below reflects the latest run.</p>
        </section>

        <section className="space-y-3 rounded-lg border border-dashed border-muted p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Latest standings</h2>
              <p className="text-xs text-muted-foreground">Sorted by cumulative score across all matches.</p>
            </div>
            {champion ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                {champion.name}
              </Badge>
            ) : (
              <Badge variant="outline">Run to populate</Badge>
            )}
          </div>

          {results ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Rank</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead className="w-24 text-right">Score</TableHead>
                  <TableHead className="w-24 text-right">Wins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={result.name} data-state={index === 0 ? 'selected' : undefined}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell className={cn('text-sm', index === 0 && 'font-semibold text-foreground')}>
                      {result.name}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{result.totalScore}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{result.wins}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Run the tournament to populate the standings table.</p>
          )}
        </section>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Pro tip: open DevTools (F12) before running to follow along with the console log output.
        </p>
        <Button size="lg" onClick={onRunTournament} className="w-full sm:w-auto">
          <Play className="mr-2 h-4 w-4" />
          Run Tournament
        </Button>
      </CardFooter>
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

  const runTournament = () => {
    console.clear();
    const errorRate = noiseEnabled ? noisePercent / 100 : 0;
    const outcome = simulateTournament(roundsPerMatch, errorRate, payoffMatrix);
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
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