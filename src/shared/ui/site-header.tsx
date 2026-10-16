import Link from "next/link";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({
  leading,
  signedIn,
  children,
}: {
  leading?: React.ReactNode;
  signedIn: { name: string; href: string; current?: boolean } | null;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">{leading}</div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {children}
        {signedIn ? <SignedInAccount {...signedIn} /> : <GuestStatus />}
      </div>
    </header>
  );
}

function SignedInAccount({ name, href, current }: { name: string; href: string; current?: boolean }) {
  return (
    <Button variant="ghost" className="px-2 sm:px-3" asChild>
      <Link href={href} aria-label={`Signed in as ${name}`} aria-current={current ? "page" : undefined}>
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {initials(name)}
        </span>
        <span className="hidden max-w-36 truncate sm:inline">{name}</span>
      </Link>
    </Button>
  );
}

function GuestStatus() {
  return (
    <p className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm font-semibold text-muted">
      <span className="sm:hidden">Guest</span>
      <span className="hidden sm:inline">Not signed in</span>
    </p>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0] ?? "");
  const mark = letters.join("").toUpperCase();
  return mark || "?";
}
