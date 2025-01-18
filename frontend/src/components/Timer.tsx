import { useState } from "react";
import { useTimer } from "react-timer-hook";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const Timer = () => {
  // Timer duration (60 seconds)
  const [duration, setDuration] = useState(60);

  // Initialize the expiry timestamp
  const getExpiryTimestamp = () => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + duration);
    return time;
  };

  const { seconds, restart, isRunning } = useTimer({
    expiryTimestamp: getExpiryTimestamp(),
    onExpire: () => console.log("Timer expired"),
    autoStart: false,
  });

  const percentage = (seconds / duration) * 100;

  // Determine progress bar color
  const percentageProgress =
    seconds > 30 ? "#4caf50" : seconds > 10 ? "#ff9800" : "#f44336";

  const handleRestart = () => {
    restart(getExpiryTimestamp()); // Restart with a new expiryTimestamp
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-gray-100 rounded-lg w-64">
      <h1 className="text-lg font-semibold text-gray-800">Countdown Timer</h1>
      <div className="w-40">
        <CircularProgressbar
          value={percentage}
          text={`${seconds}`}
          styles={buildStyles({
            pathTransition: "stroke-dashoffset 1s linear",
            pathColor: percentageProgress,
            textColor: "#374151",
            trailColor: "#d1d5db",
          })}
        />
      </div>
      <button
        className={`px-4 py-2 rounded-lg text-white font-medium ${
          isRunning ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"
        }`}
        onClick={handleRestart}
        disabled={isRunning}
      >
        {isRunning ? "Running..." : "Restart Timer"}
      </button>
    </div>
  );
};

export default Timer;
