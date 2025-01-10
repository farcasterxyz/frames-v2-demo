import { useState } from 'react'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { PlusCircle, Gift } from 'lucide-react'

interface PerksProps {
  onUpdate: (perks: string[]) => void
}

export default function Perks({ onUpdate }: PerksProps) {
  const [perks, setPerks] = useState<string[]>([])
  const [newPerk, setNewPerk] = useState('')

  const handleAddPerk = () => {
    if (newPerk.trim()) {
      const updatedPerks = [...perks, newPerk.trim()]
      setPerks(updatedPerks)
      onUpdate(updatedPerks)
      setNewPerk('')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Perks (Optional)</h2>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
        <div className="flex-grow">
          <Label htmlFor="newPerk" className="sr-only">New Perk</Label>
          <Input
            id="newPerk"
            value={newPerk}
            onChange={(e) => setNewPerk(e.target.value)}
            placeholder="Enter a perk"
            className="w-full"
          />
        </div>
        <Button onClick={handleAddPerk} className="bg-purple-600 hover:bg-purple-700 text-white">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Perk
        </Button>
      </div>
      {perks.length > 0 && (
        <ul className="space-y-2">
          {perks.map((perk, index) => (
            <li key={index} className="flex items-center bg-purple-100 p-3 rounded-md text-purple-800">
              <Gift className="w-5 h-5 mr-2" />
              {perk}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

