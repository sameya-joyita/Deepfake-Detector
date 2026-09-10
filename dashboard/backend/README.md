# Deepfake detector Flask backend

This backend reproduces the locked inference protocol from the final research
notebook. It does not execute notebook cells and it never trains a model.

## Inference contract

1. Sample at most 30 candidate frames uniformly over the uploaded video.
2. Run the OpenCV ResNet-SSD face detector on CPU.
3. Keep the highest-confidence face above 0.90, add a 15% margin and resize it
   to 224 × 224.
4. Apply the same JPEG-quality-95 round trip used when the research crop cache
   was created.
5. Uniformly retain at most 20 successful, temporally ordered face crops. This
   reproduces the notebook's FF++ preprocessing followed by its model-frame cap.
6. Send ImageNet-normalised RGB to the spatial model and raw `[0,1]` RGB to
   both the standalone frequency-only baseline and the dual model's FFT branch.
7. Score the spatial baseline, frequency-only baseline and official dual model
   on the same retained crops. The frequency-disabled dual pass is kept as a
   separate mechanistic counterfactual.
8. Convert each frame logit with sigmoid, then average frame probabilities.
9. Use `dual_best.pth` as the official decision model and 0.5 as the label
   threshold. The spatial and frequency-only models are comparison baselines.
10. Apply the validation-locked 90% coverage margin only to decide whether a
   case is automatically labelled or referred for manual review.

The response keeps per-video scores separate from dataset-level AUC values.
Scores are not calibrated probabilities and the result is not forensic proof.

## Directory layout

```text
deepfake-backend/
├── app/
│   ├── api/routes.py
│   ├── models/architectures.py
│   ├── models/registry.py
│   └── services/
│       ├── analysis.py
│       ├── preprocessing.py
│       ├── inference.py
│       ├── gradcam.py
│       ├── input_quality.py
│       ├── evidence.py
│       ├── narratives.py
│       └── media.py
├── artifacts/
│   ├── checkpoints/
│   ├── face_detector/
│   ├── model_metadata.json
│   └── triage_thresholds.json
├── scripts/
├── tests/
├── .env.example
├── requirements.txt
└── run.py
```

## Required private artifacts

Copy these files into the stated directories. They are intentionally excluded
from Git:

```text
artifacts/checkpoints/spatial_best.pth
artifacts/checkpoints/frequency_only_best.pth
artifacts/checkpoints/dual_best.pth
artifacts/face_detector/deploy.prototxt
artifacts/face_detector/face_detector.caffemodel
```

The standalone frequency-only score comes from `frequency_only_best.pth`. It
is a separately trained research baseline and never controls the live decision.
The counterfactual remains distinct: it uses `dual_best.pth` with its learned
frequency residual disabled.

## Setup

Use Python 3.11 or 3.12. Install the PyTorch build appropriate for the target
CPU/CUDA platform first, then install the remaining packages:

```bash
python -m venv .venv
source .venv/bin/activate                 # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
# Install torch and torchvision using the official PyTorch selector.
python -m pip install -r requirements.txt
python scripts/download_face_detector.py
```

Copy `.env.example` to `.env`, then start the development service:

```bash
python run.py
```

For a single-GPU deployment, use one application worker because every worker
loads the spatial, frequency-only and dual checkpoints:

```bash
python -m pip install -r requirements-production.txt
gunicorn --workers 1 --threads 4 --timeout 300 --bind 0.0.0.0:5000 run:app
```

Requests are currently serialised around the shared OpenCV DNN and PyTorch
models. This is deliberate correctness protection for the dissertation
prototype, not a claim of production-scale throughput.

Endpoints:

- `GET /api/health`
- `GET /api/model-card`
- `POST /api/analyze` with multipart field `file`

The optional multipart field `include_gradcam` accepts `true` or `false`.

### PyTorch 2.6 and newer

The Kaggle checkpoints contain small NumPy scalar values in their saved
metric metadata. The backend explicitly allowlists only the NumPy scalar and
dtype classes needed to read that metadata while retaining PyTorch's
restricted `weights_only=True` loader. Do not change this to
`weights_only=False` for a checkpoint obtained from an untrusted source.

## Verification

```bash
python -m unittest discover -s tests -v
python scripts/verify_artifacts.py
```

The face detector weight file is named `face_detector.caffemodel`, exactly as
in the training notebook. It contains the OpenCV ResNet-SSD weights downloaded
from the notebook's original URL.

Run `scripts/check_notebook_parity.py` against the saved FF++ crops for
`Deepfakes_004_982`. It checks the notebook reference values for the official
dual score and the frequency-disabled counterfactual.

To verify the complete raw-video preprocessing path as well, provide the
corresponding original `004_982.mp4` file:

```bash
python scripts/check_notebook_parity.py PATH_TO_FF_TEST_FAKE_CROPS \
  --raw-video PATH_TO_DEEPFAKES_004_982_VIDEO
```
