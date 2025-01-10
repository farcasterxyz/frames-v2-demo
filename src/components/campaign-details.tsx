import { useState } from 'react'
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Switch } from "../components/ui/switch"
import ImageUpload from './image-upload'

interface CampaignDetailsProps {
  onUpdate: (details: {
    collectionName: string,
    title: string,
    description: string,
    image: File | null,
    timeBound: boolean,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    soulbound: boolean,
    openEdition: boolean,
  }) => void
}

export default function CampaignDetails({ onUpdate }: CampaignDetailsProps) {
  const [details, setDetails] = useState({
    collectionName: '',
    title: '',
    description: '',
    image: null as File | null,
    timeBound: false,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    soulbound: false,
    openEdition: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDetails(prev => ({ ...prev, [name]: value }))
    onUpdate({ ...details, [name]: value })
  }

  const handleToggle = (name: string) => (checked: boolean) => {
    setDetails(prev => ({ ...prev, [name]: checked }))
    onUpdate({ ...details, [name]: checked })
  }

  const handleImageUpload = (file: File) => {
    setDetails(prev => ({ ...prev, image: file }))
    onUpdate({ ...details, image: file })
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="collectionName" className="text-lg font-medium text-gray-700">NFT Collection Name</Label>
        <Input id="collectionName" name="collectionName" value={details.collectionName} onChange={handleChange} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="title" className="text-lg font-medium text-gray-700">Campaign Title</Label>
        <Input id="title" name="title" value={details.title} onChange={handleChange} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="description" className="text-lg font-medium text-gray-700">Campaign Description</Label>
        <Textarea id="description" name="description" value={details.description} onChange={handleChange} className="mt-1" />
      </div>
      <div>
        <Label className="text-lg font-medium text-gray-700">Image/Video</Label>
        <ImageUpload onUpload={handleImageUpload} />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="timeBound" checked={details.timeBound} onCheckedChange={handleToggle('timeBound')} />
        <Label htmlFor="timeBound" className="font-medium text-gray-700">Time Bound</Label>
      </div>
      {details.timeBound && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate" className="font-medium text-gray-700">Start Date</Label>
            <Input
              type="date"
              id="startDate"
              name="startDate"
              value={details.startDate || ''}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="startTime" className="font-medium text-gray-700">Start Time</Label>
            <Input
              type="time"
              id="startTime"
              name="startTime"
              value={details.startTime || ''}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="font-medium text-gray-700">End Date</Label>
            <Input
              type="date"
              id="endDate"
              name="endDate"
              value={details.endDate || ''}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endTime" className="font-medium text-gray-700">End Time</Label>
            <Input
              type="time"
              id="endTime"
              name="endTime"
              value={details.endTime || ''}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <Switch id="soulbound" checked={details.soulbound} onCheckedChange={handleToggle('soulbound')} />
        <Label htmlFor="soulbound" className="font-medium text-gray-700">Soulbound Token</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="openEdition" checked={details.openEdition} onCheckedChange={handleToggle('openEdition')} />
        <Label htmlFor="openEdition" className="font-medium text-gray-700">Open Edition</Label>
      </div>
    </div>
  )
}

