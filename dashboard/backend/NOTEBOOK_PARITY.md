# Notebook parity

This backend is aligned to `deepfake-detector-project.ipynb`.

## Locked preprocessing

- FF++ candidate frames: 30
- Face detector: OpenCV ResNet-SSD
- Local detector filenames:
  - `deploy.prototxt`
  - `face_detector.caffemodel`
- Face-confidence threshold: 0.90
- Highest-confidence face only
- Crop margin: 15%
- Crop size: 224 × 224
- Crop storage parity: JPEG quality 95 round trip
- Failed detections: discarded, never replaced with a full video frame
- Model-frame cap: uniformly retain at most 20 successful crops
- Minimum usable crops: 5

The two-stage 30→20 behavior mirrors the notebook: preprocessing first creates
up to 30 successful FF++ face crops, while video-level evaluation later applies
`max_frames=20` using `np.linspace` over the saved crop list.

## Locked model inputs and aggregation

- Spatial input: RGB tensor normalized with ImageNet mean/std.
- Frequency input: raw RGB tensor in [0,1].
- Dual model receives both tensors.
- Frame logits are converted with sigmoid.
- Video score is the arithmetic mean of frame probabilities.
- The official live decision is based on the dual checkpoint; spatial and
  frequency-only outputs are comparison baselines.
