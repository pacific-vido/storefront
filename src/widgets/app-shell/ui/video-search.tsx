"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/shared/ui";

export function VideoSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [value, setValue] = useState(q);
  const [syncedQuery, setSyncedQuery] = useState(q);
  if (q !== syncedQuery) {
    setSyncedQuery(q);
    setValue((current) => (current.trim() === q ? current : q));
  }

  useEffect(() => {
    if (value === q) return;
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      const trimmed = value.trim();
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const query = next.toString();
      const path = pathname === "/" ? (query ? `/?${query}` : "/") : `/?${query}`;
      router.replace(path, { scroll: false });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [pathname, q, router, value]);

  return (
    <form
      role="search"
      className="relative mx-auto w-full max-w-xl"
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor="video-search" className="sr-only">
        Search videos and creators
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <Input
        id="video-search"
        type="search"
        value={value}
        placeholder="Search videos and creators"
        onChange={(event) => setValue(event.target.value)}
        className="h-10 rounded-full border-border bg-card pr-3 pl-9"
      />
    </form>
  );
}
