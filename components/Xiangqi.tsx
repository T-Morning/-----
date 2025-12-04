import React, { useState } from 'react';
import { Player, PieceType, XiangqiPiece, XiangqiBoardState } from '../types';
import { Undo2, RefreshCw } from 'lucide-react';

// Initial Setup
const INITIAL_BOARD: XiangqiBoardState = [
  // Red Side (Top in this representation, but usually bottom. Let's make Red bottom for standard view)
  // Actually, standard array index 0 is top. Let's put Black at 0 (top) and Red at 9 (bottom).
  [
    { type: PieceType.CHARIOT, player: Player.BLACK },
    { type: PieceType.HORSE, player: Player.BLACK },
    { type: PieceType.ELEPHANT, player: Player.BLACK },
    { type: PieceType.ADVISOR, player: Player.BLACK },
    { type: PieceType.GENERAL, player: Player.BLACK },
    { type: PieceType.ADVISOR, player: Player.BLACK },
    { type: PieceType.ELEPHANT, player: Player.BLACK },
    { type: PieceType.HORSE, player: Player.BLACK },
    { type: PieceType.CHARIOT, player: Player.BLACK },
  ],
  Array(9).fill(null),
  [
    null, { type: PieceType.CANNON, player: Player.BLACK }, null, null, null, null, null, { type: PieceType.CANNON, player: Player.BLACK }, null
  ],
  [
    { type: PieceType.SOLDIER, player: Player.BLACK }, null, { type: PieceType.SOLDIER, player: Player.BLACK }, null, { type: PieceType.SOLDIER, player: Player.BLACK }, null, { type: PieceType.SOLDIER, player: Player.BLACK }, null, { type: PieceType.SOLDIER, player: Player.BLACK }
  ],
  Array(9).fill(null), // River
  Array(9).fill(null), // River
  [
    { type: PieceType.SOLDIER, player: Player.RED }, null, { type: PieceType.SOLDIER, player: Player.RED }, null, { type: PieceType.SOLDIER, player: Player.RED }, null, { type: PieceType.SOLDIER, player: Player.RED }, null, { type: PieceType.SOLDIER, player: Player.RED }
  ],
  [
    null, { type: PieceType.CANNON, player: Player.RED }, null, null, null, null, null, { type: PieceType.CANNON, player: Player.RED }, null
  ],
  Array(9).fill(null),
  [
    { type: PieceType.CHARIOT, player: Player.RED },
    { type: PieceType.HORSE, player: Player.RED },
    { type: PieceType.ELEPHANT, player: Player.RED },
    { type: PieceType.ADVISOR, player: Player.RED },
    { type: PieceType.GENERAL, player: Player.RED },
    { type: PieceType.ADVISOR, player: Player.RED },
    { type: PieceType.ELEPHANT, player: Player.RED },
    { type: PieceType.HORSE, player: Player.RED },
    { type: PieceType.CHARIOT, player: Player.RED },
  ]
];

const getPieceLabel = (type: PieceType, player: Player): string => {
  const isRed = player === Player.RED;
  switch (type) {
    case PieceType.GENERAL: return isRed ? '帅' : '将';
    case PieceType.ADVISOR: return isRed ? '仕' : '士';
    case PieceType.ELEPHANT: return isRed ? '相' : '象';
    case PieceType.HORSE: return isRed ? '马' : '马';
    case PieceType.CHARIOT: return isRed ? '车' : '车';
    case PieceType.CANNON: return isRed ? '炮' : '炮';
    case PieceType.SOLDIER: return isRed ? '兵' : '卒';
  }
};

