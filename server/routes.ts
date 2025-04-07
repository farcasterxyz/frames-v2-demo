import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { handleFrameAction } from "./api/frame";
import { handleSignerRequest, handleCastRequest } from "./api/signer";
import { prisma } from "./db";
import path from "path";
import fs from "fs";
import { 
  getTopScores, 
  addHighScore, 
  getUserByAddress, 
  createOrUpdateUser,
  useGameCoin,
  refreshUserCoins
} from "./utils";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Farcaster Frame v2 (mini-app) Signer endpoints
  app.get("/api/signer", (req: Request, res: Response) => {
    handleSignerRequest(req, res);
  });
  
  app.post("/api/signer", (req: Request, res: Response) => {
    handleSignerRequest(req, res);
  });
  
  app.post("/api/cast", (req: Request, res: Response) => {
    handleCastRequest(req, res);
  });
  
  // Authentication and wallet endpoints
  app.post("/api/auth/wallet", async (req: Request, res: Response) => {
    try {
      const { address, username } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Wallet address is required" });
      }
      
      const user = await createOrUpdateUser({ 
        address,
        username
      });
      
      return res.json({
        user: {
          id: user.id,
          address: user.address,
          username: user.username || "Anonymous",
          coins: user.coins,
          farcasterFid: user.farcasterFid
        }
      });
    } catch (error) {
      console.error("Error in wallet auth:", error);
      return res.status(500).json({ error: "Failed to authenticate with wallet" });
    }
  });
  
  // Farcaster authentication endpoint
  app.post("/api/auth/farcaster", async (req: Request, res: Response) => {
    try {
      const { address, fid, username } = req.body;
      
      if (!address || !fid) {
        return res.status(400).json({ 
          error: "Wallet address and Farcaster ID (fid) are required" 
        });
      }
      
      const user = await createOrUpdateUser({
        address,
        farcasterFid: fid,
        fcastUsername: username
      });
      
      return res.json({
        user: {
          id: user.id,
          address: user.address,
          username: user.username || user.fcastUsername || "Anonymous",
          coins: user.coins,
          farcasterFid: user.farcasterFid
        }
      });
    } catch (error) {
      console.error("Error in Farcaster auth:", error);
      return res.status(500).json({ error: "Failed to authenticate with Farcaster" });
    }
  });
  
  // Get user data
  app.get("/api/user/:address", async (req: Request, res: Response) => {
    try {
      const address = req.params.address;
      const user = await getUserByAddress(address);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      return res.json({
        user: {
          id: user.id,
          address: user.address,
          username: user.username || user.fcastUsername || "Anonymous",
          coins: user.coins,
          farcasterFid: user.farcasterFid
        }
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }
  });
  
  // Use a coin to play the game
  app.post("/api/game/use-coin", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        console.log('No userId provided in coin usage request');
        return res.status(400).json({ error: "User ID is required" });
      }
      
      console.log(`Attempting to use coin for user ${userId}`);
      
      // First, try to refresh coins based on WIB timezone
      try {
        await refreshUserCoins(userId);
        console.log('Refreshed user coins based on timezone');
      } catch (refreshError) {
        console.error('Error refreshing user coins:', refreshError);
        // Continue anyway as useGameCoin will also try to refresh
      }
      
      const updatedUser = await useGameCoin(userId);
      
      if (!updatedUser) {
        console.log(`User ${userId} has no coins available`);
        return res.status(403).json({ error: "No coins available" });
      }
      
      console.log(`Coin used for user ${userId}, coins remaining: ${updatedUser.coins}`);
      return res.json({
        success: true,
        coins: updatedUser.coins
      });
    } catch (error) {
      console.error("Error using coin:", error);
      return res.status(500).json({ error: "Failed to use coin" });
    }
  });
  
  // Frame API endpoint for Farcaster Frames
  app.post("/api/frame", async (req: Request, res: Response) => {
    await handleFrameAction(req, res);
  });
  
  // Default frame endpoint for initial load
  app.get("/api/frame", (req: Request, res: Response) => {
    // Redirect to the client app where the frame will be rendered
    res.redirect("/");
  });
  
  // High score API endpoints
  // GET - retrieve high scores
  app.get("/api/highscores", async (req: Request, res: Response) => {
    try {
      // Get the limit from the query parameter, default to 10 if not provided
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Ensure the limit is within a reasonable range (1-100)
      const safeLimit = Math.max(1, Math.min(100, limit));
      
      const topScores = await getTopScores(safeLimit);
      
      // Convert to simpler format for the frontend
      const formattedScores = topScores.map(score => ({
        id: score.id, // Include ID for key prop in React
        name: score.user.username || score.user.fcastUsername || "Anonymous",
        score: score.score,
        date: score.gameDate
      }));
      
      res.json(formattedScores);
    } catch (error) {
      console.error("Error fetching high scores:", error);
      return res.status(500).json({ error: "Failed to fetch high scores" });
    }
  });
  
  // GET - retrieve archived leaderboards
  app.get("/api/highscores/archives", async (req: Request, res: Response) => {
    try {
      // Get query parameters
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const weekNumber = req.query.week ? parseInt(req.query.week as string) : undefined;
      
      // Build the query
      const whereClause: any = {};
      if (year !== undefined) {
        whereClause.year = year;
      }
      if (weekNumber !== undefined) {
        whereClause.weekNumber = weekNumber;
      }
      
      // Get archives from database
      const archives = await prisma.leaderboardArchive.findMany({
        where: whereClause,
        orderBy: [
          { year: 'desc' },
          { weekNumber: 'desc' }
        ],
        take: 10
      });
      
      // Process the archives
      const formattedArchives = archives.map(archive => {
        const scores = JSON.parse(archive.scores);
        return {
          id: archive.id,
          weekNumber: archive.weekNumber,
          year: archive.year,
          date: archive.createdAt,
          scores: scores
        };
      });
      
      return res.json(formattedArchives);
    } catch (error) {
      console.error("Error fetching leaderboard archives:", error);
      return res.status(500).json({ error: "Failed to fetch leaderboard archives" });
    }
  });
  
  // POST - submit a new high score
  app.post("/api/highscores", async (req: Request, res: Response) => {
    try {
      const { name, score, userId } = req.body;
      
      // If we have a userId, use that
      if (userId) {
        await addHighScore(userId, score);
        return res.status(200).json({ success: true });
      }
      
      // Otherwise for non-logged in users, create a temporary user with just a username
      if (!name || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Invalid high score data' });
      }
      
      const tempUser = await createOrUpdateUser({
        address: `anon_${Date.now()}`, // Use a temporary address
        username: name
      });
      
      await addHighScore(tempUser.id, score);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error submitting high score:', error);
      return res.status(500).json({ error: 'Failed to submit high score' });
    }
  });
  
  // Serve Farcaster configuration JSON file for Warpcast/Farcaster validation
  app.get("/farcaster.json", (req: Request, res: Response) => {
    const farcasterConfigPath = path.join(process.cwd(), 'farcaster.json');
    try {
      const configData = fs.readFileSync(farcasterConfigPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      return res.send(configData);
    } catch (error) {
      console.error("Error serving farcaster.json:", error);
      return res.status(404).send({ error: "Farcaster configuration not found" });
    }
  });
  
  // Serve Farcaster config at the well-known path (new standard)
  app.get("/.well-known/farcaster/farcaster.json", (req: Request, res: Response) => {
    const farcasterConfigPath = path.join(process.cwd(), '.well-known', 'farcaster', 'farcaster.json');
    try {
      const configData = fs.readFileSync(farcasterConfigPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      return res.send(configData);
    } catch (error) {
      console.error("Error serving farcaster.json from well-known path:", error);
      return res.status(404).send({ error: "Farcaster configuration not found" });
    }
  });
  
  // Webhook endpoint for Farcaster Frames
  app.post("/api/webhook", async (req: Request, res: Response) => {
    // Import the webhook handler here to avoid circular dependencies
    const { handleWebhook } = require('./api/webhook');
    await handleWebhook(req, res);
  });

  const httpServer = createServer(app);

  return httpServer;
}
