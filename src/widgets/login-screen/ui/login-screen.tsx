"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDemoRepository, demoErrorMessage } from "@/features/demo-repository";
import type { User } from "@/entities/user";
import { appConfig } from "@/shared/config";
import { Button, Logo, SiteHeader } from "@/shared/ui";

export function LoginScreen() {
  const router = useRouter();
  const [people, setPeople] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const repository = getDemoRepository();
    let active = true;
    void repository.getSession().then((session) => {
      if (active && session) router.replace("/");
    });
    void repository.listDemoPeople().then((directory) => {
      if (active) setPeople(directory);
    });
    return () => {
      active = false;
    };
  }, [router]);

  async function choose(userId: string) {
    setPendingId(userId);
    setError(null);
    try {
      await getDemoRepository().signIn(userId);
      router.push("/");
    } catch (caught) {
      setError(demoErrorMessage(caught));
      setPendingId(null);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader leading={<Logo name={appConfig.name} compact />} signedIn={null} />
      <main className="mx-auto flex w-full max-w-3xl flex-col justify-center gap-8 px-4 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-2">{appConfig.demoLabel}</p>
        <h1 className="mt-2 text-3xl font-semibold">Choose a demo person</h1>
        <p className="mt-3 max-w-xl text-muted">
          There is no password. These two people are fictional, and this screen is not real
          authentication. Avery owns two private rooms and has a pending invite. Jordan owns a private
          room, a public room, and already watches one of Avery’s. Other fictional people publish
          public videos on Home.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {people.map((person) => (
          <article key={person.id} className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-xl font-semibold">{person.name}</h2>
            <p className="mt-1 text-sm text-muted">{person.email}</p>
            <Button
              className="mt-5 w-full"
              disabled={pendingId !== null}
              onClick={() => void choose(person.id)}
            >
              {pendingId === person.id ? "Entering…" : `Continue as ${person.name}`}
            </Button>
          </article>
        ))}
      </div>
      </main>
    </div>
  );
}
