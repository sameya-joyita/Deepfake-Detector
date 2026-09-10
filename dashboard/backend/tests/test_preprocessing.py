import unittest

from app.services.preprocessing import (
    ExtractionResult,
    uniform_frame_indices,
    uniform_subsample,
)


class SamplingTests(unittest.TestCase):
    def test_short_video_uses_every_frame(self):
        self.assertEqual(uniform_frame_indices(3, 20), [0, 1, 2])

    def test_twenty_indices_include_video_endpoints(self):
        indices = uniform_frame_indices(100, 20)
        self.assertEqual(len(indices), 20)
        self.assertEqual(indices[0], 0)
        self.assertEqual(indices[-1], 99)

    def test_invalid_request_is_rejected(self):
        with self.assertRaises(ValueError):
            uniform_frame_indices(100, 0)

    def test_thirty_candidates_are_capped_like_the_notebook(self):
        candidates = list(range(30))
        selected = uniform_subsample(candidates, 20)

        self.assertEqual(len(selected), 20)
        self.assertEqual(selected[0], 0)
        self.assertEqual(selected[-1], 29)
        self.assertEqual(
            selected,
            [0, 1, 3, 4, 6, 7, 9, 10, 12, 13,
             15, 16, 18, 19, 21, 22, 24, 25, 27, 29],
        )

    def test_capping_does_not_turn_detected_faces_into_failures(self):
        extraction = ExtractionResult(
            total_video_frames=100,
            requested_frames=30,
            maximum_model_frames=20,
            sampled_frame_indices=list(range(30)),
            frames_read=30,
            face_candidates_detected=25,
            samples=list(range(20)),
        )

        self.assertEqual(extraction.face_detection_failures, 5)
        self.assertEqual(extraction.model_frames_discarded, 5)


if __name__ == "__main__":
    unittest.main()
