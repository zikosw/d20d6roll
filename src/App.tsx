import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DiceBox from '@3d-dice/dice-box';

type PlayerState = {
  id: number;
};

const THEMES = [
  { text: 'text-[#141414]', themeColor: '#ffffff' }, // Base fallback
  { text: 'text-white', themeColor: '#0A2463' }, // Blue
  { text: 'text-white', themeColor: '#FF5A1F' }, // Orange
  { text: 'text-white', themeColor: '#4C1E4F' }, // Purple
  { text: 'text-white', themeColor: '#141414' }, // Black
  { text: 'text-white', themeColor: '#059669' }, // Emerald
  { text: 'text-[#141414]', themeColor: '#FACC15' }, // Yellow
];

export default function App() {
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [globalRollTrigger, setGlobalRollTrigger] = useState(0);
  const [playerRollTrigger, setPlayerRollTrigger] = useState<number | null>(null);

  const [diceBox, setDiceBox] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [results, setResults] = useState<{ [playerId: number]: { d20?: number; d6?: number } }>({});
  const boxInitialized = useRef(false);

  useEffect(() => {
    if (boxInitialized.current) return;
    boxInitialized.current = true;

    const selector = '#global-dice-box';
    const container = document.querySelector(selector);
    if (container) {
      container.innerHTML = '';
    }
    
    // Initialize single dice box spanning the whole screen
    const box = new DiceBox(selector, {
      assetPath: '/assets/dice-box/',
      themeColor: '#ffffff', // default color, can be overridden per notation
      theme: 'default'
    });

    box.init().then(() => {
      setDiceBox(box);
      setIsInitializing(false);
    });

    return () => {};
  }, []);

  useEffect(() => {
    if (!diceBox) return;
    diceBox.onRollComplete = (rollResults: any) => {
      const newResults: { [playerId: number]: { d20?: number; d6?: number } } = {};
      const allDice: any[] = [];
      
      if (Array.isArray(rollResults)) {
        rollResults.forEach(r => {
           if (r.rolls && Array.isArray(r.rolls)) {
             allDice.push(...r.rolls);
           } else {
             allDice.push(r);
           }
        });
      }

      allDice.forEach(r => {
        const pIndex = THEMES.findIndex(t => t.themeColor.toLowerCase() === r.themeColor?.toLowerCase());
        const truePlayerId = pIndex !== -1 ? pIndex : 1; 

        if (!newResults[truePlayerId]) {
          newResults[truePlayerId] = {};
        }
        
        if (r.sides === 20) newResults[truePlayerId].d20 = r.value;
        if (r.sides === 6) newResults[truePlayerId].d6 = r.value;
      });
      // If we rolled for a single player, preserve other results
      setResults(prev => playerRollTrigger !== null ? { ...prev, ...newResults } : newResults);
      setPlayerRollTrigger(null);
    };
  }, [diceBox, playerRollTrigger]);

  useEffect(() => {
    if (globalRollTrigger > 0 && diceBox) {
      const notations = players.map((p, index) => {
        return {
          qty: 1, 
          sides: 20,
          theme: 'default',
          themeColor: THEMES[index + 1] ? THEMES[index + 1].themeColor : THEMES[0].themeColor
        };
      });

      const notationsD6 = players.map((p, index) => {
        return {
          qty: 1, 
          sides: 6,
          theme: 'default',
          themeColor: THEMES[index + 1] ? THEMES[index + 1].themeColor : THEMES[0].themeColor
        };
      });

      diceBox.roll([...notations, ...notationsD6]);
    }
  }, [globalRollTrigger, diceBox, players]);

  useEffect(() => {
    if (playerRollTrigger !== null && diceBox) {
      const index = playerRollTrigger - 1;
      const themeColor = THEMES[playerRollTrigger] ? THEMES[playerRollTrigger].themeColor : THEMES[0].themeColor;
      
      const notations = {
        qty: 1, 
        sides: 20,
        theme: 'default',
        themeColor
      };

      const notationsD6 = {
        qty: 1, 
        sides: 6,
        theme: 'default',
        themeColor
      };

      diceBox.roll([notations, notationsD6]);
    }
  }, [playerRollTrigger, diceBox]);

  const startGame = (count: number) => {
    const initialPlayers: PlayerState[] = Array.from({ length: count }).map((_, i) => ({
      id: i + 1,
    }));
    setPlayers(initialPlayers);
    setPlayerCount(count);
    if (diceBox) diceBox.clear();
    setResults({});
  };

  const rollAll = () => {
    setGlobalRollTrigger(prev => prev + 1);
  };

  const rollPlayer = (playerId: number) => {
    setPlayerRollTrigger(playerId);
  };

  useEffect(() => {
    if (diceBox && playerCount) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }, [playerCount, diceBox]);

  return (
    <>
      <div className="fixed inset-0 bg-[#E5E5E5] -z-10" />

      <div 
        id="global-dice-box"
        className={`fixed top-0 bottom-0 right-0 z-0 ${playerCount ? "left-72 sm:left-80" : "left-0"}`}
        style={{ opacity: playerCount ? 1 : 0, pointerEvents: playerCount ? 'auto' : 'none' }}
      />
      
      {!playerCount ? (
        <div className="relative z-20">
          <SetupView onStart={startGame} />
        </div>
      ) : (
        <div className="relative z-10">
          <DashboardView 
            players={players} 
            results={results}
            onRollAll={rollAll}
            onRollPlayer={rollPlayer}
            isInitializing={isInitializing}
            onReset={() => {
              setPlayerCount(null);
              if (diceBox) diceBox.clear();
            }}
          />
        </div>
      )}
    </>
  );
}

