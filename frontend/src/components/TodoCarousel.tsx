import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const TodoCarousel = () => {
  const slides = [
    {
      gif: "https://skribbl.io/img/tutorial/step1.gif",
      pointer: "Make your room, or join your friend's with their room code!",
    },
    {
      gif: "https://skribbl.io/img/tutorial/step2.gif",
      pointer: "When all players are in, hit 'Start'!",
    },
    {
      gif: "https://skribbl.io/img/tutorial/step3.gif",
      pointer:
        "The Artist has 60 seconds to draw their phrase in a way only human players can understand, to score points.",
    },
    {
      gif: "https://skribbl.io/img/tutorial/step4.gif",
      pointer: "Guessers have to guess what the Artist draws to score points.",
    },
    {
      gif: "https://skribbl.io/img/tutorial/step5.gif",
      pointer:
        "If the AI is able to correctly guess what's being drawn, everyone loses!",
    },
    {
      gif: "https://skribbl.io/img/tutorial/step6.gif",
      pointer: "After all rounds, the player with the most points wins!",
    },
  ];

  return (
    <Carousel className="w-full max-w-2xl mx-auto">
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index} className="flex flex-col items-center p-4">
            <img
              src={slide.gif}
              alt={`Step ${index + 1}`}
              className="w-full h-auto rounded-lg shadow-md mb-4 bg-black"
            />
            <p className="text-center font-medium text-gray-800">
              {slide.pointer}
            </p>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="text-gray-800 hover:text-gray-600" />
      <CarouselNext className="text-gray-800 hover:text-gray-600" />
    </Carousel>
  );
};

export default TodoCarousel;
