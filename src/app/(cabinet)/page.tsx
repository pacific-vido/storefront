import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeScreen } from "@/widgets/home-feed";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return (
    <Suspense fallback={<p role="status">Loading videos…</p>}>
      <HomeScreen />
    </Suspense>
  );
}
