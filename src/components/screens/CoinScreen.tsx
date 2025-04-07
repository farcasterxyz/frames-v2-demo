import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/AuthProvider';
import { Share2 } from 'lucide-react';

const CoinScreen = () => {
  const { isLoggedIn, coins, userId, lastCoinReset } = useAuth();
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  
  useEffect(() => {
    // Function to calculate time until next reset (00:00 Jakarta/WIB time)
    const calculateTimeUntilReset = () => {
      if (!lastCoinReset) {
        setTimeUntilReset('--:--:--');
        return;
      }
      
      // Get current date in Jakarta/WIB timezone (UTC+7)
      const jakartaOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
      const now = new Date();
      const jakartaTime = new Date(now.getTime() + jakartaOffset);
      
      // Set next reset time to midnight (00:00) Jakarta time
      const nextReset = new Date(jakartaTime);
      nextReset.setUTCHours(17, 0, 0, 0); // 17:00 UTC = 00:00 Jakarta (WIB)
      
      // If the next reset time is in the past, add one day
      if (nextReset.getTime() <= jakartaTime.getTime()) {
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
      }
      
      // Calculate time difference
      const diffMs = nextReset.getTime() - jakartaTime.getTime();
      
      if (diffMs <= 0) {
        setTimeUntilReset('00:00:00');
        return;
      }
      
      // Convert to hours, minutes, seconds
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      setTimeUntilReset(
        `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`
      );
    };
    
    // Update time every second
    calculateTimeUntilReset();
    const interval = setInterval(calculateTimeUntilReset, 1000);
    
    return () => clearInterval(interval);
  }, [lastCoinReset]);
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Zombie Defense Game',
        text: 'Try the exciting Zombie Defense game!',
        url: window.location.href,
      })
      .then(() => console.log('Successfully shared'))
      .catch(error => console.log('Error sharing:', error));
    } else {
      // Copy referral link to clipboard if Web Share API is not supported
      const referralLink = `${window.location.href}?ref=${userId}`;
      navigator.clipboard.writeText(referralLink)
        .then(() => alert('Referral link copied to clipboard!'))
        .catch(error => console.log('Error copying to clipboard:', error));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-white mb-4">Login Required</h2>
          <p className="text-gray-300 text-center mb-6">
            Please login to view and manage your coins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-white mb-4">
          Your Coins
        </h2>
        
        <div className="mb-6 flex flex-col items-center">
          <div className="text-yellow-400 text-5xl font-bold mb-2">{coins}</div>
          <p className="text-gray-300">coins remaining</p>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Coin Update</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Reset in:</span>
              <span className="text-white font-mono">{timeUntilReset}</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              You will receive 3 new coins at 00:00 WIB (Jakarta time) every day.
            </p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Share With Friends</h3>
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-lg flex items-center justify-center font-bold text-white bg-green-600 hover:bg-green-700"
          >
            <Share2 size={18} className="mr-2" />
            Invite Friends
          </button>
          <p className="text-gray-400 text-sm mt-2 text-center">
            Share the game with your friends!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoinScreen;