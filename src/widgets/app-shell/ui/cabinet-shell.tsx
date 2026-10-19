"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { currentUser, initialsFor } from "@/entities/user";
import { getDemoRepository, useDemoQuery } from "@/features/demo-repository";
import { Button, Logo, Sheet, SiteHeader } from "@/shared/ui";
import { CreateRoomHost } from "./create-room-host";
import { SidebarNav } from "./sidebar-nav";
import { VideoSearch } from "./video-search";

export function CabinetShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useDemoQuery("session", (repository) => repository.getSession());
  const rooms = useDemoQuery("sidebar-rooms", (repository) => repository.listRooms("owned"));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void getDemoRepository().ensureCurrentUser();
  }, []);

  const user =
    session.status === "ready" && session.data
      ? session.data
      : { id: currentUser.id, name: currentUser.displayName, email: currentUser.email };
  const owned = rooms.status === "ready" ? rooms.data : [];

  function openCreateRoom() {
    const next = new URLSearchParams(window.location.search);
    next.set("create", "room");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setMenuOpen(false);
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-background lg:flex">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 overflow-y-auto border-r border-border bg-surface lg:block">
        <SidebarNav
          pathname={pathname}
          user={user}
          rooms={owned}
          onNavigate={() => setMenuOpen(false)}
          onCreateRoom={openCreateRoom}
        />
      </aside>
      <div className="min-w-0 flex-1">
        <SiteHeader
          leading={
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu aria-hidden="true" className="size-5" />
              </Button>
              <span className="lg:hidden">
                <Logo href="/" variant="mark" />
              </span>
              <p className="hidden text-sm font-medium lg:block">Discover</p>
            </>
          }
          center={
            <Suspense fallback={<div className="mx-auto h-10 w-full max-w-xl rounded-full border border-border bg-card" />}>
              <VideoSearch />
            </Suspense>
          }
        >
          <Button type="button" className="px-3" aria-label="Create room" onClick={openCreateRoom}>
            <Plus aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Create room</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary text-sm font-semibold hover:bg-border"
            asChild
          >
            <Link href={`/people/${user.id}`} aria-label={`Account: ${user.name}`}>
              <span aria-hidden="true">{initialsFor(user.name)}</span>
            </Link>
          </Button>
        </SiteHeader>
        <main id="content" className="px-4 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <Sheet open={menuOpen} title="Menu" onClose={() => setMenuOpen(false)}>
        <SidebarNav
          pathname={pathname}
          user={user}
          rooms={owned}
          onNavigate={() => setMenuOpen(false)}
          onCreateRoom={openCreateRoom}
        />
      </Sheet>
      <Suspense fallback={null}>
        <CreateRoomHost />
      </Suspense>
    </div>
  );
}
