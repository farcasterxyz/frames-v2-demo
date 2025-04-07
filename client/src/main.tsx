import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { useAudio } from "./lib/stores/useAudio";

// Make the audio store available globally for easy access
// This helps prevent circular dependencies
// @ts-ignore - We know window doesn't have this property
window.audioStore = useAudio;

createRoot(document.getElementById("root")!).render(<App />);
