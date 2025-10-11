import { Beaker, Play, Sparkles, Workflow } from 'lucide-react';

import { cn } from '@/lib/utils';
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

type LandingScreenProps = {
  onStart: () => void;
  isFadingOut: boolean;
};

export function LandingScreen({ onStart, isFadingOut }: LandingScreenProps) {
  const features = [
    {
      icon: Sparkles,
      title: 'Simulate tournaments',
      description: 'Configure formats, noise, and payoff matrices to see which strategies rise to the top.',
    },
    {
      icon: Workflow,
      title: 'Evolve new strategies',
      description: 'Let the genetic engine iterate on genomes and inject the champion into the next bracket.',
    },
    {
      icon: Beaker,
      title: 'Inspect outcomes',
      description: 'Review standings, heat maps, and trend charts to understand how strategies interact.',
    },
  ] as const;

  return (
    <Card className={cn('transition-opacity duration-500', isFadingOut ? 'opacity-0' : 'opacity-100')}>
      <CardHeader className="space-y-3">
        <Badge variant="secondary" className="w-fit uppercase tracking-wide">
          Welcome
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-2xl sm:text-3xl">Game Theory Lab</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Experiment with cooperation, defection, and adaptive strategies in the Iterated Prisoner&apos;s Dilemma.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-sm text-muted-foreground">
        <section className="space-y-3">
          <p className="text-sm sm:text-base">
            Load into the lab to configure strategies, run customised tournaments, and explore analytical dashboards
            that highlight how trust and retaliation evolve over repeated play.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex h-full flex-col gap-2 rounded-md border border-muted bg-muted/10 p-3 transition hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {title}
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick start</h3>
          <ol className="space-y-2 text-xs">
            <li className="rounded-md border border-dashed border-muted/60 bg-background/80 p-3">
              <span className="font-semibold text-foreground">1. Curate the roster:</span> Pick a mix of classic and
              genetic strategies from the dashboard roster.
            </li>
            <li className="rounded-md border border-dashed border-muted/60 bg-background/80 p-3">
              <span className="font-semibold text-foreground">2. Configure the arena:</span> Use simulation controls to
              set rounds, noise, and tournament format.
            </li>
            <li className="rounded-md border border-dashed border-muted/60 bg-background/80 p-3">
              <span className="font-semibold text-foreground">3. Run & inspect:</span> Launch the tournament, then dig
              into standings, head-to-head heatmaps, and evolution insights.
            </li>
          </ol>
        </section>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 text-left">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Ready to experiment?</p>
          <p className="text-xs text-muted-foreground">
            Step inside the dashboard and kick off your first tournament run.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            size="lg"
            onClick={onStart}
            className="w-full sm:w-auto"
            disabled={isFadingOut}
          >
            <Play className="mr-2 h-4 w-4" />
            Enter the Lab
          </Button>
          <Button variant="outline" className="h-11 w-full sm:w-auto" asChild>
            <a href="https://github.com/umutdinceryananer/My-Game-Theory-Lab#readme" target="_blank" rel="noreferrer">
              View project guide
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
