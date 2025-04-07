import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useZombieGame } from '@/lib/stores/useZombieGame';
import { useAuth } from '@/lib/providers/AuthProvider';
import WalletConnect from '../auth/WalletConnect';

interface HomeScreenProps {
  onPlayGame: () => void;
}

const HomeScreen = ({ onPlayGame }: HomeScreenProps) => {
  const [showGuide, setShowGuide] = useState(false);
  const { canPlay } = useZombieGame();
  const { isLoggedIn, coins, userAddress } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 relative">
      {/* Background overlay with zombie image and gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-25"
        style={{ 
          backgroundImage: 'url(/images/zombie-background.jpg)', 
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Dark overlay for better readability and theme consistency */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-green-950/95 to-black/95 z-0"></div>
      
      {/* Content with higher z-index to show above background */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        <button 
          className="absolute top-4 right-4 text-white hover:text-green-400 transition-colors"
          onClick={() => setShowGuide(!showGuide)}
        >
          <HelpCircle size={24} />
        </button>
        
        <div className="mb-8 flex flex-col items-center">
          <img 
            src="/images/game-title.png" 
            alt="Zombie Defense" 
            className="h-auto max-w-full mb-3"
            style={{ width: '280px' }} 
          />
          <p className="text-gray-300 text-center text-lg">Protect civilians from zombie attacks!</p>
        </div>
        
        {isLoggedIn ? (
          <div className="mb-8 text-center bg-green-900/60 p-4 rounded-lg w-full max-w-sm border border-green-700">
            <p className="text-white mb-2 text-lg">Coins remaining: <span className="text-yellow-400 font-bold">{coins}</span></p>
            <p className="text-gray-400 text-sm truncate">Wallet: {userAddress}</p>
          </div>
        ) : (
          <div className="mb-8 w-full max-w-sm">
            <WalletConnect className="w-full" />
          </div>
        )}
        
        <button
          className={`w-64 py-4 rounded-lg font-bold text-white text-xl transition-transform transform hover:scale-105 ${
            canPlay 
              ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/50' 
              : 'bg-gray-600 cursor-not-allowed'
          }`}
          onClick={canPlay ? onPlayGame : undefined}
          disabled={!canPlay}
        >
          {canPlay ? 'PLAY' : 'Not Enough Coins'}
        </button>
      </div>
      
      {/* Game guide modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-green-950/95 z-50 p-6 flex flex-col justify-center border-2 border-green-800">
          <h2 className="text-2xl font-bold text-green-500 mb-4">How to Play</h2>
          <ul className="text-white space-y-2 mb-6">
            <li>• Shoot zombies (green) to earn points</li>
            <li>• Avoid shooting civilians (red)</li>
            <li>• Don't let zombies reach the bottom of the screen</li>
            <li>• Get the highest score possible!</li>
          </ul>
          <h3 className="text-xl font-bold text-green-500 mb-2">Points:</h3>
          <ul className="text-white space-y-2 mb-6">
            <li>• +10 points for each zombie shot</li>
            <li>• -50 points if you shoot a civilian</li>
            <li>• Lose a life if a zombie reaches the bottom</li>
          </ul>
          <button 
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg mt-4 self-center"
            onClick={() => setShowGuide(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;