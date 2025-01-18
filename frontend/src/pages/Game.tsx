import { useEffect, useState, useRef, ReactNode, FormEvent } from "react";
import Guesses from "@/components/Guesses";
import { Input } from "@/components/ui/input";
import { useParams } from "react-router-dom";
import PlayerCard from "@/components/PlayerCard";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { UserRoomType, RoomType, RoundType } from "@/types";
import {
  ReactSketchCanvas,
  ReactSketchCanvasRef,
  CanvasPath,
} from "react-sketch-canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [dialogContent, setDialogContent] = useState<ReactNode>();
  const [currentRound, setCurrentRound] = useState<number>();
  const [guess, setGuess] = useState<string>("");

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

  async function disablePlayer(user_id: string) {
    const { error } = await supabase
      .from("art_room_users")
      .update({ is_active: false })
      .eq("user_id", user_id)
      .eq("room_id", room_id);
    if (error) {
      console.log(error);
    }
    return;
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
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "art_rooms",
            filter: `room_id=eq.${room_id}`,
          },
          (payload) => {
            console.log("Change received!", payload);
            setGameStart(payload.new["is_active"]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "art_draw_strokes",
          },
          (payload) => {
            console.log("Change received!", payload);
            if (canvasRef.current) {
              canvasRef.current?.eraseMode(payload.new["is_eraser"]);
              canvasRef.current?.loadPaths([payload.new["stroke_path"]]);
            }
          }
        )
        .on("broadcast", { event: "openDialog" }, (payload) => {
          setIsDrawer(userID == payload.payload["drawer_id"]);
          setGameStart(true);
          setOpenDialog(true);
        })
        .on("broadcast", { event: "closeDialog" }, () => {
          setOpenDialog(false);
        })
        .on("broadcast", { event: "updateRound" }, (payload) => {
          setCurrentRound(payload.payload["round_id"]);
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
          disablePlayer(key);
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

  async function handleAddRound(topic_id: number) {
    await addRound(roomData ? roomData["host_id"] : "", topic_id);
    channel?.send({ type: "broadcast", event: "closeDialog" });
  }

  useEffect(() => {
    async function getTopics(topicArr: number[]): Promise<void> {
      try {
        const allTopics = await Promise.all(
          topicArr.map(async (topic_id) => {
            return getTopic(topic_id); // Returns array of topics for each ID
          })
        );
        const flatTopics = allTopics.flat();
        setDialogContent(
          <>
            <DialogHeader>
              <DialogTitle className="text-center">
                Pick Your Topic!
              </DialogTitle>
            </DialogHeader>
            <div className="w-full flex justify-around p-4">
              {flatTopics.map((e) => {
                return (
                  <Button
                    size={"lg"}
                    key={"Topic" + e.topic_id}
                    onClick={() => handleAddRound(e.topic_id)}
                  >
                    {e.name}
                  </Button>
                );
              })}
            </div>
          </>
        );
      } catch (error) {
        console.log("Error fetching topics:", error);
      }
    }

    if (isDrawer) {
      let topicArr = getRandomTopics();
      getTopics(topicArr);
    } else {
      setDialogContent(
        <>
          <DialogHeader>
            <DialogTitle className="text-center">
              Other player choosing topic...
            </DialogTitle>
          </DialogHeader>
        </>
      );
    }
  }, [isDrawer, openDialog]);

  function getRandomTopics() {
    let numbers: number[] = [];
    while (numbers.length < 3) {
      let num = Math.floor(Math.random() * 6) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  }

  async function startGame() {
    if (players.length < 2) {
      toast.error("Require 1 more player to start");
      return;
    }
    setGameStart(true);
    await updateGameState(true);
    channel?.send({
      type: "broadcast",
      event: "openDialog",
      payload: {
        drawer_id: roomData && roomData["host_id"],
      },
    });
  }

  async function addRound(user_id: string, topic_id: number) {
    const { data, error } = await supabase
      .from("art_rounds")
      .insert({
        room_id: room_id,
        topic_id: topic_id,
        drawer_id: user_id,
      })
      .select();
    if (error) {
      console.log(error);
    }
    setCurrentRound((data as RoundType[])[0].id);
    channel?.send({
      type: "broadcast",
      event: "updateRound",
      payload: {
        round_id: (data as RoundType[])[0].id,
      },
    });
  }

  async function updateGameState(is_active: boolean) {
    const { error } = await supabase
      .from("art_rooms")
      .update({ is_active: is_active })
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
    if (players.length < 2) {
      updateGameState(false);
    }
  }, [players]);

  const predictDrawing = async (base64Image: string) => {
    try {
      const response = await fetch('https://art-ificialfailure-backend.fly.dev/api/v1/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [{
            image_id: `round_${currentRound}`,
            base64_data: base64Image.split(',')[1], // Remove data URL prefix
            format: 'image/png'
          }],
          model: "openai",
          top_k: 3,
          confidence_threshold: 0.5
        })
      });

      const data = await response.json();
      console.log('Prediction response:', data);
      return data;
    } catch (error) {
      console.error('Error getting predictions:', error);
      throw error;
    }
  };

  const saveCanvasToSupabase = async () => {
    if (!canvasRef.current || !currentRound) {
      toast.error("No canvas or round data available");
      return;
    }

    try {
      // Get the canvas image as base64
      const imageData = await canvasRef.current.exportImage("png");
      
      // Get predictions first
      await predictDrawing(imageData);

      // Convert base64 to blob for storage
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('art')
        .upload(`round_${currentRound}.png`, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        throw error;
      }

      toast.success('Drawing saved and analyzed successfully!');
    } catch (error) {
      console.error('Error saving canvas:', error);
      toast.error('Failed to save drawing');
    }
  };

  const handleStrokeChange = async (path: CanvasPath, isEraser: boolean) => {
    const { error } = await supabase.from("art_draw_strokes").insert({
      round_id: currentRound,
      is_eraser: isEraser,
      stroke_path: path,
    });

    if (error) {
      console.log(error);
      return;
    }
  };

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
      <Dialog open={openDialog}>
        <DialogContent>{dialogContent}</DialogContent>
      </Dialog>
      {!gameStart && (
        <Button onClick={startGame} disabled={!isHost || players.length < 2}>
          Start Game
        </Button>
      )}
      {gameStart && (
        <div className="flex flex-col gap-4">
          <ReactSketchCanvas
            ref={canvasRef}
            className={!isDrawer ? "pointer-events-none" : ""}
            onStroke={(path, isEraser) => handleStrokeChange(path, isEraser)}
            strokeColor="black"
          />
          {isDrawer ? (
            <Button onClick={saveCanvasToSupabase}>
              Save Drawing
            </Button>
          ) : (
            <form onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              if (guess.trim()) {
                try {
                  const { data: userData } = await supabase
                    .from("art_users")
                    .select("name")
                    .eq("user_id", userID)
                    .single();

                  const { error } = await supabase
                    .from("art_round_guesses")
                    .insert({
                      round_id: currentRound,
                      user_id: userID,
                      guess: guess.trim()
                    });
                    
                  if (error) throw error;

                  // Add guess to local state
                  setGuesses(prev => [...prev, {
                    userName: userData?.name || "Unknown",
                    guess: guess.trim(),
                    userId: userID
                  }]);
                  
                  toast.success("Guess submitted!");
                  setGuess("");
                } catch (error) {
                  console.error("Error submitting guess:", error);
                  toast.error("Failed to submit guess");
                }
              }
            }}
            className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter your guess..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                Submit Guess
              </Button>
            </form>
          )}
          <div className="mt-4 space-y-2">
            {guesses.map((g, index) => (
              <Guesses
                key={index}
                userName={g.userName}
                guess={g.guess}
                isCurrentUser={g.userId === userID}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
