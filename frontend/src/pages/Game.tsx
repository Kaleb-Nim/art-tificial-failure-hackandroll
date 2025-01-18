import { useParams } from "react-router-dom";
import PlayerList from "@/components/PlayerList";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

const Game = () => {
  const navigate = useNavigate();

  const [userID, setUserID] = useState<string>("");
  const [name, setName] = useState<string>("");
  const { room_id } = useParams();

  async function checkRoomExist(room_id: string) {
    const { data, error } = await supabase
      .from("art_rooms")
      .select()
      .eq("room_id", room_id);
    if (error) {
      return console.log(error);
    }
    return data.length != 0;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      let user_id = localStorage.getItem("user_id") || "";
      let name = localStorage.getItem("name") || "";
      setUserID(user_id);
      setName(name);
      if (!user_id || !name) {
        navigate(`/?room_id=${room_id}`);
      }
    }
  }, []);

  useEffect(() => {
    async function game() {
      if (room_id) {
        let checkExist = await checkRoomExist(room_id);
        if (!checkExist) {
          navigate(`/?toast=true`);
        }
      }
    }
    game();
  }, [room_id]);

  return (
    <div className="flex p-4">
      <div className="flex flex-1 gap-4">
        <PlayerList />
        {userID} {name}
      </div>
    </div>
  );
};

export default Game;
