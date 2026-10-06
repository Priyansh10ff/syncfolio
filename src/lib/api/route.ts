import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ProfileSettings } from "@/lib/schema/profile";

/** Thrown inside a handler to return a JSON error with a status code. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

export type AuthedContext = {
  req: Request;
  supabase: SupabaseClient;
  userId: string;
  profileId: string;
  settings: ProfileSettings;
};

type Handler = (ctx: AuthedContext) => Promise<unknown>;

/**
 * Wraps a route handler that needs a signed-in user with a profile.
 * Resolves the session, profile id and module settings once, turns
 * HttpError into JSON responses, and hides unexpected errors behind a
 * generic 500. A handler returns either a Response or a plain object
 * (sent as 200 JSON).
 */
export function authed(handler: Handler) {
  return async (req: Request): Promise<Response> => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new HttpError(401, "Not signed in");

      const { data: row } = await supabase
        .from("profiles")
        .select("id, resume_enabled, portfolio_enabled, portfolio_auto_sync")
        .eq("user_id", user.id)
        .single();
      if (!row) throw new HttpError(401, "No profile for this account — sign in again.");

      const result = await handler({
        req,
        supabase,
        userId: user.id,
        profileId: row.id,
        settings: {
          resume_enabled: row.resume_enabled,
          portfolio_enabled: row.portfolio_enabled,
          portfolio_auto_sync: row.portfolio_auto_sync,
        },
      });
      return result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Same error handling as `authed`, for routes that don't use a session. */
export function open(handler: (req: Request) => Promise<unknown>) {
  return async (req: Request): Promise<Response> => {
    try {
      const result = await handler(req);
      return result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

/** Parses the JSON body against a zod schema, or throws a 400 naming the first problem. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length ? `${issue.path.join(".")}: ` : "";
    throw new HttpError(400, `${where}${issue.message}`);
  }
  return result.data;
}

/** Throws a 404 when the given module is turned off for this profile. */
export function requireModule(ctx: AuthedContext, module: "resume" | "portfolio") {
  const on = module === "resume" ? ctx.settings.resume_enabled : ctx.settings.portfolio_enabled;
  if (!on) {
    throw new HttpError(404, `The ${module} module is turned off. Turn it on in Settings.`);
  }
}

/** Throws a 500 HttpError carrying a Postgres error's message. */
export function dbFail(error: { message: string } | null): asserts error is null {
  if (error) throw new HttpError(500, error.message);
}
