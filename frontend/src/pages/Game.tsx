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
import { cn } from "@/lib/utils";
import { IoSend } from "react-icons/io5";
import { useTimer } from "react-timer-hook";

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
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [roundCounter, setRoundCounter] = useState<number>(0);
  const [guess, setGuess] = useState<string>("");
  const [guesses, setGuesses] = useState<
    Array<{
      userName: string;
      guess: string;
      userId: string;
    }>
  >([]);
  const [topic, setTopic] = useState<string>("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const duration = 60;
  const getExpiryTimestamp = () => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + duration);
    return time;
  };

  const { seconds, restart } = useTimer({
    expiryTimestamp: getExpiryTimestamp(),
    onExpire: () => {
      console.log("Timer expired");
      saveCanvasToSupabase(true);
    },
    autoStart: false,
  });

  const handleRestart = () => {
    restart(getExpiryTimestamp()); // Restart with a new expiryTimestamp
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [guesses]);

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
    console.log(data, user_id, room_id);
    if (data.length == 0) {
      console.log("CMI");
      return {};
    }
    return data[0];
  }

  useEffect(() => {
    addUser();
    async function addUser() {
      const { error } = await supabase.from("art_room_users").upsert({
        room_id: room_id,
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
  }, [userID]);

  async function activatePlayer(user_id: string, is_active: boolean) {
    const { error } = await supabase
      .from("art_room_users")
      .update({ is_active: is_active })
      .eq("user_id", user_id)
      .eq("room_id", room_id);
    if (error) {
      console.log(error);
    }
    return;
  }

  async function changeHost() {
    console.log("hi CHANGE");
    const { data, error } = await supabase
      .from("art_room_users")
      .select()
      .eq("room_id", room_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    console.log(data, "fu");
    if (error) {
      console.log(error);
      return;
    }

    if (data.length == 0 && room_id) {
      await removeRoom(room_id);
    } else {
      await updateHost(data[0].user_id);
      setIsHost(data[0].user_id == userID);
    }
    return;
  }

  async function updateHost(host_id: string) {
    const { error } = await supabase
      .from("art_rooms")
      .update({
        host_id: host_id,
      })
      .eq("room_id", room_id);
    if (error) {
      console.log(error);
      return;
    }
  }

  async function removeRoom(room_id: string) {
    const { error } = await supabase
      .from("art_rooms")
      .delete()
      .eq("room_id", room_id);
    if (error) {
      console.log(error);
      return;
    }
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
            if (canvasRef.current && !isDrawer) {
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
        .on("broadcast", { event: "closeDialog" }, async (payload) => {
          setOpenDialog(false);
          setRoundCounter((prev) => prev + 1);
          let topic = await getTopic(payload.payload["topic"] as number);
          console.log(payload, "Close", topic);
          setTopic((topic && topic[0]["name"]) || "");
          handleRestart();
        })
        .on("broadcast", { event: "updateRound" }, (payload) => {
          setCurrentRound(payload.payload["round_id"]);
        })
        .on("broadcast", { event: "addGuess" }, (payload) => {
          setGuesses((prev) => [...prev, payload.payload]);
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
          await activatePlayer(key, false);
          if (roomData && key == roomData["host_id"]) {
            console.log("Change Host", roomData, key);
            await changeHost();
          }
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
    channel?.send({
      type: "broadcast",
      event: "closeDialog",
      payload: {
        topic: topic_id,
      },
    });
  }

  useEffect(() => {
    if (seconds <= 25) {
      saveCanvasToSupabase(); // Call your function when there are 15 seconds left
    }
  }, [seconds]);

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
      if (user_id) {
        setUserID(JSON.parse(user_id));
      }
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
      console.log(roomData, "Room Data");
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
    console.log("HI PLAYERS");
  }, [players]);

  const predictDrawing = async (base64Image: string) => {
    try {
      const response = await fetch(
        "https://art-ificialfailure-backend.fly.dev/api/v1/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images: [
              {
                image_id: `round_${currentRound}`,
                base64_data: base64Image.split(",")[1], // Remove data URL prefix
                format: "image/png",
              },
            ],
            model: "openai",
            top_k: 3,
            confidence_threshold: 0.5,
          }),
        }
      );

      const data = await response.json();
      console.log("Prediction response:", data);
      return data;
    } catch (error) {
      console.error("Error getting predictions:", error);
      throw error;
    }
  };

  async function addGuessData(
    user_id: string,
    guess: string,
    confidence: number
  ) {
    try {
      const { error } = await supabase.from("art_round_guesses").upsert({
        round_id: currentRound,
        user_id: user_id,
        guess: guess.trim(),
        confidence: confidence,
      });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.log(error);
    }
  }

  const saveCanvasToSupabase = async (is_final: boolean = false) => {
    if (!canvasRef.current || !currentRound) {
      toast.error("No canvas or round data available");
      return;
    }

    try {
      // Get the canvas image as base64
      const imageData = await canvasRef.current.exportImage("png");

      // Get predictions first
      let predict = await predictDrawing(imageData);
      console.log(predict);
      let prediction = predict["results"][0]["predictions"][0];
      addGuessData("1", prediction["label"], prediction["confidence"]);
      if (!is_final) {
        return predict;
      }
      // Convert base64 to blob for storage
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from("art")
        .upload(`round_${currentRound}.png`, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // toast.success("Drawing saved and analyzed successfully!");
    } catch (error) {
      console.error("Error saving canvas:", error);
      // toast.error("Failed to save drawing");
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
    <div className="flex flex-col h-full md:p-8 p-4">
      {/* Header */}
      <div className="h-16 bg-white text-black flex items-center justify-between px-6 md:mx-6 rounded-lg shadow">
        <div className="text-lg font-semibold">
          Round {roundCounter}/{players.length}
        </div>
        <div className="text-lg font-bold">
          {isDrawer
            ? topic
            : topic
                .split("")
                .map((_) => "_")
                .join(" ")}
        </div>
        <div className="text-xl font-bold text-red-500">
          {seconds || duration}s
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 bg-white mt-6 md:mx-6 rounded-lg shadow overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={cn(
            "min-w-[200px] max-w-[20%] w-full bg-blue-900 text-white p-4 flex-col gap-4",
            !gameStart ? "flex" : "flex md:flex"
          )}
        >
          <div className="text-center text-lg font-semibold">Players</div>
          <ul className="space-y-2 max-h-[calc(100%-28px-36px-5px)] overflow-y-auto">
            <li className="flex flex-col gap-5">
              {players.map((event: UserRoomType) => {
                const playerHost = roomData
                  ? event.user_id == roomData["host_id"]
                  : false;
                return (
                  <PlayerCard
                    data={event.art_users}
                    key={"Player " + event.user_id}
                    isHost={playerHost}
                    score={event.score}
                  />
                );
              })}
              <Dialog open={openDialog}>
                <DialogContent>{dialogContent}</DialogContent>
              </Dialog>
            </li>
          </ul>
          {!gameStart && (
            <Button
              onClick={startGame}
              disabled={!isHost || players.length < 2}
              className="mx-auto mt-auto"
            >
              Start Game
            </Button>
          )}
        </div>

        {/* Middle Content */}
        <div className="flex-1 bg-gray-100 p-4 flex flex-col h-full justify-center items-center">
          {gameStart && (
            <ReactSketchCanvas
              className={`w-full mx-auto h-full aspect-square ${
                !isDrawer ? "pointer-events-none" : ""
              }`}
              canvasColor="white"
              onStroke={(path, isEraser) => handleStrokeChange(path, isEraser)}
              strokeColor="black"
              ref={canvasRef}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <div className="min-w-[200px] max-w-[20%] w-full bg-gray-50 border-l border-gray-300 p-4 md:flex flex-col flex gap-4">
          <div className="text-lg font-semibold text-gray-700">Chat</div>
          <div
            className="gap-2 max-h-[calc(100%-28px-36px-5px)] overflow-y-auto flex flex-col"
            ref={scrollContainerRef}
          >
            {guesses.map((g, index) => (
              <Guesses
                key={index}
                userName={g.userName}
                guess={g.guess}
                isCurrentUser={g.userId === userID}
              />
            ))}
          </div>
          {gameStart && !isDrawer && (
            <form
              onSubmit={async (e: FormEvent) => {
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
                      .upsert({
                        round_id: currentRound,
                        user_id: userID,
                        guess: guess.trim(),
                      });

                    if (error) throw error;

                    channel?.send({
                      type: "broadcast",
                      event: "addGuess",
                      payload: {
                        userName: userData?.name || "Unknown",
                        guess: guess.trim(),
                        userId: userID,
                      },
                    });

                    toast.success("Guess submitted!", { duration: 500 });
                    setGuess("");
                  } catch (error) {
                    console.error("Error submitting guess:", error);
                    toast.error("Failed to submit guess");
                  }
                }
              }}
              className="flex gap-2 mt-auto"
            >
              <Input
                type="text"
                placeholder="Enter your guess..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <IoSend />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
