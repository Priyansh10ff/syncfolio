import { Profile } from "@/lib/schema/profile";
import { parseResultSchema, ParseResult } from "./proposed-update";
import { getProvider, isAIConfigured } from "./providers";

export { isAIConfigured };

const SYSTEM_PROMPT = `You turn a person's casual, informal note about something that changed in their career or work into structured updates for their profile database.

You will be given:
1. A compact summary of their existing profile (experience, projects, skills, education — each with an id and a short label).
2. The person's free-text note describing what changed.

Decide, for each distinct change implied by the note, whether it:
- creates a new row (a new project, a new job, a new skill, a new degree), or
- updates an existing row (add a bullet/metric to a project or job that already exists, change an end date, etc.)

Match against existing rows by meaning, not exact string — "the trading bot" should match an existing project literally named "BSE/NSE paper-trading bot" if that's the closest existing thing.

Respond with ONLY a JSON object matching this exact shape — no markdown fences, no preamble, no text before or after the JSON:

{
  "updates": [
    {
      "target_table": "experience" | "projects" | "skills" | "education" | "profiles",
      "action": "create" | "update",
      "target_id": "<existing row id>" | null,
      "payload": { ...fields being set or added... },
      "diff_summary": "<one short human-readable line describing this exact change>"
    }
  ],
  "clarification_needed": "<a short question, if the note is too ambiguous to parse confidently>" | null
}

Rules:
- target_id must be null when action is "create", and must be a real id from the profile summary when action is "update".
- payload for a "create" on "projects" needs at least: name, description. Optional: bullets (array), metrics (array), tags (array).
- payload for an "update" on "projects" or "experience" should contain only the fields being changed — e.g. { "bullets": ["existing bullets...", "new bullet"] } to append a bullet, or { "metrics": [...] } to add a metric. Include the full new array (existing + new), not just the new item, since this replaces the field.
- payload for "experience" create needs: role, org, start_date (YYYY-MM). end_date is null if current.
- payload for "skills" create needs: name, and optionally category.
- Keep diff_summary short and specific: "Added 'cut p95 latency 40% via Redis caching' to Patchwork" not "Updated project."
- If nothing in the note maps to a confident change, return an empty updates array and fill clarification_needed.
- Never invent facts not implied by the note. Do not embellish metrics or claims the person didn't state.`;

function summarizeProfile(profile: Profile): string {
  const lines: string[] = [];
  lines.push(`Name: ${profile.name || "(not set)"}`);
  lines.push("Experience:");
  profile.experience.forEach((e) =>
    lines.push(`  - id=${e.id} "${e.role} at ${e.org}" bullets=${JSON.stringify(e.bullets)}`)
  );
  lines.push("Projects:");
  profile.projects.forEach((p) =>
    lines.push(
      `  - id=${p.id} "${p.name}" desc="${p.description}" bullets=${JSON.stringify(
        p.bullets
      )} metrics=${JSON.stringify(p.metrics)}`
    )
  );
  lines.push("Skills:");
  profile.skills.forEach((s) => lines.push(`  - id=${s.id} "${s.name}"`));
  lines.push("Education:");
  profile.education.forEach((ed) =>
    lines.push(`  - id=${ed.id} "${ed.degree ?? ""} at ${ed.institution}"`)
  );
  return lines.join("\n");
}

/** Strips markdown code fences a model added despite instructions not to. */
function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
}

export async function parseUpdateText(
  note: string,
  profile: Profile
): Promise<ParseResult> {
  // Manual editing on /dashboard/profile never depends on this — this
  // only blocks the natural-language update box.
  const provider = getProvider(); // throws "AI_NOT_CONFIGURED" if nothing is set up

  const raw = await provider.complete({
    system: SYSTEM_PROMPT,
    user: `Existing profile:\n${summarizeProfile(profile)}\n\nNote:\n"""${note}"""`,
    maxTokens: 2000,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    throw new Error(
      `${provider.id} returned text that wasn't valid JSON. Smaller local models sometimes need a stricter prompt or a JSON-mode/grammar setting — see docs/DEPLOYMENT.md.`
    );
  }

  return parseResultSchema.parse(parsed);
}
