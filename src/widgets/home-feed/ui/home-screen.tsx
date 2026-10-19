"use client";

import { Globe } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DemoErrorState, useDemoQuery } from "@/features/demo-repository";
import { Button, StatusPanel } from "@/shared/ui";
import { filterHomeVideos, parseHomeQuery, type HomeSort, type HomeTopic } from "../model/filter-home";
import { HomeBanner } from "./home-banner";
import { HomeFilters } from "./home-filters";
import { HomeVideoCard } from "./home-video-card";

const coverAlt: Record<string, string> = {
  "Evening sauce": "Pasta in a pan on a kitchen stove",
  "Ridge line": "Hikers on a trail beneath a mountain ridge",
  "Color pass": "A video editing timeline on a monitor",
  "Creek crossing": "A green gorge with a stream below the rocks",
  "Soft light test": "A portrait lit by warm natural light",
  "Pier loop": "Sunlight on the water at the shore",
};

export function HomeScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const query = useDemoQuery("home", (repository) => repository.listHomeVideos());
  const homeQuery = parseHomeQuery({
    q: params.get("q"),
    topic: params.get("topic"),
    sort: params.get("sort"),
  });

  function replaceQuery(next: { topic?: HomeTopic; sort?: HomeSort; clear?: boolean }) {
    const search = new URLSearchParams(params.toString());
    if (next.clear) {
      search.delete("q");
      search.delete("topic");
      search.delete("sort");
    }
    if (next.topic) {
      if (next.topic === "all") search.delete("topic");
      else search.set("topic", next.topic);
    }
    if (next.sort) {
      if (next.sort === "newest") search.delete("sort");
      else search.set("sort", next.sort);
    }
    const value = search.toString();
    router.replace(value ? `/?${value}` : "/", { scroll: false });
  }

  function openCreateRoom() {
    const search = new URLSearchParams(params.toString());
    search.set("create", "room");
    router.replace(`/?${search.toString()}`, { scroll: false });
  }

  function explore() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("discover")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className="grid min-w-0 gap-7">
      <header className="flex min-w-0 items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-[40px]">Home</h1>
          <p className="mt-2 text-[15px] text-muted">Fresh perspectives. New favorites. Your next great watch.</p>
        </div>
        <p className="hidden items-center gap-2 text-sm text-muted sm:flex">
          <Globe aria-hidden="true" className="size-4" />
          Public videos
        </p>
      </header>
      <HomeBanner onExplore={explore} onCreateRoom={openCreateRoom} />
      <p className="flex items-center gap-2 text-sm text-muted sm:hidden">
        <Globe aria-hidden="true" className="size-4" />
        Public videos
      </p>
      {query.status === "loading" ? <p role="status">Loading videos…</p> : null}
      {query.status === "error" ? <DemoErrorState error={query.error} /> : null}
      {query.status === "ready" ? (
        <Catalog
          items={query.data}
          topic={homeQuery.topic}
          sort={homeQuery.sort}
          queryText={homeQuery.query}
          onTopic={(topic) => replaceQuery({ topic })}
          onSort={(sort) => replaceQuery({ sort })}
          onClear={() => replaceQuery({ clear: true })}
        />
      ) : null}
    </div>
  );
}

function Catalog({
  items,
  topic,
  sort,
  queryText,
  onTopic,
  onSort,
  onClear,
}: {
  items: Array<{
    id: string;
    title: string;
    durationLabel: string;
    createdAt: string;
    roomId: string;
    roomTitle: string;
    ownerId: string;
    ownerName: string;
    ownerAvatarSrc: string | null;
    coverSrc: string | null;
    category: "outdoors" | "food" | "film" | "lifestyle" | null;
  }>;
  topic: HomeTopic;
  sort: HomeSort;
  queryText: string;
  onTopic: (topic: HomeTopic) => void;
  onSort: (sort: HomeSort) => void;
  onClear: () => void;
}) {
  const visible = filterHomeVideos(items, { query: queryText, topic, sort });
  const filtered = queryText.length > 0 || topic !== "all";

  return (
    <section id="discover" className="grid min-w-0 scroll-mt-24 gap-5">
      <HomeFilters topic={topic} sort={sort} onTopic={onTopic} onSort={onSort} />
      <div className="flex min-w-0 items-end justify-between gap-4">
        <h2 className="min-w-0 font-display text-[26px] font-extrabold tracking-tight">Discover something good</h2>
        <p className="text-sm text-muted" aria-live="polite">
          {visible.length} {visible.length === 1 ? "video" : "videos"}
        </p>
      </div>
      {visible.length === 0 ? (
        <StatusPanel
          title={filtered ? "No matching videos" : "No public videos yet"}
          body={
            filtered
              ? "Nothing in the public catalog matches this search and category."
              : "Ready videos from public rooms show up here."
          }
          action={
            filtered ? (
              <Button type="button" variant="outline" onClick={onClear}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <HomeVideoCard
              key={item.id}
              href={`/rooms/${item.roomId}/videos/${item.id}`}
              title={item.title}
              coverSrc={item.coverSrc}
              coverAlt={coverAlt[item.title] ?? item.title}
              durationLabel={item.durationLabel}
              ownerName={item.ownerName}
              ownerHref={`/people/${item.ownerId}`}
              ownerAvatarSrc={item.ownerAvatarSrc}
              roomTitle={item.roomTitle}
              roomHref={`/rooms/${item.roomId}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
