import { useEffect } from 'react';
import { useStore, COURSES } from '../store';
import confetti from 'canvas-confetti';

export function UI() {
  const { 
    gameState, 
    players, 
    currentCourse,
    currentPlayerIndex, 
    scanningOption, 
    setScanningOption,
    powerLevel,
    strokesThisHole,
    updatePlayer,
    startGame,
    exportCSV
  } = useStore();

  const currentPlayer = players[currentPlayerIndex];
  const course = COURSES[currentCourse];

  // Auto-scanner for player setup
  useEffect(() => {
    if (gameState !== 'setup_players') return;
    
    const interval = setInterval(() => {
      setScanningOption((scanningOption % 5) + 1);
    }, 1500); // 1.5 seconds per option for accessibility
    
    return () => clearInterval(interval);
  }, [gameState, scanningOption, setScanningOption]);

  // Confetti effect
  useEffect(() => {
    if (gameState === 'hole_scored' || gameState === 'game_over') {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF0055', '#00AAFF', '#00FF00', '#FFDD00']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FF0055', '#00AAFF', '#00FF00', '#FFDD00']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [gameState]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      {/* Top Bar: Player Info */}
      {players.length > 0 && gameState !== 'title' && gameState !== 'setup_players' && gameState !== 'setup_names' && (
        <div className="flex justify-between items-start">
          <div 
            className="px-6 py-3 rounded-3xl border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1"
            style={{ borderColor: currentPlayer?.color }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-8 h-8 rounded-full border-2 border-black"
                style={{ backgroundColor: currentPlayer?.color }}
              />
              <span className="text-3xl font-black uppercase tracking-wider text-black">
                {currentPlayer?.name}'s Turn
              </span>
            </div>
            <span className="text-xl font-bold text-gray-600 uppercase tracking-widest">{currentPlayer?.team}</span>
          </div>
          
          <div className="flex flex-col gap-4 items-end">
            <div className="px-6 py-3 rounded-3xl border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl font-black uppercase tracking-wider text-black">
                {course.name} - Par {course.par}
              </span>
            </div>
            <div className="px-6 py-3 rounded-3xl border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl font-black uppercase tracking-wider text-black">
                Stroke: {strokesThisHole + 1}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center pointer-events-auto">
        {gameState === 'title' && (
          <div className="text-center animate-bounce">
            <h1 className="text-9xl font-black text-white drop-shadow-[0_10px_0_rgba(0,0,0,1)] uppercase tracking-tighter mb-8" style={{ WebkitTextStroke: '4px black' }}>
              Super Golf!
            </h1>
            <div className="inline-block px-8 py-4 bg-[#00FF00] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-4xl font-black uppercase tracking-widest text-black">
                Press Switch to Start
              </span>
            </div>
          </div>
        )}

        {gameState === 'setup_players' && (
          <div className="text-center bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-6xl font-black uppercase tracking-wider text-black mb-12">
              How Many Players?
            </h2>
            <div className="flex gap-6 justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <div 
                  key={num}
                  className={`w-32 h-32 rounded-3xl border-8 flex items-center justify-center transition-all duration-300 ${
                    scanningOption === num 
                      ? 'border-[#FF0055] bg-[#FF0055] text-white scale-110 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' 
                      : 'border-black bg-gray-200 text-black scale-100'
                  }`}
                >
                  <span className="text-6xl font-black">{num}</span>
                </div>
              ))}
            </div>
            <div className="mt-12 text-3xl font-bold uppercase text-gray-500 animate-pulse">
              Press switch to select
            </div>
          </div>
        )}

        {gameState === 'setup_names' && (
          <div className="bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-5xl font-black uppercase tracking-wider text-black mb-8 text-center">
              Teacher Setup: Names & Teams
            </h2>
            <div className="flex flex-col gap-6 mb-8">
              {players.map((p, idx) => (
                <div key={p.id} className="flex gap-4 items-center bg-gray-100 p-4 rounded-2xl border-4 border-black">
                  <div className="w-12 h-12 rounded-full border-4 border-black shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-xl font-bold uppercase">Player Name</label>
                    <input 
                      type="text" 
                      value={p.name}
                      onChange={(e) => updatePlayer(idx, { name: e.target.value })}
                      className="border-4 border-black rounded-xl p-3 text-2xl font-bold"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-xl font-bold uppercase">Team Name</label>
                    <input 
                      type="text" 
                      value={p.team}
                      onChange={(e) => updatePlayer(idx, { team: e.target.value })}
                      className="border-4 border-black rounded-xl p-3 text-2xl font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button 
                onClick={startGame}
                className="px-12 py-6 bg-[#00FF00] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-4xl font-black uppercase tracking-widest hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {gameState === 'course_intro' && (
          <div className="text-center animate-bounce">
            <div className="inline-block px-12 py-6 bg-white border-8 border-black rounded-[3rem] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-8xl font-black uppercase tracking-widest text-black mb-4">
                Course {currentCourse + 1}
              </h2>
              <h3 className="text-6xl font-black uppercase text-[#FF0055]">
                {course.name}
              </h3>
              <p className="text-4xl font-bold uppercase text-gray-500 mt-4">Par {course.par}</p>
            </div>
            <div className="mt-8 text-4xl font-black uppercase text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '1px black' }}>
              Press switch to begin
            </div>
          </div>
        )}

        {gameState === 'player_turn_start' && (
          <div className="text-center animate-bounce">
            <div 
              className="inline-block px-12 py-6 border-8 border-black rounded-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
              style={{ backgroundColor: currentPlayer?.color }}
            >
              <span className="text-6xl font-black uppercase tracking-widest text-white" style={{ WebkitTextStroke: '2px black' }}>
                Ready {currentPlayer?.name}?
              </span>
            </div>
            <div className="mt-8 text-4xl font-black uppercase text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '1px black' }}>
              Press switch to aim
            </div>
          </div>
        )}

        {gameState === 'hole_scored' && (
          <div className="text-center animate-bounce">
            <h2 className="text-9xl font-black text-[#FFDD00] drop-shadow-[0_10px_0_rgba(0,0,0,1)] uppercase tracking-tighter mb-8" style={{ WebkitTextStroke: '4px black' }}>
              HOLE IN ONE!
            </h2>
            <div className="inline-block px-8 py-4 bg-white border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-4xl font-black uppercase tracking-widest text-black">
                Press switch to continue
              </span>
            </div>
          </div>
        )}

        {gameState === 'stroke_limit_reached' && (
          <div className="text-center">
            <h2 className="text-8xl font-black text-white drop-shadow-[0_10px_0_rgba(0,0,0,1)] uppercase tracking-tighter mb-8" style={{ WebkitTextStroke: '4px black' }}>
              Good Try!
            </h2>
            <div className="inline-block px-8 py-4 bg-white border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <span className="text-4xl font-black uppercase tracking-widest text-black">
                Press switch to continue
              </span>
            </div>
          </div>
        )}

        {gameState === 'game_over' && (
          <div className="text-center bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-8xl font-black uppercase tracking-wider text-black mb-12">
              Game Over!
            </h2>
            <div className="flex flex-col gap-4 mb-12">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-12 text-4xl font-black uppercase border-b-4 border-gray-200 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-4 border-black" style={{ backgroundColor: p.color }} />
                    <div className="flex flex-col items-start">
                      <span>{p.name}</span>
                      <span className="text-xl text-gray-500">{p.team}</span>
                    </div>
                  </div>
                  <span>{p.score} Strokes</span>
                </div>
              ))}
            </div>
            <div className="flex gap-6 justify-center">
              <button 
                onClick={exportCSV}
                className="px-8 py-4 bg-[#00AAFF] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-3xl font-black uppercase tracking-widest hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-white"
              >
                Export CSV
              </button>
              <div className="inline-block px-8 py-4 bg-[#00FF00] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <span className="text-3xl font-black uppercase tracking-widest text-black">
                  Press switch to play again
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Instructions & Power Meter */}
      <div className="w-full flex flex-col items-center gap-4 pointer-events-none">
        {gameState === 'aiming' && (
          <div className="px-8 py-4 bg-white border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-pulse">
            <span className="text-4xl font-black uppercase tracking-widest text-black">
              Press switch to lock aim
            </span>
          </div>
        )}

        {gameState === 'power' && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-4">
            <div className="px-8 py-4 bg-white border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-pulse">
              <span className="text-4xl font-black uppercase tracking-widest text-black">
                Press switch to shoot!
              </span>
            </div>
            {/* Power Meter */}
            <div className="w-full h-16 bg-gray-200 border-8 border-black rounded-full overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {/* Gradient background for power */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00FF00] via-[#FFDD00] to-[#FF0055]" />
              {/* Mask to show current power */}
              <div 
                className="absolute top-0 right-0 bottom-0 bg-black transition-all duration-75"
                style={{ width: `${100 - powerLevel}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Gameplay Controls (End Game / Reset Round) */}
      {['player_turn_start', 'aiming', 'power', 'rolling'].includes(gameState) && (
        <div className="absolute bottom-8 left-8 flex gap-4 pointer-events-auto">
          <button 
            onClick={() => useStore.getState().resetRound()}
            className="px-6 py-3 bg-[#FFDD00] border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xl font-black uppercase tracking-wider hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
          >
            Reset Round
          </button>
          <button 
            onClick={() => useStore.getState().endGame()}
            className="px-6 py-3 bg-[#FF0055] border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xl font-black uppercase tracking-wider hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-white"
          >
            End Game
          </button>
        </div>
      )}
    </div>
  );
}
