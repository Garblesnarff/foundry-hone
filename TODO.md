# foundry-hone Development Roadmap

## Phase 0: Core Infrastructure (Current Sprint)

### Backend Foundation
- [ ] FastAPI application setup with uvicorn
- [ ] Environment configuration (.env parsing)
- [ ] SQLite async wrapper (aiosqlite)
- [ ] Pydantic schemas
- [ ] Error handling with Forge language messages
- [ ] CORS configuration
- [ ] Logging setup

### ML Pipeline Infrastructure
- [ ] ONNX Runtime wrapper class
- [ ] Model manager: download, validate, cache
- [ ] Model checksum validation (SHA256)
- [ ] Lazy loading
- [ ] Test fixtures

### Frontend Foundation
- [ ] Vite project setup
- [ ] Root App.tsx layout
- [ ] Tailwind configuration
- [ ] TypeScript strict mode
- [ ] API client service
- [ ] Basic routing

---

## Phase 1: MVP (Single Image Upscale + Face Restore)

### ML Pipeline Implementation

#### Real-ESRGAN Upscaler
- [ ] Implement upscaler.py ONNX wrapper
- [ ] Unit tests with sample images
- [ ] Benchmark: 1 MP image < 15 sec

#### RetinaFace Face Detector
- [ ] Implement detector.py ONNX wrapper
- [ ] Unit tests with known face counts
- [ ] Benchmark: 4 MP image < 5 sec

#### GFPGAN Face Restorer
- [ ] Implement restorer.py ONNX wrapper
- [ ] Unit tests with blend weight validation
- [ ] Benchmark: single face < 2 sec

### API Endpoints
- [ ] GET /health
- [ ] POST /hone (synchronous)
- [ ] POST /hone/batch (asynchronous)
- [ ] GET /hone/progress/{job_id} (SSE)
- [ ] GET /models/list
- [ ] POST /models/download/{model_id}
- [ ] GET /settings
- [ ] PATCH /settings
- [ ] GET /history
- [ ] GET /history/{job_id}
- [ ] DELETE /history/{job_id}

### Frontend (MVP)
- [ ] UploadZone component
- [ ] ScaleSelector (2x/4x)
- [ ] FaceBlendSlider (0–1)
- [ ] ProgressBar (SSE)
- [ ] ResultView with metadata
- [ ] ComparisonView (before/after)
- [ ] Export button

### Testing
- [ ] Backend unit tests
- [ ] Frontend component tests
- [ ] Integration tests
- [ ] Performance baselines

---

## Phase 2: Enhancement (Batch, Tile, Model Manager)

### Batch Processing
- [ ] Batch queue implementation
- [ ] QueueList component
- [ ] Per-image progress
- [ ] Batch export (ZIP)

### Tile-Based Processing
- [ ] Image tiling utility
- [ ] Tile-based upscaling
- [ ] Seamless boundary blending
- [ ] Large image (16 MP) handling

### Model Manager UI
- [ ] Settings → Models tab
- [ ] Download progress UI
- [ ] Storage usage display
- [ ] Model deletion

### Advanced Export
- [ ] Format options
- [ ] Metadata embedding
- [ ] Comparison export
- [ ] Optional watermark

### History Enhancements
- [ ] HistoryBrowser component
- [ ] Job thumbnails
- [ ] Filter/sort options
- [ ] Persistence & cleanup

### Mobile Optimization
- [ ] Responsive CSS
- [ ] Touch-friendly UI
- [ ] Mobile file upload

---

## Phase 3: Polish & Performance

### GPU Acceleration
- [ ] ONNX Runtime GPU support
- [ ] Provider detection & fallback
- [ ] Benchmarks

### Advanced Features
- [ ] Color correction post-processing
- [ ] Face anonymization mode
- [ ] Desktop app packaging (Tauri)

---

## Known Blockers & Risks

| Item | Status | Notes |
|------|--------|-------|
| ONNX model availability | Open | Verify format compatibility |
| Performance baselines | Open | Benchmark on target hardware |
| Mobile file upload | Open | Test on iOS/Android |
| Memory limits | Open | Define hard limits for tiling |

---

**Last Updated**: 2026-03-14  
**Owner**: Development Team  
**Status**: In Planning
