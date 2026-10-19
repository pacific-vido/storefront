import Image from "next/image";
import Link from "next/link";
import { PlayIcon } from "@/shared/ui";
import { videoStatusLabel, type Video } from "../model/video";

const statusClass = {
  uploading: "text-accent-2",
  processing: "text-accent-2",
  ready: "text-ink",
  error: "text-danger",
} as const;

export function VideoCard({
  video,
  href,
  actions,
  footer,
}: {
  video: Video;
  href: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card">
      <Link href={href} className="group block min-w-0 cursor-pointer">
        <span aria-hidden="true" className="relative flex aspect-video items-center justify-center overflow-hidden bg-graphite">
          {video.coverSrc ? (
            <Image src={video.coverSrc} alt="" fill sizes="(min-width: 1280px) 30vw, 50vw" className="object-cover" />
          ) : null}
          {video.status === "ready" ? (
            <PlayIcon className="opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none" />
          ) : (
            <span className="relative rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
              {videoStatusLabel[video.status]}
            </span>
          )}
          <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
            {video.durationLabel}
          </span>
        </span>
        <span
          className={
            footer
              ? "flex items-start justify-between gap-3 px-4 pb-2 pt-3"
              : "flex items-start justify-between gap-3 px-4 pb-4 pt-3"
          }
        >
          <h3 className="break-words text-base font-semibold group-hover:text-accent-2">{video.title}</h3>
          {video.status === "ready" ? null : (
            <span className={`shrink-0 text-xs font-semibold uppercase ${statusClass[video.status]}`}>
              {videoStatusLabel[video.status]}
            </span>
          )}
        </span>
      </Link>
      {footer ? <div className="px-4 pb-4">{footer}</div> : null}
      {video.errorMessage ? <p className="px-4 pb-3 text-sm text-danger">{video.errorMessage}</p> : null}
      {actions ? <div className="flex flex-wrap gap-2 px-4 pb-4">{actions}</div> : null}
    </article>
  );
}
