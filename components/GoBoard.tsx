import React, { useState, useEffect } from 'react';
import { GoBoardState, PeerConnection, OnlineMove, OnlineAction } from '../types';
import { getGoTutorAdvice } from '../services/geminiService';
import { Undo2, RefreshCw, Sparkles, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const BOARD_SIZE = 19;

interface GoBoardProps {
    connection?: PeerConnection;
    isHost?: boolean;
}

const GoBoard: React.FC<GoBoardProps> = ({ connection, isHost }) => {
  const [history, setHistory] = useState<GoBoardState[]>([
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))
  ]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(1); // 1: Black, 2: White
  const [prisoners, setPrisoners] = useState<{black: number, white: number}>({black: 0, white: 0});
  const [lastMove, setLastMove] = useState<{x: number, y: number} | null>(null);
  
  // AI State
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);

  // Online Logic
  const isOnline = !!connection;
  const myPlayerNumber = isHost ? 1 : 2; // Host = Black (1), Guest = White (2)
  const isMyTurn = !isOnline || currentPlayer === myPlayerNumber;

  const currentBoard = history[history.length - 1];

  useEffect(() => {
    if (!connection) return;

    connection.on('data', (data: any) => {
        if (data.type === 'MOVE') {
            performMove(data.x, data.y, false);
        } else if (data.type === 'UNDO') {
            performUndo();
        } else if (data.type === 'RESET') {
            performReset();
        }
    });
  }, [connection, history, currentPlayer]);

  // Logic: Check liberties and remove dead stones
  const getGroup = (board: GoBoardState, x: number, y: number, color: number) => {
    const group: {x: number, y: number}[] = [];
    const visited = new Set<string>();
    const queue = [{x, y}];
    visited.add(`${x},${y}`);

    while (queue.length > 0) {
      const {x: cx, y: cy} = queue.pop()!;
      group.push({x: cx, y: cy});

      [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dx, dy]) => {
        const nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
          if (board[ny][nx] === color && !visited.has(`${nx},${ny}`)) {
            visited.add(`${nx},${ny}`);
            queue.push({x: nx, y: ny});
          }
        }
      });
    }
    return group;
  };

  const countLiberties = (board: GoBoardState, group: {x: number, y: number}[]) => {
    const liberties = new Set<string>();
    group.forEach(({x, y}) => {
      [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
          if (board[ny][nx] === 0) {
            liberties.add(`${nx},${ny}`);
          }
        }
      });
    });
    return liberties.size;
  };

  const performMove = (x: number, y: number, isLocal: boolean) => {
    // Access latest from closure due to re-render or useEffect dep
    const board = history[history.length - 1];
    if (board[y][x] !== 0) return;

    // Tentative move
    const nextBoard = board.map(row => [...row]);
    nextBoard[y][x] = currentPlayer;

    const opponent = currentPlayer === 1 ? 2 : 1;
    let capturedStones = 0;
    const stonesToRemove: {x: number, y: number}[] = [];

    // Check captured opponent groups
    [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
            if (nextBoard[ny][nx] === opponent) {
                const group = getGroup(nextBoard, nx, ny, opponent);
                if (countLiberties(nextBoard, group) === 0) {
                    group.forEach(stone => stonesToRemove.push(stone));
                }
            }
        }
    });

    // Remove captured stones
    stonesToRemove.forEach(s => {
        nextBoard[s.y][s.x] = 0;
        capturedStones++;
    });

    // Check suicide (if no captures made)
    if (stonesToRemove.length === 0) {
        const myGroup = getGroup(nextBoard, x, y, currentPlayer);
        if (countLiberties(nextBoard, myGroup) === 0) {
             if (isLocal) alert("Suicide move is not allowed.");
            return;
        }
    }

    // Ko Rule check
    if (history.length > 1) {
        const prevBoard = history[history.length - 2];
        let same = true;
        for(let i=0; i<BOARD_SIZE; i++) {
            for(let j=0; j<BOARD_SIZE; j++) {
                if (prevBoard[i][j] !== nextBoard[i][j]) {
                    same = false;
                    break;
                }
            }
        }
        if (same) {
            if (isLocal) alert("Ko rule: Cannot repeat previous board state immediately.");
            return;
        }
    }

    // Update State
    setHistory(prev => [...prev, nextBoard]);
    setCurrentPlayer(opponent);
    setLastMove({x, y});
    setPrisoners(prev => ({
        ...prev,
        [currentPlayer === 1 ? 'black' : 'white']: prev[currentPlayer === 1 ? 'black' : 'white'] + capturedStones
    }));
    
    setAiAdvice('');
    setShowAdvice(false);

    if (isLocal && connection) {
        connection.send({ type: 'MOVE', x, y } as OnlineMove);
    }
  };

  const handlePlaceStone = (x: number, y: number) => {
    if (!isMyTurn) return;
    performMove(x, y, true);
  };

  const askAiTutor = async () => {
    setIsThinking(true);
    setShowAdvice(true);
    setAiAdvice('');
    const advice = await getGoTutorAdvice(currentBoard, lastMove, currentPlayer);
    setAiAdvice(advice || "No advice available.");
    setIsThinking(false);
  };

  const performUndo = () => {
      setHistory(prev => {
          if (prev.length <= 1) return prev;
          return prev.slice(0, -1);
      });
      setCurrentPlayer(prev => prev === 1 ? 2 : 1);
      setLastMove(null);
      setAiAdvice('');
      setShowAdvice(false);
  };

  const handleUndo = () => {
      if (history.length > 1) {
          performUndo();
          if (connection) connection.send({ type: 'UNDO' } as OnlineAction);
      }
  };

    const performReset = () => {
        setHistory([Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))]);
        setCurrentPlayer(1);
        setPrisoners({black: 0, white: 0});
        setLastMove(null);
        setAiAdvice('');
        setShowAdvice(false);
    };

    const resetGame = () => {
        performReset();
        if (connection) connection.send({ type: 'RESET' } as OnlineAction);
    };

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-8 p-4 w-full max-w-6xl mx-auto">
      
      {/* Game Area */}
      <div className="flex flex-col items-center">
          <div className="mb-4 flex flex-col md:flex-row justify-between items-center w-full max-w-lg gap-4">
             <div className="flex gap-4 text-sm font-semibold">
                <div className={`flex items-center gap-2 flex-col sm:flex-row ${currentPlayer===1 ? 'text-slate-900' : 'text-slate-400'}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-slate-900 border border-white"></div>
                        <span>黑 (Black)</span>
                    </div>
                    <span className="text-xs">{prisoners.black} captured</span>
                    {isOnline && isHost && <span className="text-[10px] uppercase tracking-wider bg-black/10 px-1 rounded">You</span>}
                    {isOnline && !isHost && <span className="text-[10px] uppercase tracking-wider">Opponent</span>}
                </div>
                <div className={`flex items-center gap-2 flex-col sm:flex-row ${currentPlayer===2 ? 'text-slate-900' : 'text-slate-400'}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-white border border-slate-300"></div>
                        <span>白 (White)</span>
                    </div>
                    <span className="text-xs">{prisoners.white} captured</span>
                    {isOnline && !isHost && <span className="text-[10px] uppercase tracking-wider bg-black/10 px-1 rounded">You</span>}
                    {isOnline && isHost && <span className="text-[10px] uppercase tracking-wider">Opponent</span>}
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={handleUndo} disabled={history.length <= 1 || (isOnline && !isMyTurn)} className="p-2 bg-wood-300 rounded-full hover:bg-wood-400 disabled:opacity-50">
                    <Undo2 size={18} />
                </button>
                <button onClick={resetGame} className="p-2 bg-wood-300 rounded-full hover:bg-wood-400">
                    <RefreshCw size={18} />
                </button>
             </div>
          </div>

          {isOnline && (
            <div className="mb-2 text-wood-700 font-medium flex items-center gap-2 animate-pulse">
                {isMyTurn ? "Your Turn" : "Waiting for opponent..."}
            </div>
          )}

          <div className={`relative bg-[#dc9f5e] p-2 rounded shadow-xl border-2 border-[#86432a] overflow-hidden ${isOnline && !isMyTurn ? 'opacity-90' : ''}`}>
             {/* Board Container */}
             <div 
                className="grid relative"
                style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                    width: 'min(90vw, 550px)',
                    height: 'min(90vw, 550px)'
                }}
             >
                {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
                    const x = i % BOARD_SIZE;
                    const y = Math.floor(i / BOARD_SIZE);
                    // Hoshi Points
                    const isStar = [3, 9, 15].includes(x) && [3, 9, 15].includes(y);

                    return (
                        <div 
                            key={i} 
                            className="relative cursor-pointer"
                            onClick={() => handlePlaceStone(x, y)}
                        >
                            {/* Lines */}
                            <div className={`absolute top-1/2 left-0 w-full h-px bg-black transform -translate-y-1/2 ${x === 0 ? 'left-1/2 w-1/2' : ''} ${x === BOARD_SIZE - 1 ? 'w-1/2' : ''}`}></div>
                            <div className={`absolute top-0 left-1/2 h-full w-px bg-black transform -translate-x-1/2 ${y === 0 ? 'top-1/2 h-1/2' : ''} ${y === BOARD_SIZE - 1 ? 'h-1/2' : ''}`}></div>
                            
                            {isStar && <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>}
                            
                            {/* Stone */}
                            {currentBoard[y][x] !== 0 && (
                                <div className={`absolute top-1/2 left-1/2 w-[90%] h-[90%] rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-sm z-10 ${
                                    currentBoard[y][x] === 1 
                                    ? 'bg-slate-900 radial-gradient-black' 
                                    : 'bg-white radial-gradient-white'
                                }`}></div>
                            )}

                            {/* Last Move Marker */}
                            {lastMove?.x === x && lastMove?.y === y && (
                                <div className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20 ${
                                    currentBoard[y][x] === 1 ? 'bg-white' : 'bg-black'
                                }`}></div>
                            )}

                            {/* Hover Ghost */}
                            {currentBoard[y][x] === 0 && isMyTurn && (
                                <div className={`absolute top-1/2 left-1/2 w-[80%] h-[80%] rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-30 ${
                                    currentPlayer === 1 ? 'bg-black' : 'bg-white'
                                }`}></div>
                            )}
                        </div>
                    );
                })}
             </div>
          </div>
          
          <div className="mt-6 flex justify-center w-full">
            <button 
                onClick={askAiTutor} 
                disabled={isThinking}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all disabled:opacity-70 font-semibold"
            >
                {isThinking ? <BrainCircuit className="animate-pulse" /> : <Sparkles />}
                {isThinking ? 'AI 思考中...' : 'Ask AI Tutor (Teaching Mode)'}
            </button>
          </div>
      </div>

      {/* AI Panel */}
      {(showAdvice || isThinking) && (
          <div className="w-full max-w-md bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-indigo-100 min-h-[200px] flex flex-col animate-in slide-in-from-bottom duration-500">
             <h3 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <BrainCircuit size={24} /> 
                AI 围棋导师
             </h3>
             <div className="prose prose-sm prose-indigo flex-grow overflow-y-auto max-h-[500px]">
                {isThinking ? (
                    <div className="space-y-2">
                        <div className="h-4 bg-indigo-100 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-indigo-100 rounded w-1/2 animate-pulse"></div>
                        <div className="h-4 bg-indigo-100 rounded w-5/6 animate-pulse"></div>
                    </div>
                ) : (
                    <ReactMarkdown>{aiAdvice}</ReactMarkdown>
                )}
             </div>
             <button onClick={() => setShowAdvice(false)} className="mt-4 text-xs text-slate-500 hover:text-slate-800 underline self-end">
                Close Tutor
             </button>
          </div>
      )}
    </div>
  );
};

export default GoBoard;