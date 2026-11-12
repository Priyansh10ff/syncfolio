import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";

/** Shown in place of a module's page when that module is turned off. */
export default function ModuleOff({ name }: { name: "Resume" | "Portfolio" }) {
  return (
    <>
      <PageHeader title={name.toLowerCase()} />
      <EmptyState>
        the {name.toLowerCase()} module is off.{" "}
        <Link href="/dashboard/settings" className="text-thread hover:underline">
          turn it on in settings
        </Link>
      </EmptyState>
    </>
  );
}
