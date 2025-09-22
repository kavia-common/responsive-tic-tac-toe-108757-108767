import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Ocean Professional Tic Tac Toe
 * - Primary: #2563EB (blue)
 * - Secondary/Success: #F59E0B (amber)
 * - Error: #EF4444
 * - Background: #f9fafb
 * - Surface: #ffffff
 * - Text: #111827
 */

// Helpers
const LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diags
  [2, 4, 6],
];

function calculateWinner(squares) {
  for (const [a, b, c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function emptyIndices(squares) {
  return squares.flatMap((v, i) => (v ? [] : [i]));
}

// Simple AI: try to win, block opponent, take center, take corner, else random
function computeComputerMove(squares, ai = 'O', human = 'X') {
  const empties = emptyIndices(squares);
  if (empties.length === 0) return null;

  // Try to win
  for (const idx of empties) {
    const clone = squares.slice();
    clone[idx] = ai;
    if (calculateWinner(clone)?.player === ai) return idx;
  }

  // Block opponent
  for (const idx of empties) {
    const clone = squares.slice();
    clone[idx] = human;
    if (calculateWinner(clone)?.player === human) return idx;
  }

  // Center
  if (empties.includes(4)) return 4;

  // Corners
  const corners = [0, 2, 6, 8].filter((c) => empties.includes(c));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // Random
  return empties[Math.floor(Math.random() * empties.length)];
}

// PUBLIC_INTERFACE
function App() {
  /** Styling theme isn't toggled in spec; keep single clean modern theme. */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('pvp'); // 'pvp' | 'cpu'
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [highlight, setHighlight] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const winnerInfo = useMemo(() => calculateWinner(board), [board]);
  const winner = winnerInfo?.player || null;
  const isBoardFull = useMemo(() => board.every(Boolean), [board]);
  const isDraw = !winner && isBoardFull;

  useEffect(() => {
    if (winnerInfo) {
      setHighlight(winnerInfo.line);
      setScores((s) => ({ ...s, [winnerInfo.player]: s[winnerInfo.player] + 1 }));
    } else if (isDraw) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    }
  }, [winnerInfo, isDraw]);

  // CPU move effect
  useEffect(() => {
    if (mode !== 'cpu') return;
    if (winner || isDraw) return;

    const currentPlayer = xIsNext ? 'X' : 'O';
    // CPU is 'O' by default
    if (currentPlayer === 'O') {
      const timer = setTimeout(() => {
        const move = computeComputerMove(board, 'O', 'X');
        if (move !== null) {
          handleSquareClick(move);
        }
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [mode, xIsNext, board, winner, isDraw]);

  function handleSquareClick(index) {
    if (winner || board[index] || isAnimating) return;

    setBoard((prev) => {
      const next = prev.slice();
      next[index] = xIsNext ? 'X' : 'O';
      return next;
    });
    setXIsNext((prev) => !prev);
    // Micro animation trigger
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
  }

  // PUBLIC_INTERFACE
  function restartGame(keepScores = true) {
    /** Restart the current game. Optionally reset scores. */
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setHighlight([]);
    if (!keepScores) {
      setScores({ X: 0, O: 0, draws: 0 });
    }
  }

  // PUBLIC_INTERFACE
  function changeMode(nextMode) {
    /** Change game mode between 'pvp' and 'cpu', and restart. */
    setMode(nextMode);
    restartGame(true);
  }

  const statusText = (() => {
    if (winner) return `Winner: ${winner}`;
    if (isDraw) return "It's a draw";
    return `Turn: ${xIsNext ? 'X' : 'O'}`;
  })();

  const statusTone = winner ? 'success' : isDraw ? 'warning' : 'info';

  return (
    <div className="ocean-app">
      <div className="ocean-container">
        <header className="ocean-header">
          <div className="brand">
            <div className="brand-mark" aria-hidden />
            <h1 className="title">Tic Tac Toe</h1>
          </div>

          <div className={`status ${statusTone}`}>
            {statusText}
          </div>

          <div className="scoreboard" aria-label="Scoreboard">
            <div className="score">
              <span className="label">X</span>
              <span className="value">{scores.X}</span>
            </div>
            <div className="score">
              <span className="label">O</span>
              <span className="value">{scores.O}</span>
            </div>
            <div className="score">
              <span className="label">Draws</span>
              <span className="value">{scores.draws}</span>
            </div>
          </div>
        </header>

        <main className="board-wrap">
          <div className="board" role="grid" aria-label="Tic Tac Toe Board">
            {board.map((val, idx) => {
              const isWinCell = highlight.includes(idx);
              return (
                <button
                  key={idx}
                  className={`cell ${val ? 'filled' : ''} ${isWinCell ? 'win' : ''}`}
                  role="gridcell"
                  aria-label={`Cell ${idx + 1}${val ? ` with ${val}` : ''}`}
                  onClick={() => handleSquareClick(idx)}
                  disabled={Boolean(winner)}
                >
                  <span className={`mark ${val === 'X' ? 'x' : 'o'}`}>
                    {val}
                  </span>
                </button>
              );
            })}
          </div>
        </main>

        <footer className="controls">
          <div className="mode-group" role="group" aria-label="Game mode">
            <button
              className={`btn ${mode === 'pvp' ? 'primary' : 'ghost'}`}
              onClick={() => changeMode('pvp')}
              aria-pressed={mode === 'pvp'}
            >
              Player vs Player
            </button>
            <button
              className={`btn ${mode === 'cpu' ? 'primary' : 'ghost'}`}
              onClick={() => changeMode('cpu')}
              aria-pressed={mode === 'cpu'}
            >
              Player vs Computer
            </button>
          </div>

          <div className="action-group">
            <button className="btn outline" onClick={() => restartGame(true)} aria-label="Restart game">
              Restart
            </button>
            <button className="btn danger-ghost" onClick={() => restartGame(false)} aria-label="Restart and reset scores">
              Reset Scores
            </button>
          </div>

          <p className="hint">
            Tip: X always starts. In vs Computer mode, the computer plays as O.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
