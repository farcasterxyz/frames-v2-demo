import { Request, Response } from 'express';

/**
 * Handles Farcaster webhook events
 * These could be triggered by the Farcaster Hub when events occur
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    console.log("Farcaster webhook event received:", JSON.stringify(req.body, null, 2));
    
    // Basic validation that it's a Farcaster webhook
    if (!req.body || !req.body.event) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
    
    // Process different event types
    const { event } = req.body;
    
    switch (event.type) {
      case 'frame_action':
        await handleFrameAction(event);
        break;
        
      case 'mention':
        await handleMention(event);
        break;
        
      case 'reaction':
        await handleReaction(event);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Always acknowledge receipt
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Still return 200 to avoid retries
    return res.status(200).json({ success: false, error: "Error processing webhook" });
  }
}

/**
 * Handle frame action events
 */
async function handleFrameAction(event: any) {
  console.log("Processing frame action:", event);
  // Implement your frame action handling logic here
  // For example, you might want to record analytics or trigger some game action
}

/**
 * Handle mentions of your app in casts
 */
async function handleMention(event: any) {
  console.log("Processing mention:", event);
  // Implement your mention handling logic here
  // For example, you might want to respond to the cast or record the mention
}

/**
 * Handle reactions to your app's casts
 */
async function handleReaction(event: any) {
  console.log("Processing reaction:", event);
  // Implement your reaction handling logic here
  // For example, you might want to track popular casts or thank users for likes
}