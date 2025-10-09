[![CI](https://github.com/umutdinceryananer/My-Game-Theory-Lab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/umutdinceryananer/My-Game-Theory-Lab/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/umutdinceryananer/My-Game-Theory-Lab?display_name=tag&sort=semver)](https://github.com/umutdinceryananer/My-Game-Theory-Lab/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

# Game Theory Lab

Interactive React/Vite sandbox for the iterated Prisoner's Dilemma. Strategies face off in a configurable simulation engine, and the monochrome UI is built with Tailwind CSS + shadcn/ui components.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Launch the dev server**
   ```bash
   npm run dev
   ```
3. Open the printed URL in your browser and keep DevTools (F12) open to watch the tournament logs.

## Features

- **Tournament engine** \ `src/core` implements the match logic, supports custom round counts, and can inject noise that flips moves to emulate miscommunication. The round-robin driver aggregates scores and ranks strategies.
- **Strategy catalog** \ `src/strategies` ships Always Cooperate, Always Defect, Tit-for-Tat, Random, and numerous variants. You can create your own by exporting a `Strategy` and wiring it into `baseStrategies` / `defaultStrategies`.
- **Genetic strategy editor** \ Toggle the new *Genetic Editor* button in the roster. Mutation/crossover rates and individual genes (response, last-move conditions, round ranges, weight) are now editable, with per-gene validation, undo/redo history, and unsaved-change warnings.
- **Onboarding flow** \ `src/components/landing-screen.tsx` greets users with a fade transition before dropping them into the dashboard.
- **Simulation control panel** \ `src/components/panels/simulation-parameters.tsx` exposes rounds-per-match, noise toggles, payoff matrix editor, deterministic seed, and tournament format (single/double round-robin, Swiss).
- **Insights** \ Standings and head-to-head heat map live inside a shadcn-style tab control; Swiss tournaments surface per-round breakdowns and leader snapshots.

## Simulation Controls

- **Rounds per match** \ Choose any integer from 1-1000 to test short- or long-horizon behaviour.
- **Noise toggle** \ Quickly enable or disable move flips. When enabled, use the advanced slider/input to set the 0-100% probability that each move is inverted.
- **Genetic editor** \ Surface genome metadata, tweak conditions, preview validation warnings, and experiment with undo/redo before applying global changes.

## Useful Scripts

- `npm run dev` – start Vite in development mode.
- `npm run build` – type-check and build the production bundle.
- `npm run preview` – locally preview the production build.
- `npm run typecheck` – run TypeScript in `--noEmit` mode.
- `npm run lint:strict` – run ESLint with the configured TypeScript rules.
- `npm test` – run Vitest (coverage includes genetic helpers and operators).

## Customization Tips

- Update the design tokens in `src/index.css` for a different colour palette.
- Re-export new UI atoms from `src/components/ui` to keep imports tidy (`@/components/ui/...`).
- Extend `src/strategies/index.ts` or the genetic editor to introduce new behaviours, then rerun the tournament to see how they fare.

## Download

Grab the latest packaged build from the GitHub **Releases** page. After downloading the ZIP, extract it and serve the `dist/` folder with any static server of your choice.

## Roadmap

- **Evolutionary tournament mode** – Data model and engine contract live in `src/core/evolution.ts`. Upcoming work will wire selection/mutation/crossover, population metrics, and UI controls.
- **Analytics enrichments** – Planned dashboards for gene activation counts, mutation impact, and evolutionary run summaries.
- **Import/export** – Future builds may support saving and sharing genetic configurations.

Happy experimenting!

