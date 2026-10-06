"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Profile, ProfileSettings } from "@/lib/schema/profile";

type Table = "experience" | "projects" | "skills" | "education";
type Row = { id: string; show_on_resume?: boolean; show_on_portfolio?: boolean };

async function api<T>(url: string, method: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export default function ProfileEditor({
  initial,
  settings,
}: {
  initial: Profile;
  settings: ProfileSettings;
}) {
  const [profile, setProfile] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveBasics() {
    setSaving(true);
    setError(null);
    try {
      await api("/api/profile/basics", "PATCH", {
        name: profile.name,
        headline: profile.headline ?? null,
        summary: profile.summary ?? null,
        location: profile.location ?? null,
        email: profile.email ?? "",
        links: profile.links,
      });
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  }

  /** Generic list operations shared by every section. */
  function listOps<K extends Table>(table: K) {
    type Item = Profile[K][number];
    const set = (items: Item[]) => setProfile((p) => ({ ...p, [table]: items }));
    const items = profile[table] as Item[];
    return {
      items,
      onAdded: (row: Item) => set([row, ...items]),
      onDelete: async (id: string) => {
        try {
          await api(`/api/${table}`, "DELETE", { id });
          set(items.filter((x) => x.id !== id));
        } catch (e) {
          setError((e as Error).message);
        }
      },
      onToggle: async (id: string, key: "show_on_resume" | "show_on_portfolio", value: boolean) => {
        try {
          const { row } = await api<{ row: Item }>(`/api/${table}`, "PATCH", { id, [key]: value });
          set(items.map((x) => (x.id === id ? row : x)));
        } catch (e) {
          setError((e as Error).message);
        }
      },
    };
  }

  return (
    <div className="flex flex-col gap-12">
      {error && <p className="text-sm text-red-700">{error}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-[var(--sf-muted)] uppercase tracking-wide">Basics</h2>
        <Field label="Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
        <Field
          label="Headline"
          value={profile.headline ?? ""}
          onChange={(v) => setProfile({ ...profile, headline: v })}
          placeholder="Full-stack AI developer"
        />
        <Field
          label="Summary"
          textarea
          value={profile.summary ?? ""}
          onChange={(v) => setProfile({ ...profile, summary: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Location"
            value={profile.location ?? ""}
            onChange={(v) => setProfile({ ...profile, location: v })}
          />
          <Field
            label="Email"
            value={profile.email ?? ""}
            onChange={(v) => setProfile({ ...profile, email: v })}
          />
        </div>
        <button
          onClick={saveBasics}
          disabled={saving}
          className="self-start mt-2 rounded bg-[var(--sf-thread)] text-white text-sm px-4 py-2 hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save basics"}
        </button>
      </section>

      <EntityList
        title="Experience"
        settings={settings}
        {...listOps("experience")}
        renderItem={(e) => (
          <>
            <div className="font-medium">
              {e.role} · {e.org}
            </div>
            <div className="text-xs text-[var(--sf-muted)]">
              {e.start_date} — {e.end_date ?? "present"}
            </div>
          </>
        )}
        AddForm={AddExperienceForm}
      />

      <EntityList
        title="Projects"
        settings={settings}
        {...listOps("projects")}
        renderItem={(p) => (
          <>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-[var(--sf-muted)]">{p.description}</div>
          </>
        )}
        AddForm={AddProjectForm}
      />

      <EntityList
        title="Skills"
        settings={settings}
        {...listOps("skills")}
        renderItem={(s) => <div className="font-medium">{s.name}</div>}
        AddForm={AddSkillForm}
      />

      <EntityList
        title="Education"
        settings={settings}
        {...listOps("education")}
        renderItem={(ed) => (
          <>
            <div className="font-medium">
              {ed.institution}
              {ed.degree ? ` · ${ed.degree}` : ""}
            </div>
            <div className="text-xs text-[var(--sf-muted)]">
              {ed.start_date} — {ed.end_date ?? "present"}
            </div>
          </>
        )}
        AddForm={AddEducationForm}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  const cls =
    "border border-[var(--sf-line)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--sf-thread)]";
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--sf-muted)]">{label}</span>
      {textarea ? (
        <textarea
          className={cls}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={cls}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function EntityList<T extends Row>({
  title,
  items,
  settings,
  renderItem,
  onDelete,
  onToggle,
  AddForm,
  onAdded,
}: {
  title: string;
  items: T[];
  settings: ProfileSettings;
  renderItem: (item: T) => React.ReactNode;
  onDelete: (id: string) => void;
  onToggle: (id: string, key: "show_on_resume" | "show_on_portfolio", value: boolean) => void;
  AddForm: React.ComponentType<{ onAdded: (row: T) => void }>;
  onAdded: (row: T) => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--sf-muted)] uppercase tracking-wide">{title}</h2>
        <button
          onClick={() => setAdding((a) => !a)}
          className="text-xs text-[var(--sf-thread)] hover:underline"
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {adding && (
        <AddForm
          onAdded={(row) => {
            onAdded(row);
            setAdding(false);
          }}
        />
      )}

      {items.length === 0 && !adding && (
        <p className="text-sm text-[var(--sf-muted)]">Nothing here yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 border border-[var(--sf-line)] rounded px-3 py-2"
          >
            <div className="min-w-0">{renderItem(item)}</div>
            <div className="flex items-center gap-2 shrink-0">
              {settings.resume_enabled && (
                <VisibilityToggle
                  label="R"
                  title="Show on resume"
                  on={item.show_on_resume !== false}
                  onChange={(v) => onToggle(item.id, "show_on_resume", v)}
                />
              )}
              {settings.portfolio_enabled && (
                <VisibilityToggle
                  label="P"
                  title="Show on portfolio"
                  on={item.show_on_portfolio !== false}
                  onChange={(v) => onToggle(item.id, "show_on_portfolio", v)}
                />
              )}
              <button
                onClick={() => onDelete(item.id)}
                className="text-[var(--sf-muted)] hover:text-[var(--sf-thread)]"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VisibilityToggle({
  label,
  title,
  on,
  onChange,
}: {
  label: string;
  title: string;
  on: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      title={`${title}: ${on ? "on" : "off"}`}
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`text-[10px] w-5 h-5 border rounded ${
        on
          ? "border-[var(--sf-thread)] text-[var(--sf-thread)]"
          : "border-[var(--sf-line)] text-[var(--sf-muted)] line-through"
      }`}
    >
      {label}
    </button>
  );
}

/** Small inline form: renders inputs, POSTs them, hands back the saved row. */
function AddForm<T>({
  table,
  fields,
  onAdded,
}: {
  table: Table;
  fields: { key: string; placeholder: string; required?: boolean; wide?: boolean }[];
  onAdded: (row: T) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const body = Object.fromEntries(
      fields.filter((f) => values[f.key]?.trim()).map((f) => [f.key, values[f.key].trim()])
    );
    try {
      const { row } = await api<{ row: T }>(`/api/${table}`, "POST", body);
      onAdded(row);
      setValues({});
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const ready = fields.every((f) => !f.required || values[f.key]?.trim());

  return (
    <div className="flex flex-col gap-2 border border-dashed border-[var(--sf-line)] rounded p-3">
      <div className="flex gap-2 flex-wrap items-end">
        {fields.map((f) => (
          <input
            key={f.key}
            className={`border border-[var(--sf-line)] rounded px-2 py-1 text-sm ${
              f.wide ? "flex-1 min-w-[200px]" : ""
            }`}
            placeholder={f.placeholder}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          />
        ))}
        <button
          onClick={submit}
          disabled={!ready}
          className="text-sm bg-[var(--sf-thread)] text-white rounded px-3 py-1 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

function AddExperienceForm({ onAdded }: { onAdded: (row: Profile["experience"][number]) => void }) {
  return (
    <AddForm
      table="experience"
      onAdded={onAdded}
      fields={[
        { key: "role", placeholder: "Role", required: true },
        { key: "org", placeholder: "Org", required: true },
        { key: "start_date", placeholder: "Start YYYY-MM", required: true },
        { key: "end_date", placeholder: "End YYYY-MM (blank = present)" },
      ]}
    />
  );
}

function AddProjectForm({ onAdded }: { onAdded: (row: Profile["projects"][number]) => void }) {
  return (
    <AddForm
      table="projects"
      onAdded={onAdded}
      fields={[
        { key: "name", placeholder: "Project name", required: true },
        { key: "description", placeholder: "One-line description", wide: true },
      ]}
    />
  );
}

function AddSkillForm({ onAdded }: { onAdded: (row: Profile["skills"][number]) => void }) {
  return (
    <AddForm
      table="skills"
      onAdded={onAdded}
      fields={[
        { key: "name", placeholder: "Skill", required: true },
        { key: "category", placeholder: "Category (optional)" },
      ]}
    />
  );
}

function AddEducationForm({ onAdded }: { onAdded: (row: Profile["education"][number]) => void }) {
  return (
    <AddForm
      table="education"
      onAdded={onAdded}
      fields={[
        { key: "institution", placeholder: "Institution", required: true },
        { key: "degree", placeholder: "Degree" },
        { key: "start_date", placeholder: "Start YYYY-MM", required: true },
        { key: "end_date", placeholder: "End YYYY-MM (blank = present)" },
      ]}
    />
  );
}
