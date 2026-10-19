import { cn } from "@/shared/lib/cn";

export function PlayIcon({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-10 place-items-center rounded-full bg-white text-graphite", className)}>
      <svg viewBox="0 0 24 24" className="block size-4" aria-hidden="true">
        <path d="M8.333 5.5v13L19.333 12z" fill="currentColor" />
      </svg>
    </span>
  );
}
