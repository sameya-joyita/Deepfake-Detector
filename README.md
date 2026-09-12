# Spatial–Frequency Fusion for Video Deepfake Detection

This repository contains the experimental notebook and analyst-facing software
developed for a University of the West of England MSc Artificial Intelligence
group project. The study asks whether a lightweight frequency residual adds
reliable evidence to a strong spatial detector, and how the resulting system
behaves when it is evaluated beyond its training benchmark.

The work is an empirical and methodological study rather than a claim of a new
state-of-the-art detector. Its main contribution is a combined evidential
protocol:

- FaceForensics++ is split by connected source components so related source
  material cannot cross the training, validation and test partitions;
- model differences are assessed with a paired bootstrap over the 75 test
  source components, rather than by treating related videos as independent;
- the frequency pathway is examined both with a separately trained
  frequency-only baseline and with a within-checkpoint intervention that
  disables only the dual model's frequency residual; and
- calibration, corruption robustness, frame-count sensitivity, inference
  latency, external transfer and selective referral are reported alongside
  headline discrimination metrics.

The Flask–React dashboard implements the locked notebook inference protocol.
It presents model outputs as screening evidence for human review, not as a
calibrated probability or forensic conclusion.

## Research questions

1. Does additive spatial–frequency fusion improve video-level detection over
   an EfficientNet-B4 spatial baseline under a source-component-disjoint
   FaceForensics++ split, and does the improvement survive paired statistical
   and mechanistic testing?
2. How well do the locked spatial and fused detectors generalise, without
   retraining, to Celeb-DF v2 under full-collection and official-test-list
   protocols?
3. What do calibration, frame-count sensitivity, corruption robustness,
   inference cost, explainability and selective referral reveal about the
   detector's reliability and appropriate use?

## Model and inference protocol

The spatial baseline uses an ImageNet-pretrained EfficientNet-B4 encoder. The
dual model retains the trained spatial representation and adds a compact
two-dimensional FFT-magnitude branch through a learned additive gate. A third,
separately trained frequency-only network is retained as a research baseline;
it never controls the dashboard decision.

For an uploaded video, the deployed pipeline:

1. uniformly samples at most 30 candidate frames across the complete video;
2. detects the highest-confidence face above 0.90 in each candidate frame;
3. adds a 15% face margin and resizes the crop to 224 × 224;
4. reproduces the JPEG-quality-95 round trip used by the notebook crop cache;
5. uniformly retains at most 20 successful, temporally ordered face crops;
6. evaluates the spatial, frequency-only and official dual models on the same
   crops;
7. converts each frame logit with the sigmoid function and averages the frame
   scores to obtain one score per video; and
8. uses a fixed 0.5 class threshold and a validation-locked score-margin rule
   to decide whether the result is automatic or referred for manual review.

A video with fewer than five usable face crops is returned as unable to assess.

## Principal results

All values below are video-level results from the locked experimental record.

| Evaluation | Spatial | Dual | Notes |
|---|---:|---:|---|
| FF++ source-disjoint test AUC | 0.9884 | 0.9901 | 738/738 videos evaluated |
| Celeb-DF full-collection AUC | 0.8735 | 0.8786 | 6,463/6,529 videos evaluated |
| Celeb-DF official-list AUC | 0.8305 | 0.8362 | 502/518 videos evaluated |

The paired FF++ AUC difference was **+0.0017**, with a source-cluster
bootstrap 95% interval of **+0.0005 to +0.0031**. Disabling the frequency
residual inside the retained dual checkpoint reduced AUC to **0.9663**; the
separately trained frequency-only baseline achieved **0.6439**. Together these
results suggest that frequency evidence was weak in isolation but useful when
integrated with the spatial representation.

Validation-fitted temperature scaling was not retained: held-out test NLL
changed from 0.1195 to 0.1206 and ECE from 0.0290 to 0.0312. Dashboard scores
therefore remain raw mean sigmoid scores and must not be interpreted as
calibrated probabilities.

## Repository layout

