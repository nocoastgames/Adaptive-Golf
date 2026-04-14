import { create } from 'zustand';
import { audio } from './audio';

export type GameState = 
  | 'title'
  | 'setup_players'
  | 'setup_live_championship'
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
  teamId?: string;
}

export interface TournamentTeam {
  id: string;
  name: string;
  isBye?: boolean;
}

export interface TournamentMatchup {
  id: string;
  round: number;
  matchIndex: number;
  team1Id: string | null;
  team2Id: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winnerId: string | null;
  nextMatchupId: string | null;
}

export interface Tournament {
  teams: Record<string, TournamentTeam>;
  matchups: Record<string, TournamentMatchup>;
  currentMatchupId: string | null;
  currentTeamId: string | null;
  isNonRanked: boolean;
  isLiveChampionship?: boolean;
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
  startTournamentTeamRound: (matchupId: string, teamId: string) => void;
  saveTeamScore: (averageScore: number) => void;
  startLiveChampionship: (matchupId: string) => void;
  setupLiveChampionship: (t1Count: number, t2Count: number) => void;
  saveLiveChampionshipScore: () => void;
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
    const totalSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(2, numTeams))));
    const numByes = totalSlots - numTeams;

    const teams: Record<string, TournamentTeam> = {};
    const teamIds: string[] = [];
    for (let i = 1; i <= numTeams; i++) {
      const id = `t${i}`;
      teams[id] = { id, name: `Team ${i}` };
      teamIds.push(id);
    }
    const byeIds: string[] = [];
    for (let i = 1; i <= numByes; i++) {
      const id = `bye${i}`;
      teams[id] = { id, name: `BYE`, isBye: true };
      byeIds.push(id);
    }

    const round1Pairs: [string, string][] = [];
    for (let i = 0; i < totalSlots / 2; i++) {
      const t1 = teamIds.shift()!;
      const t2 = byeIds.length > 0 ? byeIds.shift()! : teamIds.shift()!;
      round1Pairs.push([t1, t2]);
    }

    const matchups: Record<string, TournamentMatchup> = {};
    const totalRounds = Math.log2(totalSlots);

    for (let r = 1; r <= totalRounds; r++) {
      const matchesInRound = totalSlots / Math.pow(2, r);
      for (let m = 1; m <= matchesInRound; m++) {
        const id = `r${r}-m${m}`;
        const nextRound = r + 1;
        const nextMatchIndex = Math.ceil(m / 2);
        const nextMatchupId = r === totalRounds ? null : `r${nextRound}-m${nextMatchIndex}`;

        let team1Id = null;
        let team2Id = null;
        let winnerId = null;

        if (r === 1) {
          team1Id = round1Pairs[m - 1][0];
          team2Id = round1Pairs[m - 1][1];
          if (teams[team1Id].isBye) winnerId = team2Id;
          if (teams[team2Id].isBye) winnerId = team1Id;
        }

        matchups[id] = {
          id, round: r, matchIndex: m,
          team1Id, team2Id,
          team1Score: null, team2Score: null,
          winnerId, nextMatchupId
        };
      }
    }

    Object.values(matchups).forEach(m => {
      if (m.round === 1 && m.winnerId && m.nextMatchupId) {
        const nextM = matchups[m.nextMatchupId];
        if (m.matchIndex % 2 !== 0) nextM.team1Id = m.winnerId;
        else nextM.team2Id = m.winnerId;
      }
    });

    set({
      tournament: { teams, matchups, currentMatchupId: null, currentTeamId: null, isNonRanked: false },
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

  startTournamentTeamRound: (matchupId, teamId) => {
    set((state) => {
      if (!state.tournament) return state;
      return {
        tournament: { ...state.tournament, currentMatchupId: matchupId, currentTeamId: teamId, isNonRanked: false },
        gameState: 'setup_players',
        scanningOption: 1
      };
    });
  },

  saveTeamScore: (averageScore) => {
    set((state) => {
      if (!state.tournament || !state.tournament.currentMatchupId || !state.tournament.currentTeamId) return state;
      const t = { ...state.tournament };
      const matchups = { ...t.matchups };
      const currentMatch = matchups[t.currentMatchupId];

      if (currentMatch.team1Id === t.currentTeamId) {
        currentMatch.team1Score = averageScore;
      } else if (currentMatch.team2Id === t.currentTeamId) {
        currentMatch.team2Score = averageScore;
      }

      if (currentMatch.team1Score !== null && currentMatch.team2Score !== null) {
        if (currentMatch.team1Score <= currentMatch.team2Score) {
          currentMatch.winnerId = currentMatch.team1Id;
        } else {
          currentMatch.winnerId = currentMatch.team2Id;
        }

        if (currentMatch.nextMatchupId) {
          const nextMatch = matchups[currentMatch.nextMatchupId];
          if (currentMatch.matchIndex % 2 !== 0) {
            nextMatch.team1Id = currentMatch.winnerId;
          } else {
            nextMatch.team2Id = currentMatch.winnerId;
          }
        }
      }

      t.matchups = matchups;
      t.currentMatchupId = null;
      t.currentTeamId = null;

      return { tournament: t, gameState: 'bracket_view' };
    });
  },

  startLiveChampionship: (matchupId) => {
    set((state) => {
      if (!state.tournament) return state;
      return {
        tournament: { ...state.tournament, currentMatchupId: matchupId, currentTeamId: null, isLiveChampionship: true, isNonRanked: false },
        gameState: 'setup_live_championship'
      };
    });
  },

  setupLiveChampionship: (t1Count, t2Count) => {
    set((state) => {
      const t = state.tournament;
      if (!t || !t.currentMatchupId) return state;
      const match = t.matchups[t.currentMatchupId];
      const t1 = t.teams[match.team1Id!];
      const t2 = t.teams[match.team2Id!];

      const newPlayers: Player[] = [];
      let idCounter = 0;
      for (let i = 0; i < t1Count; i++) {
        newPlayers.push({
          id: idCounter,
          color: PLAYER_COLORS[idCounter % PLAYER_COLORS.length],
          name: t1Count === 1 ? t1.name : `${t1.name} P${i + 1}`,
          team: t1.name,
          teamId: t1.id,
          strokes: 0,
          score: 0
        });
        idCounter++;
      }
      for (let i = 0; i < t2Count; i++) {
        newPlayers.push({
          id: idCounter,
          color: PLAYER_COLORS[idCounter % PLAYER_COLORS.length],
          name: t2Count === 1 ? t2.name : `${t2.name} P${i + 1}`,
          team: t2.name,
          teamId: t2.id,
          strokes: 0,
          score: 0
        });
        idCounter++;
      }

      return {
        players: newPlayers,
        gameState: 'setup_names'
      };
    });
  },

  saveLiveChampionshipScore: () => {
    set((state) => {
      const t = state.tournament;
      if (!t || !t.currentMatchupId) return state;
      const match = t.matchups[t.currentMatchupId];

      const t1Players = state.players.filter(p => p.teamId === match.team1Id);
      const t2Players = state.players.filter(p => p.teamId === match.team2Id);

      const t1Avg = t1Players.length > 0 ? t1Players.reduce((sum, p) => sum + p.score, 0) / t1Players.length : 0;
      const t2Avg = t2Players.length > 0 ? t2Players.reduce((sum, p) => sum + p.score, 0) / t2Players.length : 0;

      const newMatchups = { ...t.matchups };
      const currentMatch = { ...newMatchups[t.currentMatchupId] };

      currentMatch.team1Score = t1Avg;
      currentMatch.team2Score = t2Avg;
      currentMatch.winnerId = t1Avg <= t2Avg ? currentMatch.team1Id : currentMatch.team2Id;

      newMatchups[t.currentMatchupId] = currentMatch;

      return {
        tournament: { ...t, matchups: newMatchups, currentMatchupId: null, isLiveChampionship: false },
        gameState: 'bracket_view'
      };
    });
  },

  discardTournamentMatchup: () => {
    set((state) => {
      if (!state.tournament) return state;
      return {
        tournament: { ...state.tournament, currentMatchupId: null, currentTeamId: null },
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
        tournament: { ...state.tournament, currentMatchupId: null, currentTeamId: null, isNonRanked: true, isLiveChampionship: false },
        gameState: 'setup_players'
      };
    });
  },

  quitTournament: () => set({ tournament: null, gameState: 'title' }),

  setupGame: (numPlayers) => {
    const state = get();
    const t = state.tournament;
    const teamName = t && t.currentTeamId && !t.isNonRanked
      ? t.teams[t.currentTeamId].name
      : 'Player';

    const newPlayers = Array.from({ length: numPlayers }).map((_, i) => ({
      id: i,
      color: PLAYER_COLORS[i],
      name: numPlayers === 1 ? teamName : `${teamName} P${i + 1}`,
      team: teamName,
      teamId: t && t.currentTeamId && !t.isNonRanked ? t.currentTeamId : undefined,
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
    tournament: null,
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
