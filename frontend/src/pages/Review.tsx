import { useState } from "react";
import Logo from "../assets/Logo.png";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PlayerCard from "@/components/PlayerCard";

const Review = () => {
  const [canvasImage, setCanvasImage] = useState<string>(
    "https://images.pexels.com/photos/1193743/pexels-photo-1193743.jpeg?cs=srgb&fm=jpg"
  );

  return (
    <div className="w-full flex justify-center mt-20 mb-6">
      <div className="flex flex-col items-center w-4/5">
        <img className="h-44 mb-6" src={Logo} alt="Logo" />
        <Card className="p-6 w-full">
          {/* Create a grid with 5 columns */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-start">
            {/* First column */}
            <div className="flex flex-col items-center gap-4">
              <h1 className="font-bold text-2xl sticky top-0 bg-white py-2">
                Final Drawing
              </h1>
              <img src={canvasImage} alt="Final Drawing" />
            </div>

            {/* First vertical separator */}
            <Separator
              orientation="vertical"
              className="my-2 w-px bg-gray-300"
            />

            {/* Second column */}
            <div className="flex flex-col items-center gap-4">
              <h1 className="font-bold text-2xl text-center sticky top-0 bg-white py-2">
                AI Prediction and Confidence
              </h1>
              <div className="flex flex-col items-start gap-2 w-full">
                <div>
                  <p>AI Prediction:</p>
                  <p>Orange</p>
                </div>
                <div>
                  <p>AI Confidence:</p>
                  <p>0.85</p>
                </div>
              </div>
            </div>

            {/* Second vertical separator */}
            <Separator
              orientation="vertical"
              className="my-2 w-px bg-gray-300"
            />

            {/* Third column */}
            <div className="flex flex-col items-center gap-4">
              <h1 className="font-bold text-2xl sticky top-0 bg-white py-2">
                Player Predictions
              </h1>
              {/* Can for loop later */}
              <PlayerCard
                data={{
                  user_id: "",
                  name: "",
                  created_at: "",
                  character_img: "",
                }}
                isHost={false}
                score={0}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Review;
