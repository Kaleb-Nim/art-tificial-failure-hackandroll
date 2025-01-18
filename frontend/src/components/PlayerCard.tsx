// import Avatar from "../assets/Avatar.png";
// import { Separator } from "./ui/separator";
// import { X, Check } from "lucide-react";
import { UserType } from "@/types";

type PlayerCardType = {
  data: UserType;
  isHost: boolean;
  score: number;
};

const PlayerCard = ({ data, isHost, score }: PlayerCardType) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-14 h-14 rounded-full overflow-hidden relative">
          <img
            className="w-full h-full object-cover"
            src={(data && data.character_img) || ""}
            alt=""
          />
        </div>
        {isHost && (
          <img
            className="absolute w-[30px] aspect-square left-1/2 -translate-x-1/2 -top-[20px]"
            src={"https://cdn-icons-png.flaticon.com/512/1586/1586967.png"}
            alt=""
          />
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-teal-600 font-semibold text-lg">
          {(data && data.name) || ""}
        </h3>
        <p className="text-gray-600 text-sm">{score} Points</p>
      </div>
    </div>

    //   <Separator orientation="vertical" className="my-2">
    //     <div className="flex items-center gap-2">
    //       <span className="text-gray-700 text-sm">Hack and Roll 2025</span>
    //       <div className="flex gap-1">
    //         <Check className="w-4 h-4 text-green-500" />
    //         <X className="w-4 h-4 text-red-500" />
    //       </div>
    //     </div>
    //   </Separator>
    // </div>
  );
};

export default PlayerCard;
