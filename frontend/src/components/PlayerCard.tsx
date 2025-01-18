import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface PlayerCardProps {
  data: {
    name: string;
    character_img: string;
  };
  isHost: boolean;
  score: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ data, isHost, score }) => {
  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        {/* Avatar Section */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden">
            <img
              className="w-full h-full object-cover"
              src={data.character_img || ""}
              alt={`${data.name}'s avatar`}
            />
          </div>
          {isHost && (
            <img
              className="absolute w-[30px] aspect-square left-1/2 -translate-x-1/2 -top-[20px]"
              src={"https://cdn-icons-png.flaticon.com/512/1586/1586967.png"}
              alt="Host Icon"
            />
          )}
        </div>

        {/* Player Info Section */}
        <div className="flex-1">
          <CardTitle className="text-teal-600 font-semibold text-lg">
            {data.name || ""}
          </CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            {score} Points
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};

export default PlayerCard;
