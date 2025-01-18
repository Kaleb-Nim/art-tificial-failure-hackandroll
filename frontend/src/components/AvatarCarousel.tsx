import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

type CarouselProps = {
  setApi: (api: any) => void;
  startIndex: number;
};

const AvatarCarousel = ({ setApi, startIndex }: CarouselProps) => {
  const carouselSlides = [
    {
      avatar: "./1.png",
      pointer: "Avatar 1",
    },
    {
      avatar: "./2.png",
      pointer: "Avatar 2",
    },
    {
      avatar: "./3.png",
      pointer: "Avatar 3",
    },
    {
      avatar: "./4.png",
      pointer: "Avatar 4",
    },
    {
      avatar: "./5.png",
      pointer: "Avatar 5",
    },
  ];

  return (
    <Carousel
      className="w-[calc(100%-6rem)]"
      opts={{
        loop: true,
        startIndex: startIndex,
      }}
      setApi={setApi}
    >
      <CarouselContent>
        {carouselSlides.map((slide, index) => (
          <CarouselItem key={index} className="flex flex-col items-center">
            <img
              src={slide.avatar}
              alt={`Avatar ${index + 1}`}
              className="w-full h-auto max-h-44 rounded-lg mb-4 aspect-square object-contain"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="text-gray-800 hover:text-gray-600" />
      <CarouselNext className="text-gray-800 hover:text-gray-600 " />
    </Carousel>
  );
};

export default AvatarCarousel;
