import { cn } from "@/lib/utils";

type GuessProps = {
  userName: string;
  guess: string;
  isCurrentUser: boolean;
};

const Guesses = ({ userName, guess, isCurrentUser }: GuessProps) => {
  return (
    <div
      className={cn(
        "max-w-[200px] rounded-lg p-2",
        isCurrentUser
          ? "bg-blue-500 text-white ml-auto"
          : "bg-gray-200 text-black mr-auto"
      )}
    >
      <span className="text-sm font-semibold">
        {userName}
        {":"}
      </span>{" "}
      <span className="break-words">{guess}</span>
    </div>
  );
};

export default Guesses;
