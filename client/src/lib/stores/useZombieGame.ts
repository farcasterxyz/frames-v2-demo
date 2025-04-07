import { create } from "zustand";

interface ZombieGameState {
  // Game state
  score: number;
  lives: number;
  gameOver: boolean;
  highScore: number;
  backgroundMusic: HTMLAudioElement | null;
  playerName: string;
  canPlay: boolean;  // Indicates if player has coins or doesn't need them
  
  // Actions
  initGame: () => void;
  updateScore: (points: number) => void;
  removeLife: () => void;
  endGame: () => void;
  restartGame: () => Promise<boolean>; // Returns whether game restarted successfully
  setBackgroundMusicElement: (element: HTMLAudioElement) => void;
  submitHighScore: (name?: string) => Promise<void>;
  setPlayerName: (name: string) => void;
  checkCanPlay: () => Promise<boolean>; // Check if user can play (has coins or doesn't need them)
}

export const useZombieGame = create<ZombieGameState>((set, get) => ({
  // Game state
  score: 0,
  lives: 3,
  gameOver: false,
  highScore: parseInt(localStorage.getItem("zombieDefenseHighScore") || "0", 10),
  backgroundMusic: null,
  playerName: localStorage.getItem("zombieDefensePlayerName") || "",
  canPlay: true, // Default to true, will be checked during game initialization
  
  // Initialize the game (called internally when checking the game flow)
  initGame: () => {
    console.log("Game initialized - internal method, use restartGame instead for new games");
    // This is now a marker method, with all relevant game state initialization 
    // moved to restartGame to ensure proper coin usage
  },
  
  // Update the score
  updateScore: (points) => {
    set((state) => ({ score: state.score + points }));
  },
  
  // Lose a life
  removeLife: () => {
    set((state) => {
      const newLives = state.lives - 1;
      const newGameOver = newLives <= 0;
      
      // If this was the last life, handle game over
      if (newGameOver) {
        const { endGame } = get();
        setTimeout(endGame, 500); // Small delay before game over
      }
      
      return { lives: newLives };
    });
  },
  
  // End the game
  endGame: () => {
    const { score, highScore } = get();
    
    // Update local high score if needed
    if (score > highScore) {
      localStorage.setItem("zombieDefenseHighScore", score.toString());
      set({ highScore: score });
    }
    
    set({ gameOver: true });
    
    // Stop background music
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      console.log("Stopping background music");
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  },
  
  // Restart the game
  restartGame: async () => {
    // Check if the user can play first
    const canPlay = await get().checkCanPlay();
    
    if (canPlay) {
      // Reset game state and start a new game
      set({ 
        score: 0,
        lives: 3,
        gameOver: false
      });
      
      // Start background music if available
      const { backgroundMusic } = get();
      if (backgroundMusic) {
        // Make sure to apply muted state first
        try {
          // Try to check if audio store is available and get muted state
          // @ts-ignore - We know this might not exist
          const audioStore = window.audioStore;
          if (audioStore && audioStore.getState) {
            const { isMuted } = audioStore.getState();
            backgroundMusic.muted = isMuted;
            console.log(`Applied muted state (${isMuted}) to background music`);
          }
        } catch (e) {
          console.log('Error accessing audio store:', e);
        }
        
        backgroundMusic.play().catch(error => {
          console.log("Background music play prevented:", error);
        });
      }
      
      return true;
    }
    
    return false;
  },
  
  setBackgroundMusicElement: (element) => {
    set({ backgroundMusic: element });
  },
  
  // Submit high score to the server
  submitHighScore: async (name) => {
    const { score, playerName } = get();
    const nameToSubmit = name || playerName || 'Anonymous';
    
    // Only submit if score is significant
    if (score > 0) {
      try {
        // Try to get user ID from auth if it exists (for logged in users)
        let userId = null;
        try {
          // Get auth from window to avoid circular dependencies
          // @ts-ignore - We know this might not exist
          const auth = window.authContext;
          userId = auth?.userId || null;
        } catch (e) {
          console.log('No auth context available for score submission');
        }
        
        const response = await fetch('/api/highscores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            name: nameToSubmit, 
            score,
            userId // Include user ID if available
          }),
        });
        
        // Log error but don't throw to prevent game progression
        if (!response.ok) {
          console.error('Failed to submit high score:', await response.text());
        }
      } catch (error) {
        console.error('Error submitting high score:', error);
      }
    }
  },
  
  // Set player name
  setPlayerName: (name) => {
    if (name) {
      localStorage.setItem("zombieDefensePlayerName", name);
      set({ playerName: name });
    }
  },
  
  // Check if the user can play (has coins or guest mode)
  checkCanPlay: async () => {
    try {
      // Try to get auth context
      // @ts-ignore - We know this might not exist
      const auth = window.authContext;
      
      // If auth context exists and user is logged in
      if (auth && auth.isLoggedIn && auth.userId) {
        console.log('User is logged in, checking coins...');
        
        // First check if the user has coins before trying to use one
        if (auth.coins <= 0) {
          console.log('User has no coins left');
          set({ canPlay: false });
          return false;
        }
        
        // Try to use a coin
        const success = await auth.useGameCoin();
        console.log(`Using game coin result: ${success}`);
        
        // Update local state with the result
        set({ canPlay: success });
        return success;
      }
      
      // If no auth or not logged in, allow play (guest mode)
      console.log('Guest mode, allowing play without coins');
      set({ canPlay: true });
      return true;
    } catch (e) {
      console.error('Error checking if user can play:', e);
      // Default to allowing play to prevent blocking game
      set({ canPlay: true });
      return true;
    }
  }
}));
