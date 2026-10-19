"use client";

import { House, Library, Lock, Settings } from "lucide-react";
import Link from "next/link";
import { initialsFor } from "@/entities/user";
import { Button, Logo } from "@/shared/ui";

const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/rooms", label: "Library", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({
  pathname,
  user,
  rooms,
  onNavigate,
  onCreateRoom,
}: {
  pathname: string;
  user: { id: string; name: string };
  rooms: Array<{ id: string; title: string }>;
  onNavigate: () => void;
  onCreateRoom: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col bg-surface">
      <div className="px-4 pt-5">
        <Logo href="/" />
      </div>
      <nav aria-label="Main" className="mt-6 grid gap-1 px-3">
        {links.map((link) => {
          const current = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={`relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[15px] ${
                current ? "bg-brand-soft font-medium text-foreground" : "text-foreground hover:bg-secondary"
              }`}
            >
              {current ? (
                <span aria-hidden="true" className="absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand" />
              ) : null}
              <Icon
                aria-hidden="true"
                className={`size-[18px] ${current ? "text-primary" : "text-muted"}`}
                strokeWidth={1.75}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t border-border px-4 pt-4">
        <p className="px-2 text-[11px] font-semibold tracking-[0.14em] text-muted">YOUR SPACE</p>
        <ul className="mt-2 grid gap-1">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                onClick={onNavigate}
                className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-foreground hover:bg-secondary"
              >
                <Lock aria-hidden="true" className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                <span className="truncate">{room.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto px-4 pb-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">A room for your people.</p>
          <p className="mt-1 text-[13px] leading-5 text-muted">Share videos. Choose who gets in.</p>
          <Button type="button" variant="outline" className="mt-3 w-full border-primary text-primary hover:bg-brand-soft" onClick={onCreateRoom}>
            Create a room
          </Button>
        </div>
      </div>
      <div className="border-t border-border px-3 py-3">
        <Link
          href={`/people/${user.id}`}
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 hover:bg-secondary"
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground"
          >
            {initialsFor(user.name)}
          </span>
          <span className="truncate text-sm font-semibold">{user.name}</span>
        </Link>
      </div>
    </div>
  );
}
