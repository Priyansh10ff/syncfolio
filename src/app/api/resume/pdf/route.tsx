import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { authed, HttpError, requireModule } from "@/lib/api/route";
import { loadProfile } from "@/lib/profile";
import { toResumeView } from "@/lib/modules";
import { ResumeDocument } from "@/lib/resume/template";

/** GET /api/resume/pdf — renders the resume view of the live profile. */
export const GET = authed(async (ctx) => {
  requireModule(ctx, "resume");
  const loaded = await loadProfile(ctx.supabase, ctx.profileId);
  if (!loaded) throw new HttpError(404, "Profile not found");

  const resume = toResumeView(loaded.profile);
  const buffer = await renderToBuffer(<ResumeDocument profile={resume} />);
  const filename = `${(resume.name || "resume").replace(/[^\w-]+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