```text
Deepfake-Detector/
├── notebooks/
│   └── deepfake-detector-project.ipynb  : Notebook used for model development
├── dashboard/
│   ├── backend/                : Flask inference and evidence API
│   └── frontend/               : React/Vite interface
├── results/
│   ├── summary/                : Final JSON records
│   └── figures/                : Selected final experimental figures
├── docs/
│   ├── artifact_manifest.md
│   ├── reproducibility.md
│   ├── privacy.md
│   ├── validation/
```

## Required model artifacts

Make sure the following files are present in the backend before
starting the API:

```text
dashboard/backend/artifacts/checkpoints/spatial_best.pth
dashboard/backend/artifacts/checkpoints/frequency_only_best.pth
dashboard/backend/artifacts/checkpoints/dual_best.pth
dashboard/backend/artifacts/face_detector/deploy.prototxt
dashboard/backend/artifacts/face_detector/face_detector.caffemodel
```

See [the artifact manifest](docs/artifact_manifest.md) for provenance,
integrity checks and installation guidance. Dataset licences and access terms
also apply; this repository does not redistribute FF++ or Celeb-DF videos or
derived face crops.

## Run the backend

Python 3.11 or 3.12 is recommended. Install the PyTorch build appropriate for
your CPU or CUDA environment first, then install the remaining dependencies.

```bash
cd dashboard/backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# Linux or macOS
source .venv/bin/activate
```

Then install and configure the application:

```bash
python -m pip install --upgrade pip
# Install torch and torchvision using https://pytorch.org/get-started/locally/
python -m pip install -r requirements.txt
python scripts/download_face_detector.py
```

Copy `.env.example` to `.env`, add the three checkpoints, and verify the
artifacts:

```bash
python scripts/verify_artifacts.py
python -m unittest discover -s tests -v
python run.py
```

The development API runs at `http://127.0.0.1:5000`. Useful endpoints are:

- `GET /api/health`
- `GET /api/model-card`
- `POST /api/analyze` using multipart field `file` and optional field
  `include_gradcam`

## Run the frontend

Node.js 20.19 or later is required.

```bash
cd dashboard/frontend
npm ci
npm run dev
```

Vite serves the development interface at `http://localhost:5173` and proxies
`/api` to the local Flask backend. To verify the production bundle:

```bash
npm run build
```

## Notebook and reproducibility

The notebook is the authoritative experimental record. It contains manifest
construction, crop generation, model training and selection, standardised
video prediction, paired source-cluster bootstrapping, calibration, ablation,
robustness, timing, cross-dataset evaluation, explainability and the final
model card.

Long-running Kaggle files are not included in Git. The notebook expects the
original datasets and restored processed-crop/checkpoint artifacts at its
documented Kaggle paths. Final lightweight result records are recorded in
`results/summary/` so the principal claims can be inspected without rerunning
training.

See [the reproducibility guide](docs/reproducibility.md)
for reproducibility detail.

## Scope and limitations

- The positive class covers the four FF++ facial manipulation families used in
  this study: Deepfakes, Face2Face, FaceSwap and NeuralTextures.
- Frames are analysed independently; temporal consistency and audio are not
  modelled.
- Only the highest-confidence detected face is retained per sampled frame.
- Cross-dataset evaluation is limited to Celeb-DF v2 and exhibits a clear
  domain gap.
- Demographic fairness has not been established because suitable validated
  subgroup labels were unavailable.
- Grad-CAM shows model sensitivity, not manipulation localisation.
- MC Dropout was exploratory and does not determine the live referral policy.
- Scores are not calibrated probabilities, identity claims or forensic proof.

Consequential decisions require human review and corroborating evidence.

## Privacy

The Flask application processes each upload in a temporary request directory
and removes that directory when the request finishes. This statement applies
to the supplied application code; production proxies, hosting platforms,
monitoring systems and backups require their own retention and privacy review.

## Authorship and licences

No dataset rights are transferred with this repository. FaceForensics++,
Celeb-DF v2, pretrained weights and third-party software remain subject to
their respective terms
