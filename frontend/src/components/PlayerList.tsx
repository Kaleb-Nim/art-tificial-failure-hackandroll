import { Card } from "./ui/card";
import PlayerCard from "./PlayerCard";

const PlayerList = () => {
  return (
    <Card className="w-64 p-4">
      <div className="space-y-2">
        <PlayerCard />
      </div>
    </Card>
  );
};

export default PlayerList;
