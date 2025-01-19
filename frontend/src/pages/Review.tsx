import { useState, useEffect } from "react";
import Logo from "../assets/Logo.png";
import { UserRoomType } from "@/types";
import { RoomType } from "@/types";

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
  const { data, error } = await supabase
    .storage
    .from('art')
    .getPublicUrl(`round_${roundId}.png`);

  if (error) {
    console.error('Error fetching drawing:', error);
    return null;
  }
  console.log(data);
  return data.publicUrl;
}

const Review = () => {
  const [players, setPlayers] = useState<UserRoomType[]>([]);
  const [roomData, setRoomData] = useState<RoomType>();

  const [canvasImage, setCanvasImage] = useState<string>("");
  const [aiPrediction, setAiPrediction] = useState<AIPrediction>({ guess: "", confidence: 0 });
  const [playerGuesses, setPlayerGuesses] = useState<PlayerGuess[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Hard coded round_id for testing
      const roundId = "135";
      
      // Fetch drawing
      const imageUrl = await getDrawingUrl(roundId);
      if (imageUrl) {
        setCanvasImage(imageUrl);
      }

      // Fetch AI prediction
      const { data: aiData, error: aiError } = await supabase
        .from("art_round_guesses")
        .select("guess, confidence")
        .eq("round_id", roundId)
        .eq("user_id", "1")
        .single();

      if (aiError) {
        console.error('Error fetching AI prediction:', aiError);
      } else if (aiData) {
        setAiPrediction({
          guess: aiData.guess,
          confidence: aiData.confidence
        });
      }

      // Fetch player guesses
      const { data: playerData, error: playerError } = await supabase
        .from("art_round_guesses")
        .select("user_id, guess, created_at")
        .eq("round_id", roundId)
        .neq("user_id", "1"); // Exclude AI guesses

      if (playerError) {
        console.error('Error fetching player guesses:', playerError);
      } else if (playerData) {
        setPlayerGuesses(playerData);
      }
    }
    fetchData();
  }, []);

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

  return (
    // <div className="w-full flex justify-center mt-20 mb-6">
    //   <div className="flex flex-col items-center w-4/5">
    //     <img className="h-44 mb-6" src={Logo} alt="Logo" />
    //     <Card className="p-6 w-full">
    //       {/* Create a grid with 5 columns */}
    //       <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-start">
    //         {/* First column */}
    //         <div className="flex flex-col items-center gap-4">
    //           <h1 className="font-bold text-2xl sticky top-0 bg-white py-2">
    //             Final Drawing
    //           </h1>
    //           <img src={canvasImage} alt="Final Drawing" />
    //         </div>

    //         {/* First vertical separator */}
    //         <Separator
    //           orientation="vertical"
    //           className="my-2 w-px bg-gray-300"
    //         />

    //         {/* Second column */}
    //         <div className="flex flex-col items-center gap-4">
    //           <h1 className="font-bold text-2xl text-center sticky top-0 bg-white py-2">
    //             AI Prediction and Confidence
    //           </h1>
    //           <div className="flex flex-col items-start gap-2 w-full">
    //             <div>
    //               <p>AI Prediction:</p>
    //               <p>Orange</p>
    //             </div>
    //             <div>
    //               <p>AI Confidence:</p>
    //               <p>0.85</p>
    //             </div>
    //           </div>
    //         </div>

    //         {/* Second vertical separator */}
    //         <Separator
    //           orientation="vertical"
    //           className="my-2 w-px bg-gray-300"
    //         />

    //         {/* Third column */}
    //         <div className="flex flex-col items-center gap-4">
    //           <h1 className="font-bold text-2xl sticky top-0 bg-white py-2">
    //             Player Predictions
    //           </h1>
    //           {/* Can for loop later */}
    //           <PlayerCard
    //             data={{
    //               user_id: "",
    //               name: "",
    //               created_at: "",
    //               character_img: "",
    //             }}
    //             isHost={false}
    //             score={0}
    //           />
    //         </div>
    //       </div>
    //     </Card>
    //   </div>
    // </div>
    <div className="w-full flex flex-col items-center mt-20 mb-6">
      {/* Top logo */}
      <img className="h-44 m-6" src={String(Logo)} alt="Logo" />

      {/* Single card containing all three sections */}
      <Card className="w-4/5">
        <CardHeader>
          <CardTitle className="text-2xl flex justify-center">
            Answer: Orange
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex w-full">
            {/* Left column */}
            <div className="w-1/3 p-4">
              <h2 className="text-lg font-semibold flex justify-center mb-2">
                Human Guesses
              </h2>
              <div className="w-full bg-blue-900 text-white p-4 rounded">
                <p className="text-center text-lg font-semibold mb-4">
                  Players
                </p>
                <ul className="space-y-2">
                  {playerGuesses.map((guess) => (
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
            <div className="w-1/4 p-4">
              <h2 className="text-lg font-semibold mb-2">AI Predictions</h2>
              <div>
                <p className="font-semibold text-xl">{aiPrediction.guess}</p>
                <p>Confidence Score: {aiPrediction.confidence.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Review;
