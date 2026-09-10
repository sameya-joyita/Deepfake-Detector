# Validation

The rebuilt backend was checked against the uploaded training notebook
`deepfake-detector-project (37)(1).ipynb`.

Verified source-level parity:
- 30 FF++ candidate frames
- OpenCV ResNet-SSD detector at 0.90 confidence
- highest-confidence face only
- 15% crop margin
- 224×224 crop
- JPEG quality 95 round trip
- failed face detections discarded
- uniform cap of 20 successful crops with `np.linspace`
- ImageNet-normalised spatial tensor
- raw [0,1] frequency tensor
- sigmoid per frame followed by mean frame probability
- local detector filename `face_detector.caffemodel`

Validation completed in this environment:
- all Python files compile
- preprocessing and input-quality unit tests: 6/6 passed
- detector/checkpoint files are present in the package

Full model/API tests require the project's Flask, timm, PyTorch and torchvision
runtime dependencies. Run locally after installing `requirements.txt`:

```bash
python -m unittest discover -s tests -v
python scripts/verify_artifacts.py
python run.py
```
