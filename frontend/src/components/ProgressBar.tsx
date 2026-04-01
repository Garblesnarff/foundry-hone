import { JobStatus } from '../api'

interface ProgressBarProps {
  status: JobStatus
  progress?: number // 0–100; undefined = indeterminate
  message?: string
}

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Queued — waiting to start',
  processing: 'Processing your image',
  complete: 'Done!',
  error: 'Something went wrong',
}

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: 'bg-zinc-500',
  processing: 'bg-amber-500 progress-shimmer',
  complete: 'bg-emerald-500',
  error: 'bg-red-500',
}

export default function ProgressBar({ status, progress, message }: ProgressBarProps) {
  const isIndeterminate = status === 'processing' && progress === undefined
  const displayProgress = status === 'complete' ? 100 : (progress ?? 0)

  return (
    <div className="space-y-2.5 animate-fade-in">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'processing' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          )}
          {status === 'complete' && (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'error' && (
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {status === 'pending' && (
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
            </svg>
          )}
          <span className={[
            'text-sm font-medium',
            status === 'complete' ? 'text-emerald-400'
              : status === 'error' ? 'text-red-400'
              : status === 'processing' ? 'text-amber-300'
              : 'text-zinc-400',
          ].join(' ')}>
            {message ?? STATUS_LABELS[status]}
          </span>
        </div>
        {!isIndeterminate && status !== 'error' && (
          <span className="text-xs font-mono text-zinc-500">
            {displayProgress}%
          </span>
        )}
      </div>

      {/* Track */}
      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
        {isIndeterminate ? (
          /* Indeterminate: animated sliding bar */
          <div className="h-full w-1/3 rounded-full bg-amber-500 origin-left animate-[indeterminate_1.4s_ease-in-out_infinite]"
            style={{
              animation: 'indeterminate 1.4s ease-in-out infinite',
            }}
          />
        ) : (
          <div
            className={['h-full rounded-full transition-all duration-500 ease-out', STATUS_COLORS[status]].join(' ')}
            style={{ width: `${displayProgress}%` }}
          />
        )}
      </div>

      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-100%) scaleX(1); }
          40%  { transform: translateX(0%) scaleX(1.2); }
          100% { transform: translateX(400%) scaleX(1); }
        }
      `}</style>
    </div>
  )
}
