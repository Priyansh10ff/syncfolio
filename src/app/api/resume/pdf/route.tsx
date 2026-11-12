import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { authed, HttpError, requireModule } from "@/lib/api/route";
import { loadProfile } from "@/lib/profile";
import { toResumeView } from "@/lib/modules";
import { ResumeDocument, type ResumeDensity } from "@/lib/resume/template";

/** GET /api/resume/pdf[?density=compact] — renders the resume view of the live profile. */
export const GET = authed(async (ctx) => {
  requireModule(ctx, "resume");
  const loaded = await loadProfile(ctx.supabase, ctx.profileId);
  if (!loaded) throw new HttpError(404, "Profile not found");

  const resume = toResumeView(loaded.profile);
  const density: ResumeDensity = new URL(ctx.req.url).searchParams.get("density") === "compact" ? "compact" : "comfortable";
  const buffer = await renderToBuffer(<ResumeDocument profile={resume} density={density} />);
  const filename = `${(resume.name || "resume").replace(/[^\w-]+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
