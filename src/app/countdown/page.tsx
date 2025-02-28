"use client";
import { useEffect, useState } from "react";

import { Metadata } from "next";

// const appUrl = process.env.NEXT_PUBLIC_URL;
const appUrl = process.env.VERCEL_URL;

const frame = {
  version: "next",
  imageUrl: `https://${appUrl}/opengraph-image`,
  button: {
    title: "Launch Frame",
    action: {
      type: "launch_frame",
      name: "Farcaster Frames v2 Demo",
      url: `https://${appUrl}`,
      splashImageUrl: `https://${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Farcaster Frames v2 Demo",
    openGraph: {
      title: "Farcaster Frames v2 Demo",
      description: "A Farcaster Frames v2 demo app.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

// const START_DATE = new Date("2025-02-13"); // 2 weeks before Feb 27
const END_DATE = new Date("2025-04-09"); // 6 weeks from Feb 26

const STAR_COUNT = 100;
const FALL_DURATION = 5000; // Duration for stars to fall in milliseconds

const COLORS = [
  "#FF5733",
  "#FFBD33",
  "#DBFF33",
  "#75FF33",
  "#33FF57",
  "#33FFBD",
  "#33DBFF",
  "#3375FF",
  "#5733FF",
  "#BD33FF",
  "#FF33DB",
  "#FF3375",
];

const QUOTES = [
  "Time is the most valuable thing a man can spend. - Theophrastus",
  "The two most powerful warriors are patience and time. - Leo Tolstoy",
  "Yesterday is gone. Tomorrow has not yet come. We have only today. - Mother Teresa",
  "The future depends on what you do today. - Mahatma Gandhi",
  "Time waits for no one. - Folklore",
  "Lost time is never found again. - Benjamin Franklin",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Time flies over us, but leaves its shadow behind. - Nathaniel Hawthorne",
  "Don't count every hour in the day, make every hour in the day count. - Muhammad Ali",
  "Time is what we want most, but what we use worst. - William Penn",
  "The key is in not spending time, but in investing it. - Stephen R. Covey",
  "Either you run the day, or the day runs you. - Jim Rohn",
  "Time discovers truth. - Seneca",
  "Time is a created thing. To say 'I don't have time' is to say 'I don't want to.' - Lao Tzu",
  "The trouble is, you think you have time. - Buddha",
  "Time is the wisest counselor of all. - Pericles",
  "Time is the school in which we learn, time is the fire in which we burn. - Delmore Schwartz",
  "The present time has one advantage over every other – it is our own. - Charles Caleb Colton",
  "Time is the coin of your life. It is the only coin you have, and only you can determine how it will be spent. - Carl Sandburg",
  "The time is always right to do what is right. - Martin Luther King Jr.",
];

const generateStars = () => {
  return Array.from({ length: STAR_COUNT }, () => ({
    id: Math.random(),
    x: Math.random() * 100, // Random x position
    delay: Math.random() * FALL_DURATION, // Random delay for falling
    color: COLORS[Math.floor(Math.random() * COLORS.length)], // Random color
  }));
};

const CountdownPage = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [stars] = useState(generateStars());
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Update countdown based on current time
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = END_DATE.getTime() - now.getTime();
      setTimeLeft(Math.max(0, difference));
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1); // Update every millisecond
    return () => clearInterval(intervalId);
  }, []);

  const timeLeftString = timeLeft.toString();
  const visibleDigits = timeLeftString.slice(0, -3);
  const fadedDigits = timeLeftString.slice(-3);

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      {/* Starry Background */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              width: "2px",
              height: "2px",
              top: "-10px",
              left: `${star.x}%`,
              backgroundColor: star.color,
              animation: `fall ${FALL_DURATION}ms linear ${star.delay}ms infinite`,
            }}
          />
        ))}
      </div>

      {/* Countdown Display */}
      <div className="relative z-10 flex justify-center items-center h-full">
        <div className="text-center">
          <h1 className="mb-5 text-xl font-bold text-white text-shadow-lg opacity-0 animate-fadeIn">
            {quote}
          </h1>
          <p className="text-7xl font-mono font-bold text-white text-shadow-lg bg-black/30 p-8 rounded-lg backdrop-blur-sm">
            <span>{visibleDigits}</span>
            <span className="opacity-50">{fadedDigits}</span>
            <span className="text-2xl ml-2">ms</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CountdownPage;
