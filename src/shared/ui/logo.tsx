import Image from "next/image";
import Link from "next/link";

export function Logo({ href, name, compact = false }: { href?: string; name: string; compact?: boolean }) {
  const lockup = (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#314152] ring-1 ring-black/10 dark:bg-[#dce3ea] dark:ring-white/20">
        <Image
          src="/brand/mark.png"
          alt=""
          width={256}
          height={256}
          priority
          className="h-10 w-10"
        />
      </span>
      <span className={compact ? "hidden text-lg font-semibold tracking-tight text-ink sm:inline" : "text-lg font-semibold tracking-tight text-ink"}>
        {name}
      </span>
    </span>
  );

  if (!href) return lockup;

  return (
    <Link href={href} className="inline-flex rounded-xl">
      {lockup}
    </Link>
  );
}
