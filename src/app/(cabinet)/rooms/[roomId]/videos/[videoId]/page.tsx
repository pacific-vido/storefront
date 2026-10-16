import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchScreen } from "@/widgets/video-library";

export const metadata: Metadata = { title: "Video" };

export default function WatchPage() {
  return (
    <Suspense fallback={<p role="status">Loading video…</p>}>
      <WatchScreen />
    </Suspense>
  );
}
