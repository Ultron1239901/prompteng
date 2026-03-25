import { motion } from 'framer-motion'
import { ArrowLeft, BrainCircuit, Download, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { RadarForPrompt, ScoreBarChart } from '@/components/AnalyticsCharts'
import { PromptStrengthMeter } from '@/components/PromptStrengthMeter'
import { getExperiment } from '@/lib/api'
import { exportExperimentJson, exportExperimentPdf } from '@/lib/exportReport'
import type { ExperimentDetail } from '@/types'
import { clsx } from 'clsx'

const COLORS = ['#d97745', '#326789', '#6f8f72', '#b7791f', '#5b6cfa', '#d16ba5']

export function ExperimentDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<ExperimentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancel = false
    ;(async () => {
      try {
        const ex = await getExperiment(Number(id))
        if (!cancel) setData(ex)
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : 'Not found')
      }
    })()
    return () => {
      cancel = true
    }
  }, [id])

  if (!id) return null

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center gap-3 rounded-[28px] border border-lab-border bg-white px-5 py-4 text-slate-800 shadow-panel">
        <Loader2 className="h-5 w-5 animate-spin text-lab-accent2" />
        Loading experiment report...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-lab-border bg-white p-6 shadow-panel sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link to="/history" className="inline-flex items-center gap-2 text-sm font-semibold text-lab-accent2">
              <ArrowLeft className="h-4 w-4" />
              Back to history
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-lab-muted">Experiment Report</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-lab-ink">
              {data.title || `Experiment #${data.id}`}
            </h2>
            <p className="mt-2 text-sm text-slate-800">
              {data.model_name} - {data.provider} - {new Date(data.created_at).toLocaleString()}
            </p>
            {data.error_message && (
              <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
                <span className="font-semibold">Run error:</span> {data.error_message}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => exportExperimentJson(data)}
              className="inline-flex items-center gap-2 rounded-full border border-lab-border bg-lab-surface px-4 py-2.5 text-sm font-semibold text-lab-ink"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => exportExperimentPdf(data)}
              className="inline-flex items-center gap-2 rounded-full bg-lab-accent px-4 py-2.5 text-sm font-semibold text-white shadow-float"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </section>

      {data.status === 'failed' && (
        <section className="rounded-[30px] border border-rose-200 bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl font-semibold text-lab-ink">Experiment did not complete</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-800">
            This record was saved, but the AI pipeline failed before scoring finished. If the message mentions credits
            or token limits, rerun it from Workspace with a cheaper model such as <span className="font-semibold text-lab-ink">openai/gpt-4o-mini</span>.
          </p>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-lab-border bg-white p-6 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lab-muted">Scoreboard</p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-lab-ink">How each prompt performed</h3>
          {data.results.length > 0 && <div className="mt-5"><ScoreBarChart results={data.results} /></div>}
        </div>

        <div className="grid gap-6">
          {data.winner_explanation && (
            <div className="rounded-[32px] border border-orange-200 bg-orange-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lab-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-lab-ink">Why the winner stood out</h3>
              </div>
              <p className="text-sm leading-7 text-slate-700">{data.winner_explanation}</p>
            </div>
          )}

          {data.consistency && (
            <div className="rounded-[32px] border border-sky-200 bg-sky-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lab-accent2">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-lab-ink">Consistency review</h3>
                  <p className="text-sm text-slate-800">Alignment score: {data.consistency.overall_score.toFixed(1)} / 10</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-700">{data.consistency.summary}</p>
            </div>
          )}

          {data.optimization && (
            <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lab-accent3">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-lab-ink">Optimization suggestion</h3>
              </div>
              <pre className="whitespace-pre-wrap rounded-[24px] border border-emerald-100 bg-white p-4 text-sm leading-7 text-slate-700">
                {data.optimization.improved_prompt}
              </pre>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5">
        {data.results.map((result, index) => (
          <motion.article
            key={result.variation_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={clsx(
              'rounded-[34px] border bg-white p-6 shadow-panel',
              result.is_winner ? 'border-orange-200' : 'border-lab-border',
            )}
          >
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-2xl font-semibold text-lab-ink">{result.label}</h3>
                  {result.is_winner && (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      Winner
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-800">
                  Weighted score {result.weighted_score.toFixed(2)} - Bias severity {result.bias.severity}
                </p>
              </div>
              <div className="w-full max-w-sm">
                <PromptStrengthMeter value={result.strength_score} label="Prompt strength" />
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[28px] border border-lab-border bg-lab-surface p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-lab-muted">Radar profile</p>
                <RadarForPrompt result={result} color={COLORS[index % COLORS.length]} />
              </div>

              <div className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-lab-border bg-lab-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lab-muted">Prompt</p>
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {result.prompt_text}
                    </pre>
                  </div>
                  <div className="rounded-[24px] border border-lab-border bg-lab-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lab-muted">Response</p>
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {result.response_text}
                    </pre>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-lab-border bg-lab-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lab-muted">Evaluator reasoning</p>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                      {Object.entries(result.evaluation.reasoning).map(([key, value]) => (
                        <p key={key}>
                          <span className="font-semibold capitalize text-lab-ink">{key}: </span>
                          {String(value)}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-lab-border bg-lab-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lab-muted">Bias review</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{result.bias.explanation}</p>
                    {result.bias.flags.length > 0 && (
                      <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
                        {result.bias.flags.map((flag) => (
                          <li key={flag}>{flag}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  )
}
