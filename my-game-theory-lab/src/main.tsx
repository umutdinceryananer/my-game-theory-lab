import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { testGameLogic } from './test-game'

function App() {
  const runTournament = () => {
    console.clear();
    testGameLogic();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Game Theory Lab</h1>
      <p>Iterated Prisoner's Dilemma Tournament</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={runTournament}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Run Tournament
        </button>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Features 4 classic strategies: Always Cooperate, Always Defect, Tit-for-Tat, and Random.</p>
        <p>Open browser console (F12) to see tournament results.</p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)