import { Request, Response } from 'express';
import { getTopScores } from '../utils';

// Define our own interfaces since we're not using the actual Frame SDK
interface FrameActionBody {
  buttonIndex?: number;
  inputText?: string;
  state?: string | any;
}

// Define the URL of your app for the frame
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

export async function handleFrameAction(req: Request, res: Response) {
  try {
    // In a real implementation, we'd use proper verification
    // For this demo, we'll just process the button index directly
    const frameMessage = req.body as FrameActionBody;
    
    // Log the message for debugging
    console.log('Frame message received:', frameMessage);
    
    // Process based on button index and current state and get HTML response
    let html: string;
    
    if (!frameMessage || !frameMessage.buttonIndex) {
      // Default welcome frame
      html = generateWelcomeFrame();
    } else {
      // Parse state if it exists and is a string, otherwise use default
      const state = frameMessage.state && typeof frameMessage.state === 'string' 
        ? JSON.parse(frameMessage.state) 
        : { page: 'welcome' };
      
      switch (frameMessage.buttonIndex) {
        case 1:
          if (state.page === 'highscores') {
            // Back to welcome from high scores
            html = generateWelcomeFrame();
          } else {
            // Play game
            html = generateGameFrame();
          }
          break;
          
        case 2:
          // View high scores - this one is async
          html = await generateHighScoresFrame();
          break;
          
        default:
          // Default to welcome
          html = generateWelcomeFrame();
      }
    }
    
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error processing frame action:', error);
    return res.status(400).send(generateErrorFrame());
  }
}

// Generate frame HTML response manually
function generateFrameHtml(options: {
  buttons: string[],
  image: string,
  inputText?: string,
  state?: Record<string, any>,
  isApp?: boolean // New parameter to indicate if this is a mini-app (Frame v2)
}) {
  const { buttons, image, inputText, state, isApp = true } = options;
  
  // Create button HTML
  const buttonHtml = buttons.map((text, index) => 
    `<meta property="fc:frame:button:${index + 1}" content="${text}" />`
  ).join('\n');
  
  // Create input HTML if provided
  const inputHtml = inputText 
    ? `<meta property="fc:frame:input:text" content="${inputText}" />`
    : '';
  
  // Create state if provided
  const stateHtml = state
    ? `<meta property="fc:frame:state" content="${JSON.stringify(state)}" />`
    : '';
  
  // Add mini-app (Frame v2) specific meta tag if isApp is true
  const appTypeHtml = isApp 
    ? `<meta property="fc:frame:type" content="app" />`
    : '';
  
  // Domain verification - This should be your verified domain in developer.farcaster.xyz
  const VERIFIED_DOMAIN = process.env.VERIFIED_DOMAIN || APP_URL;
  
  // Add image validator URL with your verified domain
  const imageUrl = image.startsWith('http') 
    ? image 
    : `${VERIFIED_DOMAIN}${image.startsWith('/') ? '' : '/'}${image}`;
  
  // Combine all HTML
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Zombie Defense Game</title>
  
  <!-- Frame v2 Meta Tags -->
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:post_url" content="${VERIFIED_DOMAIN}/api/frame" />
  ${appTypeHtml}
  ${buttonHtml}
  ${inputHtml}
  ${stateHtml}
  
  <!-- Add Open Graph Tags for better sharing -->
  <meta property="og:title" content="Zombie Defense Game" />
  <meta property="og:description" content="Defend civilians from zombie invasion in this action game!" />
  <meta property="og:image" content="${imageUrl}" />
</head>
<body>
  <h1>Zombie Defense Game</h1>
  <p>This is a Farcaster Frame v2 Mini-App. View this in a compatible client.</p>
</body>
</html>
  `.trim();
}

// Generate the welcome frame
function generateWelcomeFrame() {
  return generateFrameHtml({
    buttons: ['Play Game', 'View High Scores'],
    image: `${APP_URL}/frame-images/welcome.svg`,
    inputText: 'Enter your name (optional)',
    state: { page: 'welcome' }
  });
}

// Generate the high scores frame
async function generateHighScoresFrame() {
  try {
    // Get top scores from the database
    const topScores = await getTopScores(5);
    
    // Create a formatted scores string for display 
    // (this won't actually be visible in the frame, but useful for debugging)
    const scoresText = topScores
      .map((score, index) => {
        const name = score.user.username || score.user.fcastUsername || "Anonymous";
        return `${index + 1}. ${name}: ${score.score}`;
      })
      .join('\n');
      
    return generateFrameHtml({
      buttons: ['Back', 'Play Game'],
      image: `${APP_URL}/frame-images/highscores.svg`,
      state: { page: 'highscores', scoresText }
    });
  } catch (error) {
    console.error("Error generating high scores frame:", error);
    // Fall back to default frame if there's an error
    return generateFrameHtml({
      buttons: ['Back', 'Play Game'],
      image: `${APP_URL}/frame-images/highscores.svg`,
      state: { page: 'highscores', error: true }
    });
  }
}

// Generate the game frame
function generateGameFrame() {
  return generateFrameHtml({
    buttons: ['Start Game'],
    image: `${APP_URL}/frame-images/game.svg`,
    state: { page: 'game' }
  });
}

// Generate error frame
function generateErrorFrame() {
  return generateFrameHtml({
    buttons: ['Try Again'],
    image: `${APP_URL}/frame-images/error.svg`
  });
}

// Legacy function for compatibility - don't add directly to in-memory array anymore,
// but redirect to the database utility function
export function addHighScore(name: string, score: number) {
  console.log(`Legacy high score submission: ${name} - ${score}`);
  // In a real app, we'd use the database utility here, but we'll
  // let the actual API handle this to avoid circular dependencies
}