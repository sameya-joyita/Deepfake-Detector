import { formatMilliseconds, formatNumber, formatScore } from "../lib/format";

function Metric({ label, value, note }) {
  return <div className="metric-tile"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

export function FrequencyEvidence({ result }) {
  if (!result?.scores) return null;

  const counterfactual = result.frequency_counterfactual;
  const effect = counterfactual?.score_effect;
  const direction = effect > 0 ? "increased" : effect < 0 ? "decreased" : "did not change";

  return (
    <section className="panel evidence-panel" aria-labelledby="frequency-title">
      <span className="section-kicker">Frequency evidence</span>
      <h2 id="frequency-title">Standalone baseline and fusion check</h2>

      <div className="metric-grid frequency-metric-grid">
        <Metric label="Frequency-only model" value={formatScore(result.scores.frequency_only_score)} note="Separately trained FFT-domain checkpoint" />
        <Metric label="Official dual score" value={formatScore(result.scores.dual_score)} note="Spatial + frequency gated fusion" />
        <Metric label="Dual with residual disabled" value={formatScore(result.scores.frequency_disabled_score)} note="Same dual checkpoint with the frequency residual removed" />
        <Metric label="Residual score effect" value={Number.isFinite(effect) ? `${effect >= 0 ? "+" : ""}${formatNumber(effect, 3)}` : "—"} note={Number.isFinite(effect) ? `Frequency residual ${direction} the fake score` : "Counterfactual unavailable"} />
      </div>

      {Number.isFinite(result.gate_alpha) && (
        <div className="gate-strip">
          <div><span>Mean gate alpha</span><strong>{formatNumber(result.gate_alpha, 3)}</strong></div>
          <p>{result.narrative?.gate_alpha || "Gate alpha records the learned weighting applied to the frequency residual inside the dual model."}</p>
        </div>
      )}

      {counterfactual && <p>{result.narrative?.frequency_counterfactual}</p>}
      <p className="context-note">
        Frequency-only is an independently trained baseline. The residual-disabled value is a counterfactual pass through the trained dual model. They answer different questions and are shown separately.
      </p>
    </section>
  );
}

export function InputEvidence({ result }) {
  const input = result?.input_adequacy;
  if (!input) return null;

  return (
    <section className="panel" aria-labelledby="input-title">
      <span className="section-kicker">Input adequacy</span>
      <h2 id="input-title">What the pipeline could inspect</h2>
      <div className="metric-grid">
        <Metric label="Candidate frames sampled" value={input.candidate_frames_sampled ?? "—"} note={Number.isFinite(input.candidate_frames_requested) ? `Maximum ${input.candidate_frames_requested}` : undefined} />
        <Metric label="Faces detected" value={input.face_candidates_detected ?? "—"} />
        <Metric label="Model face crops" value={input.usable_frames ?? 0} note={Number.isFinite(input.maximum_model_frames) ? `Maximum ${input.maximum_model_frames}` : undefined} />
        <Metric label="Crops discarded" value={input.model_frames_discarded ?? 0} note="Successful crops beyond the 20-frame model limit" />
        <Metric label="Model-frame coverage" value={formatScore(input.usable_fraction)} />
        <Metric label="Mean brightness" value={formatNumber(input.mean_brightness, 1)} />
      </div>
      <p>{result.narrative?.input_adequacy}</p>
      {input.warnings?.length > 0 && (
        <ul className="warning-list">{input.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
      )}
    </section>
  );
}

export function ProcessingEvidence({ result }) {
  const processing = result?.processing;
  if (!processing) return null;
  const forward = processing.model_forward_ms || {};

  return (
    <section className="panel" aria-labelledby="processing-title">
      <span className="section-kicker">Processing record</span>
      <h2 id="processing-title">Pipeline timing</h2>
      <div className="metric-grid processing-metrics">
        <Metric label="Full pipeline" value={formatMilliseconds(processing.total_pipeline_ms)} />
        <Metric label="Preprocessing" value={formatMilliseconds(processing.preprocessing_ms)} />
        <Metric label="Spatial forward" value={formatMilliseconds(forward.spatial_forward_batch)} />
        <Metric label="Frequency-only forward" value={formatMilliseconds(forward.frequency_only_forward_batch)} />
        <Metric label="Dual forward" value={formatMilliseconds(forward.dual_forward_batch)} />
        <Metric label="Residual-disabled forward" value={formatMilliseconds(forward.frequency_disabled_forward_batch)} />
      </div>
      <p className="context-note">{processing.note}</p>
    </section>
  );
}
