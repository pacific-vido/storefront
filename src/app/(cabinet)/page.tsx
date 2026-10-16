import type { Metadata } from "next";
import { HomeScreen } from "@/widgets/home-feed";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return <HomeScreen />;
}
