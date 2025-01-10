import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { PlusCircle } from "lucide-react";

export interface Requirement {
  type: string;
}

interface RequirementsProps {
  onUpdate: (updatedRequirements: Requirement[]) => void;
}

export default function Requirements({ onUpdate }: RequirementsProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleAddRequirement = (requirement: Requirement) => {
    const updatedRequirements: Requirement[] = [...requirements, requirement];
    setRequirements(updatedRequirements);
    onUpdate(updatedRequirements);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Requirements (Optional)
      </h2>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Requirement
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Requirement</DialogTitle>
          </DialogHeader>
          {/* Add your requirement form here */}
          <Button onClick={() => handleAddRequirement({ type: "example" })}>
            Add
          </Button>
        </DialogContent>
      </Dialog>
      {requirements.length > 0 && (
        <ul className="mt-4 space-y-2">
          {requirements.map((req, index) => (
            <li
              key={index}
              className="bg-purple-100 p-3 rounded-md text-purple-800"
            >
              Requirement {index + 1}: {req.type}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
