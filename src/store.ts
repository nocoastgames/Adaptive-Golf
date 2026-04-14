import { create } from 'zustand';
import { audio } from './audio';

export type GameState = 
  | 'title'
  | 'setup_players'
  | 'setup_names'
  | 'bracket_setup'
  | 'bracket_view'
  | 'course_intro'
  | 'player_turn_start'
  | 'aiming'
  | 'power'
  | 'rolling'
  | 'sinking'
  | 'hole_scored'
  | 'stroke_limit_reached'
  | 'game_over';

export interface Player {
  id: number;
  color: string;
  strokes: number;
  score: number;
  name: string;
  team: string;
}

export interface TournamentTeam {
  id: string;
  name: string;
}

export interface TournamentMatchup {
  id: string;
  round: number;
  matchIndex: number;
  team1Id: string | null;
  team2Id: string | null;
  winnerId: string | null;
  nextMatchupId: string | null;
}

export interface Tournament {
  teams: Record<string, TournamentTeam>;
  matchups: Record<string, TournamentMatchup>;
  currentMatchupId: string | null;
  isNonRanked: boolean;
}

export interface CourseDef {
  id: number;
  name: string;
  startPos: [number, number, number];
  holePos: [number, number, number];
  par: number;
}

export const COURSES: CourseDef[] = [
  { id: 0, name: "The Classic", startPos: [0, 0.5, 35], holePos: [0, 0.01, -30], par: 3 },
  { id: 1, name: "The Hill", startPos: [0, 0.5, 35], holePos: [0, 4.01, -30], par: 4 },
  { id: 2, name: "Windmill Valley", startPos: [0, 0.5, 35], holePos: [0, 0.01, -30], par: 4 },
  { id: 3, name: "Mount Drop", startPos: [0, 10.5, 35], holePos: [0, 0.01, -30], par: 5 },
];

interface StoreState {
  gameState: GameState;
  players: Player[];
  currentCourse: number;
  currentPlayerIndex: number;
  scanningOption: number; // For single switch scanning
  gameSpeed: number; // For slowing down aiming/power sweep
  aimAngle: number;
  powerLevel: number;
  ballPosition: [number, number, number];
  strokesThisHole: number;
  tournament: Tournament | null;
  
  // Actions
  setGameState: (state: GameState) => void;
  setScanningOption: (opt: number) => void;
  setGameSpeed: (speed: number) => void;
  setupGame: (numPlayers: number) => void;
  updatePlayer: (index: number, updates: Partial<Player>) => void;
  
  // Tournament Actions
  generateTournament: (numTeams: number) => void;
  updateTournamentTeam: (id: string, name: string) => void;
  startTournamentMatchup: (matchupId: string) => void;
  saveTournamentMatchup: (winnerId: string) => void;
  discardTournamentMatchup: () => void;
  importTournament: (json: string) => void;
  exportTournament: () => void;
  playNonRanked: () => void;
  quitTournament: () => void;

  startGame: () => void;
  nextPlayer: () => void;
  setAimAngle: (angle: number) => void;
  setPowerLevel: (power: number) => void;
  shoot: () => void;
  waterHazard: () => void;
  ballSinking: () => void;
  ballStopped: (inHole: boolean, finalPos: [number, number, number]) => void;
  resetGame: () => void;
  endGame: () => void;
  resetRound: () => void;
  exportCSV: () => void;
}

const PLAYER_COLORS = ['#FF0055', '#00AAFF', '#00FF00', '#FFDD00', '#9900FF', '#FF8800', '#00FFCC', '#FF00AA'];
const PLAYER_NAMES = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink'];

