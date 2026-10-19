import type { VideoCategory } from "@/entities/video";

export const homeTopics = [
  { id: "all", label: "All videos" },
  { id: "outdoors", label: "Outdoors" },
  { id: "food", label: "Food & cooking" },
  { id: "film", label: "Film & design" },
  { id: "lifestyle", label: "Lifestyle" },
] as const;

export type HomeTopic = (typeof homeTopics)[number]["id"];
export type HomeSort = "newest" | "oldest";

export interface HomeListing {
  id: string;
  title: string;
  ownerName: string;
  roomTitle: string;
  createdAt: string;
  category: VideoCategory | null;
}

export interface HomeQuery {
  query: string;
  topic: HomeTopic;
  sort: HomeSort;
}

const topicIds = new Set<string>(homeTopics.map((topic) => topic.id));

export function parseHomeQuery(input: {
  q?: string | null;
  topic?: string | null;
  sort?: string | null;
}): HomeQuery {
  const topic = input.topic && topicIds.has(input.topic) ? (input.topic as HomeTopic) : "all";
  const sort: HomeSort = input.sort === "oldest" ? "oldest" : "newest";
  return {
    query: input.q?.trim() ?? "",
    topic,
    sort,
  };
}

export function filterHomeVideos<T extends HomeListing>(items: readonly T[], query: HomeQuery): T[] {
  const needle = query.query.toLowerCase();
  const matched = items.filter((item) => {
    if (query.topic !== "all" && item.category !== query.topic) return false;
    if (!needle) return true;
    return [item.title, item.ownerName, item.roomTitle].some((value) => value.toLowerCase().includes(needle));
  });
  return [...matched].sort((left, right) => {
    const order = left.createdAt.localeCompare(right.createdAt);
    return query.sort === "oldest" ? order : -order;
  });
}
