import { useEffect, useRef } from "react";
import { useZombieGame } from "@/lib/stores/useZombieGame";
import { GameEngine } from "@/lib/game/GameEngine";

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const { 
    initGame, 
    updateScore, 
    removeLife,
    endGame,
    gameOver
  } = useZombieGame();

  // Initialize the game engine
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set initial canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const maxWidth = 500;
      const maxHeight = 1000;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Respect max dimensions while maintaining aspect ratio
      const width = Math.min(containerWidth, maxWidth);
      const height = Math.min(containerHeight, maxHeight);
      
      canvas.width = width;
      canvas.height = height;
      
      // If we have a game engine, update its dimensions
      if (gameEngineRef.current) {
        gameEngineRef.current.resizeCanvas(width, height);
      }
    };
    
    // Set canvas size initially
    updateCanvasSize();
    
    // Create the game engine
    const gameEngine = new GameEngine(
      canvas,
      ctx,
      {
        onScoreUpdate: updateScore,
        onLifeLost: removeLife,
        onGameOver: endGame
      }
    );
    
    gameEngineRef.current = gameEngine;
    
    // Initialize the game
    initGame();
    gameEngine.init();
    
    // Handle window resize
    window.addEventListener("resize", updateCanvasSize);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (gameEngineRef.current) {
        gameEngineRef.current.cleanup();
        gameEngineRef.current = null;
      }
    };
  }, [initGame, updateScore, removeLife, endGame]);

  // Start/stop game loop based on game over state
  useEffect(() => {
    if (gameOver && gameEngineRef.current) {
      gameEngineRef.current.pause();
    } else if (!gameOver && gameEngineRef.current) {
      gameEngineRef.current.resume();
    }
  }, [gameOver]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full bg-gray-800 touch-none"
    />
  );
};

export default GameCanvas;