function SetupView({ onStart }: { onStart: (count: number) => void }) {
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center text-white p-6 font-sans select-none">
      <div className="max-w-md w-full bg-[#141414] border-[6px] border-[#141414] shadow-[0_0_0_4px_white] p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Command Center</h1>
          <p className="text-[12px] font-bold tracking-widest uppercase opacity-60">Select party size</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[2, 3, 4, 5, 6].map(num => (
            <button
              key={num}
              onClick={() => onStart(num)}
              className={`py-4 text-xl font-black uppercase rounded-none border-2 border-white bg-[#141414] hover:bg-white hover:text-[#141414] transition-colors ${num === 6 ? 'col-span-2' : ''}`}
            >
              {num} Players
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardView({ 
  players, 
  results,
  isInitializing,
  onRollAll,
  onRollPlayer,
  onReset
}: { 
  players: PlayerState[]; 
  results: { [playerId: number]: { d20?: number; d6?: number } };
  isInitializing: boolean;
  onRollAll: () => void;
  onRollPlayer: (playerId: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="fixed inset-0 flex font-sans select-none pointer-events-none">

      {/* Sidebar */}
      <div className="w-72 sm:w-80 h-full bg-[#141414] text-white border-r-[6px] border-[#141414] shadow-[4px_0_0_0_white] p-4 sm:p-5 flex flex-col pointer-events-auto z-30">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <button 
            onClick={onReset}
            className="text-white hover:bg-white hover:text-[#141414] transition-colors text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1.5 sm:px-3 sm:py-2 bg-transparent border-2 border-white"
          >
            ← Back
          </button>
          <div className="text-white/40 font-black text-[10px] uppercase tracking-widest text-right">
            v2.0
          </div>
        </div>

        <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 shrink-0">
          Party Members
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-hide shrink">
          {players.map((p, index) => {
             const theme = THEMES[index + 1] || THEMES[0];
             const res = results[index + 1] || {};
             
             return (
               <div key={p.id} className="flex flex-row items-stretch bg-white/5 border-2 border-white/10 hover:border-white/30 transition-colors group/player">
                 <div 
                    className="w-3 flex-shrink-0"
                    style={{ backgroundColor: theme.themeColor }}
                 />
                 <div className="flex flex-col flex-1 p-2 sm:p-2.5 overflow-hidden">
                   <div className="flex justify-between items-center mb-0.5">
                     <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/50 truncate">
                       Player {p.id}
                     </div>
                     <button
                       onClick={() => onRollPlayer(p.id)}
                       className="bg-white/10 hover:bg-white text-white hover:text-[#141414] transition-colors text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1"
                     >
                       Roll
                     </button>
                   </div>
                   <div className="text-lg sm:text-xl leading-none font-black text-white mix-blend-screen truncate">
                     {res.d20 ? `${res.d20} & ${res.d6}` : '—'}
                   </div>
                 </div>
               </div>
             )
          })}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-white/20 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRollAll}
            className="w-full bg-white text-[#141414] px-4 py-4 sm:py-5 border-[4px] border-transparent hover:border-[#141414] hover:shadow-[0_0_0_4px_white] transition-all flex flex-col items-center justify-center focus:outline-none group"
          >
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-60">Command</span>
            <span className="text-lg sm:text-xl font-black leading-none whitespace-nowrap">ROLL ALL</span>
          </motion.button>
        </div>
      </div>

      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center font-black uppercase tracking-widest text-xl opacity-30 z-20 pointer-events-none text-[#141414]">
          Loading Physics...
        </div>
      )}
    </div>
  );
}
