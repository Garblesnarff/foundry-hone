# foundry-hone Agent Context

## Overview
**foundry-hone** is a local photo upscaler with intelligent AI-powered face restoration. It upscales images 2x or 4x using Real-ESRGAN, automatically detects faces on the upscaled image using RetinaFace, and restores facial detail with GFPGAN.

## Core Purpose
Provide a desktop-grade photo enhancement tool combining lossless upscaling with specialized face reconstruction, designed for photographers, content creators, and archivists working with personal photo libraries.

## Technology Stack

### Backend
- **Runtime**: Python 3.11+
- **Web Framework**: FastAPI + uvicorn
- **Database**: SQLite (aiosqlite for async support)
- **File I/O**: aiofiles
- **ML Inference**: ONNX Runtime (CPU-optimized)
- **Image Processing**: Pillow, OpenCV (headless)
- **Numerics**: NumPy

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Package Manager**: npm

### Deployment Ports
- **Backend**: `3459`
- **Frontend**: `5176`

## ML Models

### Upscaling (Real-ESRGAN)
- `RealESRGAN_x2plus.onnx` (65 MB) — 2x upscale, general purpose
- `RealESRGAN_x4plus.onnx` (65 MB) — 4x upscale, general purpose
- `RealESRGAN_x4plus_anime_6B.onnx` (65 MB) — 4x upscale, anime/illustration optimized
- `realesr-general-x4v3.onnx` (65 MB) — 4x upscale, latest general version

### Face Detection (RetinaFace)
- `retinaface_resnet50.onnx` (100 MB) — Multi-scale face detection

### Face Restoration (GFPGAN)
- `GFPGANv1.4.onnx` (350 MB) — Facial detail enhancement and artifact removal

**License Notes**: Real-ESRGAN (BSD), GFPGAN (Apache 2.0), RetinaFace (MIT)

## Processing Pipeline

```
User uploads image
    ↓
Backend receives request
    ↓
[1] Upscale full image (Real-ESRGAN x2 or x4)
    ↓
[2] Detect faces on upscaled image (RetinaFace)
    ↓
[3] For each face:
    └─→ Crop face region (+ padding)
        └─→ Restore face detail (GFPGAN)
        └─→ Blend restored face back (weighted blend: 0-1 slider)
    ↓
[4] Assemble final output
    ↓
Return result + metadata (timing, face count, settings)
```

## Performance Characteristics

- **Speed**: 10–60 seconds per image depending on resolution and scale factor
  - 1 MP image, 2x: ~10–15 seconds
  - 4 MP image, 4x: ~40–60 seconds
  - Tile-based processing for images >4 MP to manage memory
- **Memory**: ~2–6 GB depending on image size and models loaded
- **Async**: All processing is async; frontend receives real-time progress via Server-Sent Events (SSE)
- **Concurrency**: Single-queue processing to prevent resource contention

## Foundry Language & Theming

Use martial/blade forging metaphors throughout the UI and logging:

| Action | Language |
|--------|----------|
| Starting process | "Honing the blade..." |
| Face detection | "Scanning for faces..." |
| Face restoration | "Restoring faces (X of Y)..." |
| Completion | "Honed to perfection." |
| Re-run same settings | "RE-HONE" |
| Settings panel | "Hone Settings" |
| Export/Save | "Forge output" |

## Architecture

```
┌─────────────────────────────────────┐
│         React Frontend              │
│     (Vite + TypeScript + Tailwind)  │
│  • Image upload zone                │
│  • Progress indicator (SSE)         │
│  • Face blend slider (0–1)          │
│  • Scale selector (2x/4x)           │
│  • Model selector & manager         │
│  • Comparison view (before/after)   │
│  • History browser & export         │
└──────────────┬──────────────────────┘
               │
        HTTP + SSE (Port 5176→3459)
               │
┌──────────────▼──────────────────────┐
│       FastAPI Backend               │
│       (Python 3.11+ + uvicorn)      │
│  • Request validation & queuing     │
│  • Image file handling              │
│  • SSE progress streaming           │
│  • SQLite history management        │
│  • Model manager (download/list)    │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼─────┐    ┌─────▼─────┐
│  ML Cores │    │  Storage  │
│  (ONNX RT)│    │ (SQLite)  │
│           │    │           │
│ • Upscaler│    │ • Job log │
│ • Detector│    │ • Exports │
│ • Restorer│    │ • Settings│
└───────────┘    └───────────┘
```

## File Structure

### Backend
```
backend/
├── README.md
├── requirements.txt
├── .env.example
├── main.py
├── models/
│   ├── upscaler/
│   ├── detector/
│   └── restorer/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py          # health, hone, hone/batch, models, settings
│   │   └── schemas.py         # Request/Response pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── hone_service.py    # Main upscale + restore pipeline
│   │   ├── model_manager.py   # Download, load, cache models
│   │   └── database.py        # SQLite async CRUD
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── upscaler.py        # Real-ESRGAN ONNX wrapper
│   │   ├── detector.py        # RetinaFace ONNX wrapper
│   │   └── restorer.py        # GFPGAN ONNX wrapper
│   └── utils/
│       ├── __init__.py
│       ├── image.py           # Tile processing, blending
│       └── logging.py         # Forge language logging
└── tests/
    └── test_api.py
```

