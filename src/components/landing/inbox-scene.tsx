import { Sticky } from "./primitives";

/**
 * Pinned scene: an AI note, a new GitHub repo and an edit from the user's
 * own site fly in from three sides and land in one review tray.
 * Timing lives in scenes.ts ("inbox").
 */
export function InboxScene() {
  return (
    <section id="inbox" className="ld-pin" data-ld-pin="inbox" style={{ height: 2600 }} aria-label="Every source lands in one review queue">
      <div className="ld-stage">
        <div className="ld-meter" aria-hidden="true"><i /></div>
        <div className="ld-center" style={{ padding: "0 24px" }}>
          <h2 className="ld-disp ld-h2">One tray for everything.</h2>
          <p className="ld-lede">
            Notes, new GitHub repos and edits from your own site all land in the same review queue.
            Nothing is filed until you say so.
          </p>
        </div>
        <div className="ld-tray">
          <div className="ld-tray__head ld-mono">
            <span>review queue</span>
            <span className="ld-tray__count" aria-hidden="true">
              <span className="ld-b1">1 waiting</span>
              <span className="ld-b2">2 waiting</span>
              <span className="ld-b3">3 waiting</span>
            </span>
          </div>
          <Sticky color="var(--ld-yellow)" className="ld-item ld-item1">
            <span className="ld-hand" style={{ fontSize: 24 }}>shipped redis caching on patchwork…</span>
            <span className="ld-mono" style={{ fontSize: 11 }}>ai note</span>
          </Sticky>
          <div className="ld-paper ld-item ld-item2">
            <span><b>New repo:</b> weft</span>
            <span className="ld-mono ld-muted-ink" style={{ fontSize: 11 }}>github</span>
          </div>
          <div className="ld-paper ld-item ld-item3" style={{ background: "#e9f4ff" }}>
            <span>Headline edited on <b>yourname.dev</b></span>
            <span className="ld-mono" style={{ fontSize: 11, color: "#3b5a78" }}>your site</span>
          </div>
          <div className="ld-tray__foot ld-mono">
            <span>approve · reject · edit first</span>
            <span>undo the last one anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
