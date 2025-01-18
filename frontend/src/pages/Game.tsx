import { useParams } from "react-router-dom";
import PlayerList from "@/components/playerList";

const Game = () => {
  const { game_id } = useParams();
  return (
    <div className="flex bg-blue-600 p-4">
      <div className="flex flex-1 gap-4">
        <PlayerList />
      </div>
    </div>
  );
};

export default Game;
