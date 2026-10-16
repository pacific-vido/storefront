"use client";

import Link from "next/link";
import { VideoCard } from "@/entities/video";
import type { Video } from "@/entities/video";
import { DemoErrorState, useDemoQuery, type CatalogVideo } from "@/features/demo-repository";
import { StatusPanel } from "@/shared/ui";

export function HomeScreen() {
  const query = useDemoQuery("home", (repository) => repository.listHomeVideos());

  if (query.status === "loading") return <p role="status">Loading home…</p>;
  if (query.status === "error") return <DemoErrorState error={query.error} />;

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-semibold">Home</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Ready videos from other people’s public rooms. Your own rooms and invites stay in Library.
        </p>
      </header>
      {query.data.length === 0 ? (
        <StatusPanel
          title="No public videos yet"
          body="When someone else publishes a room, its ready videos show up here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((item) => (
            <VideoCard
              key={item.id}
              video={toVideo(item)}
              href={`/rooms/${item.roomId}/videos/${item.id}`}
              footer={
                <p className="text-sm text-muted">
                  <Link href={`/people/${item.ownerId}`} className="cursor-pointer font-medium text-ink">
                    {item.ownerName}
                  </Link>
                  {" · "}
                  <Link href={`/rooms/${item.roomId}`} className="cursor-pointer font-medium text-ink">
                    {item.roomTitle}
                  </Link>
                </p>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function toVideo(item: CatalogVideo): Video {
  return {
    id: item.id,
    roomId: item.roomId,
    title: item.title,
    status: item.status,
    progress: item.status === "ready" || item.status === "error" ? 100 : 0,
    durationLabel: item.durationLabel,
    createdAt: item.createdAt,
    errorMessage: item.errorMessage,
  };
}
