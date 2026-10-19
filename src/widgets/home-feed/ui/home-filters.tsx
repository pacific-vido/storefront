"use client";

import { homeTopics, type HomeSort, type HomeTopic } from "../model/filter-home";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";

export function HomeFilters({
  topic,
  sort,
  onTopic,
  onSort,
}: {
  topic: HomeTopic;
  sort: HomeSort;
  onTopic: (topic: HomeTopic) => void;
  onSort: (sort: HomeSort) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Video categories"
        className="flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {homeTopics.map((item) => {
          const active = item.id === topic;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onTopic(item.id)}
              className={`h-9 shrink-0 cursor-pointer rounded-full px-3.5 text-sm font-medium ${
                active ? "bg-graphite text-white" : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <Select value={sort} onValueChange={(value) => onSort(value === "oldest" ? "oldest" : "newest")}>
        <SelectTrigger aria-label="Sort videos" className="h-9 min-h-9 w-full shrink-0 rounded-full px-3 sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Recently added</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
