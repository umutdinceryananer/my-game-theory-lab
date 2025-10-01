# Game Theory Lab

Interactive sandbox for running Iterated Prisoner's Dilemma tournaments with React, Vite, TypeScript, Tailwind CSS, and shadcn/ui.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch the dev server:
   ```bash
   npm run dev
   ```
3. Open the printed URL in your browser and keep DevTools (F12) open to watch the tournament logs.

## What You Get

- **Tournament engine** – `src/core` implements the Prisoner's Dilemma match logic and a round-robin tournament runner.
- **Strategy catalog** – `src/strategies` ships Always Cooperate, Always Defect, Tit-for-Tat, and Random baselines to extend.
- **Monochrome UI** – `src/main.tsx` renders shadcn cards, badges, tables, and buttons with neutral Tailwind tokens plus a live standings table.

## Useful Scripts

- `npm run dev` – start Vite in development mode.
- `npm run build` – type-check and build the production bundle.
- `npm run preview` – locally preview the production build.
- `npm run lint` – run ESLint with the configured TypeScript rules.

## Customizing shadcn Components

- Tailwind configuration lives in `tailwind.config.ts`; global tokens and base utilities reside in `src/index.css`.
- Shared helpers such as `cn` and base UI primitives (Button, Card, Badge, Table) sit under `src/lib` and `src/components/ui`.
- Add new shadcn components by defining them in `src/components/ui` and wiring Tailwind classes that reference the design tokens.