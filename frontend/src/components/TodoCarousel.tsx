import { useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const TodoCarousel = () => {
  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }));

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
      gif: "https://skribbl.io/img/tutorial/step3.gif",
      pointer:
        "If the AI is able to correctly guess what's being drawn, everyone loses!",
    },
    {
      gif: "https://skribbl.io/img/tutorial/step5.gif",
      pointer: "After all rounds, the player with the most points wins!",
    },
  ];

  return (
    <Carousel
      className="w-[calc(100%-6rem)]"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem
            key={index}
            className="flex flex-col items-center mx-auto"
          >
            <img
              src={slide.gif}
              alt={`Step ${index + 1}`}
              className="w-full h-auto rounded-lg shadow-md mb-4 bg-black invert"
            />
            <p className="text-left font-medium text-gray-800">
              {slide.pointer}
            </p>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default TodoCarousel;
