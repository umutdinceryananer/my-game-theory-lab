import type { Strategy } from '../core/types';

export const alwaysCooperate: Strategy = {
  name: 'Always Cooperate',
  description: 'Always cooperates',
  play: () => 'COOPERATE'
};
