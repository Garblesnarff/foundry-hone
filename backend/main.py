"""
foundry-hone Backend
Photo Upscaler + Face Restoration using Pillow

Main entry point: FastAPI application with uvicorn server.
"""

import asyncio
import os
import sys
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from PIL import Image, ImageEnhance, ImageFilter
import uvicorn

# Add app module to path
sys.path.insert(0, str(Path(__file__).parent))

# Application version
VERSION = "0.1.0-alpha"

# Environment configuration
HONE_PORT = int(os.getenv("HONE_PORT", 3459))
HONE_DEBUG = int(os.getenv("HONE_DEBUG", 0))
HONE_DEFAULT_SCALE = int(os.getenv("HONE_DEFAULT_SCALE", 2))
HONE_FACE_BLEND = float(os.getenv("HONE_FACE_BLEND", 0.8))

# Output directory for processed images
OUTPUT_DIR = Path(tempfile.mkdtemp(prefix="foundry-hone-"))

# In-memory stores
jobs: dict = {}
settings: dict = {
    "face_blend": HONE_FACE_BLEND,
    "default_scale": HONE_DEFAULT_SCALE,
    "output_format": "png",
    "sharpen_strength": 2.0,
}

# Available processing models (Pillow-based filters)
MODELS = [
    {
        "id": "pillow-lanczos-2x",
        "name": "Lanczos Upscale 2x",
        "description": "High-quality 2x upscale with LANCZOS resampling + sharpening",
        "scale": 2,
        "installed": True,
    },
    {
        "id": "pillow-lanczos-4x",
        "name": "Lanczos Upscale 4x",
        "description": "High-quality 4x upscale with LANCZOS resampling + sharpening",
        "scale": 4,
        "installed": True,
    },
    {
        "id": "pillow-enhance",
        "name": "Detail Enhance",
        "description": "Contrast + sharpness + detail enhancement pass",
        "scale": 1,
        "installed": True,
    },
    {
        "id": "pillow-face-restore",
        "name": "Face Restore (Pillow)",
        "description": "Simulated face restoration via aggressive sharpening and smoothing",
        "scale": 1,
        "installed": True,
    },
]

# Create app
app = FastAPI(
    title="foundry-hone",
    description="Photo Upscaler + Face Restoration",
    version=VERSION,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5176", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve processed images as static files
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")


# ============================================================================
# Image Processing
# ============================================================================

def process_image(
    img: Image.Image,
    scale: int = 2,
    face_blend: float = 0.8,
) -> Image.Image:
    """
    Upscale and enhance an image using Pillow.

    Steps:
      1. Upscale with LANCZOS resampling
      2. Apply sharpening based on sharpen_strength setting
      3. Apply face-restoration-style enhancement (detail + contrast + smoothing blend)
    """
    # Ensure RGB
    if img.mode != "RGB":
        img = img.convert("RGB")

    # 1. Upscale
    new_size = (img.width * scale, img.height * scale)
    img = img.resize(new_size, Image.LANCZOS)

    # 2. Sharpening pass
    sharpen_strength = settings.get("sharpen_strength", 2.0)
    sharpener = ImageEnhance.Sharpness(img)
    img = sharpener.enhance(sharpen_strength)

    # 3. Face restoration simulation — blend enhanced detail back in
    if face_blend > 0.0:
        # Create a detail-enhanced version
        detail = img.filter(ImageFilter.DETAIL)

        # Boost contrast slightly on the detail layer
        contrast = ImageEnhance.Contrast(detail)
        detail = contrast.enhance(1.15)

        # Additional sharpness on face layer
        face_sharp = ImageEnhance.Sharpness(detail)
        detail = face_sharp.enhance(1.0 + face_blend)

        # Slight smoothing to reduce artifacts, then blend
        smooth = detail.filter(ImageFilter.SMOOTH_MORE)

        # Blend: original enhanced + face-restored layer
        img = Image.blend(img, smooth, alpha=face_blend * 0.4)

        # Final mild sharpen to compensate for smoothing
        final_sharp = ImageEnhance.Sharpness(img)
        img = final_sharp.enhance(1.0 + face_blend * 0.5)

    return img


def save_result(img: Image.Image, job_id: str) -> str:
    """Save processed image to output directory. Returns the relative URL path."""
    fmt = settings.get("output_format", "png")
    filename = f"{job_id}.{fmt}"
    filepath = OUTPUT_DIR / filename
    img.save(str(filepath), quality=95)
    return f"/output/{filename}"


async def read_upload(file: UploadFile) -> Image.Image:
    """Read an UploadFile into a PIL Image."""
    contents = await file.read()
    from io import BytesIO
    return Image.open(BytesIO(contents))


# ============================================================================
# Routes
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": VERSION,
        "output_dir": str(OUTPUT_DIR),
        "jobs_count": len(jobs),
        "forge_message": "The forge is ready.",
    }


