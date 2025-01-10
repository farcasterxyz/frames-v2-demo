"use client";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import ModeSelection from "./mode-selection";
import CampaignDetails from "./campaign-details";
import Requirements from "./requirements";
import Perks from "./perks";
import { Requirement } from "./requirements";

const steps = [
  "Mode of Campaigns",
  "Details of Campaign",
  "Requirements",
  "Perks",
];

export default function NFTCampaignStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignMode, setCampaignMode] = useState<"token" | "nft" | null>(
    null
  );
  const [selectedMode, setSelectedMode] = useState<"token" | "nft" | null>(
    null
  );
  const [campaignDetails, setCampaignDetails] = useState<{
    collectionName: string;
    title: string;
    description: string;
    image: File | null;
    timeBound: boolean;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    soulbound: boolean;
    openEdition: boolean;
  }>({
    collectionName: "",
    title: "",
    description: "",
    image: null,
    timeBound: false,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    soulbound: false,
    openEdition: false,
  });
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [perks, setPerks] = useState<string[]>([]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateCampaign = () => {
    console.log("Campaign created:", {
      campaignMode,
      campaignDetails,
      requirements,
      perks,
    });
    // Here you would typically send this data to your backend
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-purple-800">
        Create Your NFT Campaign
      </h1>
      <div className="mb-8">
        <ol className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full space-y-4 sm:space-y-0">
          {steps.map((step, index) => (
            <li
              key={index}
              className={`flex items-center ${
                index <= currentStep ? "text-purple-600" : "text-gray-400"
              } ${index < steps.length - 1 ? "w-full sm:w-auto" : ""}`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 border-2 ${
                  index <= currentStep ? "border-purple-600" : "border-gray-300"
                } rounded-full lg:h-10 lg:w-10 ${
                  index <= currentStep ? "bg-purple-600 text-white" : "bg-white"
                }`}
              >
                {index + 1}
              </span>
              <span className="ml-2 text-sm font-medium">{step}</span>
              {index < steps.length - 1 && (
                <>
                  <div className="flex-1 hidden sm:block h-0.5 bg-gray-300 mx-4"></div>
                  <div className="sm:hidden h-full w-0.5 bg-gray-300 mx-4 my-2"></div>
                </>
              )}
            </li>
          ))}
        </ol>
      </div>

      <Card className="p-6 shadow-lg bg-white">
        {currentStep === 0 && (
          <ModeSelection
            onSelect={setCampaignMode}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
          />
        )}
        {currentStep === 1 && campaignMode === "nft" && (
          <CampaignDetails
            onUpdate={(details) => setCampaignDetails(details)}
          />
        )}
        {currentStep === 2 && (
          <Requirements
            onUpdate={(updatedRequirements: Requirement[]) =>
              setRequirements(updatedRequirements)
            }
          />
        )}
        {currentStep === 3 && <Perks onUpdate={setPerks} />}
      </Card>

      <div className="mt-6 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
        <Button
          onClick={handleBack}
          disabled={currentStep === 0}
          variant="outline"
          className="bg-white hover:bg-gray-100"
        >
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleCreateCampaign}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Create Campaign
          </Button>
        )}
      </div>
    </div>
  );
}
