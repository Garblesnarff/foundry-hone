import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react'

interface ImageUploaderProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXTENSIONS = '.jpg, .jpeg, .png, .webp'
const MAX_SIZE_MB = 20
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageUploader({ onFileSelected, disabled = false }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string>('')
  const [previewSize, setPreviewSize] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or WebP image.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large (${formatBytes(file.size)}). Maximum size is ${MAX_SIZE_MB} MB.`)
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)
    setPreviewName(file.name)
    setPreviewSize(file.size)
    onFileSelected(file)
  }, [onFileSelected])

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [disabled, handleFile])

  const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }, [handleFile])

  const onClear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setPreviewName('')
    setPreviewSize(0)
    setError(null)
  }, [preview])

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload image"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'relative flex flex-col items-center justify-center gap-3',
          'rounded-xl border-2 border-dashed transition-all duration-200',
          'min-h-[200px] px-6 py-10',
          disabled
            ? 'cursor-not-allowed opacity-50 border-zinc-700'
            : isDragging
              ? 'cursor-copy border-amber-400 bg-amber-500/5'
              : 'cursor-pointer border-zinc-600 hover:border-zinc-500 hover:bg-zinc-700/30',
        ].join(' ')}
      >
        {/* Upload icon */}
        <div className={[
          'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
          isDragging ? 'bg-amber-500/20' : 'bg-zinc-700',
        ].join(' ')}>
          <svg
            className={['w-6 h-6 transition-colors', isDragging ? 'text-amber-400' : 'text-zinc-400'].join(' ')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200">
            {isDragging ? 'Drop your image here' : 'Drag & drop or click to browse'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            JPEG, PNG, WebP &mdash; up to {MAX_SIZE_MB} MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={onInputChange}
          className="sr-only"
          disabled={disabled}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 animate-fade-in">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="flex items-center gap-3 rounded-xl bg-zinc-700/50 border border-zinc-600/50 p-3 animate-slide-up">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{previewName}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{formatBytes(previewSize)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className="btn-ghost p-1.5 rounded-lg shrink-0"
            aria-label="Remove image"
            disabled={disabled}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
