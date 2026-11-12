import Link from "next/link";
import { Kbd, PageHeader } from "@/components/ui";
import { getDashboardContext, isProfileEmpty } from "@/lib/dashboard";
import ProfileEditor from "./profile-editor";

export default async function ProfilePage() {
  const { profile, settings } = await getDashboardContext();
  return (
    <>
      <PageHeader
        title="profile"
        description={
          <>
            The one source everything reads from. Click any value to edit — it saves itself.
            {settings.resume_enabled || settings.portfolio_enabled ? (
              <> <span className="font-mono text-ink">R</span> / <span className="font-mono text-ink">P</span> decide whether a row appears on your resume and portfolio.</>
            ) : null}
          </>
        }
        actions={
          isProfileEmpty(profile) ? (
            <Link href="/dashboard/welcome" className="font-mono text-[12px] text-thread hover:underline">run setup →</Link>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-muted"><Kbd>⌘K</Kbd> commands</span>
          )
        }
      />
      <ProfileEditor initial={profile} settings={settings} />
    </>
  );
}