export const useStore = create<StoreState>((set, get) => ({
  gameState: 'title',
  players: [],
  currentCourse: 0,
  currentPlayerIndex: 0,
  scanningOption: 1,
  gameSpeed: 1.0,
  aimAngle: 0,
  powerLevel: 0,
  ballPosition: COURSES[0].startPos,
  strokesThisHole: 0,
  tournament: null,

  setGameState: (state) => set({ gameState: state }),
  setScanningOption: (opt) => set({ scanningOption: opt }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  
  generateTournament: (numTeams) => {
    const teams: Record<string, TournamentTeam> = {};
    for (let i = 1; i <= numTeams; i++) {
      teams[`t${i}`] = { id: `t${i}`, name: `Team ${i}` };
    }

    const matchups: Record<string, TournamentMatchup> = {};
    const totalRounds = Math.log2(numTeams);

    for (let r = 1; r <= totalRounds; r++) {
      const matchesInRound = numTeams / Math.pow(2, r);
      for (let m = 1; m <= matchesInRound; m++) {
        const id = `r${r}-m${m}`;
        const nextRound = r + 1;
        const nextMatchIndex = Math.ceil(m / 2);
        const nextMatchupId = r === totalRounds ? null : `r${nextRound}-m${nextMatchIndex}`;

        matchups[id] = {
          id,
          round: r,
          matchIndex: m,
          team1Id: r === 1 ? `t${m * 2 - 1}` : null,
          team2Id: r === 1 ? `t${m * 2}` : null,
          winnerId: null,
          nextMatchupId
        };
      }
    }

    set({
      tournament: { teams, matchups, currentMatchupId: null, isNonRanked: false },
      gameState: 'bracket_view'
    });
  },

  updateTournamentTeam: (id, name) => {
    set((state) => {
      if (!state.tournament) return state;
      return {
        tournament: {
          ...state.tournament,
          teams: {
            ...state.tournament.teams,
            [id]: { ...state.tournament.teams[id], name }
          }
        }
      };
    });
  },

  startTournamentMatchup: (matchupId) => {
    set((state) => {
      if (!state.tournament) return state;
      const match = state.tournament.matchups[matchupId];
      if (!match.team1Id || !match.team2Id) return state;

      const t1 = state.tournament.teams[match.team1Id];
      const t2 = state.tournament.teams[match.team2Id];

      const players = [
        { id: 0, color: PLAYER_COLORS[0], name: t1.name, team: t1.name, strokes: 0, score: 0 },
        { id: 1, color: PLAYER_COLORS[1], name: t2.name, team: t2.name, strokes: 0, score: 0 }
      ];

      return {
        tournament: { ...state.tournament, currentMatchupId: matchupId, isNonRanked: false },
        players,
        currentCourse: 0,
        currentPlayerIndex: 0,
        strokesThisHole: 0,
        aimAngle: 0,
        powerLevel: 0,
        ballPosition: COURSES[0].startPos,
        gameState: 'course_intro'
      };
    });
  },

  saveTournamentMatchup: (winnerId) => {
    set((state) => {
      if (!state.tournament || !state.tournament.currentMatchupId) return state;
      const t = { ...state.tournament };
      const matchups = { ...t.matchups };
      const currentMatch = matchups[t.currentMatchupId];

      currentMatch.winnerId = winnerId;

      // Advance to next matchup
      if (currentMatch.nextMatchupId) {
        const nextMatch = matchups[currentMatch.nextMatchupId];
        if (currentMatch.matchIndex % 2 !== 0) {
          nextMatch.team1Id = winnerId;
        } else {
          nextMatch.team2Id = winnerId;
        }
      }

      t.matchups = matchups;
      t.currentMatchupId = null;

      return { tournament: t, gameState: 'bracket_view' };
    });
  },

  discardTournamentMatchup: () => {
    set((state) => {
      if (!state.tournament) return state;
      return {
        tournament: { ...state.tournament, currentMatchupId: null },
        gameState: 'bracket_view'
      };
    });
  },

  importTournament: (json) => {
    try {
      const tournament = JSON.parse(json) as Tournament;
      set({ tournament, gameState: 'bracket_view' });
    } catch (e) {
      console.error("Failed to parse tournament JSON", e);
    }
  },

  exportTournament: () => {
    const { tournament } = get();
    if (!tournament) return;
    const blob = new Blob([JSON.stringify(tournament, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'super_switch_golf_bracket.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  playNonRanked: () => {
    set((state) => {
      if (!state.tournament) return state;
      return {
        tournament: { ...state.tournament, currentMatchupId: null, isNonRanked: true },
        gameState: 'setup_players'
      };
    });
  },

  quitTournament: () => set({ tournament: null, gameState: 'title' }),

  setupGame: (numPlayers) => {
    const newPlayers = Array.from({ length: numPlayers }).map((_, i) => ({
      id: i,
      color: PLAYER_COLORS[i],
      name: PLAYER_NAMES[i],
      team: `Team ${i + 1}`,
      strokes: 0,
      score: 0,
    }));
    set({
      players: newPlayers,
      gameState: 'setup_names',
    });
  },

  updatePlayer: (index, updates) => {
    set((state) => {
      const newPlayers = [...state.players];
      newPlayers[index] = { ...newPlayers[index], ...updates };
      return { players: newPlayers };
    });
  },

  startGame: () => {
    set({
      currentCourse: 0,
      currentPlayerIndex: 0,
      gameState: 'course_intro',
      ballPosition: COURSES[0].startPos,
      strokesThisHole: 0,
      aimAngle: 0,
      powerLevel: 0,
    });
  },

  nextPlayer: () => {
    const { players, currentPlayerIndex, currentCourse } = get();
    const nextIdx = (currentPlayerIndex + 1) % players.length;
    
    // If we looped back to 0, everyone played the hole. Move to next course.
    if (nextIdx === 0) {
      const nextCourse = currentCourse + 1;
      if (nextCourse >= COURSES.length) {
        set({ gameState: 'game_over' });
      } else {
        set({
          currentCourse: nextCourse,
          currentPlayerIndex: 0,
          gameState: 'course_intro',
          ballPosition: COURSES[nextCourse].startPos,
          strokesThisHole: 0,
          aimAngle: 0,
          powerLevel: 0,
        });
      }
    } else {
      set({
        currentPlayerIndex: nextIdx,
        gameState: 'player_turn_start',
        ballPosition: COURSES[currentCourse].startPos,
        strokesThisHole: 0,
        aimAngle: 0,
        powerLevel: 0,
      });
    }
  },

  setAimAngle: (angle) => set({ aimAngle: angle }),
  setPowerLevel: (power) => set({ powerLevel: power }),

  shoot: () => {
    audio.playHit();
    set((state) => ({
      gameState: 'rolling',
      strokesThisHole: state.strokesThisHole + 1,
    }));
  },

  waterHazard: () => {
    audio.playWater();
    const { currentCourse } = get();
    set((state) => ({
      gameState: 'aiming',
      ballPosition: COURSES[currentCourse].startPos, // Reset to start
      strokesThisHole: state.strokesThisHole + 1, // Penalty stroke
      aimAngle: 0,
      powerLevel: 0,
    }));
  },

  ballSinking: () => {
    audio.playHole();
    set({ gameState: 'sinking' });
  },

  ballStopped: (inHole, finalPos) => {
    const { strokesThisHole, players, currentPlayerIndex } = get();
    
    if (inHole) {
      // Update score
      const newPlayers = [...players];
      newPlayers[currentPlayerIndex].score += strokesThisHole;
      set({ players: newPlayers, gameState: 'hole_scored' });
    } else if (strokesThisHole >= 5) {
      // Max strokes reached
      const newPlayers = [...players];
      newPlayers[currentPlayerIndex].score += 6; // Penalty score
      set({ players: newPlayers, gameState: 'stroke_limit_reached' });
    } else {
      // Keep playing
      set({
        gameState: 'aiming',
        ballPosition: finalPos,
        aimAngle: 0,
        powerLevel: 0,
      });
    }
  },

  resetGame: () => set({
    gameState: 'title',
    players: [],
    currentCourse: 0,
    currentPlayerIndex: 0,
    scanningOption: 1,
    ballPosition: COURSES[0].startPos,
    strokesThisHole: 0,
  }),

  endGame: () => set({
    gameState: 'game_over'
  }),

  resetRound: () => {
    const { currentCourse } = get();
    set({
      gameState: 'player_turn_start',
      ballPosition: COURSES[currentCourse].startPos,
      strokesThisHole: 0,
      aimAngle: 0,
      powerLevel: 0,
    });
  },

  exportCSV: () => {
    const { players } = get();
    let csv = "Player,Team,Score\n";
    players.forEach(p => {
      csv += `"${p.name}","${p.team}",${p.score}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'super_switch_golf_scores.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}));
