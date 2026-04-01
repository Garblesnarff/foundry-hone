import axios from 'axios'

// All requests go to /api which Vite proxies to localhost:3459
const client = axios.create({
  baseURL: '/api',
  timeout: 120_000, // upscaling can take time
})

// ---- Types ----

export type ScaleFactor = 2 | 4

export interface HoneParams {
  scale: ScaleFactor
  faceBlend: number // 0.0 – 1.0
}

export type JobStatus = 'pending' | 'processing' | 'complete' | 'error'

export interface Job {
  job_id: string
  status: JobStatus
  created_at: string
  completed_at?: string
  scale: ScaleFactor
  face_blend: number
  original_filename: string
  result_url?: string
  error?: string
  progress?: number // 0–100
}

export interface HistoryResponse {
  jobs: Job[]
}

export interface Settings {
  default_scale: ScaleFactor
  default_face_blend: number
  max_file_size_mb: number
}

// ---- Endpoints ----

/**
 * Submit an image for upscaling + face restoration.
 * Returns the newly created job.
 */
export async function submitHoneJob(
  file: File,
  params: HoneParams
): Promise<Job> {
  const form = new FormData()
  form.append('image', file)
  form.append('scale', String(params.scale))
  form.append('face_blend', String(params.faceBlend))

  const { data } = await client.post<Job>('/hone', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Poll a single job's status by ID.
 */
export async function getJob(jobId: string): Promise<Job> {
  const { data } = await client.get<Job>(`/hone/${jobId}`)
  return data
}

/**
 * Fetch all previous jobs for the history panel.
 */
export async function getHistory(): Promise<Job[]> {
  const { data } = await client.get<HistoryResponse>('/history')
  return data.jobs ?? []
}

/**
 * Delete a job from history.
 */
export async function deleteJob(jobId: string): Promise<void> {
  await client.delete(`/history/${jobId}`)
}

/**
 * Fetch current application settings.
 */
export async function getSettings(): Promise<Settings> {
  const { data } = await client.get<Settings>('/settings')
  return data
}

/**
 * Update application settings.
 */
export async function patchSettings(
  updates: Partial<Settings>
): Promise<Settings> {
  const { data } = await client.patch<Settings>('/settings', updates)
  return data
}

export default client
