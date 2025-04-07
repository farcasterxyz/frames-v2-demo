import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface GameUIProps {
  score: number;
  lives: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

const GameUI = ({ score, lives, isMuted, onToggleMute }: GameUIProps) => {
  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
      {/* Score display */}
      <div className="bg-gray-900 bg-opacity-75 p-2 rounded-md">
        <span className="text-white font-bold text-xl">Score: {score}</span>
      </div>
      
      {/* Lives display */}
      <div className="flex items-center">
        <div className="bg-gray-900 bg-opacity-75 p-2 rounded-md mr-2">
          <span className="text-white font-bold text-xl">Lives: {lives}</span>
        </div>
        
        {/* Mute button */}
        <Button 
          variant="outline" 
          size="icon"
          className="bg-gray-900 bg-opacity-75 text-white h-12 w-12 min-w-12"
          onClick={onToggleMute}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </Button>
      </div>
    </div>
  );
};

export default GameUI;