### Frontend
```
frontend/
├── README.md
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── UploadZone.tsx
│   │   ├── ProgressBar.tsx        # Real-time SSE progress
│   │   ├── FaceBlendSlider.tsx    # 0–1 face restoration blend
│   │   ├── ScaleSelector.tsx      # 2x / 4x radio
│   │   ├── ModelManager.tsx       # Download optional models
│   │   ├── ComparisonView.tsx     # Before/after slider
│   │   ├── HistoryBrowser.tsx     # Job history & export
│   │   └── Button.tsx, Input.tsx, ...
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── Settings.tsx           # Face blend, model config
│   ├── hooks/
│   │   ├── useHone.ts            # Orchestrate hone + SSE
│   │   └── useModels.ts          # Model list & download
│   ├── services/
│   │   └── api.ts                # Axios wrapper for backend
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── styles/
│       └── globals.css           # Tailwind + custom theme
└── public/
    └── vite.svg
```

### Docs
```
docs/
├── DESIGN_SYSTEM.md       # Points to shared Foundry design system
├── API_SPEC.md            # Full endpoint documentation
└── ARCHITECTURE.md        # Technical decisions & diagrams
```

## API Summary

### Health & Status
- `GET /health` → `{ status: "ok", version: "..." }`

### Hone (Single Image)
- `POST /hone` → Synchronous full-res return (for small images)
- `POST /hone/batch` → Returns job ID, streams progress via SSE at `GET /hone/progress/{job_id}`

### Models
- `GET /models/list` → List available & installed models
- `POST /models/download/{model_id}` → Download & cache model

### Settings
- `GET /settings` → Current face blend weight, scale defaults
- `PATCH /settings` → Update face blend (0–1), default scale (2 or 4)

### History & Export
- `GET /history` → List all processed jobs
- `GET /history/{job_id}` → Fetch result metadata & image blob
- `POST /history/{job_id}/export` → Export as PNG/WebP with metadata

## Key Implementation Notes

### Tile-Based Processing
- Images > 4 MP are processed in overlapping tiles to manage VRAM and system memory
- Tiles: 512×512 with 32-pixel overlap for seamless blending
- Upscale each tile independently, reconstruct full image

### Face Blend Weight Control
- Slider: 0 (no restoration) → 1 (full restoration)
- Implemented as weighted average: `output = (1 - blend_weight) * upscaled + blend_weight * restored`
- Allows users to preserve original face texture while adding detail selectively

### Model Manager
- On-demand download: models are ~65–350 MB each
- Optional lazy loading: not all models loaded into memory simultaneously
- Cache in `HONE_MODELS_DIR` (default `./models`)
- Prevents re-downloading; validate checksums on load

### Progress & SSE
- Backend streams progress events to frontend in real-time:
  ```json
  {"event": "upscaling", "progress": 33, "message": "Honing the blade..."}
  {"event": "detecting", "progress": 66, "message": "Scanning for faces (3 found)..."}
  {"event": "restoring", "progress": 80, "message": "Restoring faces (2 of 3)..."}
  {"event": "complete", "progress": 100, "message": "Honed to perfection."}
  ```

## Critical Considerations

1. **GPU-agnostic**: ONNX Runtime runs on CPU by default. GPU support is optional (cuDNN/TensorRT).
2. **Single-queue processing**: Prevents resource contention; one image at a time.
3. **Async throughout**: All I/O and ML inference calls are async-compatible.
4. **Model validation**: Ensure models match expected input/output shapes before inference.
5. **Error handling**: Graceful degradation if optional models (anime) are missing.
6. **Security**: Validate file uploads; limit request size; sanitize file paths.
7. **Monitoring**: Log all Forge language messages; track processing times per stage.
8. **User preferences**: Store face blend weight and scale preferences in `settings` table.

## Forge Language Reference

The app's personality uses blade-forging metaphors:

- **Warming up**: "Preparing the forge..."
- **Upscaling**: "Honing the blade..." (10–30 seconds)
- **Face detection**: "Scanning for faces..." (3–5 seconds per image)
- **Restoring each face**: "Restoring faces (1 of 4)..." → "Restoring faces (2 of 4)..."
- **Final assembly**: "Finishing the edges..."
- **Complete**: "Honed to perfection."
- **Error**: "The forge has cooled. [Details]"
- **Re-run**: Button labeled "RE-HONE" with same settings

## Development Workflow

1. **Backend first**: Set up FastAPI, ONNX model loading, basic pipeline
2. **ML integration**: Integrate upscaler → detector → restorer in sequence
3. **SSE + progress**: Implement real-time progress streaming
4. **Frontend**: React upload, real-time progress, result viewer
5. **History & export**: SQLite job tracking, PNG/WebP export with metadata
6. **Polish**: Model manager UI, face blend slider, comparison view

## Testing & Validation

- Unit tests for each ML module (upscaler, detector, restorer)
- Integration tests for full pipeline on sample images
- Load tests for concurrent requests (expect graceful queuing)
- UI tests for responsive design (mobile-first)

---

**Last Updated**: 2026-03-14  
**Lead**: Claude Agent (foundry-hone)  
**Repository**: Local development  
**Slack**: `#foundry-hone` (when established)
