import Link from "next/link";

/** Shown in place of a module's page when that module is turned off. */
export default function ModuleOff({ name }: { name: "Resume" | "Portfolio" }) {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-1">{name}</h1>
      <p className="text-sm text-[var(--sf-muted)]">
        The {name.toLowerCase()} module is turned off.{" "}
        <Link href="/dashboard/settings" className="underline">
          Turn it on in Settings
        </Link>
        .
      </p>
    </div>
  );
}
