import { UserRoomType } from "@/types";
import { ReactSketchCanvas } from "react-sketch-canvas";
import PlayerCard from "./PlayerCard";

const GameLayout = () => {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="h-16 bg-white text-black flex items-center justify-between px-6 mt-8 mx-6 rounded-lg shadow">
        <div className="text-lg font-semibold">Topic:</div>
        <div className="text-lg font-bold">Sports</div>
        <div className="text-xl font-bold text-red-500">35s</div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 bg-white mt-6 mx-6 rounded-lg shadow overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-1/5 bg-blue-900 text-white p-4">
          <div className="text-center text-lg font-semibold mb-4">Players</div>
          <ul className="space-y-2">
            {/* <li className="flex justify-between px-3 py-2 rounded bg-blue-700">
              <span>Thaddy</span>
              <span>2000 Points</span>
            </li>
            <li className="flex justify-between px-3 py-2 rounded bg-blue-600">
              <span>Kaleb</span>
              <span>2690 pts</span>
            </li> */}
            <li className="flex flex-col gap-5">
              {players.map((event: UserRoomType) => {
                const playerHost = roomData
                  ? event.user_id == roomData["host_id"]
                  : false;
                return (
                  <PlayerCard
                    data={event.art_users}
                    key={"Player " + event.user_id}
                    isHost={playerHost}
                    score={event.score}
                  />
                );
              })}
            </li>
          </ul>
        </div>

        {/* Middle Content */}
        <div className="flex-1 bg-gray-100 p-4 flex flex-col">
          <ReactSketchCanvas
            className="w-full h-full pointer-events-none"
            canvasColor="white"
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-1/5 bg-gray-50 border-l border-gray-300 p-4 flex flex-col">
          <div className="text-lg font-semibold text-gray-700 mb-4">Chat</div>
        </div>
      </div>
    </div>
  );
};

export default GameLayout;
