import { prisma } from './db';
import { User } from '@prisma/client';

/**
 * Check if user's coins need to be reset (reset at 00:00 WIB/Jakarta time)
 * Each user gets 3 coins per day
 */
export async function refreshUserCoins(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Set timezone to Jakarta/WIB (UTC+7)
  const jakartaOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
  
  // Get current time in Jakarta/WIB timezone
  const now = new Date();
  const jakartaTime = new Date(now.getTime() + jakartaOffset);
  
  // Get last reset time in Jakarta/WIB timezone
  let lastResetTimeJakarta = null;
  if (user.lastCoinReset) {
    lastResetTimeJakarta = new Date(user.lastCoinReset.getTime() + jakartaOffset);
  }
  
  // Reset coins if:
  // 1. No last reset time exists, or
  // 2. The lastResetTime date differs from current date in Jakarta time
  const shouldResetCoins = !lastResetTimeJakarta || 
    lastResetTimeJakarta.getDate() !== jakartaTime.getDate() ||
    lastResetTimeJakarta.getMonth() !== jakartaTime.getMonth() ||
    lastResetTimeJakarta.getFullYear() !== jakartaTime.getFullYear();

  console.log(`Checking coin reset for user ${userId}:`);
  console.log(`- Current Jakarta time: ${jakartaTime.toISOString()}`);
  if (lastResetTimeJakarta) {
    console.log(`- Last reset Jakarta time: ${lastResetTimeJakarta.toISOString()}`);
  } else {
    console.log(`- No previous reset time`);
  }
  console.log(`- Should reset coins: ${shouldResetCoins}`);

  if (shouldResetCoins) {
    console.log(`Resetting coins for user ${userId} to 3`);
    return prisma.user.update({
      where: { id: userId },
      data: {
        coins: 3, // Reset to 3 coins
        lastCoinReset: now // Store current time in UTC (not Jakarta time)
      }
    });
  }

  return user;
}

/**
 * Deducts a coin from the user
 * @returns Updated user or null if no coins available
 */
export async function useGameCoin(userId: string): Promise<User | null> {
  // First refresh coins if needed
  const user = await refreshUserCoins(userId);
  
  // Check if user has coins
  if (user.coins <= 0) {
    return null;
  }
  
  // Deduct a coin
  return prisma.user.update({
    where: { id: userId },
    data: {
      coins: user.coins - 1
    }
  });
}

// Flag to check if we've ever run the reset check in this server instance
let hasInitializedReset = false;

/**
 * Check if weekly leaderboard reset is needed (reset every Monday at 00:00 WIB/Jakarta time)
 * Returns true if reset was performed, false otherwise
 */
