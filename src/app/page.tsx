import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
      <h1 className="font-display text-3xl">Loom</h1>
      <p className="text-[var(--loom-muted)] max-w-md">
        Tell it what changed once. Your resume and portfolio update themselves.
      </p>
      <Link
        href="/dashboard/profile"
        className="mt-2 bg-[var(--loom-thread)] text-white rounded px-4 py-2 text-sm"
      >
        Open dashboard
      </Link>
    </div>
  );
}
