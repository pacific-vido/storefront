"use client";

import { useId, useRef, useState } from "react";
import type { UploadRequest } from "@/entities/video";
import { Button, Dialog, Input, Label, TextField } from "@/shared/ui";

export function UploadDialog({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (input: UploadRequest) => Promise<string | null>;
}) {
  return (
    <Dialog open={open} title="Upload video" onClose={onClose}>
      {open ? <UploadForm onClose={onClose} onUpload={onUpload} /> : null}
    </Dialog>
  );
}

function UploadForm({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (input: UploadRequest) => Promise<string | null>;
}) {
  const fileId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a video file. It is not sent anywhere.");
      return;
    }
    setPending(true);
    setError(null);
    const message = await onUpload({
      title,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
    setPending(false);
    if (message) setError(message);
    else onClose();
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
      <TextField label="Title" value={title} onChange={setTitle} />
      <div>
        <Label htmlFor={fileId}>Video file</Label>
        <Input
          id={fileId}
          ref={fileRef}
          type="file"
          accept="video/*"
          className="mt-1 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-semibold file:text-foreground"
        />
        <p className="mt-2 text-sm text-muted">
          The file stays on this device. The demo reads only the name, size, and type. A file name
          containing “fail” simulates a processing error you can retry.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Starting…" : "Start demo upload"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function DeleteVideoDialog({
  open,
  title,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<string | null>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    setError(null);
    const message = await onConfirm();
    setPending(false);
    if (message) setError(message);
    else onClose();
  }

  return (
    <Dialog open={open} title="Delete video" onClose={onClose}>
      <p className="text-sm text-muted">
        Delete “{title}” from this demo room? It will also disappear from playlists. This lasts
        until you refresh the page.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="danger" disabled={pending} onClick={() => void confirm()}>
          {pending ? "Deleting…" : "Delete video"}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}
