import { useParams } from "react-router-dom";
import PlayerList from "@/components/PlayerList";

const Game = () => {
  const { room_id } = useParams();
  return (
    <div className="flex p-4">
      <div className="flex flex-1 gap-4">
        <PlayerList />
      </div>
    </div>
  );
};

export default Game;
