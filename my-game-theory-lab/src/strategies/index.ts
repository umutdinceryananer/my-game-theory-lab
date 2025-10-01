export { alwaysCooperate } from './alwaysCooperate';
export { alwaysDefect } from './alwaysDefect';
export { titForTat } from './titForTat';
export { random } from './random';
export { grudger } from './grudger';
export { prober } from './prober';
export { alternate } from './alternate';
export { pavlov } from './pavlov';

import { alwaysCooperate } from './alwaysCooperate';
import { alwaysDefect } from './alwaysDefect';
import { titForTat } from './titForTat';
import { random } from './random';
import { grudger } from './grudger';
import { prober } from './prober';
import { alternate } from './alternate';
import { pavlov } from './pavlov';

export const defaultStrategies = [
  alwaysCooperate,
  alwaysDefect,
  titForTat,
  random,
  grudger,
  prober,
  alternate,
  pavlov,
];