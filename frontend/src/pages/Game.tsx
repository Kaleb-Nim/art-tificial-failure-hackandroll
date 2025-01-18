import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import PlayerCard from "@/components/PlayerCard";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { UserRoomType, RoomType } from "@/types";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Game = () => {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const channelRef = useRef<RealtimeChannel | undefined>(undefined);
  const updateChannelRef = () => {
    channelRef.current = channel;
  };
  const [channel, setChannel] = useState<RealtimeChannel>();

  const navigate = useNavigate();

  const [userID, setUserID] = useState<string>("");
  const { room_id } = useParams();
  const [gameStart, setGameStart] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isDrawer, setIsDrawer] = useState<boolean>(false);
  const [players, setPlayers] = useState<UserRoomType[]>([]);
  const [roomData, setRoomData] = useState<RoomType>();
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  async function getUserInfo(user_id: string) {
    const { data, error } = await supabase
      .from("art_room_users")
      .select("*, art_users(*)")
      .eq("user_id", user_id)
      .eq("room_id", room_id);

    if (error) {
      console.log(error);
      return {};
    }

    if (data.length == 0) {
      console.log("CMI");
      return {};
    }
    return data[0];
  }

  useEffect(() => {
    const initChannel = async () => {
      const newChannel = supabase.channel(`art_${room_id}`, {
        config: {
          broadcast: {
            self: true,
          },
          presence: {
            key: String(userID),
          },
        },
      });

      newChannel
        .on("presence", { event: "sync" }, () => {
          const newState = newChannel.presenceState();
          console.log("sync", newState);
          [...new Set(Object.keys(newState))].forEach(async (id) => {
            const data = await getUserInfo(id);
            console.log(data);
            setPlayers((prev) => [...prev, data]);
          });
        })
        .on("presence", { event: "join" }, async ({ key, newPresences }) => {
          console.log("join", key, newPresences);
        })
        .on("presence", { event: "leave" }, async ({ key, leftPresences }) => {
          console.log("leave", key, leftPresences);
          setPlayers((prev) =>
            prev.filter((e) => {
              return e.user_id != key;
            })
          );
        });

      await newChannel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          console.error("Failed to subscribe to the channel");
          return;
        }

        const presenceTrackStatus = await newChannel.track({
          user_id: String(userID),
        });
        console.log(presenceTrackStatus);
      });

      setChannel(newChannel);
    };

    if (userID) {
      initChannel();
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
        setChannel(undefined);
      }
    };
  }, [userID]);

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

  async function getTopic(topic_id: number) {
    const { data, error } = await supabase
      .from("art_topics")
      .select()
      .eq("topic_id", topic_id);
    if (error) {
      console.log(error);
      return [];
    }
    if (data.length == 0) {
      return [];
    }
    return data;
  }

  async function getRandomTopic() {}

  async function startGame() {
    if (players.length < 2) {
      return;
    }
    setGameStart(true);
    await updateGameState();
    if (roomData && userID == roomData["host_id"]) {
      setIsDrawer(true);
    }
    setOpenDialog(true);
    await addRound(roomData ? roomData["host_id"] : "", 1);
  }

  async function addRound(user_id: string, topic_id: number) {
    const { error } = await supabase.from("art_rounds").insert({
      room_id: room_id,
      topic_id: topic_id,
      drawer_id: user_id,
    });
    if (error) {
      console.log(error);
    }
    return;
  }

  async function updateGameState() {
    const { error } = await supabase
      .from("art_rooms")
      .update({ is_active: true })
      .eq("room_id", room_id);
    if (error) {
      console.log(error);
    }
    return;
  }

  async function getRoomData(room_id: string) {
    const { data, error } = await supabase
      .from("art_rooms")
      .select()
      .eq("room_id", room_id);
    if (error) {
      console.log(error);
      return {};
    }
    if (data.length == 0) {
      return {};
    }
    return data[0];
  }

  useEffect(() => {
    updateChannelRef();
  }, [channel]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let user_id = localStorage.getItem("user_id") || "";
      let name = localStorage.getItem("name") || "";
      if (!user_id || !name) {
        navigate(`/?room_id=${room_id}`);
      }
      setUserID(JSON.parse(user_id));
    }
  }, []);

  useEffect(() => {
    async function initGame() {
      if (!room_id) {
        return;
      }
      let checkExist = await checkRoomExist(room_id);
      if (!checkExist) {
        return navigate(`/?room_id=${room_id}&toast=true`);
      }
      let roomData = await getRoomData(room_id);
      setRoomData(roomData);
      if (roomData) {
        setGameStart(Boolean(roomData["is_active"]));
        setIsHost(userID == roomData["host_id"]);
      }
    }
    initGame();
  }, [userID, room_id]);

  useEffect(() => {
    const uniquePlayers = [
      ...new Map(players.map((user: any) => [user["user_id"], user])).values(),
    ];

    if (JSON.stringify(uniquePlayers) !== JSON.stringify(players)) {
      setPlayers(uniquePlayers);
    }
  }, [players]);

  return (
    <div className="flex p-12">
      <div className="flex flex-col gap-5">
        {players.map((e: UserRoomType) => {
          const playerHost = roomData
            ? e.user_id == roomData["host_id"]
            : false;
          console.log(
            e.user_id,
            roomData && roomData["host_id"],
            roomData ? e.user_id == roomData["host_id"] : false,
            playerHost
          );
          return (
            <PlayerCard
              data={e.art_users}
              key={"Player" + e.user_id}
              isHost={playerHost}
              score={e.score}
            ></PlayerCard>
          );
        })}
      </div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      {!gameStart && (
        <Button onClick={startGame} disabled={!isHost}>
          Start Game
        </Button>
      )}
      {gameStart && (
        <ReactSketchCanvas
          ref={canvasRef}
          className={!isDrawer ? "pointer-events-none" : ""}
        ></ReactSketchCanvas>
      )}
    </div>
  );
};

export default Game;
