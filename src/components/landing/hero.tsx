"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { DiffLines, StalePrint, START_URL, Sticky, sx } from "./primitives";

const TITLE = ["Everything", "you", "ship", "starts", "as", "a"];

function setPointer(e: MouseEvent<HTMLElement>, reset = false) {
  const el = e.currentTarget;
  if (reset) {
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");
    return;
  }
  const b = el.getBoundingClientRect();
  el.style.setProperty("--mx", (((e.clientX - b.left) / b.width - 0.5) * 2).toFixed(3));
  el.style.setProperty("--my", (((e.clientY - b.top) / b.height - 0.5) * 2).toFixed(3));
}

/**
 * Headline rises word by word; desk objects drop in, then drift with the
 * pointer and spread apart on scroll — each at its own depth (`--d`).
 */
export function Hero({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <section
      data-ld-hero
      className="ld-wrap ld-hero"
      onMouseMove={reduceMotion ? undefined : (e) => setPointer(e)}
      onMouseLeave={(e) => setPointer(e, true)}
    >
      <div className="ld-hero__copy">
        <h1 className="ld-disp ld-hero__title">
          {TITLE.map((word, i) => (
            <span key={word}>
              <span className="ld-rise" style={{ animationDelay: `${60 + i * 80}ms` }}>
                {word}
              </span>{" "}
            </span>
          ))}
          <span className="ld-rise" style={{ animationDelay: "540ms", color: "var(--ld-yellow)" }}>
            note.
          </span>
        </h1>
        <p className="ld-hero__sub ld-rise" style={{ animationDelay: "700ms" }}>
          Write it once. Syncfolio files it in your profile, shows you the change, and — after you
          approve — reprints your resume and republishes your portfolio.
        </p>
        <div className="ld-rise" style={{ display: "flex", gap: 12, flexWrap: "wrap", animationDelay: "820ms" }}>
          <Link href={START_URL} className="ld-btn ld-btn--yellow">
            Start free →
          </Link>
          <a href="#desk" className="ld-btn ld-btn--ghost">
            Watch the desk ↓
          </a>
        </div>
        <p className="ld-hand ld-hero__note ld-rise" style={{ animationDelay: "950ms" }}>
          open source · any AI model · any portfolio stack
        </p>
      </div>

      <div className="ld-hero__scene" aria-hidden="true">
        <div className="ld-coffee ld-drop" style={sx({ "--d": 0.4, left: 60, top: 360, width: 130, height: 130, animationDelay: "300ms" })} />
        <div className="ld-paper ld-drop" style={sx({ "--d": 1.6, "--r": "7deg", left: 340, top: 20, width: 250, height: 320, padding: 20, boxSizing: "border-box", fontSize: 11, animationDelay: "100ms" })}>
          <StalePrint name="resume_final_v4.pdf">
            <div className="ld-hand" style={{ position: "absolute", bottom: 20, right: 16, fontSize: 24, color: "var(--ld-red)" }}>
              from March…
            </div>
          </StalePrint>
        </div>
        <div className="ld-drop" style={sx({ "--d": 0.8, "--r": "-3deg", left: 30, top: 70, width: 480, animationDelay: "220ms" })}>
          <div className="ld-laptop__lid">
            <div className="ld-laptop__screen" style={{ height: 280 }}>
              <div className="ld-mono ld-muted-ink" style={{ fontSize: 11, display: "flex", justifyContent: "space-between" }}>
                <span>syncfolio · updates</span>
                <span style={{ color: "var(--ld-green)" }}>● 2 waiting</span>
              </div>
              <div className="ld-mono ld-input" style={{ fontSize: 12 }}>
                <span style={{ color: "var(--ld-green)" }}>›&nbsp;</span>shipped redis caching on patchwork…
              </div>
              <div className="ld-diff">
                <div className="ld-diff__head">Patchwork</div>
                <DiffLines />
                <div className="ld-diff__foot">
                  <span style={{ background: "var(--ld-green)", color: "#fff", borderRadius: 4, padding: "2px 10px" }}>Approve</span>
                </div>
              </div>
            </div>
          </div>
          <div className="ld-laptop__base" />
        </div>
        <Sticky color="var(--ld-yellow)" className="ld-drop" style={sx({ "--d": 2.2, "--r": "6deg", left: 390, top: 370, width: 200, height: 180, padding: 18, animationDelay: "420ms" })}>
          <div className="ld-hand" style={{ fontSize: 28, lineHeight: 1.05 }}>shipped redis caching on patchwork, p95 ↓40%!</div>
        </Sticky>
        <Sticky color="var(--ld-pink)" className="ld-drop" style={sx({ "--d": 2.8, "--r": "-8deg", left: -10, top: 410, width: 160, height: 150, padding: 16, animationDelay: "520ms" })}>
          <div className="ld-hand" style={{ fontSize: 24, lineHeight: 1.05 }}>update portfolio before Friday??</div>
        </Sticky>
        <div className="ld-pencil ld-drop" style={sx({ "--d": 1.2, "--r": "-14deg", left: 200, top: 560, width: 270, animationDelay: "620ms" })} />
        <Sticky color="var(--ld-blue)" className="ld-drop" style={sx({ "--d": 3.2, "--r": "4deg", left: 560, top: 250, width: 120, height: 110, padding: 12, animationDelay: "700ms" })}>
          <div className="ld-hand" style={{ fontSize: 20, lineHeight: 1.05 }}>new repo: weft</div>
        </Sticky>
      </div>
    </section>
  );
}
