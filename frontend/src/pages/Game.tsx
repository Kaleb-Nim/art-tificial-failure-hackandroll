import { useParams } from "react-router-dom";

export default function Game() {
  const { game_id } = useParams();
  return <div>Game</div>;
}
