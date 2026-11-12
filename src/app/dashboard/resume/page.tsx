import { PageHeader } from "@/components/ui";
import { getDashboardContext } from "@/lib/dashboard";
import ModuleOff from "@/components/app/module-off";
import ResumeWorkspace from "./resume-workspace";

export default async function ResumePage() {
  const { profile, settings } = await getDashboardContext();
  if (!settings.resume_enabled) return <ModuleOff name="Resume" />;
  return (
    <>
      <PageHeader title="resume" description="Generated from your profile — never edited by hand, so it can't fall behind. Toggle R to keep a row off the page without deleting it." />
      <ResumeWorkspace initial={profile} />
    </>
  );
}
