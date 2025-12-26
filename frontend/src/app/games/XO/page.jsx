"use client";

import { useEffect, useState } from "react";

/**
 * XOGame.jsx
 * - Modes : "menu" -> choisir solo / duel, "solo" (vs bot), "duel" (deux joueurs sur le même écran)
 * - Auto-reset 1s après victoire ou match nul
 * - Bouton "Recommencer" disponible pendant la partie
 * - Design premium, animations, retour visuel
 */

export default function XOGame() {
  const emptyGrid = Array(9).fill(null);

  const [grid, setGrid] = useState(emptyGrid);
  const [player, setPlayer] = useState("X"); // joueur courant
  const [winner, setWinner] = useState(null); // "X", "O" ou "draw" ou null
  const [mode, setMode] = useState("menu"); // "menu" | "solo" | "duel"
  const [isBotTurn, setIsBotTurn] = useState(false);
  const [animating, setAnimating] = useState(false); // pour petites animations quand victoire
  const [lastMoveIndex, setLastMoveIndex] = useState(null); // pour mettre en évidence dernier coup

  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const checkWinner = (g) => {
    for (let p of winPatterns) {
      const [a, b, c] = p;
      if (g[a] && g[a] === g[b] && g[a] === g[c]) {
        return { winner: g[a], pattern: p };
      }
    }
    if (!g.includes(null)) return { winner: "draw" };
    return null;
  };

  // Bot (simple random) joue un coup
  const playBot = (currentGrid) => {
  if (winner) return;

  const newGrid = [...currentGrid];

  const emptyCells = newGrid
    .map((v, i) => (v === null ? i : null))
    .filter((v) => v !== null);

  if (emptyCells.length === 0) return;

  // 1️⃣ BOT CHECK : peut-il gagner ?
  for (let [a, b, c] of winPatterns) {
    const line = [newGrid[a], newGrid[b], newGrid[c]];
    if (line.filter((x) => x === "O").length === 2 && line.includes(null)) {
      const idx = [a, b, c][line.indexOf(null)];
      newGrid[idx] = "O";
      setLastMoveIndex(idx);
      const res = checkWinner(newGrid);
      setGrid(newGrid);
      if (res) setWinner(res.winner);
      setIsBotTurn(false);
      setPlayer("X");
      return;
    }
  }

  // 2️⃣ DEFENSE : empêcher X de gagner
  for (let [a, b, c] of winPatterns) {
    const line = [newGrid[a], newGrid[b], newGrid[c]];
    if (line.filter((x) => x === "X").length === 2 && line.includes(null)) {
      const idx = [a, b, c][line.indexOf(null)];
      newGrid[idx] = "O";
      setLastMoveIndex(idx);
      setGrid(newGrid);
      setIsBotTurn(false);
      setPlayer("X");
      return;
    }
  }

  // 3️⃣ PRENDRE LE CENTRE
  if (newGrid[4] === null) {
    newGrid[4] = "O";
    setLastMoveIndex(4);
    setGrid(newGrid);
    setIsBotTurn(false);
    setPlayer("X");
    return;
  }

  // 4️⃣ PRENDRE UN COIN
  const corners = [0, 2, 6, 8].filter((i) => newGrid[i] === null);
  if (corners.length > 0) {
    // eslint-disable-next-line react-hooks/purity
    const idx = corners[Math.floor(Math.random() * corners.length)];
    newGrid[idx] = "O";
    setLastMoveIndex(idx);
    setGrid(newGrid);
    setIsBotTurn(false);
    setPlayer("X");
    return;
  }

  // 5️⃣ SINON → case aléatoire
  // eslint-disable-next-line react-hooks/purity
  const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  newGrid[randomIndex] = "O";
  setLastMoveIndex(randomIndex);
  setGrid(newGrid);
  setIsBotTurn(false);
  setPlayer("X");
};


  const handleClick = (index) => {
    if (grid[index] !== null) return;
    if (winner) return;
    if (isBotTurn) return;

    // si mode solo et le bot joue en tant que O, on doit interdire le joueur O
    // Ici on considère que "player" indique le symbole du joueur courant à l'écran.
    const newGrid = [...grid];
    newGrid[index] = player;
    setGrid(newGrid);
    setLastMoveIndex(index);

    const res = checkWinner(newGrid);
    if (res) {
      setWinner(res.winner);
      setAnimating(true);
      return;
    }

    // si grille pleine -> égalité
    if (!newGrid.includes(null)) {
      setWinner("draw");
      setAnimating(true);
      return;
    }

    if (mode === "solo") {
      // après le joueur (X) joue -> bot joue O
      setPlayer("O");
      setIsBotTurn(true);
      // donner un petit délai pour montrer le coup du bot
      setTimeout(() => playBot([...newGrid]), 450);
      return;
    }

    // duel local : toggle player
    setPlayer(player === "X" ? "O" : "X");
  };

  // reset complet
  const resetGame = (keepMode = true) => {
    setGrid(emptyGrid);
    setWinner(null);
    setPlayer("X");
    setIsBotTurn(false);
    setAnimating(false);
    setLastMoveIndex(null);
    if (!keepMode) setMode("menu");
  };

  // auto reset 1s après victoire / draw
  useEffect(() => {
    if (winner) {
      const t = setTimeout(() => {
        // on remet à zéro, en gardant le mode actif pour rejouer rapidement
        resetGame(true);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [winner]);

  // small visual: highlight winning pattern
  const winningPattern = (() => {
    if (!winner || winner === "draw") return [];
    for (let p of winPatterns) {
      const [a, b, c] = p;
      if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
        return p;
      }
    }
    return [];
  })();

  // Menu rendering + controls
  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white/70 backdrop-blur rounded-3xl shadow-2xl border border-white/30 p-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3 text-center">
            XO — Morpion
          </h1>
          <p className="text-sm text-slate-600 text-center mb-6">
            Choisis un mode : affronte l&apos;ordinateur ou joue avec un ami sur le
            même écran.
          </p>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <button
              onClick={() => {
                resetGame(true);
                setMode("solo");
              }}
              className="flex-1 px-4 py-4 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-2xl font-semibold shadow-lg transform hover:scale-[1.02] transition"
            >
              Solo — contre le bot
              <span className="block text-xs opacity-90 mt-1">
                Difficulté : facile (bot aléatoire)
              </span>
            </button>

            <button
              onClick={() => {
                resetGame(true);
                setMode("duel");
              }}
              className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-2xl font-semibold shadow hover:shadow-md transition"
            >
              Duel local — joue avec un ami
              <span className="block text-xs opacity-80 mt-1 text-slate-600">
                Tour à tour sur le même appareil
              </span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                resetGame(false);
                setMode("menu");
              }}
              className="text-sm text-slate-600 hover:underline"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">XO — {mode === "solo" ? "Solo" : "Duel local"}</h2>
            <p className="text-sm text-slate-600">Design premium • Jouez et amusez-vous</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetGame(true);
              }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition"
            >
              Recommencer
            </button>

            <button
              onClick={() => {
                resetGame(false);
                setMode("menu");
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:scale-[1.02] transition"
            >
              Quitter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-white/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow">
                <span className="font-bold">{player}</span>
              </div>
              <div>
                {!winner ? (
                  <p className="text-sm text-slate-700">
                    Tour du joueur <span className="font-semibold">{player}</span>
                  </p>
                ) : winner === "draw" ? (
                  <p className="text-sm text-yellow-600 font-semibold">Match nul 🤝</p>
                ) : (
                  <p className="text-sm text-green-600 font-semibold">🎉 Le joueur {winner} a gagné !</p>
                )}
                <p className="text-xs text-slate-400">Mode : {mode === "solo" ? "Solo (bot)" : "Duel local"}</p>
              </div>
            </div>

            <div className="text-sm text-slate-500">
              <div className="mb-1">Dernier coup : {lastMoveIndex !== null ? lastMoveIndex + 1 : "-"}</div>
              <div className="text-xs">Auto-reset 1s après fin</div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-6 justify-center items-center 
            w-full max-w-[420px] md:max-w-[500px] mx-auto">

            {grid.map((cell, i) => {
              const isWinningCell = winningPattern.includes(i);
              const isLast = lastMoveIndex === i;
              return (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  disabled={!!winner || isBotTurn}
                  className={`
                    relative
                    w-28 h-28 md:w-32 md:h-32 rounded-2xl
                    flex items-center justify-center text-5xl font-extrabold
                    transition-transform transform
                    ${cell ? "text-slate-900" : "text-slate-400"}
                    ${cell ? "bg-white" : "bg-white/80"}
                    shadow-md hover:scale-[1.03]
                    ${isWinningCell ? "ring-4 ring-green-300" : ""}
                    ${isLast ? "ring-2 ring-indigo-200" : ""}
                    ${winner ? "opacity-90" : "opacity-100"}
                  `}
                >
                  <span className={`${cell === "X" ? "text-indigo-600" : "text-rose-600"} ${isWinningCell ? "animate-pulse" : ""}`}>
                    {cell}
                  </span>

                  {/* small accent */}
                  {!cell && (
                    <span className="absolute bottom-2 right-2 text-xs text-slate-300">
                      {i + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls & footer */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => resetGame(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg shadow hover:scale-[1.02] transition"
              >
                Recommencer
              </button>

              <button
                onClick={() => {
                  // basculer facilement le mode et reset
                  if (mode === "solo") setMode("duel");
                  else setMode("solo");
                  resetGame(true);
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow hover:shadow-md transition"
              >
                Passer en {mode === "solo" ? "Duel" : "Solo"}
              </button>
            </div>

            <div className="text-xs text-slate-500 text-center md:text-right">
              <div>{winner ? "Partie terminée — réinitialisation automatique..." : isBotTurn ? "Le bot réfléchit..." : "Amusez-vous !"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
