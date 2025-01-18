import { useLocalStorageState } from "@/lib/utils";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import supabase from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/Logo.png";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [userID] = useLocalStorageState<string>("user_id", uuidv4());
  const [name, setName] = useLocalStorageState<string>("name", "");
  const [roomID, setRoomID] = useState<string>("");
  const [noRoomError, setNoRoomError] = useState(false);

  useEffect(() => {
    setRoomID(searchParams.get("room_id") || "");
    setNoRoomError(Boolean(searchParams.get("toast")) || false);
  }, [searchParams]);

  useEffect(() => {
    if (noRoomError) {
      toast.warning("Room does not exist!");
    }
  }, [noRoomError]);

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

  const handleEnterLobby = async () => {
    if (!name) {
      return toast.error("Missing Name");
    }

    if (!roomID) {
      return toast.error("Missing Game ID");
    }

    let checkExist = await checkRoomExist(roomID);
    if (!checkExist) {
      return toast.warning("Room does not exists!");
    }

    let success = await addUser();
    if (success) {
      navigate(roomID);
    }
    return;
  };

  async function addUser() {
    const { error } = await supabase.from("art_room_users").upsert({
      room_id: roomID,
      user_id: userID,
      score: 0,
      is_active: true,
    });
    if (error) {
      console.log(error);
      return false;
    }
    return true;
  }

  const handleCreateLobby = async () => {
    if (!name) {
      return toast.error("Missing Name");
    }
    if (!roomID) {
      return toast.error("Missing Game ID");
    }
    let checkExist = await checkRoomExist(roomID);
    if (checkExist) {
      return toast.warning("Room already exists!");
    }

    async function addRooms() {
      const { error } = await supabase.from("art_rooms").insert({
        room_id: roomID,
        host_id: userID,
      });
      if (error) {
        return console.log(error);
      }
    }
    await addRooms();
    let success = await addUser();
    if (success) {
      navigate(roomID);
    }
    return;
  };

  return (
    <div className="flex justify-center items-center h-full flex-col gap-4">
      <img src={logo} alt="Art-ificial Failure Logo" className="h-44" />
      <div className="p-4 bg-white rounded-xl flex flex-col items-center justify-center gap-2">
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
            defaultValue={roomID}
            onInput={(event) => {
              setRoomID((event.target as HTMLInputElement).value);
            }}
          />
        </div>
        <Button
          onClick={handleEnterLobby}
          className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 h-10 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Play!
        </Button>
        <Button
          onClick={handleCreateLobby}
          className="w-full rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          Create Private Room
        </Button>
      </div>
    </div>
  );
}
