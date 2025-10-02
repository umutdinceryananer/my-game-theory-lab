import type { Strategy } from '../core/types';

export const alternate: Strategy = {
  name: 'Alternator',
  description: 'Alternates between cooperate and defect.',
  play: (_history, round) => (round % 2 === 0 ? 'COOPERATE' : 'DEFECT'),
};