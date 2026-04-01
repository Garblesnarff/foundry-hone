import { useRef, useState, useCallback, useEffect, MouseEvent, TouchEvent } from 'react'

interface ComparisonViewProps {
  originalUrl: string
  resultUrl: string
  jobId: string
}

export default function ComparisonView({ originalUrl, resultUrl, jobId }: ComparisonViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sliderPos, setSliderPos] = useState(50) // 0–100 percent
  const [isDragging, setIsDragging] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Convert client X to percent within container
  const xToPercent = useCallback((clientX: number): number => {
    const el = containerRef.current
    if (!el) return 50
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    return Math.min(100, Math.max(0, pct))
  }, [])

  const onMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setSliderPos(xToPercent(e.clientX))
  }, [xToPercent])

  const onTouchStart = useCallback((e: TouchEvent) => {
    setIsDragging(true)
    setSliderPos(xToPercent(e.touches[0].clientX))
  }, [xToPercent])

  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDragging) return
      setSliderPos(xToPercent(e.clientX))
    }
    const onTouchMove = (e: globalThis.TouchEvent) => {
      if (!isDragging) return
      setSliderPos(xToPercent(e.touches[0].clientX))
    }
    const onUp = () => setIsDragging(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging, xToPercent])

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(resultUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hone-result-${jobId}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // fallback: open in new tab
      window.open(resultUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }, [resultUrl, jobId])

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Labels */}
      <div className="flex items-center justify-between px-1">
        <span className="label">Before / After</span>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-primary py-1.5 text-xs"
        >
          {isDownloading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Downloading
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download
            </>
          )}
        </button>
      </div>

      {/* Comparison container */}
      <div
        ref={containerRef}
        className={[
          'relative rounded-xl overflow-hidden bg-zinc-900 select-none',
          'border border-zinc-700/50',
          isDragging ? 'cursor-ew-resize' : 'cursor-ew-resize',
        ].join(' ')}
        style={{ aspectRatio: '16/10' }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* After (result) — full width, bottom layer */}
        <img
          src={resultUrl}
          alt="Processed result"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Before (original) — clipped to left portion */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={originalUrl}
            alt="Original image"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ width: `${(100 / sliderPos) * 100}%`, maxWidth: 'none' }}
            draggable={false}
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
          style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        >
          {/* Handle circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-9 h-9 rounded-full bg-white shadow-xl
                          flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </div>
        </div>

        {/* Corner labels */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-black/60 text-zinc-300 backdrop-blur-sm">
            Before
          </span>
        </div>
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/80 text-zinc-900 backdrop-blur-sm">
            After
          </span>
        </div>

        {/* Drag hint (fades out) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="px-3 py-1 rounded-full text-xs bg-black/50 text-zinc-400 backdrop-blur-sm">
            Drag to compare
          </span>
        </div>
      </div>
    </div>
  )
}
