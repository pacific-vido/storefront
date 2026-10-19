"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { filterRoomsByTitle, RoomCard } from "@/entities/room";
import { VideoCard, type Video } from "@/entities/video";
import {
  demoErrorMessage,
  DemoErrorState,
  getDemoRepository,
  useDemoQuery,
  type CatalogVideo,
} from "@/features/demo-repository";
import { Button, StatusPanel, Tabs, TabsContent, TabsList, TabsTrigger, TextField } from "@/shared/ui";

export function RoomsScreen() {
  const query = useDemoQuery("rooms", async (repository) => {
    const [owned, shared, pending, videos] = await Promise.all([
      repository.listRooms("owned"),
      repository.listRooms("shared"),
      repository.listPendingInvitations(),
      repository.listOwnedVideos(),
    ]);
    return { owned, shared, pending, videos };
  });
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState("owned");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function openCreateRoom() {
    const next = new URLSearchParams(window.location.search);
    next.set("create", "room");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  if (query.status === "loading") {
    return <p role="status">Loading rooms…</p>;
  }
  if (query.status === "error") return <DemoErrorState error={query.error} />;

  const roomSource = tab === "shared" ? query.data.shared : query.data.owned;
  const visibleRooms = filterRoomsByTitle(roomSource, search);
  const needle = search.trim().toLowerCase();
  const visibleVideos = needle
    ? query.data.videos.filter((item) => item.title.toLowerCase().includes(needle))
    : query.data.videos;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Library</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Your rooms, the videos in them, and rooms other people have shared with you.
          </p>
        </div>
        <Button onClick={openCreateRoom}>Create room</Button>
      </div>
      <TextField
        label={tab === "videos" ? "Search by video title" : "Search by room name"}
        type="search"
        value={search}
        onChange={setSearch}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Room lists">
          <TabsTrigger value="owned">My rooms</TabsTrigger>
          <TabsTrigger value="videos">My videos</TabsTrigger>
          <TabsTrigger value="shared">Shared with me</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
        {notice ? (
          <p role="alert" className="mb-4 text-sm text-danger">
            {notice}
          </p>
        ) : null}
        {tab === "shared" && query.data.pending.length > 0 ? (
          <section className="mb-4 rounded-2xl border border-line bg-card p-5">
            <h2 className="font-semibold">Invitations</h2>
            <ul className="mt-3 grid gap-3">
              {query.data.pending.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm">
                    <span className="font-medium">{invitation.roomTitle}</span>
                    <span className="text-muted"> · from {invitation.invitedByName}</span>
                  </span>
                  <Button
                    onClick={() => {
                      setNotice(null);
                      void getDemoRepository()
                        .acceptInvitation(invitation.id)
                        .catch((error: unknown) => setNotice(demoErrorMessage(error)));
                    }}
                  >
                    Accept
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {tab === "videos" ? (
          visibleVideos.length === 0 ? (
            <StatusPanel
              title={search.trim() ? "No matching videos" : "No videos yet"}
              body={
                search.trim()
                  ? "Try a different title. Search only looks through videos in your rooms."
                  : "Videos you add inside your rooms show up here, including ones that are still processing."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleVideos.map((item) => (
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
          )
        ) : visibleRooms.length === 0 ? (
          <StatusPanel
            title={search.trim() ? "No matching rooms" : tab === "owned" ? "No rooms yet" : "Nothing shared yet"}
            body={
              search.trim()
                ? "Try a different name. Search only looks through rooms you can already open."
                : tab === "owned"
                  ? "Create a room to keep videos private and invite viewers."
                  : "Accepted invitations show up here. Pending ones are listed above when you have them."
            }
            action={
              tab === "owned" && !search.trim() ? (
                <Button onClick={openCreateRoom}>Create room</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
        </TabsContent>
      </Tabs>
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
