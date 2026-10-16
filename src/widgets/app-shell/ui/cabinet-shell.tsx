"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@/entities/user";
import { getDemoRepository, useDemoQuery } from "@/features/demo-repository";
import { appConfig } from "@/shared/config";
import { Button, Dialog, Logo, SiteHeader } from "@/shared/ui";

const links = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Library" },
  { href: "/settings", label: "Settings" },
];

export function CabinetShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useDemoQuery("session", (repository) => repository.getSession());
  const people = useDemoQuery("people", (repository) => repository.listDemoPeople());
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const reopenRef = useRef<HTMLButtonElement>(null);
  const focusReopen = useRef(false);

  useEffect(() => {
    if (!focusReopen.current || sidebarOpen) return;
    focusReopen.current = false;
    reopenRef.current?.focus();
  }, [sidebarOpen]);

  useEffect(() => {
    if (session.status === "ready" && session.data === null) router.replace("/login");
  }, [router, session]);

  if (session.status !== "ready" || session.data === null) {
    return (
      <p className="p-6 text-sm text-muted" role="status">
        Checking demo session…
      </p>
    );
  }

  const user = session.data;
  const directory = people.status === "ready" ? people.data : [];

  return (
    <div className="min-h-dvh bg-bg md:flex">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside
        inert={sidebarOpen ? undefined : true}
        className={
          sidebarOpen
            ? "hidden overflow-hidden bg-surface transition-[width] duration-300 ease-out motion-reduce:transition-none md:sticky md:top-0 md:block md:h-dvh md:w-[16.5rem] md:border-r md:border-line"
            : "hidden overflow-hidden bg-surface transition-[width] duration-300 ease-out motion-reduce:transition-none md:sticky md:top-0 md:block md:h-dvh md:w-0"
        }
      >
        <div className="flex h-dvh w-[16.5rem] flex-col">
          <Sidebar
            user={user}
            people={directory}
            pathname={pathname}
            onNavigate={() => setMenuOpen(false)}
            onCollapse={() => {
              focusReopen.current = true;
              setSidebarOpen(false);
            }}
          />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <SiteHeader
          leading={
            <>
              <div className="md:hidden">
                <Logo href="/" name={appConfig.name} compact />
              </div>
              {sidebarOpen ? null : (
                <Button
                  ref={reopenRef}
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex"
                  aria-label="Show sidebar"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeftOpen aria-hidden="true" className="size-5" />
                </Button>
              )}
            </>
          }
          signedIn={{
            name: user.name,
            href: `/people/${user.id}`,
            current: pathname === `/people/${user.id}`,
          }}
        >
          <Button variant="secondary" className="md:hidden" onClick={() => setMenuOpen(true)}>
            Menu
          </Button>
        </SiteHeader>
        <main id="content" className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
      <Dialog open={menuOpen} title="Menu" onClose={() => setMenuOpen(false)}>
        <Sidebar user={user} people={directory} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
      </Dialog>
    </div>
  );
}

function Sidebar({
  user,
  people,
  pathname,
  onNavigate,
  onCollapse,
}: {
  user: User;
  people: User[];
  pathname: string;
  onNavigate: () => void;
  onCollapse?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-2">
        <Logo href="/" name={appConfig.name} />
        {onCollapse ? (
          <Button variant="ghost" size="icon" aria-label="Hide sidebar" onClick={onCollapse}>
            <PanelLeftClose aria-hidden="true" className="size-5" />
          </Button>
        ) : null}
      </div>
      <nav aria-label="Main" className="grid gap-1">
        {links.map((link) => {
          const current =
            link.href === "/"
              ? pathname === "/"
              : link.href === "/settings"
                ? pathname === "/settings"
                : pathname === "/rooms" || pathname.startsWith("/rooms/");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm font-semibold ${current ? "bg-card text-ink shadow-sm" : "text-muted hover:bg-card hover:text-ink"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto grid gap-3">
        <p className="text-xs leading-5 text-muted">
          <span className="font-semibold text-accent-2">{appConfig.demoLabel}.</span> Fictional people
          and videos. This sign-in is not real authentication.
        </p>
        <p className="text-sm">
          <span className="block text-muted">Demo person</span>
          <span className="font-semibold">{user.name}</span>
        </p>
        {people.map((person) => (
          <div key={person.id} className="grid gap-1">
            <Button
              variant={person.id === user.id ? "secondary" : "ghost"}
              aria-pressed={person.id === user.id}
              onClick={() => {
                if (person.id !== user.id) void getDemoRepository().signIn(person.id);
              }}
            >
              {person.id === user.id ? person.name : `Switch to ${person.name}`}
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/people/${person.id}`} onClick={onNavigate}>
                {person.id === user.id ? "Your profile" : `${person.name}'s profile`}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
