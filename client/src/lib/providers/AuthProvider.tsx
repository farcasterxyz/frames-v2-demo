import React, { createContext, useContext, useEffect, useState } from 'react';

// Define what the auth context will contain
interface AuthContextType {
  // User data
  isLoggedIn: boolean;
  userAddress: string | null;
  username: string | null;
  userId: string | null;
  coins: number;
  lastCoinReset: Date | null;
  
  // Auth actions
  login: () => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  
  // Game actions
  useGameCoin: () => Promise<boolean>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userAddress: null,
  username: null, 
  userId: null,
  coins: 0,
  lastCoinReset: null,
  
  login: async () => {},
  logout: () => {},
  refreshUserData: async () => {},
  useGameCoin: async () => false,
});

// Mock implementation for now - will be replaced with actual Web3/Farcaster integration
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [coins, setCoins] = useState(3); // Default 3 coins
  const [lastCoinReset, setLastCoinReset] = useState<Date | null>(null);
  
  // Simulate login - would use real wallet connection in production
  const login = async () => {
    try {
      // Simulate successful login with a mock address
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      setUserAddress(mockAddress);
      await refreshUserData();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };
  
  const logout = () => {
    setIsLoggedIn(false);
    setUserAddress(null);
    setUsername(null);
    setUserId(null);
    setCoins(0);
    setLastCoinReset(null);
  };
  
  const refreshUserData = async () => {
    if (!userAddress) return;
    
    try {
      // Call our backend to get user data based on their wallet address
      const response = await fetch(`/api/user/${userAddress}`);
      
      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUsername(data.user.username);
        setUserId(data.user.id);
        setCoins(data.user.coins);
        setLastCoinReset(data.user.lastCoinReset ? new Date(data.user.lastCoinReset) : null);
      } else if (response.status === 404) {
        // User not found, create a new user
        const createResponse = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: userAddress })
        });
        
        if (createResponse.ok) {
          const data = await createResponse.json();
          setIsLoggedIn(true);
          setUsername(data.user.username);
          setUserId(data.user.id);
          setCoins(data.user.coins);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };
  
  const useGameCoin = async (): Promise<boolean> => {
    // Allow guest play if not logged in
    if (!isLoggedIn || !userId) {
      console.log('Guest play - no login, skipping coin usage');
      return true;
    }
    
    console.log('Attempting to use a coin, userId:', userId);
    
    try {
      const response = await fetch('/api/game/use-coin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Coin used successfully, coins remaining:', data.coins);
        setCoins(data.coins);
        return true;
      } else {
        console.error('Failed to use coin:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to use game coin:', error);
      return false;
    }
  };
  
  // Expose the auth context to the window for other components
  useEffect(() => {
    // @ts-ignore - Adding to window for global access
    window.authContext = {
      isLoggedIn,
      userAddress,
      username,
      userId,
      coins,
      lastCoinReset,
      login,
      logout,
      refreshUserData,
      useGameCoin
    };
  }, [isLoggedIn, userAddress, username, userId, coins, lastCoinReset]);
  
  const contextValue: AuthContextType = {
    isLoggedIn,
    userAddress,
    username,
    userId,
    coins,
    lastCoinReset,
    login,
    logout,
    refreshUserData,
    useGameCoin
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);