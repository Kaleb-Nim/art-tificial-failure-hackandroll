import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

import Avatar_1 from "../assets/Avatar_1.png";
import Avatar_2 from "../assets/Avatar_2.png";
import Avatar_3 from "../assets/Avatar_3.png";
import Avatar_4 from "../assets/Avatar_4.png";
import Avatar_5 from "../assets/Avatar_5.png";

const AvatarCarousel = () => {
  const carouselSlides = [
    {
      avatar: Avatar_1,
      pointer: "Avatar 1",
    },
    {
      avatar: Avatar_2,
      pointer: "Avatar 2",
    },
    {
      avatar: Avatar_3,
      pointer: "Avatar 3",
    },
    {
      avatar: Avatar_4,
      pointer: "Avatar 4",
    },
    {
      avatar: Avatar_5,
      pointer: "Avatar 5",
    },
  ];

  return (
    <Carousel className="w-full max-w-2xl mx-auto">
      <CarouselContent>
        {carouselSlides.map((slide, index) => (
          <CarouselItem key={index} className="flex flex-col items-center p-4">
            <img
              src={slide.avatar}
              alt={`Avatar ${index + 1}`}
              className="w-full h-auto rounded-lg shadow-md mb-4 bg-black"
            />
            <p className="text-center font-medium text-gray-800">
              {slide.pointer}
            </p>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="text-gray-800 hover:text-gray-600" />
      <CarouselNext className="text-gray-800 hover:text-gray-600" />Ç
    </Carousel>
  );
};

export default AvatarCarousel;
