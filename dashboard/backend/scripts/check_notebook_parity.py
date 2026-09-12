"""Compare saved FF++ crops with the final notebook reference prediction."""

import argparse
from pathlib import Path
import sys

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import Config
from app.models.registry import load_model_bundle
from app.services.inference import InferenceEngine
from app.services.preprocessing import FaceExtractor


REFERENCE_VIDEO_ID = "Deepfakes_004_982"
REFERENCE_DUAL_SCORE = 0.935472482442856
REFERENCE_DISABLED_SCORE = 0.0230944835580885
REFERENCE_MODEL_FRAMES = 20
TOLERANCE = 1e-4


def config_dict():
    return {
        name: getattr(Config, name)
        for name in [
            "SPATIAL_CHECKPOINT",
            "DUAL_CHECKPOINT",
            "FREQUENCY_CHECKPOINT",
            "FACE_PROTOTXT",
            "FACE_WEIGHTS",
            "TRIAGE_THRESHOLDS",
            "MODEL_METADATA",
            "VERIFY_DUAL_SHA256",
            "DEVICE",
        ]
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "crop_directory",
        type=Path,
        help=(
            "Directory containing the saved test crops for "
            f"{REFERENCE_VIDEO_ID}."
        ),
    )
    parser.add_argument(
        "--raw-video",
        type=Path,
        help=(
            "Optional original Deepfakes 004_982 video. When supplied, the "
            "script also validates the complete 30-candidate to 20-crop "
            "live preprocessing path against the notebook score."
        ),
    )
    args = parser.parse_args()

    all_crop_paths = sorted(
        path
        for path in args.crop_directory.glob(f"{REFERENCE_VIDEO_ID}_f*.jpg")
    )
    if not all_crop_paths:
        raise FileNotFoundError("No notebook reference crops were found.")

    crop_paths = all_crop_paths
    if len(crop_paths) > REFERENCE_MODEL_FRAMES:
        selected = np.linspace(
            0,
            len(crop_paths) - 1,
            REFERENCE_MODEL_FRAMES,
            dtype=int,
        )
        crop_paths = [crop_paths[index] for index in selected]

    if len(crop_paths) != REFERENCE_MODEL_FRAMES:
        raise RuntimeError(
            f"The parity reference requires {REFERENCE_MODEL_FRAMES} model "
            f"crops, but only {len(crop_paths)} were selected from "
            f"{len(all_crop_paths)} available files. Restore the complete "
            f"saved crop set for {REFERENCE_VIDEO_ID}."
        )

    print(f"Reference crops available: {len(all_crop_paths)}")
    print(f"Reference crops selected: {len(crop_paths)}")

    crops = []
    for path in crop_paths:
        bgr = cv2.imread(str(path))
        if bgr is None:
            raise RuntimeError(f"Could not read {path}")
        crops.append(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))

    bundle = load_model_bundle(config_dict())
    engine = InferenceEngine(bundle)
    result = engine.score(crops)

    checks = {
        "dual score": (result.dual_score, REFERENCE_DUAL_SCORE),
        "frequency-disabled score": (
            result.frequency_disabled_score,
            REFERENCE_DISABLED_SCORE,
        ),
    }
    for label, (actual, expected) in checks.items():
        difference = abs(actual - expected)
        print(
            f"{label:<28}: actual={actual:.9f}, expected={expected:.9f}, "
            f"difference={difference:.9f}"
        )
        if difference > TOLERANCE:
            raise RuntimeError(f"Notebook parity failed for {label}.")

    print("Saved-crop inference parity passed.")

    if args.raw_video is not None:
        if not args.raw_video.is_file():
            raise FileNotFoundError(
                f"Raw reference video not found: {args.raw_video}"
            )

        extractor = FaceExtractor(
            face_detector=bundle.face_detector,
            input_size=Config.MODEL_INPUT_SIZE,
            confidence_threshold=Config.FACE_CONFIDENCE_THRESHOLD,
            margin=Config.FACE_MARGIN,
            jpeg_quality=Config.JPEG_QUALITY,
        )
        extraction = extractor.extract_video(
            args.raw_video,
            requested_frames=Config.CANDIDATE_VIDEO_FRAMES,
            maximum_model_frames=Config.MAX_VIDEO_FRAMES,
        )

        if len(extraction.samples) < Config.MIN_USABLE_FRAMES:
            raise RuntimeError(
                "Raw reference video produced fewer than five usable crops."
            )

        raw_result = engine.score(
            [sample.crop_rgb for sample in extraction.samples]
        )
        raw_checks = {
            "raw-video dual score": (
                raw_result.dual_score,
                REFERENCE_DUAL_SCORE,
            ),
            "raw-video disabled score": (
                raw_result.frequency_disabled_score,
                REFERENCE_DISABLED_SCORE,
            ),
        }

        print(
            f"Candidate frames: {len(extraction.sampled_frame_indices)}, "
            f"detected faces: {extraction.face_candidates_detected}, "
            f"model frames: {len(extraction.samples)}"
        )
        for label, (actual, expected) in raw_checks.items():
            difference = abs(actual - expected)
            print(
                f"{label:<28}: actual={actual:.9f}, "
                f"expected={expected:.9f}, difference={difference:.9f}"
            )
            if difference > TOLERANCE:
                raise RuntimeError(
                    f"End-to-end notebook parity failed for {label}."
                )

        print("Raw-video end-to-end parity passed.")


if __name__ == "__main__":
    main()
