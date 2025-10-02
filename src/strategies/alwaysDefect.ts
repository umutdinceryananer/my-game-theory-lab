import type { Strategy } from '../core/types';

export const alwaysDefect: Strategy = {
  name: 'Always Defect', 
  description: 'Always defects',
  play: () => 'DEFECT'
};
