import type {
  ExperimentDetail,
  ExperimentListItem,
  ExperimentRunResponse,
  Provider,
  ScoreWeights,
  VariationIn,
} from '@/types'

function apiBase(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined
  if (raw && raw.length > 0) return raw.replace(/\/$/, '')
  return ''
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body && typeof body.detail === 'string') detail = body.detail
      else if (body && Array.isArray(body.detail)) detail = body.detail.map((x: { msg?: string }) => x.msg).join(', ')
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export interface RunPayload {
  title?: string | null
  base_prompt: string
  variations: VariationIn[]
  weights: ScoreWeights
  /** Always OpenRouter; sent for API compatibility. */
  provider?: Provider
  model?: string | null
}

export async function runExperiment(body: RunPayload): Promise<ExperimentRunResponse> {
  const payload = { ...body, provider: 'openrouter' as const }
  const res = await fetch(`${apiBase()}/api/experiments/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handle<ExperimentRunResponse>(res)
}

export async function listExperiments(): Promise<ExperimentListItem[]> {
  const res = await fetch(`${apiBase()}/api/experiments`)
  return handle<ExperimentListItem[]>(res)
}

export async function getExperiment(id: number): Promise<ExperimentDetail> {
  const res = await fetch(`${apiBase()}/api/experiments/${id}`)
  return handle<ExperimentDetail>(res)
}

export async function deleteExperiment(id: number): Promise<void> {
  const res = await fetch(`${apiBase()}/api/experiments/${id}`, { method: 'DELETE' })
  if (res.status === 204) return
  if (!res.ok) await handle<void>(res)
}
