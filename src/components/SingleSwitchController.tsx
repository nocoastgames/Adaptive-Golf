import { useEffect } from 'react';
import { useStore } from '../store';
import { audio } from '../audio';

export function SingleSwitchController() {
  const { 
    gameState, 
    setGameState, 
    scanningOption, 
    setupGame, 
    startGame,
    nextPlayer,
    shoot,
    resetGame
  } = useStore();

  const handleSwitch = () => {
    switch (gameState) {
      case 'title':
        audio.toggleBGM(); // Start music on first interaction
        setGameState('setup_players');
        break;
      case 'setup_players':
        setupGame(scanningOption);
        break;
      case 'setup_names':
        // Setup names is handled by mouse/keyboard for the teacher, switch does nothing here
        // Or we could allow switch to skip it. Let's let the UI button handle it.
        break;
      case 'course_intro':
        setGameState('player_turn_start');
        break;
      case 'player_turn_start':
        setGameState('aiming');
        break;
      case 'aiming':
        setGameState('power');
        break;
      case 'power':
        shoot();
        break;
      case 'rolling':
      case 'sinking':
        // Do nothing, wait for ball to stop
        break;
      case 'hole_scored':
      case 'stroke_limit_reached':
        nextPlayer();
        break;
      case 'game_over':
        if (useStore.getState().tournament) {
          // If in a tournament, don't auto-reset on switch. Let teacher use mouse to save/discard.
        } else {
          resetGame();
        }
        break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger switch if typing in an input field
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleSwitch();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.closest('button')) return;
      handleSwitch();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [gameState, scanningOption]);

  return null;
}
