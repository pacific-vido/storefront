import Link from "next/link";
import type { RoomRole } from "../model/room";

export function RoomCard({
  room,
}: {
  room: {
    id: string;
    title: string;
    description: string;
    role: RoomRole;
    videoCount: number;
    playlistCount: number;
  };
}) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex min-w-0 cursor-pointer flex-col rounded-2xl border border-line bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="break-words text-lg font-semibold">{room.title}</h2>
        <span className="shrink-0 rounded-full border border-line px-2 py-1 text-xs uppercase tracking-wide text-muted">
          {room.role}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted">
        {room.description || "No description"}
      </p>
      <p className="mt-4 text-sm text-muted">
        {room.videoCount} {room.videoCount === 1 ? "video" : "videos"} · {room.playlistCount}{" "}
        {room.playlistCount === 1 ? "playlist" : "playlists"}
      </p>
    </Link>
  );
}
