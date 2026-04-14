import { useEffect } from 'react';
import { useStore, COURSES } from '../store';
import confetti from 'canvas-confetti';

export function UI() {
  const { 
    gameState, 
    setGameState,
    players, 
    currentCourse,
    currentPlayerIndex, 
    scanningOption, 
    setScanningOption,
    gameSpeed,
    setGameSpeed,
    powerLevel,
    strokesThisHole,
    updatePlayer,
    startGame,
    exportCSV,
    tournament,
    generateTournament,
    updateTournamentTeam,
    startTournamentMatchup,
    saveTournamentMatchup,
    discardTournamentMatchup,
    importTournament,
    exportTournament,
    playNonRanked,
    quitTournament
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
          <div className="text-center animate-bounce pointer-events-auto">
            <h1 className="text-9xl font-black text-white drop-shadow-[0_10px_0_rgba(0,0,0,1)] uppercase tracking-tighter mb-8" style={{ WebkitTextStroke: '4px black' }}>
              Super Golf!
            </h1>
            <div className="flex flex-col gap-6 items-center">
              <button 
                onClick={() => setGameState('setup_players')}
                className="inline-block px-12 py-6 bg-[#00FF00] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <span className="text-4xl font-black uppercase tracking-widest text-black">
                  Start Game
                </span>
              </button>
              <button 
                onClick={() => setGameState('bracket_setup')}
                className="inline-block px-8 py-4 bg-[#00AAFF] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <span className="text-2xl font-black uppercase tracking-widest text-white">
                  Tournament Bracket
                </span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'setup_players' && (
          <div className="text-center bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] pointer-events-auto">
            <h2 className="text-6xl font-black uppercase tracking-wider text-black mb-12">
              How Many Players?
            </h2>
            <div className="flex gap-6 justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <button 
                  key={num}
                  onClick={() => useStore.getState().setupGame(num)}
                  className={`w-32 h-32 rounded-3xl border-8 flex items-center justify-center transition-all duration-300 cursor-pointer ${
                    scanningOption === num 
                      ? 'border-[#FF0055] bg-[#FF0055] text-white scale-110 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' 
                      : 'border-black bg-gray-200 text-black scale-100 hover:bg-gray-300'
                  }`}
                >
                  <span className="text-6xl font-black">{num}</span>
                </button>
              ))}
            </div>
            <div className="mt-12 text-3xl font-bold uppercase text-gray-500 animate-pulse">
              Press switch or click to select
            </div>
          </div>
        )}

        {gameState === 'setup_names' && (
          <div className="bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-5xl font-black uppercase tracking-wider text-black mb-8 text-center">
              Teacher Setup
            </h2>
            
            {/* Speed Setting */}
            <div className="mb-8 p-6 bg-gray-100 rounded-2xl border-4 border-black">
              <h3 className="text-2xl font-black uppercase mb-4">Game Speed (Aim & Power)</h3>
              <div className="flex gap-4">
                {[0.5, 0.75, 1.0, 1.25, 1.5].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setGameSpeed(speed)}
                    className={`flex-1 py-3 rounded-xl border-4 font-bold text-xl transition-all ${
                      gameSpeed === speed 
                        ? 'border-black bg-[#FFDD00] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]' 
                        : 'border-gray-400 bg-white text-gray-500'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <p className="text-gray-500 mt-2 font-bold">Lower speeds give more processing time for switch users.</p>
            </div>

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

        {gameState === 'bracket_setup' && (
          <div className="bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto">
            <h2 className="text-5xl font-black uppercase tracking-wider text-black mb-8 text-center">
              Tournament Setup
            </h2>
            <div className="flex flex-col gap-8 mb-8">
              <div className="p-8 bg-gray-100 rounded-2xl border-4 border-black text-center">
                <h3 className="text-3xl font-black uppercase mb-6">Create New Bracket</h3>
                <div className="flex gap-4 justify-center">
                  {[4, 8, 16].map(num => (
                    <button 
                      key={num}
                      onClick={() => {
                        generateTournament(num);
                        setGameState('bracket_name_entry');
                      }}
                      className="px-8 py-4 bg-[#00FF00] border-4 border-black rounded-xl font-black text-2xl hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      {num} Teams
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-gray-100 rounded-2xl border-4 border-black text-center">
                <h3 className="text-3xl font-black uppercase mb-6">Load Existing Bracket</h3>
                <label className="inline-block px-8 py-4 bg-[#00AAFF] text-white border-4 border-black rounded-xl font-black text-2xl hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                  Import JSON File
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const json = event.target?.result as string;
                        importTournament(json);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => setGameState('title')}
                className="px-8 py-4 bg-[#FF0055] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-2xl font-black uppercase tracking-widest hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-white"
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}

        {gameState === 'bracket_name_entry' && tournament && (
          <div className="bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto">
            <h2 className="text-5xl font-black uppercase tracking-wider text-black mb-8 text-center">
              Enter Team Names
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {Object.values(tournament.teams).map((team) => (
                <div key={team.id} className="flex flex-col gap-2 bg-gray-100 p-4 rounded-2xl border-4 border-black">
                  <label className="text-xl font-bold uppercase">{team.id}</label>
                  <input 
                    type="text" 
                    value={team.name}
                    onChange={(e) => updateTournamentTeam(team.id, e.target.value)}
                    className="border-4 border-black rounded-xl p-3 text-2xl font-bold"
                  />
                </div>
              ))}
            </div>
            <div className="text-center">
              <button 
                onClick={() => setGameState('bracket_view')}
                className="px-12 py-6 bg-[#00FF00] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-4xl font-black uppercase tracking-widest hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                View Bracket
              </button>
            </div>
          </div>
        )}

        {gameState === 'bracket_view' && tournament && (
          <div className="bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-6xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-5xl font-black uppercase tracking-wider text-black">
                Tournament Bracket
              </h2>
              <div className="flex gap-4">
                <button 
                  onClick={exportTournament}
                  className="px-6 py-3 bg-[#00AAFF] border-4 border-black rounded-xl font-bold text-xl text-white hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Export Bracket
                </button>
                <button 
                  onClick={quitTournament}
                  className="px-6 py-3 bg-[#FF0055] border-4 border-black rounded-xl font-bold text-xl text-white hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Quit
                </button>
              </div>
            </div>

            {/* Bracket Visualization */}
            <div className="flex gap-8 overflow-x-auto pb-8 mb-8 flex-1">
              {Array.from(new Set(Object.values(tournament.matchups).map(m => m.round))).sort().map(r => (
                <div key={r} className="flex flex-col gap-4 min-w-[250px] justify-around">
                  <h3 className="text-2xl font-black uppercase text-center bg-black text-white py-2 rounded-xl">Round {r}</h3>
                  {Object.values(tournament.matchups).filter(m => m.round === r).map(m => (
                    <div key={m.id} className={`border-4 border-black p-4 rounded-xl ${m.winnerId ? 'bg-gray-200' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}>
                      <div className={`font-bold text-xl ${m.winnerId === m.team1Id ? 'text-[#00FF00]' : ''}`}>
                        {m.team1Id ? tournament.teams[m.team1Id].name : 'TBD'}
                      </div>
                      <div className="h-1 bg-black my-2 opacity-20"></div>
                      <div className={`font-bold text-xl ${m.winnerId === m.team2Id ? 'text-[#00FF00]' : ''}`}>
                        {m.team2Id ? tournament.teams[m.team2Id].name : 'TBD'}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-8 justify-center items-center bg-gray-100 p-8 rounded-3xl border-4 border-black">
              <div className="flex-1">
                <h3 className="text-2xl font-black uppercase mb-4">Play Next Match</h3>
                <div className="flex gap-4">
                  <select 
                    id="matchup-select"
                    className="flex-1 border-4 border-black rounded-xl p-3 text-xl font-bold"
                  >
                    {Object.values(tournament.matchups)
                      .filter(m => m.team1Id && m.team2Id && !m.winnerId)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {tournament.teams[m.team1Id!].name} vs {tournament.teams[m.team2Id!].name}
                        </option>
                      ))
                    }
                  </select>
                  <button 
                    onClick={() => {
                      const select = document.getElementById('matchup-select') as HTMLSelectElement;
                      if (select && select.value) {
                        startTournamentMatchup(select.value);
                      }
                    }}
                    className="px-8 py-4 bg-[#FFDD00] border-4 border-black rounded-xl font-black text-xl hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Start Match
                  </button>
                </div>
              </div>
              <div className="w-1 bg-black h-24 opacity-20"></div>
              <div className="flex-1 text-center">
                <h3 className="text-2xl font-black uppercase mb-4">Eliminated Teams</h3>
                <button 
                  onClick={playNonRanked}
                  className="px-8 py-4 bg-[#00FF00] border-4 border-black rounded-xl font-black text-xl hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Play Non-Ranked Game
                </button>
              </div>
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
          <div className="text-center bg-white border-8 border-black rounded-[3rem] p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] pointer-events-auto">
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
            
            {/* Tournament Matchup Resolution */}
            {tournament && !tournament.isNonRanked && tournament.currentMatchupId ? (
              <div className="bg-gray-100 p-8 rounded-2xl border-4 border-black mb-8">
                <h3 className="text-3xl font-black uppercase mb-6">Save Match Results</h3>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => saveTournamentMatchup(tournament.matchups[tournament.currentMatchupId!].team1Id!)}
                    className="px-6 py-4 bg-[#00FF00] border-4 border-black rounded-xl font-black text-xl hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {players[0].name} Wins
                  </button>
                  <button 
                    onClick={() => saveTournamentMatchup(tournament.matchups[tournament.currentMatchupId!].team2Id!)}
                    className="px-6 py-4 bg-[#00FF00] border-4 border-black rounded-xl font-black text-xl hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {players[1].name} Wins
                  </button>
                  <button 
                    onClick={discardTournamentMatchup}
                    className="px-6 py-4 bg-[#FF0055] text-white border-4 border-black rounded-xl font-black text-xl hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Discard Results
                  </button>
                </div>
              </div>
            ) : tournament && tournament.isNonRanked ? (
              <div className="flex gap-6 justify-center">
                <button 
                  onClick={() => setGameState('bracket_view')}
                  className="px-8 py-4 bg-[#FFDD00] border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-3xl font-black uppercase tracking-widest hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                >
                  Back to Bracket
                </button>
              </div>
            ) : (
              /* Standard Game Over Actions */
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
            )}
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
