import { formatScore } from "../lib/format";

const MODEL_META = {
  spatial: { label: "Spatial baseline", detail: "EfficientNet-B4 facial appearance evidence", colour: "#53718f" },
  frequency: { label: "Frequency-only", detail: "Standalone FFT-domain baseline", colour: "#7b6a9a" },
  dual: { label: "Spatial-frequency model", detail: "Official gated fusion checkpoint", colour: "#c78908" },
};

function ScoreMeter({ label, score, colour, detail }) {
  const safeScore = Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : 0;
  return (
    <div className="score-row">
      <div className="score-row-heading">
        <div><strong>{label}</strong><span>{detail}</span></div>
        <b>{formatScore(score)}</b>
      </div>
      <div className="score-track" aria-label={`${label} score ${formatScore(score)}`}>
        <span className="score-boundary" aria-hidden="true" />
        <span className="score-fill" style={{ width: `${safeScore * 100}%`, backgroundColor: colour }} />
      </div>
      <div className="score-scale"><span>Likely authentic</span><span>0.5 boundary</span><span>Likely manipulated</span></div>
    </div>
  );
}

export default function ScoreComparison({ result, selectedModels }) {
  if (!result?.scores) return null;
  const scores = {
    spatial: result.scores.spatial_score,
    frequency: result.scores.frequency_only_score,
    dual: result.scores.dual_score,
  };
  const agreement = result?.model_comparison?.agreement;
  const visible = Object.keys(MODEL_META).filter((key) => selectedModels.has(key) && Number.isFinite(scores[key]));

  return (
    <section className="panel" aria-labelledby="score-comparison-title">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Model comparison</span>
          <h2 id="score-comparison-title">Video-level manipulation scores</h2>
        </div>
        {typeof agreement === "boolean" && (
          <span className={`agreement-badge ${agreement ? "agrees" : "disagrees"}`}>
            {agreement ? "Spatial and dual agree" : "Spatial and dual disagree"}
          </span>
        )}
      </div>

      <div className="score-stack">
        {visible.map((key) => (
          <ScoreMeter key={key} {...MODEL_META[key]} score={scores[key]} />
        ))}
      </div>

      <p className="context-note">
        Scores are means of per-frame sigmoid outputs and are not calibrated probabilities. The 0.5 line is the fixed class boundary used by the research pipeline.
      </p>
    </section>
  );
}
