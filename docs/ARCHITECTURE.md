# foundry-hone Architecture

## System Design

```
┌─────────────────────────────────────┐
│      Frontend (React + Vite)        │
│    • Upload UI                      │
│    • Real-time progress             │
│    • Result comparison              │
│    • Settings management            │
└──────────────┬──────────────────────┘
               │ HTTP + SSE
               ↓
┌──────────────────────────────────────┐
│    Backend (FastAPI + Uvicorn)      │
│  • Request routing & validation     │
│  • Job queue management             │
│  • Model orchestration              │
│  • SSE progress streaming           │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    ↓                     ↓
┌─────────────┐    ┌──────────────┐
│  ML Pipeline│    │   Storage    │
│  (ONNX RT)  │    │  (SQLite)    │
│             │    │              │
│ • Upscaler  │    │ • Jobs       │
│ • Detector  │    │ • Settings   │
│ • Restorer  │    │ • Exports    │
└─────────────┘    └──────────────┘
```

## Backend Architecture

### Request Lifecycle

```
1. Client sends POST /hone or POST /hone/batch
2. FastAPI receives and validates request
3. Image uploaded to temp directory
4. Request queued in single-threaded queue
5. Processing begins (async):
   a) Load upscaler model
   b) Upscale image
   c) Load detector model
   d) Detect faces
   e) For each face:
      - Load restorer model
      - Restore face detail
      - Blend with upscaled image
   f) Save result
6. SSE progress events sent to client
7. Result available at /history/{job_id}
```

### Component Responsibilities

#### API Layer (`app/api/`)
- Route handlers
- Request/response validation (Pydantic)
- CORS, error handling
- SSE streaming

#### Services Layer (`app/services/`)

**hone_service.py** — Orchestration
- Upscaler → Detector → Restorer pipeline
- Progress tracking
- Error handling

**model_manager.py** — Model lifecycle
- Download, validate, cache
- Lazy loading

**database.py** — Data persistence
- SQLite async wrapper (aiosqlite)
- Job history CRUD
- Settings storage

#### ML Layer (`app/ml/`)

**upscaler.py** — Real-ESRGAN wrapper
- Load ONNX model
- Preprocessing, inference, postprocessing

**detector.py** — RetinaFace wrapper
- Multi-scale face detection
- NMS, confidence filtering

**restorer.py** — GFPGAN wrapper
- Face restoration
- Blend weighting

#### Utils Layer (`app/utils/`)

**image.py** — Image processing
- Tile extraction/reconstruction
- Face box extraction

**logging.py** — Forge language
- Structured logging
- Progress events

## Frontend Architecture

### Component Hierarchy

```
App.tsx
├── Home Page
│   ├── UploadZone
│   ├── ScaleSelector
│   ├── FaceBlendSlider
│   ├── ProgressBar (conditional)
│   └── ResultView (conditional)
└── Settings Page
    └── ModelManager (Phase 2)
```

### API Client

**services/api.ts** — Axios wrapper
- Centralized HTTP requests
- Base URL configuration
- Error handling
- SSE parsing

### Hooks

**useHone.ts** — Orchestration
- Upload file
- Post to /hone or /hone/batch
- Subscribe to /hone/progress/{job_id} (SSE)

**useModels.ts** — Model management
- Fetch /models/list
- Download models

## Data Flow

### Single Image Processing

```
User Interface
    ↓
UploadZone Component
    ↓ [POST /hone]
FastAPI Router
    ↓
Hone Service
    ├─ Real-ESRGAN Upscaler
    ├─ RetinaFace Detector
    └─ GFPGAN Restorer (per face)
    ↓ [Save to temp]
FastAPI Response
    ↓ [Base64 image + metadata]
ResultView Component
```

### Batch Image Processing

```
User Interface
    ↓ [Multiple files]
UploadZone Component
    ↓ [POST /hone/batch]
Job Queue (FIFO)
    ├─ Job 1: processing
    ├─ Job 2: queued
    └─ Job 3: queued
    ↓
SSE Stream
    └─ Progress events
ProgressBar Component
    ↓ [On complete, fetch /history/{job_id}]
ResultView Component
```

## Database Schema (SQLite)

### jobs Table
```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  scale INTEGER NOT NULL,
  blend_weight REAL NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  processing_time_seconds REAL,
  faces_detected INTEGER,
  original_image BLOB,
  upscaled_image BLOB,
  metadata JSON
);
```

### settings Table
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

## Tile-Based Upscaling

```
Original Image (8 MP)
    ↓
Tile Extraction (512x512 + 32px overlap)
    ├─ Tile 1, Tile 2
    ├─ Tile 3, Tile 4
    ↓ [Upscale each independently]
    ├─ Tile 1 upscaled
    ├─ Tile 2 upscaled
    ├─ Tile 3 upscaled
    └─ Tile 4 upscaled
    ↓ [Blend overlaps]
Reconstructed Image (16 MP, seamless)
```

Blending: `output = α * tile1 + (1-α) * tile2`

## Performance Considerations

### Memory Management
- Load models on-demand, unload after
- Process in tiles for large images
- Explicit cleanup of arrays/tensors
- Peak: ~2-6 GB

### Concurrency
- Single-queue backend (no parallel processing)
- Async I/O (non-blocking uploads/downloads)
- SSE streaming (persistent HTTP connection)

### Latency
- Upscaling: 10-30 seconds
- Face detection: 3-5 seconds
- Face restoration: 1-2 seconds per face
- Total: 10-60 seconds

### Caching
- Models: on-disk in `HONE_MODELS_DIR`
- Thumbnails: SQLite BLOB
- Static frontend: browser cache

## Security Considerations

### Input Validation
- File format check (JPEG, PNG, WebP only)
- File size limit (max 20 MB)
- Path sanitization
- Image dimensions check

### CORS
- Allow: `localhost:5176` (frontend)
- Deny: other origins by default

### Error Messages
- Use Forge language for users
- Log full errors internally
- No path/model leaks

---

**Last Updated**: 2026-03-14  
**Author**: Architecture Team  
**Status**: Final
