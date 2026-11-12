"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { DeskScene } from "./desk-scene";
import { FoldersScene } from "./folders-scene";
import { Hero } from "./hero";
import { InboxScene } from "./inbox-scene";
import { DOCS_URL, Grain, Logo, REPO_URL, Ruler, SELF_HOST_URL, START_URL } from "./primitives";
import { AppShot, Cta, Faq, Features, Tags } from "./sections";
import { useScrollScenes } from "./use-scroll-scenes";
import "./landing.css";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The public landing page. Everything is on a green cutting mat; scroll
 * position drives the pinned scenes (see use-scroll-scenes.ts).
 */
export function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollScenes(rootRef);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

  return (
    <div ref={rootRef} className="ld">
      <Grain />
      <Ruler />

      <header className="ld-wrap ld-header">
        <Link href="/" className="ld-logo">
          <Logo />
          <span className="ld-disp" style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.02em" }}>Syncfolio</span>
        </Link>
        <nav className="ld-nav" aria-label="Main">
          <a href="#desk">How it works</a>
          <a href="#inbox">Review queue</a>
          <a href="#features">Features</a>
          <a href={REPO_URL}>GitHub</a>
          <Link href={START_URL} className="ld-btn ld-btn--yellow ld-btn--sm">Get started</Link>
        </nav>
      </header>

      <main>
        <Hero reduceMotion={reduceMotion} />
        <Tags />
        <DeskScene />
        <InboxScene />
        <Features />
        <FoldersScene />
        <AppShot />
        <Faq />
        <Cta />
      </main>

      <footer className="ld-wrap ld-footer">
        <span>Syncfolio · MIT licence</span>
        <nav aria-label="Footer">
          <a href={REPO_URL}>GitHub</a>
          <a href={DOCS_URL}>Docs</a>
          <a href={SELF_HOST_URL}>Self-host</a>
        </nav>
      </footer>
    </div>
  );
}
