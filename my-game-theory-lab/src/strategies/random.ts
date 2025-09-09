import type { Strategy } from '../core/types';

export const random: Strategy = {
  name: 'Random',
  description: 'Random 50/50 choice',
  play: () => Math.random() < 0.5 ? 'COOPERATE' : 'DEFECT'
};
