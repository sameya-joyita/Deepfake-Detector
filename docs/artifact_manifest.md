# Artifact manifest

The repository keeps source code and lightweight result records in Git. Large
or access-controlled artifacts are stored separately and copied into the
backend only when running the application.

## Required backend artifacts

| Artifact | Produced or obtained from | Local dashboard destination | Integrity status |
|---|---|---|---|
| `spatial_best.pth` | Final Kaggle checkpoint: `/kaggle/working/checkpoints/spatial_best.pth` | `dashboard/backend/artifacts/checkpoints/spatial_best.pth` | SHA-256 below |
| `dual_best.pth` | Final retained Kaggle checkpoint: `/kaggle/working/checkpoints/dual_best.pth` | `dashboard/backend/artifacts/checkpoints/dual_best.pth` | SHA-256 below |
| `frequency_only_best.pth` | Final Kaggle frequency baseline checkpoint | `dashboard/backend/artifacts/checkpoints/frequency_only_best.pth` | SHA-256 below |
| `deploy.prototxt` | Official OpenCV repository | `dashboard/backend/artifacts/face_detector/deploy.prototxt` | Downloaded by script |
| `face_detector.caffemodel` | Official OpenCV 3rd-party repository | `dashboard/backend/artifacts/face_detector/face_detector.caffemodel` | Downloaded by script |

Known checkpoint hashes:

```text
spatial_best.pth:
57E2292D750FB31AAB2A17003D38EA5CCE5D2C080ACB6B3683702EDE2C418CD9

dual_best.pth
2499bc2020eea1f7a7f0ca448312d64c4771f81f6e834944e682c4498df8dd42

frequency_only_best.pth
7ef2965b7853bfa19ab5bfbea521be0f6f4bd5e35c57b7d7f65476ebe0e61dd4
```

## Face-detector installation

From `dashboard/backend` run:

```bash
python scripts/download_face_detector.py
```

The script downloads only the two published detector files. Review the URLs in
the script before execution when working in a controlled environment.

