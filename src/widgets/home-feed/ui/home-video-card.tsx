import Image from "next/image";
import Link from "next/link";
import { PlayIcon } from "@/shared/ui";

export function HomeVideoCard({
  href,
  title,
  coverSrc,
  coverAlt,
  durationLabel,
  ownerName,
  ownerHref,
  ownerAvatarSrc,
  roomTitle,
  roomHref,
}: {
  href: string;
  title: string;
  coverSrc: string | null;
  coverAlt: string;
  durationLabel: string;
  ownerName: string;
  ownerHref: string;
  ownerAvatarSrc: string | null;
  roomTitle: string;
  roomHref: string;
}) {
  return (
    <article className="min-w-0">
      <Link href={href} className="group block cursor-pointer rounded-xl">
        <span className="relative block aspect-video overflow-hidden rounded-xl bg-graphite">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={coverAlt}
              fill
              sizes="(min-width: 1280px) 28vw, (min-width: 768px) 44vw, 100vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
            />
          ) : null}
          <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 group-hover:bg-black/15 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
            <PlayIcon />
          </span>
          <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
            {durationLabel}
          </span>
        </span>
        <h3 className="mt-3 font-display text-[17px] leading-snug font-bold tracking-tight text-foreground">
          {title}
        </h3>
      </Link>
      <p className="mt-1.5 flex min-w-0 items-center gap-2 text-[13px] text-muted">
        {ownerAvatarSrc ? (
          <Image
            src={ownerAvatarSrc}
            alt=""
            width={24}
            height={24}
            className="size-6 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-secondary" />
        )}
        <span className="min-w-0 truncate">
          <Link href={ownerHref} className="font-medium text-foreground hover:underline">
            {ownerName}
          </Link>
          <span> · </span>
          <Link href={roomHref} className="hover:underline">
            {roomTitle}
          </Link>
        </span>
      </p>
    </article>
  );
}
