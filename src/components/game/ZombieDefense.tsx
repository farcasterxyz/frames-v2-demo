import { useEffect, useState } from "react";
import { useAudio } from "@/lib/stores/useAudio";
import GameCanvas from "./GameCanvas";
import GameUI from "./GameUI";
import GameOverScreen from "./GameOverScreen";
import { useZombieGame } from "@/lib/stores/useZombieGame";

// Define Props for ZombieDefense component
interface ZombieDefenseProps {
  onNavigateHome?: () => void;
}

const ZombieDefense = ({ onNavigateHome }: ZombieDefenseProps) => {
  const { 
    score, 
    lives, 
    gameOver, 
    restartGame,
    highScore,
    setBackgroundMusicElement
  } = useZombieGame();
  
  const [isLoading, setIsLoading] = useState(true);
  const { isMuted, toggleMute, setHitSound, setSuccessSound, setBackgroundMusic } = useAudio();

  // Load audio effects
  useEffect(() => {
    const loadAudio = async () => {
      try {
        const hitAudio = new Audio('/sounds/hit.mp3');
        const successAudio = new Audio('/sounds/success.mp3');
        const bgMusic = new Audio('/sounds/background.mp3');
        
        bgMusic.loop = true;
        bgMusic.volume = 0.4;
        
        setHitSound(hitAudio);
        setSuccessSound(successAudio);
        setBackgroundMusic(bgMusic);
        setBackgroundMusicElement(bgMusic);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load audio:", error);
        setIsLoading(false);
      }
    };
    
    loadAudio();
  }, [setHitSound, setSuccessSound, setBackgroundMusic, setBackgroundMusicElement]);

  // Handle go to home button click
  const handleGoHome = () => {
    if (onNavigateHome) {
      console.log("Navigating back to home screen...");
      onNavigateHome();
    } else {
      console.log("onNavigateHome function not provided");
      // Fallback restart game if no navigation function provided
      restartGame().catch(error => {
        console.error("Error restarting game:", error);
      });
    }
  };
  
  // Handle restart game - now async with coin usage
  const handleRestart = async (): Promise<boolean> => {
    console.log("Attempting to restart game...");
    const success = await restartGame();
    
    if (success) {
      console.log("Game restarted successfully");
      return true;
    } else {
      console.log("Unable to restart - out of coins or error occurred");
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full max-w-[500px] max-h-[1000px] overflow-hidden">
      {/* Game canvas */}
      <GameCanvas />
      
      {/* Game UI overlay */}
      <GameUI score={score} lives={lives} isMuted={isMuted} onToggleMute={toggleMute} />
      
      {/* Game over screen */}
      {gameOver && (
        <GameOverScreen
          score={score}
          highScore={highScore}
          onRestart={handleGoHome}
          onPlayAgain={handleRestart}
        />
      )}
    </div>
  );
};

export default ZombieDefense;