export async function checkWeeklyLeaderboardReset(): Promise<boolean> {
  // Skip checking if we've already initialized
  if (hasInitializedReset) {
    return false;
  }
  
  // Set the flag to prevent future checks during this server instance
  hasInitializedReset = true;

  try {
    // Get the last reset timestamp from the database or create it if it doesn't exist
    const resetConfigKey = 'lastLeaderboardReset';
    
    // Check if config exists
    let resetConfig = await prisma.systemConfig.findUnique({
      where: { key: resetConfigKey }
    });
    
    // If config doesn't exist, create it with the current time
    if (!resetConfig) {
      console.log("No reset config found, initializing with current time");
      await prisma.systemConfig.create({
        data: {
          key: resetConfigKey,
          value: new Date().toISOString()
        }
      });
      return false;
    }

    // For manual resets (will only execute on Mondays at midnight WIB):
    // Set timezone to Jakarta/WIB (UTC+7)
    const jakartaOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    
    // Get current time in Jakarta/WIB timezone
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + jakartaOffset);
    
    // Get last reset time in Jakarta/WIB timezone
    const lastResetTime = new Date(resetConfig.value);
    const lastResetTimeJakarta = new Date(lastResetTime.getTime() + jakartaOffset);
    
    // Calculate if we should reset - every Monday (day 1) at 00:00 WIB
    const isMonday = jakartaTime.getDay() === 1; // 0 is Sunday, 1 is Monday
    const isMidnight = jakartaTime.getHours() === 0 && 
                      jakartaTime.getMinutes() < 5; // Allow 5 minute window
    
    // Only reset if it's Monday at midnight and we haven't reset yet this week
    const daysSinceReset = dateDiffInDays(lastResetTimeJakarta, jakartaTime);
    const shouldReset = isMonday && isMidnight && daysSinceReset >= 6;
    
    if (shouldReset) {
      console.log('Performing weekly leaderboard reset...');
      
      try {
        // Archive current week's high scores
        const topScores = await prisma.highScore.findMany({
          take: 100,
          orderBy: {
            score: 'desc'
          },
          include: {
            user: {
              select: {
                username: true,
                fcastUsername: true
              }
            }
          }
        });
        
        // Store archive record with week number and year
        const weekNumber = getWeekNumber(jakartaTime);
        const year = jakartaTime.getFullYear();
        
        await prisma.leaderboardArchive.create({
          data: {
            weekNumber,
            year,
            scores: JSON.stringify(topScores.map(score => ({
              score: score.score,
              username: score.user.username || score.user.fcastUsername || "Anonymous",
              date: score.gameDate
            })))
          }
        });
        
        // Clear all high scores
        await prisma.highScore.deleteMany({});
        
        // Update the last reset time
        await prisma.systemConfig.update({
          where: { key: resetConfigKey },
          data: { value: now.toISOString() }
        });
        
        console.log('Weekly leaderboard reset complete!');
        return true;
      } catch (error) {
        console.error('Error during weekly leaderboard reset:', error);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in checkWeeklyLeaderboardReset:', error);
    return false;
  }
}

// Helper function to calculate difference in days between two dates
function dateDiffInDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  
  return Math.floor((utcB - utcA) / MS_PER_DAY);
}

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get top scores from the leaderboard
 * Also checks if weekly reset is needed
 */
export async function getTopScores(limit = 10) {
  // Only check for weekly reset once per server start
  // Use a static variable to track if we've checked
  if (!getTopScores.hasCheckedReset) {
    try {
      await checkWeeklyLeaderboardReset();
      getTopScores.hasCheckedReset = true;
    } catch (error) {
      console.error('Error checking weekly leaderboard reset:', error);
      // Continue with getting scores even if reset check fails
    }
  }
  
  return prisma.highScore.findMany({
    take: limit,
    orderBy: {
      score: 'desc'
    },
    include: {
      user: {
        select: {
          username: true,
          fcastUsername: true
        }
      }
    }
  });
}

// Add static property to function
getTopScores.hasCheckedReset = false;

/**
 * Add a high score to the leaderboard
 */
export async function addHighScore(
  userId: string, 
  score: number
) {
  return prisma.highScore.create({
    data: {
      score,
      userId
    }
  });
}

/**
 * Get a user by their Ethereum address
 */
export async function getUserByAddress(address: string) {
  return prisma.user.findUnique({
    where: {
      address: address.toLowerCase()
    }
  });
}

/**
 * Creates a new user or returns existing one
 */
export async function createOrUpdateUser(data: {
  address: string;
  username?: string;
  farcasterFid?: number;
  fcastUsername?: string;
}) {
  const address = data.address.toLowerCase();
  
  const existingUser = await prisma.user.findUnique({
    where: { address }
  });
  
  if (existingUser) {
    return prisma.user.update({
      where: { address },
      data: {
        ...data,
        username: data.username || existingUser.username,
        farcasterFid: data.farcasterFid || existingUser.farcasterFid,
        fcastUsername: data.fcastUsername || existingUser.fcastUsername,
        address // Ensure address is lowercase
      }
    });
  }
  
  return prisma.user.create({
    data: {
      ...data,
      address, // Ensure address is lowercase
      coins: 3,
      lastCoinReset: new Date()
    }
  });
}