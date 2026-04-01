import { useEffect, useState, useCallback } from 'react'
import { Job, getHistory, deleteJob, ScaleFactor } from '../api'

interface HistoryPanelProps {
  onSelectJob: (job: Job) => void
  selectedJobId?: string
  refreshTrigger?: number // increment to force refresh
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function scaleBadge(scale: ScaleFactor) {
  return (
    <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-zinc-600/60 text-zinc-300">
      {scale}x
    </span>
  )
}

function statusDot(status: Job['status']) {
  const base = 'w-1.5 h-1.5 rounded-full shrink-0 mt-1.5'
  switch (status) {
    case 'complete':   return <span className={`${base} bg-emerald-400`} />
    case 'processing': return <span className={`${base} bg-amber-400 animate-pulse`} />
    case 'error':      return <span className={`${base} bg-red-400`} />
    default:           return <span className={`${base} bg-zinc-500`} />
  }
}

export default function HistoryPanel({
  onSelectJob,
  selectedJobId,
  refreshTrigger = 0,
}: HistoryPanelProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      setError(null)
      const data = await getHistory()
      // newest first
      setJobs(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch {
      setError('Could not load history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory, refreshTrigger])

  const handleDelete = useCallback(async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation()
    setDeletingId(jobId)
    try {
      await deleteJob(jobId)
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId))
    } catch {
      // silently fail — user can try again
    } finally {
      setDeletingId(null)
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="label">History</h2>
        <button
          onClick={loadHistory}
          className="btn-ghost py-1 px-2 text-xs"
          aria-label="Refresh history"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-700/40 animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 text-sm text-red-400 py-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm text-zinc-500">No processed images yet</p>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <ul className="space-y-1.5">
          {jobs.map((job) => (
            <li key={job.job_id}>
              <button
                onClick={() => onSelectJob(job)}
                className={[
                  'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left',
                  'transition-all duration-150 group',
                  selectedJobId === job.job_id
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'border border-transparent hover:bg-zinc-700/50',
                ].join(' ')}
              >
                {/* Thumbnail or placeholder */}
                <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-zinc-700">
                  {job.result_url ? (
                    <img
                      src={job.result_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {statusDot(job.status)}
                    <p className="text-sm font-medium text-zinc-200 truncate flex-1">
                      {job.original_filename}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {scaleBadge(job.scale)}
                    <span>{timeAgo(job.created_at)}</span>
                    {job.status === 'error' && (
                      <span className="text-red-400">Failed</span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, job.job_id)}
                  disabled={deletingId === job.job_id}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded
                             text-zinc-600 hover:text-red-400 hover:bg-red-500/10
                             transition-all duration-150 shrink-0"
                  aria-label={`Delete job ${job.job_id}`}
                >
                  {deletingId === job.job_id ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                </button>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
