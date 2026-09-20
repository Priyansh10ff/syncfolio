import { getProfile } from "@/lib/profile";
import ResumePreview from "./resume-preview";

export default async function ResumePage() {
  const profile = await getProfile();
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl mb-1">Resume</h1>
          <p className="text-sm text-[var(--loom-muted)]">
            Generated straight from your profile — edit it there, not here.
          </p>
        </div>
        <a
          href="/api/resume/pdf"
          className="bg-[var(--loom-thread)] text-white rounded px-4 py-2 text-sm"
        >
          Download PDF
        </a>
      </div>
      <ResumePreview profile={profile} />
    </div>
  );
}
