"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/shared/ui";

export function HomeBanner({ onExplore, onCreateRoom }: { onExplore: () => void; onCreateRoom: () => void }) {
  return (
    <section className="overflow-hidden rounded-xl bg-graphite text-white md:grid md:min-h-[240px] md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="flex flex-col justify-center px-6 pt-7 pb-8 sm:px-8 sm:pt-8 sm:pb-9 lg:px-10">
        <p className="text-[11px] font-bold tracking-[0.16em] text-brand">YOUR VIDEOS. YOUR CIRCLE.</p>
        <h2 className="mt-3 max-w-xl font-display text-[32px] leading-[1.08] font-extrabold tracking-tight sm:text-[40px]">
          Good stories deserve
          <br />
          the right audience.
        </h2>
        <p className="mt-3 max-w-md text-sm text-white/75">
          Explore public videos or create a room of your own.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={onExplore}>
            Explore videos
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={onCreateRoom}
          >
            Create a room
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
      <div className="relative h-44 min-h-0 overflow-hidden md:h-full">
        <Image
          src="/covers/banner.jpg"
          alt="A person standing on a rocky summit above forested mountains in warm light"
          fill
          priority
          sizes="(min-width: 768px) 46vw, 100vw"
          className="object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent md:bg-gradient-to-r md:from-graphite md:via-graphite/20 md:via-30% md:to-transparent" />
        <p className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
          <Lock aria-hidden="true" className="size-3.5" />
          Private by choice
        </p>
      </div>
    </section>
  );
}
