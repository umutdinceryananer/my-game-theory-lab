import type { Strategy } from './types';
import { PrisonersDilemmaGame } from './game';

// Simple tournament - just what we need
export class Tournament {
  private game = new PrisonersDilemmaGame();

  /**
   * Run a round-robin tournament
   */
  run(strategies: Strategy[], roundsPerMatch: number = 100) {
    if (strategies.length < 2) {
      throw new Error('Need at least 2 strategies');
    }

    const results: Array<{name: string, totalScore: number, wins: number}> = 
      strategies.map(s => ({ name: s.name, totalScore: 0, wins: 0 }));

    // Play all matches
    for (let i = 0; i < strategies.length; i++) {
      for (let j = i + 1; j < strategies.length; j++) {
        const match = this.game.playMatch(strategies[i], strategies[j], roundsPerMatch);
        
        // Update scores
        results[i].totalScore += match.player1Score;
        results[j].totalScore += match.player2Score;
        
        // Count wins
        if (match.player1Score > match.player2Score) results[i].wins++;
        else if (match.player2Score > match.player1Score) results[j].wins++;
      }
    }

    // Sort by total score
    results.sort((a, b) => b.totalScore - a.totalScore);
    
    return results;
  }

  /**
   * Format results for console
   */
  formatResults(results: ReturnType<typeof Tournament.prototype.run>) {
    console.log('\n=== TOURNAMENT RESULTS ===');
    console.log('Rank | Strategy          | Score | Wins');
    console.log('-----|-------------------|-------|-----');
    
    results.forEach((result, index) => {
      const rank = (index + 1).toString().padStart(4);
      const name = result.name.padEnd(17);
      const score = result.totalScore.toString().padStart(5);
      const wins = result.wins.toString().padStart(4);
      console.log(`${rank} | ${name} | ${score} | ${wins}`);
    });
  }
}