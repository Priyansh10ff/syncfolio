import { DiffLines, StalePrint, Sticky, sx } from "./primitives";

/**
 * Pinned scene. As you scroll: the camera pulls back from a sticky note,
 * the note's text types into the laptop, the diff appears and is
 * approved, stale PDFs are stamped and slid off the desk, a fresh resume
 * slides out and the phone shows the portfolio published.
 * Timing lives in scenes.ts ("desk").
 */
export function DeskScene() {
  return (
    <section id="desk" className="ld-pin" data-ld-pin="desk" style={{ height: 3800 }} aria-label="How a note becomes a resume line and a portfolio update">
      <div className="ld-stage">
        <div className="ld-meter" aria-hidden="true"><i /></div>
        <div className="ld-caps">
          <p className="ld-c1 ld-disp">It starts as a sticky note.</p>
          <p className="ld-c2 ld-disp">Type it once. Read the diff.</p>
          <p className="ld-c3 ld-disp">Approve — old copies go in the bin.</p>
          <p className="ld-c4 ld-disp">
            Fresh resume. <span style={{ color: "var(--ld-yellow)" }}>Live portfolio.</span>
          </p>
        </div>

        <div className="ld-scene" aria-hidden="true">
          <div className="ld-coffee" style={{ left: 860, top: 520, width: 130, height: 130 }} />

          <div className="ld-paper ld-stale" style={sx({ "--r": "8deg", left: 930, top: 60 })}>
            <StalePrint name="resume_final.pdf">
              <div className="ld-hand ld-stamp">STALE</div>
            </StalePrint>
          </div>
          <div className="ld-paper ld-stale" style={sx({ "--r": "-5deg", left: 960, top: 150 })}>
            <StalePrint name="resume_FINAL_v4.pdf">
              <div className="ld-hand ld-stamp">STALE</div>
            </StalePrint>
          </div>

          <div className="ld-paper ld-fresh" style={{ left: 460, top: 440, width: 340, padding: 22, boxSizing: "border-box", fontSize: 12, lineHeight: 1.5, zIndex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Your Name</div>
            <div className="ld-muted-ink" style={{ marginBottom: 8 }}>Full-stack developer</div>
            <div className="ld-mono" style={{ fontSize: 9.5, letterSpacing: "0.1em", borderBottom: "1px solid var(--ld-ink)", marginBottom: 4 }}>PROJECTS</div>
            <div style={{ fontWeight: 700 }}>Patchwork</div>
            <div>• Flags breaking API changes in PRs</div>
            <div className="ld-hl">• Added Redis caching; cut p95 latency 40%</div>
          </div>

          <div style={{ left: 400, top: 110, width: 470, zIndex: 2 }}>
            <div className="ld-laptop__lid">
              <div className="ld-laptop__screen">
                <div className="ld-mono ld-muted-ink" style={{ fontSize: 10, display: "flex", justifyContent: "space-between" }}>
                  <span>syncfolio · updates</span>
                  <span>you</span>
                </div>
                <div className="ld-mono ld-input">
                  <span style={{ color: "var(--ld-green)" }}>›&nbsp;</span>
                  <span className="ld-typed">shipped redis caching on patchwork, p95 down 40%</span>
                  <span className="ld-caret" />
                </div>
                <div className="ld-diff ld-diff--scene">
                  <div className="ld-diff__head">
                    projects / Patchwork <span className="ld-mono ld-muted-ink" style={{ fontWeight: 400 }}>ai draft</span>
                  </div>
                  <DiffLines withLabels />
                  <div className="ld-diff__foot">
                    <span className="ld-pill">Reject</span>
                    <span className="ld-approve">
                      Approve<span>✓ Approved</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ld-laptop__base" />
          </div>

          <div className="ld-phone" style={{ left: 900, top: 420, transform: "rotate(6deg)", zIndex: 2 }}>
            <div className="ld-phone__screen">
              <div className="ld-mono ld-muted-ink">yourname.dev</div>
              <div style={{ height: 60, borderRadius: 8, background: "var(--ld-mat)" }} />
              <div style={{ fontWeight: 800, fontSize: 14 }}>Patchwork</div>
              <div style={{ color: "#4a4d46" }}>Catches breaking API changes.</div>
              <div className="ld-published" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="ld-mono" style={{ background: "#ffe45c", borderRadius: 999, padding: "2px 8px", alignSelf: "flex-start" }}>p95 −40%</span>
                <span className="ld-mono" style={{ color: "var(--ld-green)" }}>● published just now</span>
              </div>
            </div>
          </div>

          <Sticky color="var(--ld-yellow)" className="ld-note" style={{ left: 130, top: 120, width: 240, height: 200, padding: 20, zIndex: 3 }}>
            <div className="ld-hand" style={{ fontSize: 30, lineHeight: 1.05 }}>shipped redis caching on patchwork, p95 down 40%</div>
          </Sticky>
          <Sticky color="var(--ld-blue)" style={{ left: 120, top: 420, width: 170, height: 150, padding: 16, transform: "rotate(5deg)" }}>
            <div className="ld-hand" style={{ fontSize: 24, lineHeight: 1.05 }}>nothing saves till I say so ✓</div>
          </Sticky>
          <div className="ld-pencil" style={{ left: 160, top: 640, width: 280, transform: "rotate(-8deg)" }} />
        </div>
      </div>
    </section>
  );
}
