# foundry-hone: Photo Upscaler + Face Restoration

**Hone your photos to perfection.** A local, privacy-first AI photo enhancement tool that upscales images 2x or 4x and intelligently restores facial detail using GFPGAN.

## Features

- **Smart Upscaling**: Real-ESRGAN upscaler with 2x and 4x options (plus anime-optimized variants)
- **Auto Face Detection**: RetinaFace multi-scale face detection on upscaled images
- **AI Face Restoration**: GFPGAN for realistic facial detail enhancement
- **Face Blend Control**: Adjustable slider (0–1) to fine-tune restoration intensity
- **Batch Processing**: Process multiple images with real-time SSE progress
- **Tile-Based Processing**: Handles large images via intelligent tiling
- **Comparison View**: Before/after slider to inspect results
- **Job History**: Persistent storage of all processing jobs
- **Model Manager**: Download and manage ML models on demand

## Quick Start

### Prerequisites
- Python 3.11+
- Node 18+ (LTS)
- 2+ GB free disk space (for models)
- 6 GB RAM recommended

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Backend runs at `http://localhost:3459`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5176`

## Usage

1. Open http://localhost:5176 in your browser
2. Drag & drop or click to upload an image
3. Select upscaling factor (2x or 4x)
4. (Optional) Adjust face blend weight slider
5. Click "Hone It" to start processing
6. Watch real-time progress and view result

## Architecture

```
Frontend (React + TypeScript)
    ↓ (HTTP + SSE)
Backend (FastAPI + Python)
    ↓
ML Pipeline (ONNX Runtime)
    ├─ Upscaler (Real-ESRGAN)
    ├─ Detector (RetinaFace)
    └─ Restorer (GFPGAN)
    ↓
SQLite (Job History & Settings)
```

See `CLAUDE.md` for detailed architecture diagram and tech spec.

## Performance

| Task | Speed |
|------|-------|
| 1 MP image, 2x upscale | ~10–15 seconds |
| 4 MP image, 4x upscale | ~40–60 seconds |
| Face detection on 8 MP image | ~3–5 seconds |

## Support & Contributing

- **Issues**: Create detailed reports with image samples
- **Pull Requests**: See `AGENTS.md` for contribution guidelines
- **Questions**: Check `docs/` and `CLAUDE.md` first

## Legal

- Real-ESRGAN: BSD License
- GFPGAN: Apache 2.0 License
- RetinaFace: MIT License
- foundry-hone: MIT License

---

**Latest Release**: 0.1.0-alpha  
**Last Updated**: 2026-03-14  
**Status**: Active Development
