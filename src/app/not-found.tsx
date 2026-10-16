import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">That address is not part of this demo.</p>
      <Link href="/rooms" className="mt-6 inline-flex min-h-11 items-center font-semibold text-accent-2">
        Back to rooms
      </Link>
    </main>
  );
}
