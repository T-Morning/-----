import React, { useState } from 'react';
import { GameType, PeerConnection } from './types';
import Gomoku from './components/Gomoku';
import Xiangqi from './components/Xiangqi';
import GoBoard from './components/GoBoard';
import OnlineManager from './components/OnlineManager';

const App: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<GameType>(GameType.GO);
  const [connection, setConnection] = useState<PeerConnection | undefined>(undefined);
  const [isHost, setIsHost] = useState<boolean>(false);

  const handleConnect = (conn: PeerConnection, host: boolean) => {
      setConnection(conn);
      setIsHost(host);
  };

  const handleDisconnect = () => {
      if (connection) {
          connection.close();
      }
      setConnection(undefined);
      setIsHost(false);
  };

  return (
    <div className="min-h-screen bg-wood-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-wood-800 text-wood-50 p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold tracking-wider flex items-center gap-2">
            <span className="text-3xl">🀄</span> Zen Board Games
          </h1>
          <nav className="flex bg-wood-900/30 p-1 rounded-lg">
            {Object.values(GameType).map((game) => (
              <button
                key={game}
                onClick={() => {
                    if (connection && !window.confirm("Switching games will disconnect your current online session. Continue?")) {
                        return;
                    }
                    if (connection) handleDisconnect();
                    setCurrentGame(game);
                }}
                className={`px-4 py-2 rounded-md transition-all font-medium text-sm sm:text-base ${
                  currentGame === game
                    ? 'bg-wood-100 text-wood-900 shadow-sm'
                    : 'text-wood-200 hover:bg-wood-700/50'
                }`}
              >
                {game}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 lg:p-8 flex flex-col items-center justify-start">
        <div className="w-full max-w-6xl animate-in fade-in duration-500">
            {/* Online Manager */}
            <OnlineManager 
                onConnect={handleConnect} 
                onDisconnect={handleDisconnect}
                isConnected={!!connection}
            />

            {currentGame === GameType.GOMOKU && <Gomoku connection={connection} isHost={isHost} />}
            {currentGame === GameType.XIANGQI && <Xiangqi connection={connection} isHost={isHost} />}
            {currentGame === GameType.GO && <GoBoard connection={connection} isHost={isHost} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-wood-200 text-wood-800 p-4 text-center text-sm border-t border-wood-300">
        <p>Local Multiplayer & AI Learning Environment</p>
        {currentGame === GameType.GO && <p className="text-xs mt-1 text-wood-700">Powered by Gemini 2.5 Flash for Go Tutoring</p>}
      </footer>
    </div>
  );
};

export default App;