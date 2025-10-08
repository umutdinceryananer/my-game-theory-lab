export function createSequenceRandom(sequence: number[], fallback = 0.5): () => number {
  let index = 0;
  const defaultValue = sequence.length > 0 ? sequence[sequence.length - 1] : fallback;
  return () => {
    const value = sequence[index] ?? defaultValue;
    index += 1;
    return value;
  };
}
