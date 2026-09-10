# Deepfake Evidence Dashboard frontend

This is the final React/Vite frontend for the Flask backend in `deepfake-backend-final`.
It presents live model outputs and research evidence without performing prediction
logic in the browser.

## Locked live pipeline represented by the interface

1. uniformly sample up to 30 candidate frames from the video;
2. detect the highest-confidence face in each candidate frame;
3. apply the locked 15% face margin;
4. resize the crop to 224 × 224;
5. reproduce the JPEG quality-95 round trip used by the research pipeline;
6. uniformly retain up to 20 successful crops;
7. run the Spatial, Frequency-only and official Dual models;
8. aggregate each model with the mean of per-frame sigmoid scores; and
9. apply the validation-locked triage rule to the official Dual score.

The Spatial and Frequency-only models are comparison baselines. Hiding or showing
them in the interface never changes the official Dual-model decision.

## Main interface features

- video upload with the 30-candidate → ≤20-model-crop protocol shown clearly;
- selectable Spatial, Frequency-only and Dual model outputs;
- genuine standalone Frequency-only scores from `frequency_only_best.pth`;
- separate dual-model frequency-residual-disabled counterfactual;
- all retained model frames shown together as clickable thumbnails;
- original sampled-frame preview and exact model face crop for the selected frame;
- per-frame Spatial, Frequency-only, Dual, gate-alpha and face-confidence evidence;
- input-adequacy and timing records;
- optional Grad-CAM sensitivity view;
- validation-locked automatic/manual-review result;
- exportable JSON evidence record; and
- model card with held-out benchmark context and limitations.

The displayed model scores are raw mean sigmoid scores. They are not calibrated
probabilities and are not presented as forensic proof.

## API contract

The frontend uses only the final evidence-record API:

- `GET /api/health`
- `GET /api/model-card`
- `POST /api/analyze`

`POST /api/analyze` sends multipart field `file` and the optional
`include_gradcam` boolean. The expected response has
`record_type: "live_video_evidence"`.

## Run locally

```bash
npm install
npm run dev
```

During development, Vite proxies `/api` to `http://127.0.0.1:5000` by default.
Set `VITE_API_BASE_URL` when the API is hosted elsewhere.

Create a production build with:

```bash
npm run build
```
