"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InlineField, SectionHeader } from "@/components/ui";
import { EntitySection } from "@/components/app/profile/entity-section";
import { LinksEditor } from "@/components/app/profile/field-editors";
import { SECTIONS, type AnyRow } from "@/components/app/profile/specs";
import { api } from "@/lib/api/client";
import type { Profile, ProfileSettings } from "@/lib/schema/profile";

const BASICS = [
  { key: "name", label: "name", placeholder: "Your Name" },
  { key: "headline", label: "headline", placeholder: "Full-stack developer" },
  { key: "location", label: "location", placeholder: "City, Country" },
  { key: "email", label: "email", placeholder: "you@example.com", mono: true },
  { key: "summary", label: "summary", placeholder: "Two or three lines about you", multiline: true },
] as const;

/** The source of truth. Every field saves on its own; there is no save button. */
export default function ProfileEditor({ initial, settings }: { initial: Profile; settings: ProfileSettings }) {
  const router = useRouter();
  const [basics, setBasics] = useState({
    name: initial.name,
    headline: initial.headline ?? "",
    location: initial.location ?? "",
    email: initial.email ?? "",
    summary: initial.summary ?? "",
  });
  const [links, setLinks] = useState(initial.links);

  async function saveBasics(fields: Record<string, unknown>) {
    await api("/api/profile/basics", "PATCH", fields);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="sec-basics" className="flex flex-col gap-2">
        <SectionHeader id="sec-basics" title="basics" />
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-1.5 pt-2">
          {BASICS.map((f) => (
            <div key={f.key} className="contents">
              <span className="font-mono text-label uppercase text-muted pt-1">{f.label}</span>
              <InlineField
                label={f.label}
                value={basics[f.key]}
                placeholder={f.placeholder}
                mono={"mono" in f && f.mono}
                multiline={"multiline" in f && f.multiline}
                validate={(v) =>
                  f.key === "email" && v && !/^\S+@\S+\.\S+$/.test(v) ? "Not a valid email" : null
                }
                onSave={async (v) => {
                  await saveBasics({ [f.key]: f.key === "name" ? v : v || (f.key === "email" ? "" : null) });
                  setBasics((b) => ({ ...b, [f.key]: v }));
                }}
              />
            </div>
          ))}
          <span className="font-mono text-label uppercase text-muted pt-1">links</span>
          <LinksEditor
            links={links}
            onSave={async (next) => {
              await saveBasics({ links: next });
              setLinks(next as Profile["links"]);
            }}
          />
        </div>
      </section>

      {SECTIONS.map((spec) => (
        <EntitySection
          key={spec.table}
          spec={spec}
          settings={settings}
          initialRows={initial[spec.table] as unknown as AnyRow[]}
        />
      ))}
    </div>
  );
}
