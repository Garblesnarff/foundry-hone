# foundry-hone Backend

FastAPI-based Python backend for photo upscaling and face restoration using ONNX Runtime models.

## Quick Start

### Prerequisites
- Python 3.11+
- pip package manager

### Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Backend runs at `http://localhost:3459`

### Verify

```bash
curl http://localhost:3459/health
```

## Environment Variables

```bash
HONE_PORT=3459
HONE_DEFAULT_SCALE=2
HONE_MODELS_DIR=./models
HONE_FACE_BLEND=0.8
HONE_DEBUG=0
```

## API Quick Reference

| Endpoint | Method |
|----------|--------|
| `/health` | GET |
| `/hone` | POST |
| `/hone/batch` | POST |
| `/hone/progress/{job_id}` | GET (SSE) |
| `/models/list` | GET |
| `/models/download/{model_id}` | POST |
| `/settings` | GET/PATCH |
| `/history` | GET |
| `/history/{job_id}` | GET |
| `/history/{job_id}` | DELETE |

See `../docs/API_SPEC.md` for full schema details.

## Troubleshooting

### Port Already in Use
```bash
HONE_PORT=3460 python main.py
```

### Models Not Downloading
- Check internet connectivity
- Verify `models/` directory is writable
- Check disk space (need ~2 GB)

### Out of Memory
- Reduce image size
- Close other applications

---

**Version**: 0.1.0-alpha  
**Last Updated**: 2026-03-14  
**Status**: In Development
