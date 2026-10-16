"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  demoErrorMessage,
  DemoErrorState,
  getDemoRepository,
  useDemoQuery,
} from "@/features/demo-repository";
import { Button, TextField } from "@/shared/ui";

export function SettingsScreen() {
  const router = useRouter();
  const query = useDemoQuery("settings", (repository) => repository.getSession());
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  if (query.status === "loading") return <p role="status">Loading settings…</p>;
  if (query.status === "error") return <DemoErrorState error={query.error} />;
  if (!query.data) return <p role="status">Checking demo session…</p>;

  const draft = name ?? query.data.name;

  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          This display name is stored in memory for the demo person you picked. Refreshing the page
          clears it, along with every other demo change.
        </p>
      </div>
      <form
        className="grid gap-4 rounded-2xl border border-line bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setSaved(false);
          setError(null);
          void getDemoRepository()
            .updateDisplayName(draft)
            .then(() => {
              setName(null);
              setSaved(true);
            })
            .catch((caught: unknown) => setError(demoErrorMessage(caught)))
            .finally(() => setPending(false));
        }}
      >
        <TextField label="Display name" value={draft} onChange={setName} error={error} />
        <p className="text-sm text-muted">Email stays {query.data.email} so demo invites can find you.</p>
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Saving…" : "Save display name"}
        </Button>
        {saved ? <p role="status">Saved for this browser session.</p> : null}
      </form>
      <Button
        variant="secondary"
        className="w-fit"
        onClick={() => {
          void getDemoRepository()
            .signOut()
            .then(() => router.replace("/login"));
        }}
      >
        Leave demo
      </Button>
    </div>
  );
}
