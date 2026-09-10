const MODEL_OPTIONS = [
  {
    key: "spatial",
    name: "Spatial baseline",
    detail: "EfficientNet-B4 appearance evidence",
  },
  {
    key: "frequency",
    name: "Frequency-only",
    detail: "Standalone FFT-domain baseline",
  },
  {
    key: "dual",
    name: "Dual model",
    detail: "Gated spatial + frequency fusion",
  },
];

export default function ModelSelector({ availableModels, selectedModels, onChange }) {
  function toggle(key) {
    if (!availableModels[key]) return;
    const next = new Set(selectedModels);
    if (next.has(key)) {
      if (next.size === 1) return;
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  }

  return (
    <section className="model-selector" aria-label="Models shown in this report">
      <div className="model-selector-heading">
        <div>
          <span className="section-kicker">Display controls</span>
        </div>
      </div>

      <div className="model-select-grid">
        {MODEL_OPTIONS.map((model) => {
          const available = Boolean(availableModels[model.key]);
          const active = selectedModels.has(model.key);
          return (
            <label
              key={model.key}
              className={`model-select-card ${active ? "active" : ""} ${available ? "" : "disabled"}`}
            >
              <input
                type="checkbox"
                checked={active}
                disabled={!available}
                onChange={() => toggle(model.key)}
              />
              <span className="model-select-copy">
                <strong>{model.name}</strong>
                <small>{available ? model.detail : "Unavailable for this analysis"}</small>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
