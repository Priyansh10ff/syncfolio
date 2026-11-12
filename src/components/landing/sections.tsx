import Link from "next/link";
import { REPO_URL, START_URL, sx } from "./primitives";

const TAGS = ["Next.js", "Astro", "SvelteKit", "Hugo", "Claude", "GPT", "Gemini", "Ollama"];

/** Framework and model tags that drop onto the mat as they scroll in. */
export function Tags() {
  return (
    <section className="ld-wrap ld-tags" aria-label="Works with">
      {TAGS.map((tag, i) => (
        <span
          key={tag}
          className="ld-mono ld-chip ld-rv"
          style={sx({ "--fy": `${40 + (i % 4) * 10}px`, "--fr": `${i % 2 ? 8 : -10}deg`, "--rest": `${i % 2 ? 1 : -2}deg` })}
        >
          {tag}
        </span>
      ))}
    </section>
  );
}

type Card = {
  title: string;
  body: string;
  sticky?: string;
  from: { fx: number; fy: number; fr: number; rest: number };
};

const CARDS: Card[] = [
  { title: "review queue", body: "AI notes, GitHub repo scans and edits made on your site all wait as diffs. You approve each one.", from: { fx: -220, fy: 160, fr: -24, rest: -2 } },
  { title: "undo", body: "The row as it was is saved at approval. Taking back the last change is exact.", from: { fx: 0, fy: 240, fr: 18, rest: 1.5 } },
  { title: "any model", body: "Claude, GPT, Gemini, OpenRouter, Groq — or Ollama and LM Studio on your own laptop.", from: { fx: 220, fy: 160, fr: 26, rest: -1 } },
  { title: "never makes things up", body: "The model may not add a number or claim you didn't write. You read every line anyway.", sticky: "var(--ld-yellow)", from: { fx: -260, fy: 200, fr: 30, rest: 2 } },
  { title: "precise webhooks", body: "One POST per publish naming each changed section. Your site refreshes a page, not everything.", from: { fx: 0, fy: 280, fr: -20, rest: -1.5 } },
  { title: "yours to host", body: "Open source, MIT. A free Supabase project; your data never leaves your database.", sticky: "var(--ld-pink)", from: { fx: 260, fy: 200, fr: -28, rest: -2.5 } },
];

/** Feature cards fly in from scattered, tilted positions and settle on the board. */
export function Features() {
  return (
    <section id="features" className="ld-wrap ld-section">
      <h2 className="ld-disp ld-h2 ld-rv" style={sx({ "--fy": "60px", "--fr": "0deg" })}>Pinned to the board.</h2>
      <p className="ld-lede ld-rv" style={sx({ "--fy": "60px", "--fr": "0deg" })}>Everything Syncfolio does, one card each.</p>
      <div className="ld-cards">
        {CARDS.map(({ title, body, sticky, from }) => (
          <article
            key={title}
            className={`ld-card ld-rv ${sticky ? "ld-sticky" : "ld-paper"}`}
            style={sx({
              "--fx": `${from.fx}px`,
              "--fy": `${from.fy}px`,
              "--fr": `${from.fr}deg`,
              "--rest": `${from.rest}deg`,
              ...(sticky ? { background: sticky } : {}),
            })}
          >
            {!sticky && <div className="ld-tape" aria-hidden="true" />}
            <h3 style={{ color: sticky ? "#2a2416" : "var(--ld-green)" }}>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const ROWS = [
  { name: "Patchwork", note: "breaking-API detector", r: true },
  { name: "Weft", note: "data pipeline for RAG", r: true },
  { name: "Weekend CLI", note: "file renamer", r: false },
];

/** The app itself, tilting flat as it scrolls into view. */
export function AppShot() {
  return (
    <section className="ld-wrap ld-section" aria-label="The Syncfolio profile screen">
      <h2 className="ld-disp ld-h2 ld-rv ld-center" style={sx({ "--fy": "60px", "--fr": "0deg" })}>Your whole career, one screen.</h2>
      <div className="ld-app ld-tilt">
        <div className="ld-app__lid">
          <div className="ld-app__screen">
            <aside className="ld-app__side">
              <span className="ld-disp" style={{ fontWeight: 800, marginBottom: 10, color: "var(--ld-ink)" }}>syncfolio</span>
              <span className="is-active">Profile</span>
              <span>Updates · 2</span>
              <span>Resume</span>
              <span>Portfolio</span>
            </aside>
            <div className="ld-app__main">
              <div className="ld-disp" style={{ fontWeight: 800, fontSize: 22 }}>Projects</div>
              {ROWS.map((row) => (
                <div key={row.name} className="ld-app__row">
                  <span><b>{row.name}</b> · {row.note}</span>
                  <span className="ld-rp ld-mono">
                    <span className={row.r ? undefined : "is-off"}>R</span>
                    <span>P</span>
                  </span>
                </div>
              ))}
              <p className="ld-hand" style={{ margin: "8px 0 0", fontSize: 24, color: "var(--ld-green)" }}>
                ← R and P decide where each row shows up
              </p>
            </div>
          </div>
        </div>
        <div className="ld-app__base" />
      </div>
    </section>
  );
}

const FAQ = [
  { q: "Will it change my resume without asking?", a: "Never. Automated changes are proposals you approve one by one." },
  { q: "I only need a resume.", a: "Switch the portfolio module off. Done." },
  { q: "My site isn't Next.js.", a: "Anything that can fetch JSON can read your portfolio." },
  { q: "Is it free?", a: "It's open source (MIT). Host it yourself on a free Supabase project." },
  { q: "Where does my data live?", a: "In your own Supabase database." },
];

/** FAQ on a yellow legal pad. */
export function Faq() {
  return (
    <section className="ld-wrap ld-section">
      <div className="ld-pad ld-rv" style={sx({ "--fy": "160px", "--fr": "-10deg", "--rest": "-0.6deg" })}>
        <h2 className="ld-hand">questions people ask</h2>
        {FAQ.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Closing call to action: one big sticky note. */
export function Cta() {
  return (
    <section className="ld-cta">
      <div className="ld-cta__note ld-sticky ld-rv" style={sx({ "--fy": "260px", "--fr": "24deg", "--fs": 0.15, "--rest": "-2deg" })}>
        <h2 className="ld-hand">Write it once.</h2>
        <p>Your next sticky note could be the last thing you ever update by hand.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={START_URL} className="ld-btn ld-btn--ink">Start free →</Link>
          <a href={REPO_URL} className="ld-btn" style={{ border: "2px solid var(--ld-ink)", color: "var(--ld-ink)" }}>View source</a>
        </div>
      </div>
    </section>
  );
}
