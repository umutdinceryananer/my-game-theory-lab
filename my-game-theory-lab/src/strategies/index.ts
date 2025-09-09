// Import all strategies
export { alwaysCooperate } from './alwaysCooperate';
export { alwaysDefect } from './alwaysDefect';
export { titForTat } from './titForTat';
export { random } from './random';

// Import for convenience
import { alwaysCooperate } from './alwaysCooperate';
import { alwaysDefect } from './alwaysDefect';
import { titForTat } from './titForTat';
import { random } from './random';

// Array of all default strategies
export const defaultStrategies = [
  alwaysCooperate,
  alwaysDefect,
  titForTat,
  random
];
