"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { Profile } from "@/lib/schema/profile";
import { ResumeDocument } from "@/lib/resume/template";

export default function ResumePreview({ profile }: { profile: Profile }) {
  if (!profile.name) {
    return (
      <p className="text-sm text-[var(--loom-muted)]">
        Add your name and a bit of experience on the Profile page to see a preview here.
      </p>
    );
  }

  return (
    <PDFViewer style={{ width: "100%", height: "80vh", border: "none" }} showToolbar={false}>
      <ResumeDocument profile={profile} />
    </PDFViewer>
  );
}
