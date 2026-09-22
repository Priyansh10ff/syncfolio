import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { webhook_url } = await req.json();

  if (webhook_url) {
    try {
      new URL(webhook_url);
    } catch {
      return NextResponse.json({ error: "Not a valid URL" }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ webhook_url: webhook_url || null })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
