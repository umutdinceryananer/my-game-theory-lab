import type { Strategy } from '../core/types';

export const random: Strategy = {
  name: 'Random',
  description: 'Random 50/50 choice',
  play: (history) => history.random() < 0.5 ? 'COOPERATE' : 'DEFECT',
};