"use client";

import { useState } from "react";
import { Button, Dialog, TextField } from "@/shared/ui";

export function AccessPanel({
  access,
  onInvite,
  onRevoke,
}: {
  access: {
    owner: { id: string; name: string; email: string };
    viewers: { id: string; name: string; email: string }[];
    invitations: { id: string; email: string; inviteeName: string | null }[];
  };
  onInvite: (email: string) => Promise<string | null>;
  onRevoke: (userId: string) => Promise<string | null>;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const revokeUser = access.viewers.find((viewer) => viewer.id === revokeId) ?? null;

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const message = await onInvite(email);
    setPending(false);
    if (message) setError(message);
    else setEmail("");
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-line bg-card p-5">
        <h3 className="font-semibold">People</h3>
        <ul className="mt-3 grid gap-3">
          <li className="flex items-center justify-between gap-3">
            <span>
              <span className="block font-medium">{access.owner.name}</span>
              <span className="text-sm text-muted">{access.owner.email}</span>
            </span>
            <span className="text-xs uppercase tracking-wide text-muted">Owner</span>
          </li>
          {access.viewers.map((viewer) => (
            <li key={viewer.id} className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-medium">{viewer.name}</span>
                <span className="text-sm text-muted">{viewer.email}</span>
              </span>
              <Button variant="danger" onClick={() => setRevokeId(viewer.id)}>
                Revoke
              </Button>
            </li>
          ))}
        </ul>
        {access.viewers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No viewers yet.</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h3 className="font-semibold">Invite a viewer</h3>
        <p className="mt-1 text-sm text-muted">
          Nothing is emailed. If the address matches someone here, they can accept it on Shared with me.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={(event) => void invite(event)}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={error}
          />
          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "Inviting…" : "Send invitation"}
          </Button>
        </form>
        {access.invitations.length > 0 ? (
          <ul className="mt-4 grid gap-2 text-sm">
            {access.invitations.map((invitation) => (
              <li key={invitation.id} className="text-muted">
                Pending: {invitation.inviteeName ?? invitation.email}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <Dialog
        open={revokeUser !== null}
        title="Revoke access"
        onClose={() => setRevokeId(null)}
      >
        {revokeUser ? (
          <RevokeConfirm
            name={revokeUser.name}
            onCancel={() => setRevokeId(null)}
            onConfirm={async () => {
              const message = await onRevoke(revokeUser.id);
              if (!message) setRevokeId(null);
              return message;
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function RevokeConfirm({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => Promise<string | null>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div>
      <p className="text-sm text-muted">
        {name} will lose this room, including its videos and playlists. You can invite them again later.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void onConfirm().then((message) => {
              setPending(false);
              if (message) setError(message);
            });
          }}
        >
          {pending ? "Revoking…" : "Revoke access"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
