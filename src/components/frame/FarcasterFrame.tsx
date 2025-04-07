import { useEffect, useState } from 'react';
import { useZombieGame } from '@/lib/stores/useZombieGame';

// Define our own interfaces since we're not using the actual Frame SDK
interface FrameActionBody {
  buttonIndex?: number;
  inputText?: string;
  state?: string | object;
}

// Define the URL of your app for the frame
const APP_URL = window.location.origin;

interface FrameProps {
  isVisible?: boolean;
}

export default function FarcasterFrame({ isVisible = true }: FrameProps) {
  const [frameMessage, setFrameMessage] = useState<FrameActionBody | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [currentView, setCurrentView] = useState<'welcome' | 'highscores' | 'game'>('welcome');
  const { highScore } = useZombieGame();

  // Parse frame messages when the component mounts
  useEffect(() => {
    // This would usually be done on the server side in a real implementation
    async function parseFrameMessage() {
      try {
        // In a client-side implementation, we'd get the frame message from URL parameters
        const url = new URL(window.location.href);
        const frameMessageData = url.searchParams.get('frameMessage');
        
        if (frameMessageData) {
          // In a real app, you would verify this message on the server
          const message = JSON.parse(frameMessageData);
          setFrameMessage(message);
          
          // Handle button actions
          if (message.buttonIndex === 1) {
            setCurrentView('game');
          } else if (message.buttonIndex === 2) {
            setCurrentView('highscores');
          }
          
          // Handle input
          if (message.inputText) {
            setPlayerName(message.inputText);
          }
        }
      } catch (error) {
        console.error('Error parsing frame message:', error);
      }
    }
    
    parseFrameMessage();
  }, []);

  // Handle game start from frame
  const handleStartGame = () => {
    const { restartGame } = useZombieGame.getState();
    restartGame();
    setCurrentView('game');
  };

  // If the component is not visible (i.e., not being loaded as a frame), don't render anything
  if (!isVisible) return null;

  // Generate frame HTML based on the current view (mock implementation)
  const generateFrameHtml = () => {
    // This is a mock implementation of what would normally be generated server-side
    // In a real app, we'd use @farcaster/frames-sdk or similar
    
    const frameData = {
      currentView,
      image: `${APP_URL}/frame-images/${currentView}.svg`,
      buttons: [] as string[],
      input: currentView === 'welcome' ? 'Enter your name (optional)' : undefined,
      // Add Frame v2 mini-app type
      type: 'app'
    };
    
    switch (currentView) {
      case 'welcome':
        frameData.buttons = ['Play Game', 'View High Scores'];
        break;
        
      case 'highscores':
        frameData.buttons = ['Back', 'Play Game'];
        break;
        
      case 'game':
        frameData.buttons = ['Start Game'];
        break;
    }
    
    return JSON.stringify(frameData, null, 2);
  };
  
  // In a real implementation, this HTML would be served by the server
  // For client-side rendering, we'll just display a message
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-white">Zombie Defense Frame</h2>
        
        <div className="mb-4">
          <p className="text-gray-300 mb-2">Current view: {currentView}</p>
          {playerName && (
            <p className="text-gray-300">Player: {playerName}</p>
          )}
          <p className="text-gray-300">High Score: {highScore}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentView('welcome')}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Welcome
          </button>
          <button 
            onClick={() => setCurrentView('highscores')}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            High Scores
          </button>
          <button 
            onClick={handleStartGame}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Start Game
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <p className="text-xs text-gray-400 mb-2">Frame HTML preview (normally served by server):</p>
          <pre className="text-xs text-gray-400 overflow-auto max-h-40">
            {generateFrameHtml()}
          </pre>
        </div>
      </div>
    </div>
  );
}