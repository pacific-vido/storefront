import Link from "next/link";
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
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      <Link href={href} className="group block min-w-0 cursor-pointer">
        <span aria-hidden="true" className="relative flex aspect-video items-center justify-center bg-[#0a0e12]">
          {video.status === "ready" ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <PlayIcon />
            </span>
          ) : (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {videoStatusLabel[video.status]}
            </span>
          )}
          <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
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
          <span className={`shrink-0 text-xs font-semibold uppercase ${statusClass[video.status]}`}>
            {videoStatusLabel[video.status]}
          </span>
        </span>
      </Link>
      {footer ? <div className="px-4 pb-4">{footer}</div> : null}
      {video.errorMessage ? <p className="px-4 pb-3 text-sm text-danger">{video.errorMessage}</p> : null}
      {actions ? <div className="flex flex-wrap gap-2 px-4 pb-4">{actions}</div> : null}
    </article>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-0.5" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
    </svg>
  );
}
