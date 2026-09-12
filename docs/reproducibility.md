# Reproducibility and notebook parity

## Reproducibility levels

The project provides three different forms of reproducibility:

1. **Software verification:** backend unit tests and a production frontend
   build check deterministic code paths without retraining.
2. **Inference parity:** a fixed FF++ example verifies that the backend produces
   the same official-dual and frequency-disabled scores as the notebook from
   the same saved crops.
3. **Experimental traceability:** the executed notebook and lightweight JSON
   outputs record the split, checkpoint decision, coverage, metrics and
   experiment configuration. Full retraining additionally requires authorised
   access to the original datasets and restored crop caches.

## Environment and artifacts

Before testing, place the three model checkpoints in
`dashboard/backend/artifacts/checkpoints/` and run:

```bash
cd dashboard/backend
python scripts/download_face_detector.py
python scripts/verify_artifacts.py
python -m unittest discover -s tests -v
```

The final notebook also writes `/kaggle/working/experiments/software_environment.json`.
which can be found in `results/summary/software_environment.json`.

## Saved-crop notebook parity

The reference video is `Deepfakes_004_982`. Locate the FF++ test/fake crop
directory containing files named:

```text
Deepfakes_004_982_f*.jpg
```

It is not necessary to copy the complete FF++ test set, but the directory must
contain the complete saved crop set for this reference video. The script
selects the same uniformly spaced maximum of 20 crops used by the notebook and
now refuses to certify a partial set.

Run from `dashboard/backend`:

```powershell
python scripts/check_notebook_parity.py "C:\path\to\processed\ff\test\fake"
```

Expected reference values:

```text
dual score                  : 0.935472482
frequency-disabled score    : 0.023094484
tolerance                   : 0.0001
```

The previously observed backend values were:

```text
dual score                  : 0.935472608
absolute difference         : 0.000000125
frequency-disabled score    : 0.023094494
absolute difference         : 0.000000010
```

Both were comfortably inside the tolerance.

## Save parity evidence

```powershell
New-Item -ItemType Directory -Force ..\..\docs\validation | Out-Null
& python scripts/check_notebook_parity.py "C:\path\to\processed\ff\test\fake" `
    2>&1 | Tee-Object -FilePath ..\..\docs\validation\parity_saved_crops.txt
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

## Optional end-to-end raw-video parity

The saved-crop test verifies transforms, model loading, aggregation and the
frequency-disabled counterfactual. It does not verify video decoding, candidate
frame selection or face detection. If authorised access to the original
Deepfakes `004_982.mp4` is available, run:

```powershell
python scripts/check_notebook_parity.py "C:\path\to\processed\ff\test\fake" `
    --raw-video "C:\path\to\Deepfakes\004_982.mp4"
```

A pass provides stronger end-to-end evidence. Small platform-dependent
differences in video decoding or face detection should be investigated and
reported rather than hidden by increasing the tolerance without justification.