@app.post("/hone")
async def hone_single(
    file: UploadFile = File(...),
    scale: int = Form(default=2),
    face_blend: float = Form(default=0.8),
):
    """Synchronous upscale + restore for a single image."""
    if scale not in (1, 2, 4):
        raise HTTPException(status_code=400, detail="scale must be 1, 2, or 4")
    if not (0.0 <= face_blend <= 1.0):
        raise HTTPException(status_code=400, detail="face_blend must be between 0.0 and 1.0")

    job_id = str(uuid.uuid4())
    started = time.time()

    try:
        img = await read_upload(file)
        original_size = f"{img.width}x{img.height}"

        result = process_image(img, scale=scale, face_blend=face_blend)
        output_url = save_result(result, job_id)
        elapsed = round(time.time() - started, 3)

        job_record = {
            "job_id": job_id,
            "status": "complete",
            "filename": file.filename,
            "original_size": original_size,
            "output_size": f"{result.width}x{result.height}",
            "scale": scale,
            "face_blend": face_blend,
            "output_url": output_url,
            "elapsed_seconds": elapsed,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        jobs[job_id] = job_record

        return job_record

    except Exception as exc:
        jobs[job_id] = {
            "job_id": job_id,
            "status": "error",
            "error": str(exc),
            "filename": file.filename,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}")


@app.post("/hone/batch")
async def hone_batch(
    files: list[UploadFile] = File(...),
    scale: int = Form(default=2),
    face_blend: float = Form(default=0.8),
):
    """
    Accept multiple files for batch processing.
    Returns a job_id immediately; processing runs in background.
    Poll /hone/progress/{job_id} for SSE updates.
    """
    if scale not in (1, 2, 4):
        raise HTTPException(status_code=400, detail="scale must be 1, 2, or 4")
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    job_id = str(uuid.uuid4())

    # Pre-read all file data before the background task starts (UploadFile is request-scoped)
    file_data = []
    for f in files:
        from io import BytesIO
        raw = await f.read()
        file_data.append({"filename": f.filename, "data": raw})

    job_record = {
        "job_id": job_id,
        "status": "pending",
        "total": len(files),
        "completed": 0,
        "results": [],
        "scale": scale,
        "face_blend": face_blend,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    jobs[job_id] = job_record

    async def _run_batch():
        from io import BytesIO
        job = jobs[job_id]
        job["status"] = "processing"

        for idx, item in enumerate(file_data):
            try:
                img = Image.open(BytesIO(item["data"]))
                original_size = f"{img.width}x{img.height}"
                result = process_image(img, scale=scale, face_blend=face_blend)
                sub_id = f"{job_id}_{idx}"
                output_url = save_result(result, sub_id)

                job["results"].append({
                    "index": idx,
                    "filename": item["filename"],
                    "original_size": original_size,
                    "output_size": f"{result.width}x{result.height}",
                    "output_url": output_url,
                    "status": "complete",
                })
            except Exception as exc:
                job["results"].append({
                    "index": idx,
                    "filename": item["filename"],
                    "status": "error",
                    "error": str(exc),
                })

            job["completed"] = idx + 1

        job["status"] = "complete"

    asyncio.create_task(_run_batch())

    return {"job_id": job_id, "total": len(files), "status": "pending"}


@app.get("/hone/progress/{job_id}")
async def hone_progress(job_id: str):
    """Server-Sent Events stream for batch job progress."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_stream():
        import json
        last_completed = -1
        while True:
            job = jobs.get(job_id)
            if not job:
                yield f"data: {json.dumps({'error': 'Job disappeared'})}\n\n"
                return

            current = job.get("completed", 0)
            status = job.get("status", "unknown")

            if current != last_completed or status in ("complete", "error"):
                payload = {
                    "job_id": job_id,
                    "status": status,
                    "completed": current,
                    "total": job.get("total", 1),
                    "results": job.get("results", []),
                }
                yield f"data: {json.dumps(payload)}\n\n"
                last_completed = current

            if status in ("complete", "error"):
                return

            await asyncio.sleep(0.3)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/models/list")
async def models_list():
    """List available processing models (Pillow-based filters)."""
    return {"models": MODELS}


@app.get("/settings")
async def get_settings():
    """Get current settings."""
    return settings


@app.patch("/settings")
async def update_settings(
    face_blend: Optional[float] = None,
    default_scale: Optional[int] = None,
    output_format: Optional[str] = None,
    sharpen_strength: Optional[float] = None,
):
    """Update settings in memory."""
    if face_blend is not None:
        if not (0.0 <= face_blend <= 1.0):
            raise HTTPException(status_code=400, detail="face_blend must be 0.0-1.0")
        settings["face_blend"] = face_blend

    if default_scale is not None:
        if default_scale not in (1, 2, 4):
            raise HTTPException(status_code=400, detail="default_scale must be 1, 2, or 4")
        settings["default_scale"] = default_scale

    if output_format is not None:
        if output_format not in ("png", "jpeg", "webp"):
            raise HTTPException(status_code=400, detail="output_format must be png, jpeg, or webp")
        settings["output_format"] = output_format

    if sharpen_strength is not None:
        if not (0.0 <= sharpen_strength <= 10.0):
            raise HTTPException(status_code=400, detail="sharpen_strength must be 0.0-10.0")
        settings["sharpen_strength"] = sharpen_strength

    return settings


@app.get("/history")
async def history_list():
    """List all processing jobs, newest first."""
    sorted_jobs = sorted(
        jobs.values(),
        key=lambda j: j.get("created_at", ""),
        reverse=True,
    )
    return {"jobs": sorted_jobs, "total": len(sorted_jobs)}


@app.get("/history/{job_id}")
async def history_get(job_id: str):
    """Fetch a single job result by ID."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@app.delete("/history/{job_id}")
async def history_delete(job_id: str):
    """Delete a job from history and remove its output file."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs.pop(job_id)

    # Clean up output files
    output_url = job.get("output_url", "")
    if output_url:
        filepath = OUTPUT_DIR / Path(output_url).name
        if filepath.exists():
            filepath.unlink()

    # For batch jobs, clean up all sub-results
    for result in job.get("results", []):
        sub_url = result.get("output_url", "")
        if sub_url:
            filepath = OUTPUT_DIR / Path(sub_url).name
            if filepath.exists():
                filepath.unlink()

    return {"success": True, "deleted": job_id}


# ============================================================================
# Serve frontend
# ============================================================================

_frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_frontend_dist / "assets")), name="frontend-assets")

    @app.get("/{path:path}")
    async def _spa_fallback(path: str):
        index = _frontend_dist / "index.html"
        return HTMLResponse(index.read_text())


# ============================================================================
# Server Start
# ============================================================================

if __name__ == "__main__":
    print(f"foundry-hone Backend v{VERSION}")
    print(f"Port: {HONE_PORT}")
    print(f"Output Dir: {OUTPUT_DIR}")
    print(f"Default Scale: {HONE_DEFAULT_SCALE}x")
    print(f"Face Blend: {HONE_FACE_BLEND}")
    print(f"Debug Mode: {'ON' if HONE_DEBUG else 'OFF'}")
    print()
    print("Honing the forge... Starting uvicorn server...")
    print()

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=HONE_PORT,
        reload=True,
        log_level="debug" if HONE_DEBUG else "info",
    )
