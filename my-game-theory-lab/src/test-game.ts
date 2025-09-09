import { Tournament } from './core/tournament';
import { defaultStrategies } from './strategies';

export function testGameLogic(): void {
  console.log('=== PRISONER\'S DILEMMA TOURNAMENT ===');
  
  const tournament = new Tournament();
  const results = tournament.run(defaultStrategies, 100);
  tournament.formatResults(results);
}