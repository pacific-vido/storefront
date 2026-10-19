"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { VideoCard } from "@/entities/video";
import { RoomFormDialog } from "@/features/create-room";
import { AccessPanel } from "@/features/manage-access";
import { PlaylistPanel } from "@/features/manage-playlist";
import {
  demoErrorMessage,
  DemoErrorState,
  getDemoRepository,
  useDemoQuery,
} from "@/features/demo-repository";
import { DeleteVideoDialog, UploadDialog } from "@/features/upload-video";
import { Button, StatusPanel, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";

export function RoomScreen() {
  const params = useParams<{ roomId: string }>();
  const roomId = typeof params.roomId === "string" ? params.roomId : "";
  const query = useDemoQuery(`room:${roomId}`, async (repository) => {
    const details = await repository.getRoom(roomId);
    const [videos, playlists] = await Promise.all([
      repository.listVideos(roomId),
      repository.listPlaylists(roomId),
    ]);
    const access = details.role === "owner" ? await repository.listAccess(roomId) : null;
    return { details, videos, playlists, access };
  });
  const [tab, setTab] = useState("videos");
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (query.status === "loading") return <p role="status">Loading room…</p>;
  if (query.status === "error") return <DemoErrorState error={query.error} />;

  const { details, videos, playlists, access } = query.data;
  const owner = details.role === "owner";
  const tabs = owner
    ? [
        { id: "videos", label: "Videos" },
        { id: "playlists", label: "Playlists" },
        { id: "access", label: "Access" },
      ]
    : [
        { id: "videos", label: "Videos" },
        { id: "playlists", label: "Playlists" },
      ];
  const selected = tabs.some((item) => item.id === tab) ? tab : "videos";
  const deleting = videos.find((video) => video.id === deleteId) ?? null;

  async function run(action: () => Promise<unknown>): Promise<string | null> {
    setNotice(null);
    try {
      await action();
      return null;
    } catch (error) {
      return demoErrorMessage(error);
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{details.role}</p>
          <h1 className="mt-1 break-words text-3xl font-semibold">{details.room.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {details.room.description || "No description"}
          </p>
          {details.room.visibility === "public" ? (
            <p className="mt-2 text-sm text-muted">Public room. Anyone signed in can watch it.</p>
          ) : null}
        </div>
        {owner ? (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit room
          </Button>
        ) : (
          <p className="max-w-xs text-sm text-muted">You can watch. Only the owner can change this room.</p>
        )}
      </header>
      {notice ? (
        <p role="alert" className="text-sm text-danger">
          {notice}
        </p>
      ) : null}
      <Tabs value={selected} onValueChange={setTab}>
        <TabsList aria-label="Room sections">
          {tabs.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={selected}>
        {selected === "videos" ? (
          <div className="grid gap-4">
            {owner ? (
              <div className="flex justify-end">
                <Button onClick={() => setUploading(true)}>Upload</Button>
              </div>
            ) : null}
            {videos.length === 0 ? (
              <StatusPanel
                title="No videos"
                body={owner ? "Upload a video. The file itself is not stored." : "The owner has not added videos."}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    href={`/rooms/${roomId}/videos/${video.id}`}
                    actions={
                      owner ? (
                        <>
                          {video.status === "error" ? (
                            <Button
                              onClick={() => {
                                void run(() => getDemoRepository().retryUpload(roomId, video.id)).then(
                                  (message) => {
                                    if (message) setNotice(message);
                                  },
                                );
                              }}
                            >
                              Retry
                            </Button>
                          ) : null}
                          <Button variant="danger" onClick={() => setDeleteId(video.id)}>
                            Delete
                          </Button>
                        </>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
        {selected === "playlists" ? (
          <PlaylistPanel
            roomId={roomId}
            playlists={playlists}
            videos={videos}
            canEdit={owner}
            onCreate={(input) => run(() => getDemoRepository().createPlaylist(roomId, input))}
            onUpdate={(playlistId, input) =>
              run(() => getDemoRepository().updatePlaylist(roomId, playlistId, input))
            }
            onSetVideos={(playlistId, videoIds) =>
              run(() => getDemoRepository().setPlaylistVideos(roomId, playlistId, videoIds))
            }
          />
        ) : null}
        {selected === "access" && access ? (
          <AccessPanel
            access={access}
            onInvite={(email) => run(() => getDemoRepository().inviteViewer(roomId, email))}
            onRevoke={(userId) => run(() => getDemoRepository().revokeAccess(roomId, userId))}
          />
        ) : null}
        </TabsContent>
      </Tabs>
      <RoomFormDialog
        open={editing}
        mode="edit"
        initialTitle={details.room.title}
        initialDescription={details.room.description}
        onClose={() => setEditing(false)}
        onSubmit={(input) => run(() => getDemoRepository().updateRoom(roomId, input))}
      />
      <UploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        onUpload={(input) => run(() => getDemoRepository().startUpload(roomId, input))}
      />
      <DeleteVideoDialog
        open={deleting !== null}
        title={deleting?.title ?? "this video"}
        onClose={() => setDeleteId(null)}
        onConfirm={() =>
          deleting ? run(() => getDemoRepository().deleteVideo(roomId, deleting.id)) : Promise.resolve(null)
        }
      />
    </div>
  );
}
