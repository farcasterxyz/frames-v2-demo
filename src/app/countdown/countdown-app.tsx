"use client";

import dynamic from "next/dynamic";

const Countdown = dynamic(() => import("~/components/Countdown"), {
  ssr: false,
});

export default function CountdownApp() {
  return <Countdown />;
}
