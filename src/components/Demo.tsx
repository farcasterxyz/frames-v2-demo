import React from "react";
import NFTCampaignStepper from "./nft-campaign-stepper";

function Demo({ title }: { title?: string } = { title: "Frames v2 Demo" }) {
  return (
    <div>
      <h1>{title}</h1>
      <NFTCampaignStepper  />
    </div>
  );
}

export default Demo;
