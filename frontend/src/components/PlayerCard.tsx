import React from "react";
import Avatar from "../assets/Avatar.png";
import { Separator } from "./ui/separator";

const PlayerCard = () => {
  return (
    <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg relative">
      {/* Avatar image */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gray-300 border-2 border-gray-400 overflow-hidden">
          <img className="w-full h-full object-cover" src={Avatar} alt="" />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-teal-600 font-semibold text-lg">Thaddy</h3>
        <p className="text-gray-600 text-sm">0 Points</p>
      </div>

      <Separator >

      </Separator>
    </div>
  );
};

export default PlayerCard;
