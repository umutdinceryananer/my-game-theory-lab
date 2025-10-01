import { Play } from 'lucide-react';

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
  return (
    <Card className={cn('transition-opacity duration-500', isFadingOut ? 'opacity-0' : 'opacity-100')}>
      <CardHeader className="space-y-3">
        <Badge variant="secondary" className="w-fit uppercase tracking-wide">
          Welcome
        </Badge>
        <CardTitle>Game Theory Lab</CardTitle>
        <CardDescription>
          Experiment with cooperation, defection, and adaptive strategies in the Iterated Prisoner&apos;s Dilemma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>Load into the lab to configure strategies, run tournaments, and inspect the leaderboard in real time.</p>
        <ul className="grid gap-2">
          <li className="rounded-md border border-dashed border-muted p-3">
            Analyze classic strategies such as Tit-for-Tat and Always Defect.
          </li>
          <li className="rounded-md border border-dashed border-muted p-3">
            Trigger console logs to examine detailed round-robin outcomes.
          </li>
          <li className="rounded-md border border-dashed border-muted p-3">
            Extend the catalog with your own behaviors and watch them compete.
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Ready? Step inside and start the next tournament.</p>
        <Button
          size="lg"
          onClick={onStart}
          className="w-full sm:w-auto"
          disabled={isFadingOut}
        >
          <Play className="mr-2 h-4 w-4" />
          Enter the Lab
        </Button>
      </CardFooter>
    </Card>
  );
}