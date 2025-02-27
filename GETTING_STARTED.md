# 🖼️ Coordinape Frames

This repository contains Farcaster Frames for Coordinape, built using the Frames v2 SDK.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) package manager
- [ngrok](https://ngrok.com/) for local development testing

### Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd [repo-name]
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. In a separate terminal, start ngrok to expose your local server:

```bash
ngrok http 3000
```

### 🎮 Testing Your Frames

1. Open the [Frame Playground](https://warpcast.com/~/developers/frame-playground) on Warpcast (Mobile only)
2. Enter your ngrok URL
3. Tap "Launch" to test your frame

### 📦 Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── components/        # React components
│   ├── providers/        # App providers (Wagmi, etc.)
│   └── page.tsx         # Main app page
├── lib/                  # Utility functions and shared code
└── public/              # Static assets
```

### 🛠️ Development Guidelines

1. **Frame Components**: Create new frame components in `app/components/frames/`
2. **Testing**: Test your frames thoroughly in the Warpcast playground before deploying
3. **State Management**: Use React hooks for local state, context for global state
4. **Styling**: Use Tailwind CSS for styling components

### 🔑 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Add any required environment variables here
```

### 📚 Useful Resources

- [Frames v2 Documentation](https://github.com/farcasterxyz/frames/wiki/frames-v2-developer-playground-preview)
- [Frame Playground](https://warpcast.com/~/developers/frame-playground)
- [Frame SDK Reference](https://github.com/farcasterxyz/frames/)

### 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly in the Frame Playground
4. Submit a pull request

### 📝 License

[Add your license information here]
