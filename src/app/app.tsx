"use client";

import dynamic from "next/dynamic";
import "./globals.css";

const Demo = dynamic(() => import("~/components/Demo"), {
  ssr: false,
});

export default function App(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  return <Demo title={title} />;
}
