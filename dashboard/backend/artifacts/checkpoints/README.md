# Checkpoints

This deployment uses three trusted notebook artifacts:

- `spatial_best.pth` — EfficientNet-B4 spatial baseline.
- `frequency_only_best.pth` — separately trained frequency-only baseline.
- `dual_best.pth` — official gated spatial-frequency model used for the final decision.

The dual checkpoint SHA-256 is verified against `../model_metadata.json` by
default. The frequency-only model is shown as a comparison baseline and does
not control the live triage decision.
