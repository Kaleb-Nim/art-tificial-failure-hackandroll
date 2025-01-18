import { useLocalStorageState } from "@/lib/utils";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import supabase from "@/lib/supabase";
import Logo from "@/assets/Logo.png";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";

import TodoCarousel from "@/components/TodoCarousel";
import AvatarCarousel from "@/components/AvatarCarousel";
import { type CarouselApi } from "@/components/ui/carousel";

export default function Home() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useLocalStorageState("character_img", 0);
  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);
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
      const { error } = await supabase.from("art_users").upsert({
        user_id: userID,
        name: name,
        character_img: `./${current}.png`,
      });
      if (error) {
        return console.log(error);
      }
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
      return toast.error("Missing Room ID");
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
      return toast.error("Missing Room ID");
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
    <div className="w-full flex justify-center h-full md:items-center p-5">
      <div className="flex flex-col items-center md:w-3/5">
        {/* Logo */}
        <img
          className="h-32 md:h-44 md:mb-6 object-contain"
          src={Logo}
          alt="Logo"
        />
        {/* Card */}
        <Card className="p-6 w-full">
          {/* Outer Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="flex flex-col items-center gap-4 col-span-2 md:col-span-1">
              <Input
                placeholder="Enter your name..."
                onChange={(e) => {
                  setName(e.target.value);
                }}
                defaultValue={name}
              />
              <AvatarCarousel setApi={setApi} startIndex={current - 1} />
              <Input
                placeholder="Enter Room ID..."
                onChange={(e) => setRoomID(e.target.value)}
                defaultValue={roomID}
              />
              <div className="flex gap-2 md:flex-col justify-center items-center w-full">
                <Button
                  variant="default"
                  className="bg-blue-600 text-white w-4/5"
                  onClick={handleEnterLobby}
                >
                  Join Room
                </Button>
                <Button
                  variant="default"
                  className="bg-red-500 text-white w-4/5"
                  onClick={handleCreateLobby}
                >
                  Create Room
                </Button>
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex-col items-center gap-4 hidden md:flex justify-center">
              <h2 className="text-xl font-bold underline">How To Play</h2>
              <TodoCarousel />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
