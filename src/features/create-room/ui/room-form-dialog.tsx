"use client";

import { useState } from "react";
import { Button, Dialog, TextField } from "@/shared/ui";

export function RoomFormDialog({
  open,
  mode,
  initialTitle,
  initialDescription,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialTitle: string;
  initialDescription: string;
  onClose: () => void;
  onSubmit: (input: { title: string; description: string }) => Promise<string | null>;
}) {
  return (
    <Dialog open={open} title={mode === "create" ? "Create room" : "Edit room"} onClose={onClose}>
      {open ? (
        <RoomForm
          key={`${mode}:${initialTitle}`}
          initialTitle={initialTitle}
          initialDescription={initialDescription}
          submitLabel={mode === "create" ? "Create room" : "Save room"}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

function RoomForm({
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const message = await onSubmit({ title, description });
    setPending(false);
    if (message) setError(message);
    else onClose();
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
      <TextField label="Room name" value={title} onChange={setTitle} error={error} />
      <TextField
        label="Description"
        value={description}
        onChange={setDescription}
        multiline
        hint="Optional."
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
