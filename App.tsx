
/**
 * Project: Neon Sky Ace: Overdrive
 * A high-octane 3D arcade-style flight shooter.
 */

import React, { useState, useCallback } from 'react';
import { NeonSkyAce } from './components/NeonSkyAce';
import { GameStatus } from './types';

const App: React.FC = () => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setStatus(GameStatus.GAMEOVER);
  }, []);

  const startGame = () => {
    setScore(0);
    setCombo(1);
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="relative w-full h-screen bg-[#050010] select-none overflow-hidden">
      {/* Three.js Layer */}
      <NeonSkyAce 
        status={status} 
        onGameOver={handleGameOver} 
        onScoreUpdate={setScore} 
        onComboUpdate={setCombo}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        {/* HUD */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg">
              <h2 className="text-cyan-400 font-futuristic text-[10px] tracking-widest uppercase mb-1">Score</h2>
              <p className="text-white font-futuristic text-3xl">{score.toLocaleString()}</p>
            </div>
            {combo > 1 && (
              <div className="bg-fuchsia-600/20 backdrop-blur-md border border-fuchsia-500/50 p-2 rounded-lg neon-flicker">
                <p className="text-fuchsia-400 font-futuristic text-xl italic tracking-tighter">
                  COMBO X{combo}
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
             <h1 className="text-magenta-500 font-futuristic text-2xl italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-500 glitch-text">
               NEON SKY ACE: OVERDRIVE
             </h1>
          </div>
        </div>

        {/* Start / Game Over Screens */}
        {status !== GameStatus.PLAYING && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm">
            <div className="text-center p-12 bg-black/80 border-2 border-fuchsia-500 shadow-[0_0_80px_rgba(255,0,255,0.4)] rounded-2xl max-w-md w-full">
              <h2 className="text-5xl font-futuristic text-white mb-6 tracking-tighter">
                {status === GameStatus.START ? 'SYSTEM READY' : 'PILOT DOWN'}
              </h2>
              
              {status === GameStatus.GAMEOVER && (
                <div className="mb-8">
                  <p className="text-fuchsia-400 font-futuristic text-sm tracking-widest mb-1">TOTAL POINTS</p>
                  <p className="text-white font-futuristic text-5xl mb-4">{score.toLocaleString()}</p>
                </div>
              )}

              <button 
                onClick={startGame}
                className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-600 text-white font-futuristic py-4 px-8 rounded-full text-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.6)]"
              >
                {status === GameStatus.START ? 'IGNITE ENGINES' : 'RE-INITIALIZE'}
              </button>
              
              <div className="mt-8 grid grid-cols-2 gap-4 text-[10px] text-cyan-300/40 font-futuristic uppercase tracking-[0.2em]">
                 <div>• Mouse to Steer</div>
                 <div>• Auto-fire Enabled</div>
                 <div>• Avoid Collisions</div>
                 <div>• Chain Kills for Combo</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Branding */}
        <div className="w-full flex justify-center pb-2">
          <p className="text-white/40 font-futuristic text-[9px] tracking-[0.5em] uppercase glitch-text">
            © Happy Virus
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
