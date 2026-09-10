import { useEffect, useMemo, useState } from "react";
import UploadPanel from "./components/UploadPanel";
import ScoreComparison from "./components/ScoreComparison";
import ResultDashboard from "./components/ResultDashboard";
import FrameExplorer from "./components/FrameExplorer";
import ModelCard from "./components/ModelCard";
import ModelSelector from "./components/ModelSelector";
import { FrequencyEvidence, InputEvidence, ProcessingEvidence } from "./components/EvidencePanel";
import { ActivityIcon, DownloadIcon, InfoIcon, ShieldIcon } from "./components/Icons";
import { analyzeVideo, getHealth, getModelCard } from "./lib/api";
import { downloadJson, formatNumber, formatScore } from "./lib/format";

const STATUS_CONTENT = {
  likely_manipulated: { eyebrow: "Automatic screening result", title: "Likely manipulated", tone: "manipulated", explanation: "The official dual score is above the fixed class boundary and outside the configured review region." },
  likely_authentic: { eyebrow: "Automatic screening result", title: "Likely authentic", tone: "authentic", explanation: "The official dual score is below the fixed class boundary and outside the configured review region." },
  inconclusive_manual_review: { eyebrow: "Selective triage", title: "Manual review recommended", tone: "review", explanation: "The result falls inside the validation-locked manual-review region." },
  unable_to_assess: { eyebrow: "Input adequacy", title: "Unable to assess", tone: "unable", explanation: "There was not enough usable facial evidence to produce an authenticity conclusion." },
};


function ResultHeader({ result }) {
  const decision = STATUS_CONTENT[result.status] || STATUS_CONTENT.unable_to_assess;
  return (
    <section className={`result-banner ${decision.tone}`} aria-labelledby="result-title">
      <div className="result-symbol"><ShieldIcon size={28} /></div>
      <div className="result-copy"><span>{decision.eyebrow}</span><h2 id="result-title">{decision.title}</h2><p>{decision.explanation}</p></div>
      <div className="result-numbers">
        <div><span>Dual score</span><strong>{formatScore(result?.scores?.dual_score)}</strong></div>
        <div><span>Spatial score</span><strong>{formatScore(result?.scores?.spatial_score)}</strong></div>
        {Number.isFinite(result?.scores?.frequency_only_score) && <div><span>Frequency-only</span><strong>{formatScore(result.scores.frequency_only_score)}</strong></div>}
      </div>
    </section>
  );
}

function GradcamPanel({ result }) {
  const gradcam = result?.explainability?.gradcam;
  return (
    <section className="panel gradcam-panel" aria-labelledby="gradcam-title">
      <span className="section-kicker">Explainability</span><h2 id="gradcam-title">Grad-CAM sensitivity view</h2>
      {gradcam ? <div className="gradcam-content"><img src={gradcam.overlay_data_url} alt="Grad-CAM sensitivity overlay on a representative face crop" /><div><p>{result.narrative?.gradcam}</p><dl className="detail-list compact"><div><dt>Video frame</dt><dd>{gradcam.representative_frame_index}</dd></div><div><dt>Frame score</dt><dd>{formatScore(gradcam.frame_score)}</dd></div></dl><p className="context-note">{gradcam.interpretation}</p></div></div> : <div className="empty-inline"><InfoIcon /><p>{result.narrative?.gradcam || "Grad-CAM was not returned for this analysis."}</p></div>}
    </section>
  );
}

