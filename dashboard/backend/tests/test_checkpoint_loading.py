import tempfile
import unittest
from pathlib import Path

import numpy as np
import torch

from app.models.registry import _trusted_torch_load


class CheckpointLoadingTests(unittest.TestCase):
    def test_numpy_metric_metadata_loads_with_weights_only(self):
        checkpoint = {
            "model_state": {"weight": torch.tensor([1.0, 2.0])},
            "val_auc": np.float64(0.9682),
            "epoch": np.int64(1),
        }

        with tempfile.TemporaryDirectory() as temporary_folder:
            path = Path(temporary_folder) / "checkpoint.pth"
            torch.save(checkpoint, path)
            loaded = _trusted_torch_load(path, torch.device("cpu"))

        self.assertIn("model_state", loaded)
        self.assertAlmostEqual(float(loaded["val_auc"]), 0.9682)
        self.assertEqual(int(loaded["epoch"]), 1)


if __name__ == "__main__":
    unittest.main()
