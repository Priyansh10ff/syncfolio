import { getProfileWithSettings } from "@/lib/profile";
import { toResumeView } from "@/lib/modules";
import ResumePreview from "./resume-preview";
import ModuleOff from "../module-off";

export default async function ResumePage() {
  const { profile, settings } = await getProfileWithSettings();
  if (!settings.resume_enabled) return <ModuleOff name="Resume" />;

  const resume = toResumeView(profile);
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl mb-1">Resume</h1>
          <p className="text-sm text-[var(--sf-muted)]">
            Generated from everything marked for the resume on your profile — edit it there, not here.
          </p>
        </div>
        <a
          href="/api/resume/pdf"
          className="bg-[var(--sf-thread)] text-thread-ink rounded px-4 py-2 text-sm"
        >
          Download PDF
        </a>
      </div>
      <ResumePreview profile={resume} />
    </div>
  );
}
