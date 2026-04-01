import { ScaleFactor } from '../api'

interface ProcessingControlsProps {
  scale: ScaleFactor
  onScaleChange: (scale: ScaleFactor) => void
  faceBlend: number
  onFaceBlendChange: (value: number) => void
  onSubmit: () => void
  canSubmit: boolean
  isProcessing: boolean
}

const SCALE_OPTIONS: { value: ScaleFactor; label: string; description: string }[] = [
  { value: 2, label: '2x', description: 'Double resolution' },
  { value: 4, label: '4x', description: 'Quadruple resolution' },
]

function blendLabel(value: number): string {
  if (value === 0) return 'Off'
  if (value <= 0.3) return 'Subtle'
  if (value <= 0.6) return 'Balanced'
  if (value <= 0.8) return 'Strong'
  return 'Maximum'
}

export default function ProcessingControls({
  scale,
  onScaleChange,
  faceBlend,
  onFaceBlendChange,
  onSubmit,
  canSubmit,
  isProcessing,
}: ProcessingControlsProps) {
  return (
    <div className="space-y-6">
      {/* Scale selector */}
      <div className="space-y-2">
        <label className="label">Upscale Factor</label>
        <div className="flex gap-2">
          {SCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onScaleChange(opt.value)}
              disabled={isProcessing}
              className={[
                'toggle-btn flex-1 flex flex-col items-center gap-0.5 py-3',
                scale === opt.value ? 'toggle-btn-active' : 'toggle-btn-inactive',
                isProcessing ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            >
              <span className="text-base font-bold">{opt.label}</span>
              <span className={[
                'text-xs font-normal',
                scale === opt.value ? 'text-zinc-700' : 'text-zinc-500',
              ].join(' ')}>
                {opt.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Face blend slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="face-blend-slider">
            Face Restoration
          </label>
          <div className="flex items-center gap-2">
            <span className={[
              'text-xs font-medium px-2 py-0.5 rounded-md',
              faceBlend > 0
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-zinc-700 text-zinc-500',
            ].join(' ')}>
              {blendLabel(faceBlend)}
            </span>
            <span className="text-sm font-mono font-medium text-zinc-300 w-8 text-right">
              {faceBlend.toFixed(1)}
            </span>
          </div>
        </div>

        <input
          id="face-blend-slider"
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={faceBlend}
          onChange={(e) => onFaceBlendChange(parseFloat(e.target.value))}
          disabled={isProcessing}
          className={['w-full', isProcessing ? 'opacity-50 cursor-not-allowed' : ''].join(' ')}
        />

        <div className="flex justify-between text-xs text-zinc-600 select-none">
          <span>Off</span>
          <span>Subtle</span>
          <span>Balanced</span>
          <span>Strong</span>
          <span>Max</span>
        </div>

        <p className="text-xs text-zinc-500">
          Higher values apply stronger face-specific enhancement. Set to 0 to skip face restoration.
        </p>
      </div>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit || isProcessing}
        className="btn-primary w-full py-3 text-base"
      >
        {isProcessing ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing&hellip;
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            Hone Image
          </>
        )}
      </button>
    </div>
  )
}
