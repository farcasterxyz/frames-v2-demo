import React from 'react';
import { useAuth } from '../../lib/providers/AuthProvider';
import { Button } from '../ui/button';

interface WalletConnectProps {
  className?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ className }) => {
  const { isLoggedIn, userAddress, username, coins, login, logout } = useAuth();

  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className || ''}`}>
      {isLoggedIn ? (
        <div className="flex items-center gap-4 bg-gray-800/60 p-3 rounded-lg w-full justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {username || formatAddress(userAddress || '')}
            </span>
            <span className="text-xs text-green-500">
              {coins} coins available
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="border-red-500 text-red-500 hover:bg-red-500/20"
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          <p className="text-white mb-3 text-center">Connect your wallet to track your scores!</p>
          <Button 
            onClick={login}
            className="bg-yellow-600 hover:bg-yellow-500 text-white py-6 px-8 text-lg font-bold rounded-lg shadow-lg shadow-yellow-900/30 w-64 transition-transform transform hover:scale-105"
          >
            Connect Wallet
          </Button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;