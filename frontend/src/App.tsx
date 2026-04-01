import { useState, useCallback, useEffect, useRef } from 'react'
import ImageUploader from './components/ImageUploader'
import ProcessingControls from './components/ProcessingControls'
import ProgressBar from './components/ProgressBar'
import ComparisonView from './components/ComparisonView'
import HistoryPanel from './components/HistoryPanel'
import { submitHoneJob, getJob, Job, ScaleFactor } from './api'

type AppView = 'upload' | 'processing' | 'result'

const POLL_INTERVAL_MS = 1500

export default function App() {
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null)

  // Controls state
  const [scale, setScale] = useState<ScaleFactor>(2)
  const [faceBlend, setFaceBlend] = useState<number>(0.5)

  // Job state
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [view, setView] = useState<AppView>('upload')
  const [historyRefresh, setHistoryRefresh] = useState(0)

  // Sidebar
  const [historyOpen, setHistoryOpen] = useState(false)

  // Polling ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Poll a job until it's no longer pending/processing
  const startPolling = useCallback((jobId: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const job = await getJob(jobId)
        setCurrentJob(job)
        if (job.status === 'complete' || job.status === 'error') {
          stopPolling()
          setHistoryRefresh((n) => n + 1)
          if (job.status === 'complete') {
            setView('result')
          }
        }
      } catch {
        // ignore transient errors; keep polling
      }
    }, POLL_INTERVAL_MS)
  }, [stopPolling])

  useEffect(() => () => stopPolling(), [stopPolling])

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setOriginalPreviewUrl(url)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return
    setView('processing')
    try {
      const job = await submitHoneJob(selectedFile, { scale, faceBlend })
      setCurrentJob(job)
      if (job.status === 'complete') {
        setView('result')
        setHistoryRefresh((n) => n + 1)
      } else if (job.status === 'error') {
        setView('processing') // stays on processing view to show error state
        setHistoryRefresh((n) => n + 1)
      } else {
        startPolling(job.job_id)
      }
    } catch (err) {
      // Create a fake error job for display
      setCurrentJob({
        job_id: 'local-error',
        status: 'error',
        created_at: new Date().toISOString(),
        scale,
        face_blend: faceBlend,
        original_filename: selectedFile.name,
        error: err instanceof Error ? err.message : 'Upload failed. Is the backend running?',
      })
    }
  }, [selectedFile, scale, faceBlend, startPolling])

  const handleReset = useCallback(() => {
    stopPolling()
    setSelectedFile(null)
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl)
    setOriginalPreviewUrl(null)
    setCurrentJob(null)
    setView('upload')
  }, [stopPolling, originalPreviewUrl])

  const handleSelectHistoryJob = useCallback((job: Job) => {
    setCurrentJob(job)
    if (job.status === 'complete') {
      setView('result')
    } else {
      setView('processing')
    }
    setHistoryOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-100 leading-none">Hone</h1>
              <p className="text-xs text-zinc-500 leading-none mt-0.5 hidden sm:block">
                Photo upscaler &amp; face restoration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view !== 'upload' && (
              <button onClick={handleReset} className="btn-ghost text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New image
              </button>
            )}
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className={['btn-ghost text-xs', historyOpen ? 'bg-zinc-700 text-zinc-200' : ''].join(' ')}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex gap-6">

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* Upload view */}
            {view === 'upload' && (
              <div className="space-y-6 animate-fade-in">
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-sm font-semibold text-zinc-200">Upload Image</h2>
                  </div>
                  <div className="p-5">
                    <ImageUploader
                      onFileSelected={handleFileSelected}
                      disabled={false}
                    />
                  </div>
                </div>

                {selectedFile && (
                  <div className="card animate-slide-up">
                    <div className="card-header">
                      <h2 className="text-sm font-semibold text-zinc-200">Processing Options</h2>
                    </div>
                    <div className="p-5">
                      <ProcessingControls
                        scale={scale}
                        onScaleChange={setScale}
                        faceBlend={faceBlend}
                        onFaceBlendChange={setFaceBlend}
                        onSubmit={handleSubmit}
                        canSubmit={!!selectedFile}
                        isProcessing={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Processing view */}
            {view === 'processing' && currentJob && (
              <div className="space-y-6 animate-fade-in">
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-200">
                      {currentJob.status === 'error' ? 'Processing Failed' : 'Processing'}
                    </h2>
                    <span className="text-xs text-zinc-500 font-mono">
                      #{currentJob.job_id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="p-5 space-y-6">
                    <ProgressBar
                      status={currentJob.status}
                      progress={currentJob.progress}
                      message={currentJob.status === 'error' ? currentJob.error : undefined}
                    />

                    {currentJob.status === 'error' && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleReset} className="btn-primary flex-1">
                          Try another image
                        </button>
                        <button onClick={handleSubmit} className="btn-secondary flex-1">
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job parameters recap */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-sm font-semibold text-zinc-200">Job Details</h2>
                  </div>
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="label mb-1">File</p>
                      <p className="text-sm text-zinc-300 truncate">{currentJob.original_filename}</p>
                    </div>
                    <div>
                      <p className="label mb-1">Scale</p>
                      <p className="text-sm text-zinc-300">{currentJob.scale}x</p>
                    </div>
                    <div>
                      <p className="label mb-1">Face Restoration</p>
                      <p className="text-sm text-zinc-300">{currentJob.face_blend.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Result view */}
            {view === 'result' && currentJob?.status === 'complete' && currentJob.result_url && (
              <div className="space-y-6 animate-fade-in">
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-200">Result</h2>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Complete
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <ComparisonView
                      originalUrl={originalPreviewUrl ?? currentJob.result_url}
                      resultUrl={currentJob.result_url}
                      jobId={currentJob.job_id}
                    />
                  </div>
                </div>

                {/* Result metadata */}
                <div className="card">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="label mb-1">Scale</p>
                        <p className="text-lg font-bold text-amber-400">{currentJob.scale}x</p>
                      </div>
                      <div>
                        <p className="label mb-1">Face Blend</p>
                        <p className="text-lg font-bold text-amber-400">{currentJob.face_blend.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="label mb-1">Status</p>
                        <p className="text-lg font-bold text-emerald-400">Done</p>
                      </div>
                    </div>
                    <button onClick={handleReset} className="btn-secondary whitespace-nowrap">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Process another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* History sidebar */}
          {historyOpen && (
            <aside className="w-72 shrink-0 hidden lg:block animate-slide-up">
              <div className="card sticky top-24">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-200">History</h2>
                    <button
                      onClick={() => setHistoryOpen(false)}
                      className="btn-ghost p-1"
                      aria-label="Close history"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
                  <HistoryPanel
                    onSelectJob={handleSelectHistoryJob}
                    selectedJobId={currentJob?.job_id}
                    refreshTrigger={historyRefresh}
                  />
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Mobile history drawer */}
        {historyOpen && (
          <div className="lg:hidden fixed inset-0 z-30 flex flex-col animate-fade-in">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setHistoryOpen(false)}
            />
            <div className="relative mt-auto bg-zinc-800 rounded-t-2xl border-t border-zinc-700 max-h-[80vh] flex flex-col animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                <h2 className="text-sm font-semibold text-zinc-200">History</h2>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="btn-ghost p-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto p-4">
                <HistoryPanel
                  onSelectJob={handleSelectHistoryJob}
                  selectedJobId={currentJob?.job_id}
                  refreshTrigger={historyRefresh}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-zinc-600 text-center">
            Foundry &mdash; Hone v0.1 &mdash; Photo upscaling powered by Real-ESRGAN &amp; GFPGAN
          </p>
        </div>
      </footer>
    </div>
  )
}
