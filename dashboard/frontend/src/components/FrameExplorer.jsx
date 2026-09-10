import { useEffect, useMemo, useState } from "react";
import { formatNumber, formatScore } from "../lib/format";

const MODEL_META = {
  spatial: { label: "Spatial", field: "spatial_score" },
  frequency: { label: "Frequency-only", field: "frequency_only_score" },
  dual: { label: "Dual", field: "dual_score" },
};

export default function FrameExplorer({ frames = [], selectedModels }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex >= frames.length) setSelectedIndex(0);
  }, [frames.length, selectedIndex]);

  const selected = frames[selectedIndex] || null;
  const activeModel = useMemo(() => {
    if (selectedModels.has("dual")) return "dual";
    if (selectedModels.has("spatial")) return "spatial";
    return "frequency";
  }, [selectedModels]);

  if (!frames.length || !selected) return null;

  return (
    <section className="panel frame-panel" aria-labelledby="frames-title">
      <div className="panel-heading frame-heading">
        <div>
          <span className="section-kicker">Frame evidence</span>
          <h2 id="frames-title">Retained model frames</h2>
          <p>These are the successful face samples retained after the 30-frame candidate stage. Select any thumbnail to inspect the exact crop and per-frame scores.</p>
        </div>
        <span className="muted-label">{frames.length} of 20 maximum</span>
      </div>

      <div className="frame-grid" role="list" aria-label="Retained video frames">
        {frames.map((frame, index) => {
          const meta = MODEL_META[activeModel];
          const score = frame[meta.field];
          return (
            <button
              key={`${frame.video_frame_index ?? frame.sequence ?? index}-${index}`}
              className={`frame-thumb ${selectedIndex === index ? "selected" : ""}`}
              onClick={() => setSelectedIndex(index)}
              role="listitem"
              aria-label={`Inspect retained sample ${index + 1}, video frame ${frame.video_frame_index ?? "unknown"}`}
            >
              <span className="frame-thumb-image">
                <img src={frame.preview_data_url || frame.face_crop_data_url} alt="" />
                <span className="frame-sequence">{String(index + 1).padStart(2, "0")}</span>
              </span>
              <span className="frame-thumb-meta">
                <span>Frame {frame.video_frame_index ?? "—"}</span>
                <strong>{meta.label} {formatScore(score)}</strong>
              </span>
            </button>
          );
        })}
      </div>

      <div className="frame-detail merged-frame-detail">
        <div className="selected-frame-visual">
          <img src={selected.preview_data_url || selected.face_crop_data_url} alt={`Selected video frame ${selected.video_frame_index ?? selectedIndex + 1}`} />
          {selected.preview_data_url && selected.face_crop_data_url && selected.preview_data_url !== selected.face_crop_data_url && (
            <div className="crop-inline">
              <span>224 × 224 model face crop</span>
              <img src={selected.face_crop_data_url} alt="Extracted face crop used for inference" />
            </div>
          )}
        </div>
        <div>
          <span className="section-kicker">Selected sample {selectedIndex + 1}</span>
          <h3>Video frame {selected.video_frame_index ?? "—"}</h3>
          <dl className="detail-list frame-score-list">
            {selectedModels.has("spatial") && <div><dt>Spatial score</dt><dd>{formatScore(selected.spatial_score)}</dd></div>}
            {selectedModels.has("frequency") && <div><dt>Frequency-only score</dt><dd>{formatScore(selected.frequency_only_score)}</dd></div>}
            {selectedModels.has("dual") && <div><dt>Dual score</dt><dd>{formatScore(selected.dual_score)}</dd></div>}
            {Number.isFinite(selected.frequency_disabled_score) && <div><dt>Dual, frequency residual disabled</dt><dd>{formatScore(selected.frequency_disabled_score)}</dd></div>}
            {Number.isFinite(selected.gate_alpha) && <div><dt>Gate alpha</dt><dd>{formatNumber(selected.gate_alpha, 3)}</dd></div>}
            {Number.isFinite(selected.face_confidence) && <div><dt>Face confidence</dt><dd>{formatScore(selected.face_confidence)}</dd></div>}
          </dl>
        </div>
      </div>
    </section>
  );
}
