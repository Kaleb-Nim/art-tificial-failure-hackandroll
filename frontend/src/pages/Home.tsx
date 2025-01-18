import { useLocalStorageState } from "@/lib/utils";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import supabase from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [userID, _] = useLocalStorageState<string>("user_id", uuidv4());
  const [name, setName] = useLocalStorageState<string>("name", "");
  const [gameID, setGameID] = useState<string>("");

  useEffect(() => {
    async function upsertUserData() {
      const { data, error } = await supabase.from("art_users").upsert({
        user_id: userID,
        name: name,
      });
      if (error) {
        return console.log(error);
      }
      console.log(data);
      return;
    }

    upsertUserData();
  }, [userID, name]);

  const handleEnterLobby = () => {
    if (!name) {
      return toast.error("Missing Name");
    }

    if (!gameID) {
      return toast.error("Missing Game ID");
    }
    navigate(gameID);
    return;
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="p-4 bg-white rounded-xl">
        <p>Home {userID}</p>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            id="name"
            placeholder="Enter Name"
            defaultValue={name}
            onInput={(event) => {
              setName((event.target as HTMLInputElement).value);
            }}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="roomID">Room ID</Label>
          <Input
            type="text"
            id="roomID"
            placeholder="Enter Room ID"
            defaultValue={gameID}
            onInput={(event) => {
              setGameID((event.target as HTMLInputElement).value);
            }}
          />
        </div>
        <Button onClick={handleEnterLobby}>Enter</Button>
      </div>
    </div>
  );
}
