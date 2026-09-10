"""Check required paths and the official dual checkpoint hash."""

import hashlib
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as source:
        for block in iter(lambda: source.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main():
    metadata_path = ROOT / "artifacts" / "model_metadata.json"
    with open(metadata_path, encoding="utf-8") as source:
        metadata = json.load(source)

    paths = {
        "spatial checkpoint": ROOT / "artifacts/checkpoints/spatial_best.pth",
        "dual checkpoint": ROOT / "artifacts/checkpoints/dual_best.pth",
        "frequency checkpoint": (
            ROOT / "artifacts/checkpoints/frequency_only_best.pth"
        ),
        "face prototxt": ROOT / "artifacts/face_detector/deploy.prototxt",
        "face weights": (
            ROOT
            / "artifacts/face_detector/"
            / "face_detector.caffemodel"
        ),
        "triage thresholds": ROOT / "artifacts/triage_thresholds.json",
    }

    failed = False
    for label, path in paths.items():
        present = path.is_file()
        print(f"{label:<22}: {'present' if present else 'MISSING'} - {path}")
        failed = failed or not present

    dual_path = paths["dual checkpoint"]
    if dual_path.is_file():
        actual = sha256_file(dual_path)
        expected = metadata["official_checkpoint_sha256"]
        matches = actual.lower() == expected.lower()
        print(f"dual SHA-256 match    : {matches}")
        if not matches:
            print(f"  expected: {expected}")
            print(f"  actual  : {actual}")
            failed = True

    frequency_path = paths["frequency checkpoint"]
    expected_frequency = metadata.get("frequency_only_checkpoint_sha256")
    if frequency_path.is_file() and expected_frequency:
        actual_frequency = sha256_file(frequency_path)
        matches_frequency = actual_frequency.lower() == expected_frequency.lower()
        print(f"frequency SHA-256 match: {matches_frequency}")
        if not matches_frequency:
            print(f"  expected: {expected_frequency}")
            print(f"  actual  : {actual_frequency}")
            failed = True

    if failed:
        sys.exit(1)
    print("Artifact verification passed.")


if __name__ == "__main__":
    main()
