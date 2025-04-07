import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useZombieGame } from "@/lib/stores/useZombieGame";
import { useAuth } from "@/lib/providers/AuthProvider";

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void; // This is now the Home button action
  onPlayAgain?: () => Promise<boolean>; // New prop for Play Again button
}

const GameOverScreen = ({ score, highScore, onRestart, onPlayAgain }: GameOverScreenProps) => {
  const [zombies, setZombies] = useState<Array<{x: number, y: number, angle: number, scale: number}>>([]);
  const [playerName, setPlayerName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const { submitHighScore, playerName: savedPlayerName, setPlayerName: savePlayerName, canPlay } = useZombieGame();
  const { isLoggedIn, coins, username, login } = useAuth();
  
  // Load saved player name when component mounts
  useEffect(() => {
    // Use username from auth if available, otherwise use saved player name
    if (isLoggedIn && username) {
      setPlayerName(username);
    } else if (savedPlayerName) {
      setPlayerName(savedPlayerName);
    }
  }, [savedPlayerName, isLoggedIn, username]);
  
  // Handle high score submission
  const handleSubmitScore = async () => {
    if (playerName.trim()) {
      setIsSubmitting(true);
      
      // Save the player name for future games
      savePlayerName(playerName);
      
      // Submit score to backend
      await submitHighScore(playerName);
      
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };
  
  // Create zombie silhouettes in the background
  useEffect(() => {
    const zombieCount = 12; // Number of zombies in the background
    const newZombies = [];
    
    for (let i = 0; i < zombieCount; i++) {
      newZombies.push({
        x: Math.random() * 100, // % position
        y: Math.random() * 100,
        angle: Math.random() * 20 - 10, // Random tilt
        scale: 0.5 + Math.random() * 1.5 // Random size
      });
    }
    
    setZombies(newZombies);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-800/80 via-green-900/80 to-green-950/90">
        {/* Zombie silhouettes */}
        {zombies.map((zombie, index) => (
          <div 
            key={index}
            className="absolute w-16 h-16 bg-green-700/30"
            style={{
              left: `${zombie.x}%`,
              top: `${zombie.y}%`,
              transform: `rotate(${zombie.angle}deg) scale(${zombie.scale})`,
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              animation: `float ${2 + Math.random() * 3}s infinite alternate ease-in-out`,
            }}
          />
        ))}
      </div>
      
      {/* Green effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-green-800/30 rounded-full blur-3xl" 
             style={{transform: 'translate(-50%, -50%)'}} />
        <div className="absolute top-3/4 right-1/4 w-1/2 h-1/2 bg-green-800/20 rounded-full blur-3xl" 
             style={{transform: 'translate(30%, 20%)'}} />
      </div>
      
      {/* Game over content */}
      <Card className="w-[90%] max-w-[400px] border-2 border-green-800 bg-gray-900/90 shadow-[0_0_15px_rgba(0,200,0,0.5)] backdrop-blur-sm relative z-10">
        <CardHeader className="border-b border-green-800/50">
          <CardTitle className="text-3xl text-center text-green-500 font-bold">GAME OVER</CardTitle>
        </CardHeader>
        <CardContent className="text-center pt-6">
          <p className="text-xl mb-4 text-white">Your Score: <span className="text-yellow-400 font-bold">{score}</span></p>
          <p className="text-lg text-white">High Score: <span className="text-yellow-400 font-bold">{highScore}</span></p>
          
          {score > highScore && (
            <div className="mt-4 p-2 bg-green-900/40 border border-green-500/50 rounded-md">
              <p className="font-bold text-green-500">New High Score!</p>
            </div>
          )}
          
          {/* Player name input for high score submission */}
          {!isSubmitted && score > 0 && (
            <div className="mt-6 px-3">
              <Label htmlFor="playerName" className="text-white text-left block mb-2">
                Enter your name to save your score:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  maxLength={20}
                  disabled={isSubmitting || (isLoggedIn && !!username)}
                />
                <Button 
                  onClick={handleSubmitScore}
                  className="bg-green-700 hover:bg-green-600 text-white"
                  disabled={isSubmitting || !playerName.trim()}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
          
          {/* Confirmation message after submission */}
          {isSubmitted && (
            <div className="mt-4 p-2 bg-green-900/40 border border-green-500/50 rounded-md">
              <p className="text-green-400">Score saved successfully!</p>
            </div>
          )}
          
          {/* Game information section */}
          <div className="mt-6 border-t border-gray-700 pt-4">
            {isLoggedIn ? (
              <div className="p-3 bg-gray-800/60 rounded-md">
                <p className="text-white text-sm mb-1">Logged in as <span className="font-bold">{username}</span></p>
                <p className="text-green-400 text-xs">
                  {coins > 0 
                    ? `You have ${coins} coin${coins !== 1 ? 's' : ''} remaining today.` 
                    : 'You\'re out of coins for today. Come back tomorrow for more!'}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-gray-800/60 rounded-md">
                <p className="text-gray-300 text-sm">Play as guest. Return to home screen to connect wallet.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-3 pb-6">
          {/* Play Again Button - always show it if there's a function to handle it */}
          {onPlayAgain && (
            <Button 
              size="lg" 
              className="w-[150px] h-[60px] text-lg bg-green-700 hover:bg-green-600 border-2 border-green-500/50 shadow-[0_0_10px_rgba(0,200,0,0.3)]"
              onClick={async () => {
                if (onPlayAgain) {
                  const success = await onPlayAgain();
                  if (!success && isLoggedIn) {
                    alert("You're out of coins for today! Come back tomorrow for more coins.");
                  }
                }
              }}
            >
              Play Again
            </Button>
          )}
          
          {/* Home Button */}
          <Button 
            size="lg" 
            className="w-[150px] h-[60px] text-lg bg-green-700 hover:bg-green-600 border-2 border-green-500/50 shadow-[0_0_10px_rgba(0,150,0,0.3)]"
            onClick={onRestart}
          >
            Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Add animation keyframes to the stylesheet
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes float {
    0% { transform: translateY(0) rotate(var(--rotation, 0deg)) scale(var(--scale, 1)); }
    100% { transform: translateY(20px) rotate(var(--rotation, 0deg)) scale(var(--scale, 1)); }
  }
`;
document.head.appendChild(styleSheet);

export default GameOverScreen;
