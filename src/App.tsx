import { useState, useEffect } from 'react';
import ZombieDefense from "./components/game/ZombieDefense";
import FarcasterFrame from "./components/frame/FarcasterFrame";
import { AuthProvider } from "./lib/providers/AuthProvider";
import Navbar from "./components/ui/Navbar";
import HomeScreen from "./components/screens/HomeScreen";
import CoinScreen from "./components/screens/CoinScreen";
import LeaderboardScreen from "./components/screens/LeaderboardScreen";
import { useZombieGame } from "./lib/stores/useZombieGame";
import "@fontsource/inter";
import "./index.css";

// Available screens/pages in the app
type AppScreen = 'home' | 'game' | 'coins' | 'leaderboard';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [showFrame, setShowFrame] = useState(false);
  const { gameOver } = useZombieGame();
  
  // Check URL parameters to determine if we should show the frame
  useEffect(() => {
    const url = new URL(window.location.href);
    const frameParam = url.searchParams.get('frame');
    if (frameParam === 'true') {
      setShowFrame(true);
    }
  }, []);
  
  // No longer automatically returning to home screen when game over
  // Let player manually navigate back via UI
  useEffect(() => {
    // Just log game state changes for debugging
    if (gameOver && currentScreen === 'game') {
      console.log('Game over state detected');
    }
  }, [gameOver, currentScreen]);
  
  const handlePlayGame = () => {
    setCurrentScreen('game');
  };
  
  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as AppScreen);
  };
  
  // Render the appropriate screen based on current state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'game':
        return <ZombieDefense onNavigateHome={() => handleNavigate('home')} />;
      case 'coins':
        return <CoinScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      case 'home':
      default:
        return <HomeScreen onPlayGame={handlePlayGame} />;
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
      <div className="relative w-full h-full max-w-[500px] overflow-hidden">
        {/* Main content area */}
        {renderScreen()}
        
        {/* Navbar - only show when not in game */}
        {currentScreen !== 'game' && (
          <Navbar onNavigate={handleNavigate} activePage={currentScreen} />
        )}
        
        {/* Show the Farcaster Frame UI when requested via URL param */}
        {showFrame && <FarcasterFrame isVisible={true} />}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
