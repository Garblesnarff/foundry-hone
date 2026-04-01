# foundry-hone API Specification

## Overview

Full REST API specification for foundry-hone backend at `http://localhost:3459`.

## Health Check

### GET /health

```bash
GET /health
```

Response (200 OK):
```json
{
  "status": "ok",
  "version": "0.1.0-alpha",
  "forge_message": "The forge is ready."
}
```

## Image Processing

### POST /hone

Synchronous upscaling and face restoration (≤ 4 MP).

Request:
```
POST /hone
Content-Type: multipart/form-data

image: <file>           # JPEG, PNG, WebP (max 20 MB)
scale: 2 or 4           # Upscaling factor
blend_weight: 0.0-1.0   # Face restoration intensity (default: 0.8)
```

Response (200 OK):
```json
{
  "success": true,
  "upscaled_image": "<base64>",
  "metadata": {
    "original_size": [1920, 1080],
    "upscaled_size": [3840, 2160],
    "scale": 4,
    "faces_detected": 3,
    "processing_time_seconds": 45.2,
    "blend_weight": 0.8
  }
}
```

### POST /hone/batch

Asynchronous processing. Use `/hone/progress/{job_id}` to monitor.

Response (202 Accepted):
```json
{
  "job_id": "job_abc123def456",
  "status": "queued"
}
```

### GET /hone/progress/{job_id}

Server-Sent Events (SSE) stream.

Response (200 OK, SSE):
```
event: upscaling
data: {"progress": 25, "message": "Honing the blade..."}

event: detecting
data: {"progress": 50, "message": "Scanning for faces... 3 found"}

event: restoring
data: {"progress": 75, "message": "Restoring faces (2 of 3)..."}

event: complete
data: {"progress": 100, "message": "Honed to perfection."}
```

## Models

### GET /models/list

List available and installed models.

Response (200 OK):
```json
{
  "models": [
    {
      "id": "x2",
      "name": "RealESRGAN 2x",
      "size": "65 MB",
      "license": "BSD",
      "installed": true
    }
  ],
  "total_storage_mb": 1280,
  "available_storage_mb": 2048
}
```

### POST /models/download/{model_id}

Download and cache model.

Response (202 Accepted, SSE stream):
```
event: start
data: {"model_id": "x4", "size_mb": 65}

event: progress
data: {"downloaded_mb": 32, "total_mb": 65, "percent": 50}

event: complete
data: {"model_id": "x4", "success": true}
```

## Settings

### GET /settings

Get current user settings.

Response (200 OK):
```json
{
  "face_blend": 0.8,
  "default_scale": 2
}
```

### PATCH /settings

Update settings.

Request:
```json
{
  "face_blend": 0.9,
  "default_scale": 4
}
```

Response (200 OK):
```json
{
  "success": true,
  "face_blend": 0.9,
  "default_scale": 4
}
```

## History

### GET /history

List all jobs.

Query params:
- `limit`: Max results (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status

Response (200 OK):
```json
{
  "jobs": [
    {
      "job_id": "job_xyz789",
      "filename": "photo.jpg",
      "scale": 4,
      "blend_weight": 0.8,
      "status": "completed",
      "created_at": "2026-03-14T10:30:00Z",
      "completed_at": "2026-03-14T10:31:15Z",
      "processing_time_seconds": 75,
      "faces_detected": 2
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### GET /history/{job_id}

Fetch specific job result.

Response (200 OK):
```json
{
  "job_id": "job_xyz789",
  "filename": "photo.jpg",
  "scale": 4,
  "status": "completed",
  "upscaled_image": "<base64>",
  "metadata": {
    "original_size": [1920, 1080],
    "upscaled_size": [3840, 2160]
  }
}
```

### DELETE /history/{job_id}

Delete job from history.

Response (200 OK):
```json
{
  "success": true,
  "job_id": "job_xyz789"
}
```

### POST /history/{job_id}/export

Export result in specified format.

Request:
```json
{
  "format": "png",
  "include_comparison": false,
  "metadata": true
}
```

Response (200 OK):
```
Content-Type: image/png
Content-Disposition: attachment; filename="photo_honed_4x.png"

<binary image data>
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 202 | Accepted (async job queued) |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |

---

**Last Updated**: 2026-03-14  
**Status**: Specification Complete
