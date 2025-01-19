import { useState, useEffect } from "react";
import Logo from "../assets/Logo.png";
import { RoundType, UserRoomType } from "@/types";
import { useParams } from "react-router-dom";

type AIPrediction = {
  guess: string;
  confidence: number;
};

type PlayerGuess = {
  user_id: string;
  guess: string;
  created_at: string;
};

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import PlayerCard from "@/components/PlayerCard";
import supabase from "@/lib/supabase";

async function getDrawingUrl(roundId: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from("art")
    .getPublicUrl(`round_${roundId}.png`);

  console.log(data);
  return data.publicUrl;
}

const Review = () => {
  const { round_id } = useParams();
  const [players, setPlayers] = useState<UserRoomType[]>([]);
  const [roundData, setRoundData] = useState<RoundType>();
  const [topic, setTopic] = useState<string>("");

  const [canvasImage, setCanvasImage] = useState<string>("");
  const [aiPrediction, setAiPrediction] = useState<AIPrediction>({
    guess: "",
    confidence: 0,
  });
  const [playerGuesses, setPlayerGuesses] = useState<PlayerGuess[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!round_id) return;
      // Fetch drawing
      const imageUrl = await getDrawingUrl(round_id);
      if (imageUrl) {
        setCanvasImage(imageUrl);
      }

      // Fetch AI prediction
      const { data: aiData, error: aiError } = await supabase
        .from("art_round_guesses")
        .select("guess, confidence")
        .eq("round_id", round_id)
        .eq("user_id", "1")
        .single();

      if (aiError) {
        console.error("Error fetching AI prediction:", aiError);
      } else if (aiData) {
        setAiPrediction({
          guess: aiData.guess,
          confidence: aiData.confidence,
        });
      }

      // Fetch player guesses
      const { data: playerData, error: playerError } = await supabase
        .from("art_round_guesses")
        .select("user_id, guess, created_at, art_users(*)")
        .eq("round_id", round_id)
        .neq("user_id", "1"); // Exclude AI guesses

      if (playerError) {
        console.error("Error fetching player guesses:", playerError);
      } else if (playerData) {
        setPlayerGuesses(playerData);
      }
    }
    if (!round_id) return;
    fetchData();
    getRoundData(round_id);
  }, [round_id]);

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

  async function getRoundData(round_id: string) {
    const { data, error } = await supabase
      .from("art_rounds")
      .select()
      .eq("id ", round_id);
    if (error) {
      console.log(error);
      return {};
    }
    if (data.length == 0) {
      return {};
    }
    console.log("ROUND", data[0]);
    setRoundData(data[0]);
    let topic = await getTopic(data[0]["topic_id"]);
    setTopic(topic[0]["name"]);
    return data[0];
  }

  return (
    <div className="w-full flex flex-col items-center h-full justify-center">
      {/* Top logo */}
      <img className="h-44 mb-6" src={String(Logo)} alt="Logo" />

      {/* Single card containing all three sections */}
      <Card className="w-4/5">
        <CardHeader>
          <CardTitle className="text-2xl flex justify-center">
            Answer: {topic}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center">
            {/* Left column */}
            <div className="w-1/3 p-4">
              <h2 className="text-lg font-semibold flex justify-center mb-2">
                Human Guesses
              </h2>
              <div className="w-full bg-blue-900 text-white p-4 rounded">
                <p className="text-center text-lg font-semibold mb-4">
                  Players
                </p>
                <ul className="space-y-2 h-full overflow-auto">
                  {playerGuesses.map((guess) => (
                    //   <PlayerCard
                    //   data={guess}
                    //   key={"Player " + guess.user_id}
                    //   isHost={false}
                    // />
                    <li key={guess.user_id} className="bg-blue-800 p-2 rounded">
                      <p className="font-semibold">Player {guess.user_id}</p>
                      <p>Guess: {guess.guess}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Vertical divider */}
            <Separator orientation="vertical" className="mx-4 bg-gray-300" />

            {/* Middle column */}
            <div className="w-1/3 p-4">
              <h2 className="text-lg font-semibold flex justify-center mb-2">
                Final Drawing
              </h2>
              <img src={canvasImage} alt="Final Drawing" />
            </div>

            {/* Vertical divider */}
            <Separator orientation="vertical" className="mx-4" />

            {/* Right column (slightly smaller) */}
            <div className="w-1/4 p-4 h-full self-stretch flex flex-col gap-2">
              <h2 className="text-lg font-semibold">AI Predictions</h2>
              <div>
                <p className="font-semibold text-xl">{aiPrediction.guess}</p>
                <p>Confidence Score: {aiPrediction.confidence.toFixed(2)}</p>
              </div>
              <h1 className="font-bold text-xl mt-5">
                <span>Verdict: </span>
                <span className="text-red-500  text-3xl">
                  {roundData && roundData["winner"]}
                </span>
              </h1>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Review;
