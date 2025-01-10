import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Coins, Image } from 'lucide-react'

interface ModeSelectionProps {
  onSelect: (mode: 'token' | 'nft') => void;
  selectedMode: 'token' | 'nft' | null;
  setSelectedMode: (mode: 'token' | 'nft' | null) => void;
}

export default function ModeSelection({ onSelect, selectedMode, setSelectedMode }: ModeSelectionProps) {
  const handleSelect = (mode: 'token' | 'nft') => {
    setSelectedMode(mode);
    onSelect(mode);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow duration-300 ${selectedMode === 'token' ? 'ring-2 ring-yellow-500' : ''}`} 
        onClick={() => handleSelect('token')}
      >
        <CardContent className="p-6 flex flex-col items-center text-center">
          <Coins className={`w-16 h-16 ${selectedMode === 'token' ? 'text-yellow-500' : 'text-gray-400'} mb-4`} />
          <h3 className="text-xl font-semibold mb-2">Token Campaign</h3>
          <p className="text-gray-600 mb-4">Launch a campaign with fungible tokens.</p>
          <Button className={`w-full ${selectedMode === 'token' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-200 hover:bg-gray-300'} text-white`}>
            {selectedMode === 'token' ? 'Selected' : 'Select'}
          </Button>
        </CardContent>
      </Card>
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow duration-300 ${selectedMode === 'nft' ? 'ring-2 ring-purple-500' : ''}`} 
        onClick={() => handleSelect('nft')}
      >
        <CardContent className="p-6 flex flex-col items-center text-center">
          <Image className={`w-16 h-16 ${selectedMode === 'nft' ? 'text-purple-500' : 'text-gray-400'} mb-4`} />
          <h3 className="text-xl font-semibold mb-2">NFT Campaign</h3>
          <p className="text-gray-600 mb-4">Launch a campaign with non-fungible tokens.</p>
          <Button className={`w-full ${selectedMode === 'nft' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-200 hover:bg-gray-300'} text-white`}>
            {selectedMode === 'nft' ? 'Selected' : 'Select'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

