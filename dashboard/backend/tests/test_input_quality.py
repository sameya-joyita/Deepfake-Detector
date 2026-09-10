import unittest
from types import SimpleNamespace

import numpy as np

from app.services.input_quality import assess_input_adequacy


class InputQualityTests(unittest.TestCase):
    def test_candidate_and_model_frame_counts_are_kept_separate(self):
        crop = np.full((224, 224, 3), 128, dtype=np.uint8)
        samples = [
            SimpleNamespace(crop_rgb=crop, face_area_fraction=0.25)
            for _ in range(20)
        ]
        extraction = SimpleNamespace(
            requested_frames=30,
            maximum_model_frames=20,
            total_video_frames=300,
            sampled_frame_indices=list(range(30)),
            frames_read=30,
            face_candidates_detected=25,
            model_frames_discarded=5,
            face_detection_failures=5,
            samples=samples,
        )

        result = assess_input_adequacy(extraction, minimum_usable_frames=5)

        self.assertEqual(result["candidate_frames_requested"], 30)
        self.assertEqual(result["face_candidates_detected"], 25)
        self.assertEqual(result["maximum_model_frames"], 20)
        self.assertEqual(result["usable_frames"], 20)
        self.assertEqual(result["usable_fraction"], 1.0)


if __name__ == "__main__":
    unittest.main()
