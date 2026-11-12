/**
 * Pinned scene: the Resume and Portfolio folders open one after the other
 * and their documents rise out. Timing lives in scenes.ts ("folders").
 */
export function FoldersScene() {
  return (
    <section className="ld-pin" data-ld-pin="folders" style={{ height: 2600, marginTop: 80 }} aria-label="Resume and portfolio, two optional modules">
      <div className="ld-stage" style={{ gap: 40 }}>
        <div className="ld-meter" aria-hidden="true"><i /></div>
        <div className="ld-center" style={{ padding: "0 24px" }}>
          <h2 className="ld-disp ld-h2">Two folders. Open one, or both.</h2>
          <p className="ld-lede">
            Resume and portfolio are separate modules on the same profile. Each row decides where it shows up.
          </p>
        </div>
        <div className="ld-folders">
          <div className="ld-folder">
            <div className="ld-paper ld-doc ld-doc1" style={{ padding: 22, fontSize: 12, lineHeight: 1.5 }} aria-hidden="true">
              <div style={{ fontWeight: 800, fontSize: 17 }}>Your Name</div>
              <div className="ld-mono" style={{ fontSize: 9.5, letterSpacing: "0.1em", borderBottom: "1px solid var(--ld-ink)", margin: "10px 0 4px" }}>PROJECTS</div>
              <div style={{ fontWeight: 700 }}>Patchwork</div>
              <div>• Flags breaking API changes in PRs</div>
              <div>• Added Redis caching; cut p95 latency 40%</div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>Weft</div>
              <div>• Multimodal data pipeline for RAG</div>
            </div>
            <div className="ld-folder__tab" style={{ left: 0, background: "#c9a77c" }} />
            <div className="ld-front ld-front1">
              <span className="ld-mono ld-stamp-label" style={{ rotate: "-4deg" }}>OPTIONAL</span>
              <h3 className="ld-disp" style={{ margin: "10px 0 4px", fontSize: 40, fontWeight: 800, lineHeight: 1 }}>Resume</h3>
              <p style={{ margin: 0, fontSize: 15 }}>A4 preview + PDF from rows marked <b>R</b>.</p>
            </div>
          </div>
          <div className="ld-folder">
            <div className="ld-paper ld-doc ld-doc2" style={{ padding: 0, overflow: "hidden", fontSize: 12 }} aria-hidden="true">
              <div className="ld-mono ld-muted-ink" style={{ padding: "8px 12px", fontSize: 10, background: "#f1efe6" }}>yourname.dev/projects</div>
              <div style={{ padding: 18 }}>
                <div style={{ height: 80, borderRadius: 8, background: "var(--ld-mat)", marginBottom: 10 }} />
                <div style={{ fontWeight: 800, fontSize: 17 }}>Patchwork</div>
                <div style={{ color: "#4a4d46" }}>Catches breaking API changes before users do.</div>
                <div className="ld-mono" style={{ marginTop: 8, color: "var(--ld-green)" }}>● published · webhook 200</div>
              </div>
            </div>
            <div className="ld-folder__tab" style={{ right: 0, background: "#d8bf92" }} />
            <div className="ld-front ld-front2">
              <span className="ld-mono ld-stamp-label" style={{ rotate: "3deg" }}>OPTIONAL</span>
              <h3 className="ld-disp" style={{ margin: "10px 0 4px", fontSize: 40, fontWeight: 800, lineHeight: 1 }}>Portfolio</h3>
              <p style={{ margin: 0, fontSize: 15 }}>Rows marked <b>P</b>, published to your own site.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
