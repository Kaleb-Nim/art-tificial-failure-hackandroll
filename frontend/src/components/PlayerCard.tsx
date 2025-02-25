import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlayerCardProps {
  data: {
    name: string;
    character_img: string;
  };
  isHost: boolean;
  score?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  data,
  isHost,
  score = "",
}) => {
  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center gap-4 px-2 py-5">
        {/* Avatar Section */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden">
            <img
              className="w-full h-full object-cover"
              src={
                (data &&
                  data.character_img.replace(
                    ".",
                    import.meta.env.VITE_CLIENT_URL
                  )) ||
                ""
              }
              alt={`${(data && data.name) || ""}'s avatar`}
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
            {(data && data.name) || ""}
          </CardTitle>
          <CardDescription>{score}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};

export default PlayerCard;
