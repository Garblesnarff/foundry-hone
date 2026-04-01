# foundry-hone Product Requirements Document (PRD)

> **Note**: This is a generated placeholder PRD. Full PRD to be provided by product team.

## Executive Summary

**foundry-hone** is a desktop photo enhancement tool combining intelligent image upscaling with AI-powered face restoration. Users upload photos, choose a scale factor (2x or 4x), and the system automatically detects faces and restores facial detail.

**Target Users**: Photographers, content creators, archivists, social media managers, family historians  
**Differentiation**: Privacy-first (runs locally), fast (10–60 sec per image), free and open-source

## User Stories

### US-01: Upload & Upscale
> Upscale photos 2x or 4x for use in print or social media.

**Acceptance Criteria**:
- User can drag-drop or click to upload JPEG, PNG, WebP (≤ 20 MB)
- User selects scale factor (2x or 4x)
- Progress bar shows real-time status
- Processing completes in ≤ 60 seconds for 4 MP images

### US-02: Auto Face Detection & Restoration
> Automatically detect and restore faces in old photos.

**Acceptance Criteria**:
- System detects faces (≥ 90% accuracy)
- Each face automatically restored
- User sees face count in progress
- Total time ≤ 60 seconds

### US-03: Face Blend Control
> Adjust how much face restoration is applied (0–100%).

**Acceptance Criteria**:
- Slider ranges 0 to 1 with 0.1 increments
- Default value 0.8
- Slider persists as user default

### US-04: View & Compare Results
> Compare before/after side-by-side.

**Acceptance Criteria**:
- Comparison slider overlays images
- Smooth interaction
- Export button visible

### US-05: Batch Processing
> Process multiple images at once.

**Acceptance Criteria**:
- Queue 5–10 images
- Sequential processing
- Download all results as ZIP

### US-06: Tile-Based Large Image Processing
> Upscale very large images (16+ MP) without OOM.

**Acceptance Criteria**:
- Images > 4 MP processed via tiling
- Seamless blending
- Memory < 6 GB

### US-07: Model Manager
> Download and manage ML models.

**Acceptance Criteria**:
- List available models
- Download progress UI
- Delete to reclaim space
- Graceful degradation if missing

### US-08: Export for Social
> Export before/after comparisons for social media.

**Acceptance Criteria**:
- Format options: PNG, WebP, JPEG
- Side-by-side comparison export
- Metadata embedding

### US-09: Job History
> See previous jobs and re-process with same settings.

**Acceptance Criteria**:
- History lists all jobs
- Click to view result
- RE-HONE button
- Persistence across sessions

### US-10: Mobile-Friendly UI
> Use app on tablet/mobile.

**Acceptance Criteria**:
- Responsive on 320px+ width
- Touch-friendly buttons (48px min)
- Mobile file upload works

## Phase Roadmap

### Phase 1 (MVP)
- [x] Image upload
- [x] 2x & 4x upscaling
- [x] Face detection & restoration
- [x] Blend slider
- [x] Real-time SSE progress
- [x] Comparison view
- [x] Single image processing

### Phase 2 (Enhancement)
- [ ] Batch processing
- [ ] Tile-based processing
- [ ] Model manager UI
- [ ] Advanced export
- [ ] Comparison export
- [ ] Mobile optimization
- [ ] Settings persistence

### Phase 3 (Polish)
- [ ] GPU acceleration
- [ ] Color correction
- [ ] Face anonymization
- [ ] Cloud integration
- [ ] Desktop app (Tauri)

---

**Document Version**: 1.0 (Placeholder)  
**Last Updated**: 2026-03-14  
**Status**: In Review
