import { useParams } from "react-router-dom";
import PlayerList from "@/components/playerList";

const Game = () => {
  const { game_id } = useParams();
  return (
    <div className="flex p-4">
      <div className="flex flex-1 gap-4">
        <PlayerList />
      </div>
    </div>
  );
};

export default Game;
