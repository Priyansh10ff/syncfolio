"use client";

import { useState } from "react";
import { Profile } from "@/lib/schema/profile";
import { Trash2 } from "lucide-react";

export default function ProfileEditor({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function saveBasics() {
    setSaving(true);
    await fetch("/api/profile/basics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        headline: profile.headline,
        summary: profile.summary,
        location: profile.location,
        email: profile.email,
        links: profile.links,
      }),
    });
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-[var(--loom-muted)] uppercase tracking-wide">
          Basics
        </h2>
        <Field
          label="Name"
          value={profile.name}
          onChange={(v) => setProfile({ ...profile, name: v })}
        />
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
          className="self-start mt-2 rounded bg-[var(--loom-thread)] text-white text-sm px-4 py-2 hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save basics"}
        </button>
      </section>

      <EntityList
        title="Experience"
        items={profile.experience}
        renderItem={(e) => (
          <>
            <div className="font-medium">
              {e.role} · {e.org}
            </div>
            <div className="text-xs text-[var(--loom-muted)]">
              {e.start_date} — {e.end_date ?? "present"}
            </div>
          </>
        )}
        onDelete={async (id) => {
          await fetch("/api/experience", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          setProfile({
            ...profile,
            experience: profile.experience.filter((x) => x.id !== id),
          });
        }}
        AddForm={AddExperienceForm}
        onAdded={(row) =>
          setProfile({ ...profile, experience: [row, ...profile.experience] })
        }
      />

      <EntityList
        title="Projects"
        items={profile.projects}
        renderItem={(p) => (
          <>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-[var(--loom-muted)]">{p.description}</div>
          </>
        )}
        onDelete={async (id) => {
          await fetch("/api/projects", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          setProfile({
            ...profile,
            projects: profile.projects.filter((x) => x.id !== id),
          });
        }}
        AddForm={AddProjectForm}
        onAdded={(row) =>
          setProfile({ ...profile, projects: [row, ...profile.projects] })
        }
      />

      <EntityList
        title="Skills"
        items={profile.skills}
        renderItem={(s) => <div className="font-medium">{s.name}</div>}
        onDelete={async (id) => {
          await fetch("/api/skills", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          setProfile({
            ...profile,
            skills: profile.skills.filter((x) => x.id !== id),
          });
        }}
        AddForm={AddSkillForm}
        onAdded={(row) => setProfile({ ...profile, skills: [row, ...profile.skills] })}
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
    "border border-[var(--loom-line)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--loom-thread)]";
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--loom-muted)]">{label}</span>
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

function EntityList<T extends { id: string }>({
  title,
  items,
  renderItem,
  onDelete,
  AddForm,
  onAdded,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onDelete: (id: string) => void;
  AddForm: React.ComponentType<{ onAdded: (row: T) => void }>;
  onAdded: (row: T) => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--loom-muted)] uppercase tracking-wide">
          {title}
        </h2>
        <button
          onClick={() => setAdding((a) => !a)}
          className="text-xs text-[var(--loom-thread)] hover:underline"
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
        <p className="text-sm text-[var(--loom-muted)]">Nothing here yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between border border-[var(--loom-line)] rounded px-3 py-2"
          >
            <div>{renderItem(item)}</div>
            <button
              onClick={() => onDelete(item.id)}
              className="text-[var(--loom-muted)] hover:text-[var(--loom-thread)]"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddExperienceForm({ onAdded }: { onAdded: (row: Profile["experience"][number]) => void }) {
  const [role, setRole] = useState("");
  const [org, setOrg] = useState("");
  const [start, setStart] = useState("");

  async function submit() {
    if (!role || !org || !start) return;
    const res = await fetch("/api/experience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, org, start_date: start }),
    });
    if (res.ok) {
      onAdded({
        id: crypto.randomUUID(),
        role,
        org,
        start_date: start,
        end_date: null,
        bullets: [],
        tags: [],
        source: "loom",
        updated_at: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="flex gap-2 flex-wrap items-end border border-dashed border-[var(--loom-line)] rounded p-3">
      <input
        className="border border-[var(--loom-line)] rounded px-2 py-1 text-sm"
        placeholder="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <input
        className="border border-[var(--loom-line)] rounded px-2 py-1 text-sm"
        placeholder="Org"
        value={org}
        onChange={(e) => setOrg(e.target.value)}
      />
      <input
        className="border border-[var(--loom-line)] rounded px-2 py-1 text-sm"
        placeholder="YYYY-MM"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />
      <button
        onClick={submit}
        className="text-sm bg-[var(--loom-thread)] text-white rounded px-3 py-1"
      >
        Add
      </button>
    </div>
  );
}

function AddProjectForm({ onAdded }: { onAdded: (row: Profile["projects"][number]) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function submit() {
    if (!name) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      onAdded({
        id: crypto.randomUUID(),
        name,
        description,
        bullets: [],
        links: [],
        tags: [],
        metrics: [],
        featured: false,
        source: "loom",
        updated_at: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="flex gap-2 flex-wrap items-end border border-dashed border-[var(--loom-line)] rounded p-3">
      <input
        className="border border-[var(--loom-line)] rounded px-2 py-1 text-sm"
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="border border-[var(--loom-line)] rounded px-2 py-1 text-sm flex-1 min-w-[200px]"
        placeholder="One-line description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        onClick={submit}
        className="text-sm bg-[var(--loom-thread)] text-white rounded px-3 py-1"
      >
        Add
      </button>
    </div>
  );
}

function AddSkillForm({ onAdded }: { onAdded: (row: Profile["skills"][number]) => void }) {
  const [name, setName] = useState("");

  async function submit() {
    if (!name) return;
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      onAdded({ id: crypto.randomUUID(), name });
      setName("");
    }
  }

  return (
    <div className="flex gap-2 items-end border border-dashed border-[var(--loom-line)] rounded p-3">
      <input
        className="border border-[var(--loom-line)] rounded px-2 py-1 text-sm"
        placeholder="Skill"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        onClick={submit}
        className="text-sm bg-[var(--loom-thread)] text-white rounded px-3 py-1"
      >
        Add
      </button>
    </div>
  );
}
