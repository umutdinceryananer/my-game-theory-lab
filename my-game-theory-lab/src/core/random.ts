// Simple deterministic PRNG based on mulberry32
// Accepts numeric or string seed to ease UI usage
export type RandomSource = () => number;

function stringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(31, hash) + input.charCodeAt(i) | 0;
  }
  return hash >>> 0;
}

export function createRandomSource(seed?: number | string): RandomSource {
  if (seed === undefined) {
    return Math.random;
  }

  let value: number;
  if (typeof seed === 'string') {
    value = stringToSeed(seed);
  } else {
    value = seed >>> 0;
  }

  // mulberry32
  let state = value || 0xDEADBEEF;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}