"use client";

import Link from "next/link";
import { useState } from "react";
import type { Playlist } from "@/entities/playlist";
import type { Video } from "@/entities/video";
import { Button, Dialog, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusPanel, TextField } from "@/shared/ui";

export function PlaylistPanel({
  roomId,
  playlists,
  videos,
  canEdit,
  onCreate,
  onUpdate,
  onSetVideos,
}: {
  roomId: string;
  playlists: Playlist[];
  videos: Video[];
  canEdit: boolean;
  onCreate: (input: { title: string; description: string }) => Promise<string | null>;
  onUpdate: (
    playlistId: string,
    input: { title: string; description: string },
  ) => Promise<string | null>;
  onSetVideos: (playlistId: string, videoIds: string[]) => Promise<string | null>;
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function change(playlist: Playlist, videoIds: string[]) {
    setActionError(null);
    const message = await onSetVideos(playlist.id, videoIds);
    if (message) setActionError(message);
  }

  return (
    <div className="grid gap-4">
      {canEdit ? (
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>New playlist</Button>
        </div>
      ) : (
        <p className="text-sm text-muted">Playlists use the room’s access. Viewers can watch them.</p>
      )}
      {actionError ? (
        <p role="alert" className="text-sm text-danger">
          {actionError}
        </p>
      ) : null}
      {playlists.length === 0 ? (
        <StatusPanel
          title="No playlists"
          body="Videos can stay loose in the room, or you can group them here."
        />
      ) : (
        playlists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            roomId={roomId}
            playlist={playlist}
            videos={videos}
            canEdit={canEdit}
            onEdit={() => setEditing(playlist)}
            onChange={(videoIds) => void change(playlist, videoIds)}
          />
        ))
      )}
      <PlaylistFormDialog
        open={creating}
        title="New playlist"
        initialTitle=""
        initialDescription=""
        submitLabel="Create playlist"
        onClose={() => setCreating(false)}
        onSubmit={onCreate}
      />
      <PlaylistFormDialog
        open={editing !== null}
        title="Edit playlist"
        initialTitle={editing?.title ?? ""}
        initialDescription={editing?.description ?? ""}
        submitLabel="Save playlist"
        onClose={() => setEditing(null)}
        onSubmit={(input) => (editing ? onUpdate(editing.id, input) : Promise.resolve(null))}
      />
    </div>
  );
}

function PlaylistCard({
  roomId,
  playlist,
  videos,
  canEdit,
  onEdit,
  onChange,
}: {
  roomId: string;
  playlist: Playlist;
  videos: Video[];
  canEdit: boolean;
  onEdit: () => void;
  onChange: (videoIds: string[]) => void;
}) {
  const ordered = playlist.videoIds.flatMap((id) => {
    const video = videos.find((item) => item.id === id);
    return video ? [video] : [];
  });
  const available = videos.filter((video) => !playlist.videoIds.includes(video.id));
  const first = ordered[0];

  return (
    <article className="rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold">{playlist.title}</h3>
          <p className="mt-1 text-sm text-muted">{playlist.description || "No description"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {first ? (
            <Link
              href={`/rooms/${roomId}/videos/${first.id}?playlist=${playlist.id}`}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Play
            </Link>
          ) : null}
          {canEdit ? (
            <Button variant="secondary" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
        </div>
      </div>
      {ordered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No videos in this playlist yet.</p>
      ) : (
        <ol className="mt-4 grid gap-2">
          {ordered.map((video, index) => (
            <li key={video.id} className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/rooms/${roomId}/videos/${video.id}?playlist=${playlist.id}`}
                className="min-w-0 cursor-pointer break-words text-sm font-medium"
              >
                {index + 1}. {video.title}
              </Link>
              {canEdit ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    disabled={index === 0}
                    aria-label={`Move ${video.title} earlier`}
                    onClick={() => onChange(move(playlist.videoIds, index, -1))}
                  >
                    Up
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={index === ordered.length - 1}
                    aria-label={`Move ${video.title} later`}
                    onClick={() => onChange(move(playlist.videoIds, index, 1))}
                  >
                    Down
                  </Button>
                  <Button variant="ghost" onClick={() => onChange(playlist.videoIds.filter((id) => id !== video.id))}>
                    Remove
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {canEdit ? (
        <AddVideo
          available={available}
          onAdd={(videoId) => onChange([...playlist.videoIds, videoId])}
        />
      ) : null}
    </article>
  );
}

function AddVideo({
  available,
  onAdd,
}: {
  available: Video[];
  onAdd: (videoId: string) => void;
}) {
  const [videoId, setVideoId] = useState(available[0]?.id ?? "");

  if (available.length === 0) {
    return <p className="mt-4 text-sm text-muted">Every room video is already in this playlist.</p>;
  }

  const selected = available.some((video) => video.id === videoId) ? videoId : available[0]?.id ?? "";

  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected) onAdd(selected);
      }}
    >
      <div className="grid min-w-48 flex-1 gap-1">
        <Label htmlFor="add-video">Add video</Label>
        <Select value={selected} onValueChange={setVideoId}>
          <SelectTrigger id="add-video">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {available.map((video) => (
              <SelectItem key={video.id} value={video.id}>
                {video.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Add</Button>
    </form>
  );
}

function PlaylistFormDialog({
  open,
  title,
  initialTitle,
  initialDescription,
  submitLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initialTitle: string;
  initialDescription: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (input: { title: string; description: string }) => Promise<string | null>;
}) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      {open ? (
        <PlaylistForm
          initialTitle={initialTitle}
          initialDescription={initialDescription}
          submitLabel={submitLabel}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

function PlaylistForm({
  initialTitle,
  initialDescription,
  submitLabel,
  onClose,
  onSubmit,
}: {
  initialTitle: string;
  initialDescription: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (input: { title: string; description: string }) => Promise<string | null>;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        void onSubmit({ title, description }).then((message) => {
          setPending(false);
          if (message) setError(message);
          else onClose();
        });
      }}
    >
      <TextField label="Playlist name" value={title} onChange={setTitle} error={error} />
      <TextField label="Description" value={description} onChange={setDescription} multiline />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function move(ids: string[], index: number, direction: -1 | 1): string[] {
  const next = [...ids];
  const target = index + direction;
  const current = next[index];
  const swap = next[target];
  if (current === undefined || swap === undefined) return ids;
  next[index] = swap;
  next[target] = current;
  return next;
}
