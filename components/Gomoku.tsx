import React, { useState, useCallback } from 'react';
import { Coordinates } from '../types';
import { Undo2, RefreshCw } from 'lucide-react';

const BOARD_SIZE = 15;

const Gomoku: React.FC = () => {
  const [history, setHistory] = useState<number[][][]>([
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))
  ]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(1); // 1: Black, 2: White
  const [winner, setWinner] = useState<number | null>(null);

  const currentBoard = history[history.length - 1];

  const checkWin = (board: number[][], x: number, y: number, player: number) => {
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      // Check forward
      let i = 1;
      while (true) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE || board[ny][nx] !== player) break;
        count++;
        i++;
      }
      // Check backward
      i = 1;
      while (true) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE || board[ny][nx] !== player) break;
        count++;
        i++;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  const handleClick = (x: number, y: number) => {
    if (winner || currentBoard[y][x] !== 0) return;

    const newBoard = currentBoard.map(row => [...row]);
    newBoard[y][x] = currentPlayer;

    setHistory([...history, newBoard]);

    if (checkWin(newBoard, x, y, currentPlayer)) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  const handleUndo = () => {
    if (history.length > 1 && !winner) {
      setHistory(history.slice(0, -1));
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    } else if (winner && history.length > 1) {
      // Allow undo after win to continue analysis or revert mistake
      setHistory(history.slice(0, -1));
      setWinner(null);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1); // Revert to winner's turn
    }
  };

  const resetGame = () => {
    setHistory([Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))]);
    setCurrentPlayer(1);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-4xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center w-full max-w-md">
        <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-bold shadow-sm transition-all ${currentPlayer === 1 ? 'bg-slate-900 text-white scale-105' : 'bg-gray-200 text-gray-400'}`}>
                黑子 (Black)
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold shadow-sm transition-all ${currentPlayer === 2 ? 'bg-white text-slate-900 border border-slate-300 scale-105' : 'bg-gray-200 text-gray-400'}`}>
                白子 (White)
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleUndo} disabled={history.length <= 1} className="p-2 rounded-full bg-wood-300 hover:bg-wood-400 disabled:opacity-50 transition-colors" title="悔棋 (Undo)">
                <Undo2 size={20} className="text-wood-900" />
            </button>
            <button onClick={resetGame} className="p-2 rounded-full bg-wood-300 hover:bg-wood-400 transition-colors" title="重新开始 (Restart)">
                <RefreshCw size={20} className="text-wood-900" />
            </button>
        </div>
      </div>

      {winner && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border-2 border-wood-600 p-8 rounded-xl shadow-2xl text-center animate-in fade-in zoom-in duration-300">
          <h2 className="text-3xl font-bold text-wood-800 mb-4">
            {winner === 1 ? '黑子胜!' : '白子胜!'}
          </h2>
          <button onClick={resetGame} className="px-6 py-2 bg-wood-600 text-white rounded-lg hover:bg-wood-700 font-semibold">
            再来一局
          </button>
        </div>
      )}

      {/* Board */}
      <div className="relative bg-[#e3b988] p-4 rounded-sm shadow-xl border-4 border-[#86432a]">
        <div 
            className="grid relative cursor-pointer"
            style={{ 
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                width: 'min(90vw, 500px)',
                height: 'min(90vw, 500px)'
            }}
        >
          {/* Grid Lines */}
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
            const x = i % BOARD_SIZE;
            const y = Math.floor(i / BOARD_SIZE);
            return (
              <div 
                key={i} 
                className="relative border-slate-800/20"
                onClick={() => handleClick(x, y)}
              >
                {/* Horizontal Line */}
                <div className={`absolute top-1/2 w-full h-px bg-slate-800 transform -translate-y-1/2 ${x === 0 ? 'left-1/2 w-1/2' : ''} ${x === BOARD_SIZE - 1 ? 'w-1/2' : ''}`}></div>
                {/* Vertical Line */}
                <div className={`absolute left-1/2 h-full w-px bg-slate-800 transform -translate-x-1/2 ${y === 0 ? 'top-1/2 h-1/2' : ''} ${y === BOARD_SIZE - 1 ? 'h-1/2' : ''}`}></div>
                
                {/* Star points (Hoshi) */}
                {((x === 3 || x === 11 || x === 7) && (y === 3 || y === 11 || y === 7)) && (
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-800 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                )}

                {/* Pieces */}
                {currentBoard[y][x] !== 0 && (
                  <div className={`absolute top-1/2 left-1/2 w-[80%] h-[80%] rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md ${
                    currentBoard[y][x] === 1 
                        ? 'bg-gradient-to-br from-slate-700 to-black' 
                        : 'bg-gradient-to-br from-white to-slate-200'
                  }`}></div>
                )}
                
                {/* Hover Effect */}
                {currentBoard[y][x] === 0 && !winner && (
                   <div className="absolute top-1/2 left-1/2 w-[40%] h-[40%] rounded-full transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/0 hover:bg-slate-900/20 transition-colors"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Gomoku;