const Xiangqi: React.FC = () => {
  const [history, setHistory] = useState<XiangqiBoardState[]>([INITIAL_BOARD]);
  const [selected, setSelected] = useState<{x: number, y: number} | null>(null);
  const [turn, setTurn] = useState<Player.RED | Player.BLACK>(Player.RED);
  const [winner, setWinner] = useState<Player | null>(null);

  const currentBoard = history[history.length - 1];

  const isValidMove = (board: XiangqiBoardState, x1: number, y1: number, x2: number, y2: number, player: Player): boolean => {
    // Basic bounds check
    if (x2 < 0 || x2 > 8 || y2 < 0 || y2 > 9) return false;
    
    const piece = board[y1][x1];
    const target = board[y2][x2];

    if (!piece) return false;
    if (piece.player !== player) return false;
    if (target && target.player === player) return false; // Can't eat own piece

    const dx = x2 - x1;
    const dy = y2 - y1;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    switch (piece.type) {
      case PieceType.CHARIOT: // Rook
        if (dx !== 0 && dy !== 0) return false;
        // Check for obstacles
        if (dx !== 0) {
            const step = dx > 0 ? 1 : -1;
            for (let i = x1 + step; i !== x2; i += step) if (board[y1][i]) return false;
        } else {
            const step = dy > 0 ? 1 : -1;
            for (let i = y1 + step; i !== y2; i += step) if (board[i][x1]) return false;
        }
        return true;

      case PieceType.HORSE: // Knight
        if (!((absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1))) return false;
        // Check hobbling leg (Ma Tui)
        if (absDx === 2) {
            // Horizontal move, check obstacle at (x1 + sign(dx), y1)
            if (board[y1][x1 + (dx > 0 ? 1 : -1)]) return false;
        } else {
            // Vertical move, check obstacle at (x1, y1 + sign(dy))
            if (board[y1 + (dy > 0 ? 1 : -1)][x1]) return false;
        }
        return true;
      
      case PieceType.ELEPHANT:
        if (absDx !== 2 || absDy !== 2) return false;
        // Cannot cross river
        if (player === Player.RED && y2 < 5) return false;
        if (player === Player.BLACK && y2 > 4) return false;
        // Check eye
        if (board[y1 + dy/2][x1 + dx/2]) return false;
        return true;

      case PieceType.ADVISOR:
        if (absDx !== 1 || absDy !== 1) return false;
        // Must stay in palace
        if (x2 < 3 || x2 > 5) return false;
        if (player === Player.RED) { if (y2 < 7) return false; }
        else { if (y2 > 2) return false; }
        return true;

      case PieceType.GENERAL:
        if (absDx + absDy !== 1) return false;
        // Must stay in palace
        if (x2 < 3 || x2 > 5) return false;
        if (player === Player.RED) { if (y2 < 7) return false; }
        else { if (y2 > 2) return false; }
        // Flying General rule (kings facing each other without pieces) is too complex for this snippet, skipping for MVP.
        return true;

      case PieceType.CANNON:
        if (dx !== 0 && dy !== 0) return false;
        let obstacles = 0;
        if (dx !== 0) {
            const step = dx > 0 ? 1 : -1;
            for (let i = x1 + step; i !== x2; i += step) if (board[y1][i]) obstacles++;
        } else {
            const step = dy > 0 ? 1 : -1;
            for (let i = y1 + step; i !== y2; i += step) if (board[i][x1]) obstacles++;
        }
        if (target) {
             // Eating needs 1 screen (platform)
             return obstacles === 1;
        } else {
             // Moving needs 0 obstacles
             return obstacles === 0;
        }
      
      case PieceType.SOLDIER:
        if (absDx + absDy !== 1) return false;
        // Cannot move back
        if (player === Player.RED && dy > 0) return false;
        if (player === Player.BLACK && dy < 0) return false;
        // Before river, only forward
        if (player === Player.RED && y1 > 4 && dx !== 0) return false;
        if (player === Player.BLACK && y1 < 5 && dx !== 0) return false;
        return true;
    }
    return true;
  };

  const handleClick = (x: number, y: number) => {
    if (winner) return;
    const piece = currentBoard[y][x];

    // Select piece
    if (piece && piece.player === turn) {
      setSelected({ x, y });
      return;
    }

    // Move piece
    if (selected) {
      if (isValidMove(currentBoard, selected.x, selected.y, x, y, turn)) {
        const newBoard = currentBoard.map(row => row.map(p => p ? {...p} : null));
        
        // Check win condition (capture King)
        const targetPiece = newBoard[y][x];
        if (targetPiece && targetPiece.type === PieceType.GENERAL) {
            setWinner(turn);
        }

        newBoard[y][x] = newBoard[selected.y][selected.x];
        newBoard[selected.y][selected.x] = null;

        setHistory([...history, newBoard]);
        setTurn(turn === Player.RED ? Player.BLACK : Player.RED);
        setSelected(null);
      }
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      setHistory(history.slice(0, -1));
      setTurn(turn === Player.RED ? Player.BLACK : Player.RED);
      setSelected(null);
      setWinner(null);
    }
  };

  const resetGame = () => {
    setHistory([INITIAL_BOARD]);
    setTurn(Player.RED);
    setSelected(null);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[700px] w-full max-w-4xl mx-auto p-2">
       <div className="mb-4 flex justify-between items-center w-full max-w-md">
        <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-bold shadow-sm transition-all ${turn === Player.RED ? 'bg-red-700 text-white scale-105' : 'bg-gray-200 text-gray-400'}`}>
                红方 (Red)
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold shadow-sm transition-all ${turn === Player.BLACK ? 'bg-slate-900 text-white scale-105' : 'bg-gray-200 text-gray-400'}`}>
                黑方 (Black)
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleUndo} disabled={history.length <= 1} className="p-2 rounded-full bg-wood-300 hover:bg-wood-400 disabled:opacity-50 transition-colors" title="悔棋">
                <Undo2 size={20} className="text-wood-900" />
            </button>
            <button onClick={resetGame} className="p-2 rounded-full bg-wood-300 hover:bg-wood-400 transition-colors" title="重来">
                <RefreshCw size={20} className="text-wood-900" />
            </button>
        </div>
      </div>

      {winner && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border-2 border-red-600 p-8 rounded-xl shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-red-800 mb-4">
            {winner === Player.RED ? '红方获胜!' : '黑方获胜!'}
          </h2>
          <button onClick={resetGame} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
            再来一局
          </button>
        </div>
      )}

      {/* Board */}
      <div className="relative bg-[#e3b988] p-1 rounded shadow-xl border-4 border-[#86432a] select-none">
        <div 
          className="relative grid" 
          style={{ 
            width: 'min(90vw, 450px)', 
            height: 'min(100vw, 500px)', // Aspect ratio 9:10
            gridTemplateColumns: 'repeat(9, 1fr)',
            gridTemplateRows: 'repeat(10, 1fr)'
          }}
        >
          {/* SVG Grid Overlay */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 px-[5.5%] py-[5%]" viewBox="0 0 400 450">
             {/* Main Rows */}
             {Array.from({length: 10}).map((_, i) => (
                 <line key={`r${i}`} x1="0" y1={i*50} x2="400" y2={i*50} stroke="#6c3825" strokeWidth="2" />
             ))}
             {/* Main Cols */}
             {Array.from({length: 9}).map((_, i) => (
                 <line key={`c${i}`} x1={i*50} y1="0" x2={i*50} y2={i === 0 || i === 8 ? 450 : 200} stroke="#6c3825" strokeWidth="2" />
             ))}
             {Array.from({length: 9}).map((_, i) => (
                 <line key={`c2${i}`} x1={i*50} y1="250" x2={i*50} y2={450} stroke="#6c3825" strokeWidth="2" />
             ))}
             
             {/* Palaces */}
             <line x1="150" y1="0" x2="250" y2="100" stroke="#6c3825" strokeWidth="2" />
             <line x1="250" y1="0" x2="150" y2="100" stroke="#6c3825" strokeWidth="2" />
             <line x1="150" y1="350" x2="250" y2="450" stroke="#6c3825" strokeWidth="2" />
             <line x1="250" y1="350" x2="150" y2="450" stroke="#6c3825" strokeWidth="2" />
             
             {/* River Text */}
             <text x="90" y="235" fontSize="24" fontFamily="KaiTi, serif" fill="#6c3825">楚河</text>
             <text x="270" y="235" fontSize="24" fontFamily="KaiTi, serif" fill="#6c3825">汉界</text>
          </svg>

          {/* Clickable Cells and Pieces */}
          {currentBoard.map((row, y) => (
            row.map((piece, x) => (
               <div 
                 key={`${x}-${y}`} 
                 className="relative w-full h-full z-10 flex items-center justify-center cursor-pointer"
                 onClick={() => handleClick(x, y)}
               >
                 {selected?.x === x && selected?.y === y && (
                     <div className="absolute w-[90%] h-[90%] border-2 border-blue-500 rounded-full animate-pulse"></div>
                 )}
                 {piece && (
                    <div className={`
                        w-[85%] h-[85%] rounded-full shadow-lg border-2 flex items-center justify-center
                        ${piece.player === Player.RED 
                            ? 'bg-[#f5eadb] border-red-700 text-red-700' 
                            : 'bg-[#f5eadb] border-slate-900 text-slate-900'
                        }
                    `}>
                        <div className={`
                             w-[80%] h-[80%] rounded-full border border-dashed flex items-center justify-center
                             ${piece.player === Player.RED ? 'border-red-300' : 'border-slate-400'}
                        `}>
                             <span className="font-serif font-bold text-lg sm:text-2xl" style={{ fontFamily: 'KaiTi, "Kaiti SC", STKaiti, serif' }}>
                                 {getPieceLabel(piece.type, piece.player)}
                             </span>
                        </div>
                    </div>
                 )}
                 {/* Selection indicator for valid moves (simple implementation) */}
                 {selected && !piece && isValidMove(currentBoard, selected.x, selected.y, x, y, turn) && (
                    <div className="w-3 h-3 bg-blue-500/50 rounded-full"></div>
                 )}
               </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
};

export default Xiangqi;
