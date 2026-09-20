import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getProfile } from "@/lib/profile";
import { ResumeDocument } from "@/lib/resume/template";

export async function GET() {
  const profile = await getProfile();
  const buffer = await renderToBuffer(<ResumeDocument profile={profile} />);

  const filename = `${(profile.name || "resume").replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
