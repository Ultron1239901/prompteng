export type Provider = 'openrouter'

export interface ScoreWeights {
  clarity: number
  relevance: number
  depth: number
  creativity: number
}

export interface VariationIn {
  label: string
  prompt_text: string
}

export interface MetricReasoning {
  clarity: string
  relevance: string
  depth: string
  creativity: string
}

export interface EvaluationDetail {
  clarity: number
  relevance: number
  depth: number
  creativity: number
  reasoning: MetricReasoning | Record<string, string>
}

export interface BiasReport {
  severity: 'low' | 'medium' | 'high'
  flags: string[]
  explanation: string
}

export interface VariationResultOut {
  variation_id: number
  label: string
  prompt_text: string
  response_text: string
  evaluation: EvaluationDetail
  weighted_score: number
  strength_score: number
  bias: BiasReport
  is_winner: boolean
}

export interface ConsistencyReport {
  overall_score: number
  contradictions: string[]
  themes_in_common: string[]
  summary: string
}

export interface OptimizationSuggestion {
  original_prompt: string
  improved_prompt: string
  explanation: string
}

export interface ExperimentRunResponse {
  experiment_id: number
  status: string
  provider: string
  model_name: string
  results: VariationResultOut[]
  winner_variation_id: number | null
  winner_explanation: string | null
  optimization: OptimizationSuggestion | null
  consistency: ConsistencyReport | null
  bias_summary: string | null
}

export interface ExperimentListItem {
  id: number
  created_at: string
  title: string | null
  status: string
  provider: string
  model_name: string
  variation_count: number
}

export interface ExperimentDetail {
  id: number
  created_at: string
  title: string | null
  status: string
  base_prompt: string
  provider: string
  model_name: string
  weights: ScoreWeights
  winner_variation_id: number | null
  winner_explanation: string | null
  optimization: OptimizationSuggestion | null
  consistency: ConsistencyReport | null
  bias_summary: string | null
  results: VariationResultOut[]
  error_message: string | null
}
