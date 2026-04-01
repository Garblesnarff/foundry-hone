# foundry-hone Frontend

React 19 + TypeScript + Vite + Tailwind CSS frontend for photo upscaling and face restoration.

## Quick Start

### Prerequisites
- Node 18+ (LTS recommended)
- npm package manager

### Setup

```bash
npm install
npm run dev
```

Frontend opens at `http://localhost:5176`

### Build for Production

```bash
npm run build
# Output: dist/
```

## Available Scripts

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Lint TypeScript
```

## Components

- **UploadZone**: Drag-drop file upload
- **ProgressBar**: Real-time progress with SSE
- **FaceBlendSlider**: 0–1 face restoration weight
- **ScaleSelector**: 2x / 4x radio buttons
- **ComparisonView**: Before/after slider
- **ModelManager**: Download/manage models (Phase 2)
- **HistoryBrowser**: Job history (Phase 2)

## Troubleshooting

### Dev Server Won't Start
```bash
rm -rf node_modules
npm install
npm run dev
```

### Can't Connect to Backend
- Verify backend running: `curl http://localhost:3459/health`
- Check console for CORS errors

---

**Version**: 0.1.0-alpha  
**Last Updated**: 2026-03-14  
**Status**: In Development
