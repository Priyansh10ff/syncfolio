import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { landingDisplay, landingHand, landingMono } from "@/components/landing/fonts";

export const metadata: Metadata = {
  title: "Syncfolio — say what you shipped, once",
  description:
    "Write one sentence when something changes. Syncfolio drafts the diff, you approve it, and your resume and portfolio update themselves. Open source.",
};

export default function Home() {
  return (
    <div className={`${landingDisplay.variable} ${landingHand.variable} ${landingMono.variable}`}>
      <Landing />
    </div>
  );
}
