![CI](https://github.com/umutdinceryananer/My-Game-Theory-Lab/actions/workflows/ci.yml/badge.svg)


# Game Theory Lab

Interactive React/Vite sandbox for iterated Prisoner's Dilemma tournaments. Strategies face off in a configurable simulation engine, and the monochrome UI is styled with Tailwind CSS + shadcn/ui components.

## Getting Started

1. Install dependencies:
   `bash
   npm install
   `
2. Launch the dev server:
   `bash
   npm run dev
   `
3. Open the printed URL in your browser and keep DevTools (F12) open to watch the tournament logs.

## Features

- **Tournament engine**  src/core implements the match logic, supports custom round counts, and can inject noise that flips moves to emulate miscommunication. The round-robin driver aggregates scores and ranks strategies.
- **Strategy catalog**  src/strategies ships Always Cooperate, Always Defect, Tit-for-Tat, and Random as baselines. Add new behaviours by exporting additional strategies and including them in defaultStrategies.
- **Onboarding flow**  src/components/landing-screen.tsx greets users with a fade transition before dropping them into the dashboard.
- **Simulation control panel**  src/components/panels/simulation-parameters.tsx exposes rounds-per-match, a noise toggle, and advanced slider/number inputs for fine-tuning error rates.
- **Monochrome shadcn shell**  Cards, badges, tables, buttons, switches, and inputs live in src/components/ui, styled via tokens defined in src/index.css and 	ailwind.config.ts.

## Simulation Controls

- **Rounds per match**  Choose any integer from 1-1000 to test short- or long-horizon behaviour.
- **Noise toggle**  Quickly enable or disable move flips. When enabled, use the advanced controls to set the 0�100% probability that each move is inverted.
- Results stream to the browser console and populate the standings table in real time.

## Useful Scripts

- npm run dev: start Vite in development mode.
- npm run build: type-check and build the production bundle.
- npm run preview: locally preview the production build.
- npm run lint: run ESLint with the configured TypeScript rules.

## Customization Tips

- Update the design tokens in src/index.css for a different colour palette.
- Re-export new UI atoms from src/components/ui to keep imports tidy (@/components/ui/...).
- Extend src/strategies/index.ts with custom strategies and rerun the tournament to see how they fare.

Happy experimenting!