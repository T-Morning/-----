import React, { useState, useEffect } from 'react';
import { Peer } from 'peerjs';
import { PeerConnection } from '../types';
import { Copy, Link, Check, Loader2, Users } from 'lucide-react';

interface OnlineManagerProps {
  onConnect: (connection: PeerConnection, isHost: boolean) => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

const OnlineManager: React.FC<OnlineManagerProps> = ({ onConnect, onDisconnect, isConnected }) => {
  const [peer, setPeer] = useState<any>(null);
  const [myId, setMyId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'initializing' | 'connecting' | 'connected'>('initializing');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Initialize Peer
    const newPeer = new Peer();
    
    newPeer.on('open', (id: string) => {
      setMyId(id);
      setStatus('idle');
    });

    newPeer.on('connection', (conn: any) => {
      conn.on('open', () => {
        setStatus('connected');
        onConnect(conn, true); // I am Host (recieved connection)
      });
      conn.on('close', () => {
          handleRemoteDisconnect();
      });
      conn.on('error', () => {
          handleRemoteDisconnect();
      });
    });

    newPeer.on('error', (err: any) => {
      console.error(err);
      setStatus('idle');
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  const handleRemoteDisconnect = () => {
      setStatus('idle');
      onDisconnect();
      alert('对方已断开连接 (Opponent disconnected)');
  };

  const connectToPeer = () => {
    if (!peer || !targetId) return;
    setStatus('connecting');
    
    const conn = peer.connect(targetId);
    
    conn.on('open', () => {
      setStatus('connected');
      onConnect(conn, false); // I am Guest (initiated connection)
    });
    
    conn.on('close', () => {
        handleRemoteDisconnect();
    });

    conn.on('error', (err: any) => {
        console.error(err);
        setStatus('idle');
        alert('Connection failed');
    });
  };

  const copyId = () => {
    navigator.clipboard.writeText(myId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (isConnected) {
      return (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-inner mb-4 animate-in fade-in">
              <Users size={18} />
              <span className="font-semibold">在线对战中 (Online Mode)</span>
              <button onClick={() => { onDisconnect(); setStatus('idle'); }} className="ml-auto text-xs underline hover:text-green-900">断开 (Disconnect)</button>
          </div>
      )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 border-wood-300 w-full max-w-md mx-auto mb-6">
      <h2 className="text-xl font-bold text-wood-900 mb-4 flex items-center gap-2">
        <Users size={24} /> 在线联机 (Online Play)
      </h2>
      
      {status === 'initializing' ? (
         <div className="flex items-center gap-2 text-wood-600">
             <Loader2 className="animate-spin" /> 正在连接服务器...
         </div>
      ) : (
        <div className="space-y-6">
            {/* Host Section */}
            <div className="bg-wood-50 p-4 rounded-lg border border-wood-200">
                <label className="block text-sm font-semibold text-wood-800 mb-2">
                    邀请朋友 (您的ID)
                </label>
                <div className="flex gap-2">
                    <code className="flex-1 bg-white border border-wood-300 p-2 rounded text-center font-mono text-sm break-all">
                        {myId || 'Generating...'}
                    </code>
                    <button 
                        onClick={copyId}
                        className="p-2 bg-wood-600 text-white rounded hover:bg-wood-700 transition-colors"
                        title="复制ID"
                    >
                        {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
                <p className="text-xs text-wood-500 mt-2">将此ID发送给朋友，让他们填入下方。</p>
            </div>

            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-wood-300"></div>
                <span className="flex-shrink-0 mx-4 text-wood-400 text-sm">或者 (OR)</span>
                <div className="flex-grow border-t border-wood-300"></div>
            </div>

            {/* Join Section */}
            <div>
                 <label className="block text-sm font-semibold text-wood-800 mb-2">
                    加入房间 (输入朋友的ID)
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        placeholder="粘贴对方的ID..."
                        className="flex-1 border border-wood-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-wood-500"
                    />
                    <button 
                        onClick={connectToPeer}
                        disabled={!targetId || status === 'connecting'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
                    >
                        {status === 'connecting' ? <Loader2 className="animate-spin" size={18} /> : <Link size={18} />}
                        加入
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OnlineManager;