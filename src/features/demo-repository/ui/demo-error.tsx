"use client";

import Link from "next/link";
import { StatusPanel } from "@/shared/ui";
import { DemoAccessError, demoErrorMessage } from "../model/errors";

const titles: Record<string, string> = {
  unauthenticated: "Sign-in required",
  unknown_room: "Room not found",
  forbidden: "Access denied",
  unknown_video: "Video not found",
  unknown_playlist: "Playlist not found",
  validation: "Check the form",
  invalid_state: "That action is not available",
  unexpected: "Something went wrong",
};

export function DemoErrorState({ error }: { error: unknown }) {
  const code = error instanceof DemoAccessError ? error.code : "unexpected";
  return (
    <StatusPanel
      title={titles[code] ?? titles.unexpected ?? "Something went wrong"}
      body={demoErrorMessage(error)}
      action={
        <Link
          href="/rooms"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-bg px-4 text-sm font-semibold"
        >
          Back to rooms
        </Link>
      }
    />
  );
}
