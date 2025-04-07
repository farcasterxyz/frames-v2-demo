import { useState } from 'react';
import { Home, Coins, Trophy } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

const Navbar = ({ onNavigate, activePage }: NavbarProps) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-green-950 py-2 flex justify-around items-center z-50 border-t border-green-800">
      <button 
        className={`flex flex-col items-center ${activePage === 'home' ? 'text-green-500' : 'text-gray-400'}`}
        onClick={() => onNavigate('home')}
      >
        <Home size={24} />
        <span className="text-xs mt-1">Home</span>
      </button>
      
      <button 
        className={`flex flex-col items-center ${activePage === 'coins' ? 'text-green-500' : 'text-gray-400'}`}
        onClick={() => onNavigate('coins')}
      >
        <Coins size={24} />
        <span className="text-xs mt-1">Coins</span>
      </button>
      
      <button 
        className={`flex flex-col items-center ${activePage === 'leaderboard' ? 'text-green-500' : 'text-gray-400'}`}
        onClick={() => onNavigate('leaderboard')}
      >
        <Trophy size={24} />
        <span className="text-xs mt-1">Rankings</span>
      </button>
    </div>
  );
};

export default Navbar;