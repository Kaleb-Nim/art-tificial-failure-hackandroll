import { useState, useEffect } from "react";
import Logo from "../assets/Logo.png";
import { RoundType } from "@/types";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type AIPrediction = {
  guess: string;
  confidence: number;
};

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();
  const { round_id } = useParams();
  const [roundData, setRoundData] = useState<RoundType>();
  const [topic, setTopic] = useState<string>("");

  const [canvasImage, setCanvasImage] = useState<string>("");
  const [aiPrediction, setAiPrediction] = useState<AIPrediction>({
    guess: "",
    confidence: 0,
  });
  const [playerGuesses, setPlayerGuesses] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!round_id) return;
      // Fetch drawing
      const imageUrl = await getDrawingUrl(round_id);
      if (imageUrl) {
        setCanvasImage(imageUrl);
      } else {
        setCanvasImage(
          import.meta.env.VITE_SUPABASE_URL +
            "/storage/v1/object/public/art/" +
            `round_${round_id}.png`
        );
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
      console.log(playerData, "HIASD");
      if (playerError) {
        console.error("Error fetching player guesses:", playerError);
      } else if (playerData) {
        const formattedPlayerData = playerData.map((guess) => ({
          ...guess,
          art_users: [guess.art_users][0], // Only take the first user
        }));
        console.log(formattedPlayerData);
        setPlayerGuesses(formattedPlayerData);
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
                  {playerGuesses.map((guess) => {
                    console.log(guess["art_users"]);
                    return (
                      <PlayerCard
                        data={guess.art_users}
                        key={"Player " + guess.user_id}
                        isHost={false}
                        score={"Guess: " + guess.guess}
                      />
                    );
                  })}
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
              <h2 className="text-lg font-semibold text-center">
                AI Predictions
              </h2>
              <div>
                <p className="font-semibold text-xl">{aiPrediction.guess}</p>
                <p>Confidence Score: {aiPrediction.confidence.toFixed(2)}</p>
              </div>
              <h1 className="font-bold text-xl mt-5">
                <span>Verdict: </span>
                <br />
                <span className="text-red-500  text-3xl">
                  {roundData && roundData["winner"]}
                </span>
              </h1>
              <Button
                className="flex flex-row bg-blue-600"
                onClick={() => navigate("/")}
              >
                Play Again
                <ArrowRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Review;
