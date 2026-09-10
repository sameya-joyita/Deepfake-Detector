import { formatMilliseconds, formatScore } from "../lib/format";

const MODEL_META = {
  spatial: {
    label: "Spatial baseline",
    detail: "EfficientNet-B4 appearance evidence",
    accent: "#38bdf8", // Bright cyan/blue for high contrast
    timingKey: "spatial_forward_batch",
  },
  frequency: {
    label: "Frequency-only",
    detail: "Standalone FFT-domain baseline",
    accent: "#a855f7", // Bright vibrant purple
    timingKey: "frequency_only_forward_batch",
  },
  dual: {
    label: "Official dual model",
    detail: "Gated spatial-frequency evidence",
    accent: "#f59e0b", // Warm vibrant amber/yellow
    timingKey: "dual_forward_batch",
  },
};

function normalizeScore(value) {
  if (!Number.isFinite(value)) return null;

  const clamped = Math.min(1, Math.max(0, value));
  return value > 1 ? Math.min(1, Math.max(0, value / 100)) : clamped;
}

function ScoreGauge({ label, detail, score, timing, accent }) {
  const safeScore = normalizeScore(score);

  const rotationAngle =
    safeScore !== null ? (safeScore - 0.5) * 180 : -90;

  // Position where the coloured arc should end.
  const endAngle = safeScore !== null
    ? Math.PI - safeScore * Math.PI
    : Math.PI;

  const centerX = 100;
  const centerY = 102;
  const radius = 76;

  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY - radius * Math.sin(endAngle);

  return (
    <article className="gauge-card">
      <div className="gauge-copy">
        <span>{label}</span>
        <small>{detail}</small>
      </div>

      <div className="gauge-shell">
        <svg
          viewBox="0 0 200 126"
          role="img"
          aria-label={`${label}: ${formatScore(score)}`}
        >
          {/* Background track */}
          <path
            className="gauge-track"
            d="M 24 102 A 76 76 0 0 1 176 102"
          />

          {/* Coloured value arc */}
          {safeScore !== null && safeScore > 0 && (
            <path
              className="gauge-value"
              d={`M 24 102 A 76 76 0 0 1 ${endX} ${endY}`}
              style={{
                stroke: accent,
              }}
            />
          )}

          {/* 0.5 boundary */}
          <line
            className="gauge-boundary-tick"
            x1="100"
            y1="18"
            x2="100"
            y2="30"
          />

          {/* Needle */}
          {safeScore !== null && (
            <g transform={`rotate(${rotationAngle}, 100, 102)`}>
              <line
                x1="100"
                y1="102"
                x2="100"
                y2="38"
                style={{
                  stroke: "var(--text)",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                }}
              />
            </g>
          )}

          <circle
            className="gauge-pin"
            cx="100"
            cy="102"
            r="6"
          />

          <text
            className="gauge-score"
            x="100"
            y="90"
            textAnchor="middle"
          >
            {formatScore(score)}
          </text>

          <text
            className="gauge-label-left"
            x="20"
            y="122"
          >
            0
          </text>

          <text
            className="gauge-label-middle"
            x="100"
            y="13"
            textAnchor="middle"
          >
            0.5 boundary
          </text>

          <text
            className="gauge-label-right"
            x="180"
            y="122"
            textAnchor="end"
          >
            1
          </text>
        </svg>
      </div>

      <div className="gauge-timing">
        <span>Execution time</span>
        <strong>{formatMilliseconds(timing)}</strong>
      </div>
    </article>
  );
}


function TelemetryCard({ number, label, value, note }) {
  return (
    <article className="telemetry-card">
      <span className="telemetry-number">{number}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export default function ResultDashboard({ result, selectedModels }) {
  const input = result?.input_adequacy || {};
  const processing = result?.processing || {};
  const forward = processing.model_forward_ms || {};
  const scores = {
    spatial: result?.scores?.spatial_score,
    frequency: result?.scores?.frequency_only_score,
    dual: result?.scores?.dual_score,
  };
  const visible = Object.keys(MODEL_META).filter(
    (key) => selectedModels.has(key) && Number.isFinite(scores[key])
  );

  return (
    <section className="panel result-dashboard" aria-labelledby="dashboard-title">
      <div className="panel-heading dashboard-heading">
        <div>
          <h2 className="section-kicker">SUMMARY</h2>
          
        </div>
      </div>

      {result?.scores ? (
        <div className={`gauge-grid gauges-${Math.min(visible.length, 3)}`}>
          {visible.map((key) => (
            <ScoreGauge
              key={key}
              {...MODEL_META[key]}
              score={scores[key]}
              timing={forward[MODEL_META[key].timingKey]}
            />
          ))}
        </div>
      ) : (
        <div className="dashboard-unavailable">
          No model score was produced because the minimum usable-face requirement was not met.
        </div>
      )}

      <div className="telemetry-grid">
        <TelemetryCard
          number="01"
          label="Candidate frames"
          value={input.candidate_frames_sampled ?? "—"}
          note={`Uniformly sampled from the video${Number.isFinite(input.candidate_frames_requested) ? ` · maximum ${input.candidate_frames_requested}` : ""}`}
        />
        <TelemetryCard
          number="02"
          label="Model face crops"
          value={input.usable_frames ?? result?.frames?.length ?? 0}
          note={`Successful crops retained for inference${Number.isFinite(input.maximum_model_frames) ? ` · maximum ${input.maximum_model_frames}` : ""}`}
        />
        <TelemetryCard
          number="03"
          label="Preprocessing"
          value={formatMilliseconds(processing.preprocessing_ms)}
          note="Decode, detect, margin, resize and JPEG-95 round trip"
        />
        <TelemetryCard
          number="04"
          label="Full pipeline"
          value={formatMilliseconds(processing.total_pipeline_ms)}
          note="Preprocessing, inference, evidence record and optional Grad-CAM"
        />
      </div>

      <div className="method-notes">
        <p>
          <strong>Score definition:</strong> mean of per-frame sigmoid outputs. Scores
          are not calibrated probabilities.
        </p>
        <p>
          <strong>Display controls:</strong> hiding a model only changes this report
          view; it never changes or reruns the official dual-model decision.
        </p>
      </div>
    </section>
  );
}
