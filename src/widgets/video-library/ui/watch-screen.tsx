"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { videoStatusLabel } from "@/entities/video";
import {
  demoErrorMessage,
  DemoErrorState,
  getDemoRepository,
  useDemoQuery,
} from "@/features/demo-repository";
import { DeleteVideoDialog } from "@/features/upload-video";
import { appConfig } from "@/shared/config";
import { Button, StatusPanel } from "@/shared/ui";

export function WatchScreen() {
  const params = useParams<{ roomId: string; videoId: string }>();
  const searchParams = useSearchParams();
  const roomId = typeof params.roomId === "string" ? params.roomId : "";
  const videoId = typeof params.videoId === "string" ? params.videoId : "";
  const playlistId = searchParams.get("playlist");
  const query = useDemoQuery(`watch:${roomId}:${videoId}:${playlistId ?? ""}`, (repository) =>
    repository.getWatchContext(roomId, videoId, playlistId),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (query.status === "loading") return <p role="status">Loading video…</p>;
  if (query.status === "error") return <DemoErrorState error={query.error} />;

  const { room, role, video, playlist, queue } = query.data;
  const owner = role === "owner";

  async function run(action: () => Promise<unknown>): Promise<string | null> {
    try {
      await action();
      setNotice(null);
      return null;
    } catch (error) {
      const message = demoErrorMessage(error);
      setNotice(message);
      return message;
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link href={`/rooms/${room.id}`} className="cursor-pointer text-sm font-semibold text-accent-2">
          Back to {room.title}
        </Link>
        <h1 className="mt-3 break-words text-3xl font-semibold">{video.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {videoStatusLabel[video.status]}
          {playlist ? ` · ${playlist.title}` : " · Room videos"}
        </p>
      </div>
      {notice ? (
        <p role="alert" className="text-sm text-danger">
          {notice}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0">
          {video.status === "ready" ? (
            <figure className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
              <video
                key={video.id}
                controls
                playsInline
                preload="metadata"
                src={appConfig.sampleVideoUrl}
                className="aspect-video w-full bg-black"
              >
                Your browser cannot play this demo sample.
              </video>
              <figcaption className="px-4 py-3 text-sm text-muted">
                Demo sample: every ready video plays the same short CC0 clip from the MDN interactive
                examples. It is not an uploaded file.
              </figcaption>
            </figure>
          ) : (
            <StatusPanel
              title={videoStatusLabel[video.status]}
              body={
                video.errorMessage ??
                (video.status === "uploading" || video.status === "processing"
                  ? "Demo processing is running in this browser. Playback starts when the video is ready."
                  : "This demo video cannot be played.")
              }
              action={
                owner && video.status === "error" ? (
                  <Button onClick={() => void run(() => getDemoRepository().retryUpload(room.id, video.id))}>
                    Retry
                  </Button>
                ) : video.status === "uploading" || video.status === "processing" ? (
                  <div
                    className="mx-auto h-2 max-w-sm rounded-full bg-line"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={video.progress}
                    aria-label="Upload progress"
                  >
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${video.progress}%` }} />
                  </div>
                ) : undefined
              }
            />
          )}
          {owner ? (
            <div className="mt-4">
              <Button variant="danger" onClick={() => setConfirming(true)}>
                Delete
              </Button>
            </div>
          ) : null}
        </section>
        <nav aria-label={playlist ? playlist.title : "Videos in this room"} className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-sm font-semibold">{playlist ? playlist.title : "In this room"}</h2>
          <ol className="mt-3 grid gap-2">
            {queue.map((item) => {
              const href = playlist
                ? `/rooms/${room.id}/videos/${item.id}?playlist=${playlist.id}`
                : `/rooms/${room.id}/videos/${item.id}`;
              const current = item.id === video.id;
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    aria-current={current ? "true" : undefined}
                    className={`block cursor-pointer break-words rounded-lg px-2 py-2 text-sm ${current ? "bg-secondary font-semibold" : "hover:bg-background"}`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      <DeleteVideoDialog
        open={confirming}
        title={video.title}
        onClose={() => setConfirming(false)}
        onConfirm={() => run(() => getDemoRepository().deleteVideo(room.id, video.id))}
      />
    </div>
  );
}
