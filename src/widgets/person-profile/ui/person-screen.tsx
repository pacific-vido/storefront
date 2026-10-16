"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RoomCard } from "@/entities/room";
import { VideoCard, type Video } from "@/entities/video";
import { DemoErrorState, useDemoQuery, type CatalogVideo } from "@/features/demo-repository";
import { StatusPanel } from "@/shared/ui";

export function PersonScreen() {
  const params = useParams<{ userId: string }>();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const query = useDemoQuery(`person:${userId}`, (repository) => repository.getPerson(userId));

  if (query.status === "loading") return <p role="status">Loading profile…</p>;
  if (query.status === "error") return <DemoErrorState error={query.error} />;

  const { person, self, rooms, videos } = query.data;

  return (
    <div className="grid gap-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Profile</p>
        <h1 className="mt-1 break-words text-3xl font-semibold">{person.name}</h1>
        <p className="mt-2 text-sm text-muted">{person.email}</p>
        {self ? (
          <p className="mt-3 max-w-2xl text-sm text-muted">
            This is your public page. Private rooms, your videos, and invitations live in{" "}
            <Link href="/rooms" className="cursor-pointer font-semibold text-accent-2">
              Library
            </Link>
            .
          </p>
        ) : (
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Public rooms and ready videos. Private rooms stay hidden.
          </p>
        )}
      </header>
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Public rooms</h2>
        {rooms.length === 0 ? (
          <StatusPanel title="No public rooms" body="This person has not published a room." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Public videos</h2>
        {videos.length === 0 ? (
          <StatusPanel title="No public videos" body="Ready videos from public rooms show up here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {videos.map((item) => (
              <VideoCard
                key={item.id}
                video={toVideo(item)}
                href={`/rooms/${item.roomId}/videos/${item.id}`}
                footer={
                  <p className="text-sm text-muted">
                    <Link href={`/rooms/${item.roomId}`} className="cursor-pointer font-medium text-ink">
                      {item.roomTitle}
                    </Link>
                  </p>
                }
              />
            ))}
          </div>
        )}
      </section>
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