function AnalysisResult({ result }) {
  const [activeTab, setActiveTab] = useState("summary");
  const availableModels = useMemo(() => ({
    spatial: Number.isFinite(result?.scores?.spatial_score),
    frequency: Number.isFinite(result?.scores?.frequency_only_score),
    dual: Number.isFinite(result?.scores?.dual_score),
  }), [result]);
  const [selectedModels, setSelectedModels] = useState(() => {
    const defaults = new Set(["spatial", "dual"]);
    if (Number.isFinite(result?.scores?.frequency_only_score)) defaults.add("frequency");
    return defaults;
  });

  return (
    <div className="result-view">
      <div className="result-toolbar"><div><span>Analysis record</span><strong>{result.source?.filename}</strong></div><button className="secondary-button" onClick={() => downloadJson(result)}><DownloadIcon /> Export JSON</button></div>
      <ResultHeader result={result} />
      {result?.scores && <ModelSelector availableModels={availableModels} selectedModels={selectedModels} onChange={setSelectedModels} />}

      <div className="report-tabs" role="tablist" aria-label="Analysis report views">
        {[ ["summary", "Summary"], ["evidence", "Detailed evidence"], ["frames", `Frames (${result.frames?.length || 0})`] ].map(([key, label]) => <button key={key} role="tab" aria-selected={activeTab === key} className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}>{label}</button>)}
      </div>

      <div className="report-tab-content">
        {activeTab === "summary" && <div className="summary-stack"><ResultDashboard result={result} selectedModels={selectedModels} /><FrequencyEvidence result={result} /></div>}
        {activeTab === "evidence" && <div className="result-grid"><div className="result-main"><ScoreComparison result={result} selectedModels={selectedModels} /><FrequencyEvidence result={result} /></div><aside className="result-aside"><InputEvidence result={result} /><GradcamPanel result={result} /><ProcessingEvidence result={result} /></aside></div>}
        {activeTab === "frames" && <FrameExplorer frames={result.frames} selectedModels={selectedModels} />}
      </div>
      <div className="disclaimer-box"><InfoIcon /><p>{result.disclaimer}</p></div>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState("analyze");
  const [health, setHealth] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [modelCardLoading, setModelCardLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadContext() {
      const [healthResult, modelResult] = await Promise.allSettled([getHealth(), getModelCard()]);
      if (cancelled) return;
      setHealth(healthResult.status === "fulfilled" ? healthResult.value : { ready: false });
      if (modelResult.status === "fulfilled") setMetadata(modelResult.value);
      setModelCardLoading(false);
    }
    loadContext();
    return () => { cancelled = true; };
  }, []);

  async function runAnalysis(file, includeGradcam) {
    setBusy(true); setError(""); setResult(null);
    try { setResult(await analyzeVideo(file, includeGradcam)); }
    catch (analysisError) { setError(analysisError.message || "The video could not be analysed."); }
    finally { setBusy(false); }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Deepfake Evidence Dashboard home">
          <span className="brand-mark brand-logo-wrap">
            <img src="/deepfake-logo.svg" alt="Deepfake Evidence logo" />
          </span>
          <span><strong>DEEPFAKE DETECTOR</strong></span>
        </a>
        <nav aria-label="Primary navigation"><button className={activeView === "analyze" ? "active" : ""} onClick={() => setActiveView("analyze")}>Analyse video</button><button className={activeView === "model" ? "active" : ""} onClick={() => setActiveView("model")}>Model Info</button></nav>
        
      </header>
      <main id="top">
        {activeView === "analyze" ? <>
          <UploadPanel busy={busy} onAnalyze={runAnalysis} />
          {busy && <div className="analysis-loading" role="status"><span className="spinner" /><div><strong>Analysing sampled facial evidence</strong><span>Up to 30 candidate frames are being sampled, faces extracted, and retained crops scored by the three models.</span></div></div>}
          {error && <div className="error-banner" role="alert"><InfoIcon /><div><strong>Analysis could not be completed</strong><span>{error}</span></div></div>}
          {result && <AnalysisResult key={result.analysis_id} result={result} />}
          {!result && !busy && !error && <section className="method-strip" aria-label="Analysis stages"><div><span>01</span><strong>Sample</strong><small>Up to 30 candidate frames across the video</small></div><div><span>02</span><strong>Prepare</strong><small>Best face, 15% margin, 224 × 224 and JPEG-95</small></div><div><span>03</span><strong>Retain & compare</strong><small>Up to 20 face crops scored by Spatial, Frequency-only and Dual</small></div><div><span>04</span><strong>Review</strong><small>Validation-locked triage, frame evidence and explanations</small></div></section>}
        </> : <ModelCard metadata={metadata} loading={modelCardLoading} />}
      </main>
      <footer><p>Group 9 · MSc Artificial Intelligence · University of the West of England</p><p>Disclaimer: The results provided by this prototype are for suggestion purposes only. </p></footer>
    </div>
  );
}
