import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>
      <h1>Game Theory Lab</h1>
      <p>Iterated Prisoner's Dilemma tournament!</p>
    </div>
  </StrictMode>,
)