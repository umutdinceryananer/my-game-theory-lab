## Genetic Strategy Scaffold

This folder contains the primitives needed to describe rule based genetic strategies.

- `genome.ts` - Defines the genome schema, gene conditions, and `GeneticStrategyConfig` types.
- `operators.ts` - Provides mutation and single point crossover helpers.
- `createGeneticStrategy.ts` - Turns a genome into a runnable `Strategy` instance.
- `index.ts` - Re-exports the module surface so it can be consumed from the top level `src/strategies` barrel.

Usage flow:
1. Describe your genome as a `Gene[]` (conditions are evaluated in order).
2. Build the `Strategy` instance with `createGeneticStrategy`.
3. Use the helpers in `operators.ts` when you want to mutate or cross genomes into fresh variants.

Notes:
- `roundRange` bounds are 1 based; for example `[1, 5]` covers the first five rounds.
- Weights (`weight`) help break ties when multiple genes match and default to `1`.
- Mutation and crossover rates are currently only stored as metadata on the config; integrating them with the tournament engine will follow in a later iteration.
