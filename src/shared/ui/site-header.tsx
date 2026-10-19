import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({
  leading,
  center,
  children,
}: {
  leading?: React.ReactNode;
  center?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex shrink-0 items-center gap-2">{leading}</div>
      <div className="min-w-0 flex-1">{center}</div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        {children}
      </div>
    </header>
  );
}
