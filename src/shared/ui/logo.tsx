"use client";

import Link from "next/link";
import { appConfig } from "@/shared/config";
import { cn } from "@/shared/lib/cn";

export function Logo({
  href,
  variant = "full",
  className,
}: {
  href?: string;
  variant?: "full" | "mark";
  className?: string;
}) {
  const lockup = (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <LogoMark className={variant === "mark" ? "h-8" : "h-9"} />
      {variant === "full" ? (
        <span className="font-display text-[1.35rem] leading-none font-extrabold tracking-[-0.045em] text-foreground">
          {appConfig.name.toLowerCase()}
        </span>
      ) : null}
    </span>
  );

  if (!href) return lockup;

  return (
    <Link href={href} aria-label={appConfig.name} className="inline-flex rounded-lg">
      {lockup}
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <img src="/brand/mark.png" alt="" width={174} height={190} className={cn("w-auto shrink-0", className)} />
  );
}
