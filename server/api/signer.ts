import { Request, Response } from 'express';
import { generateNonce } from '@farcaster/auth-kit';
import { createOrUpdateUser } from '../utils';

// We'll use environment variables for signer keys and Farcaster developer FID
const FARCASTER_DEVELOPER_FID = Number(process.env.FARCASTER_DEVELOPER_FID || '0');

/**
 * Process a Sign In With Farcaster (SIWF) request
 * This endpoint is used by the Farcaster mini-app to verify user identity
 */
export async function handleSignerRequest(req: Request, res: Response) {
  try {
    // Determine the type of request (nonce generation or verification)
    const { type } = req.query;

    if (type === 'nonce') {
      // Generate and return a nonce for the client to sign
      const nonce = generateNonce();
      return res.status(200).json({ nonce });
    } else if (type === 'verify') {
      // In a real implementation, we would verify the signature against Farcaster
      // Here we're simplifying for the demo
      const { fid, username, address } = req.body;
      
      if (!fid || !address) {
        return res.status(400).json({ 
          error: 'Missing Farcaster ID (fid) or wallet address' 
        });
      }
      
      try {
        // Create or update the user
        const user = await createOrUpdateUser({
          address,
          farcasterFid: fid,
          fcastUsername: username || 'Farcaster User'
        });
        
        return res.status(200).json({
          success: true,
          userId: user.id,
          username: user.username || user.fcastUsername,
          message: 'Successfully authenticated with Farcaster'
        });
      } catch (dbError) {
        console.error('Database error during Farcaster authentication:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Error storing user data'
        });
      }
    } else {
      return res.status(400).json({ error: 'Invalid request type' });
    }
  } catch (error) {
    console.error('Error in signer endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle requests for mini-apps to create Farcaster casts
 * This is used for posting scores or other game events to Farcaster
 */
export async function handleCastRequest(req: Request, res: Response) {
  try {
    // This would require the developer keys configured
    if (!FARCASTER_DEVELOPER_FID) {
      return res.status(500).json({ 
        error: 'Farcaster developer credentials not configured' 
      });
    }
    
    const { message, userId } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({ error: 'Missing message or user ID' });
    }
    
    // In a real implementation, we would use Farcaster SDK to create a cast
    // For now, just log it and return success
    console.log(`Would create cast for user ${userId}: "${message}"`);
    
    return res.status(200).json({ 
      success: true,
      message: 'Cast created successfully',
      // In a real implementation, we'd return the cast ID
      castId: `mock-cast-${Date.now()}` 
    });
  } catch (error) {
    console.error('Error in cast endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}