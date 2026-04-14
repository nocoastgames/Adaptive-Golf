import { create } from 'zustand';
import { audio } from './audio';

export type GameState = 
  | 'title'
  | 'setup_players'
  | 'setup_names'
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
  aimAngle: number;
  powerLevel: number;
  ballPosition: [number, number, number];
  strokesThisHole: number;
  
  // Actions
  setGameState: (state: GameState) => void;
  setScanningOption: (opt: number) => void;
  setupGame: (numPlayers: number) => void;
  updatePlayer: (index: number, updates: Partial<Player>) => void;
  startGame: () => void;
  nextPlayer: () => void;
  setAimAngle: (angle: number) => void;
  setPowerLevel: (power: number) => void;
  shoot: () => void;
  waterHazard: () => void;
  ballSinking: () => void;
  ballStopped: (inHole: boolean, finalPos: [number, number, number]) => void;
  resetGame: () => void;
  exportCSV: () => void;
}

const PLAYER_COLORS = ['#FF0055', '#00AAFF', '#00FF00', '#FFDD00', '#9900FF'];
const PLAYER_NAMES = ['Red', 'Blue', 'Green', 'Yellow', 'Purple'];

export const useStore = create<StoreState>((set, get) => ({
  gameState: 'title',
  players: [],
  currentCourse: 0,
  currentPlayerIndex: 0,
  scanningOption: 1,
  aimAngle: 0,
  powerLevel: 0,
  ballPosition: COURSES[0].startPos,
  strokesThisHole: 0,

  setGameState: (state) => set({ gameState: state }),
  setScanningOption: (opt) => set({ scanningOption: opt }),
  
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
