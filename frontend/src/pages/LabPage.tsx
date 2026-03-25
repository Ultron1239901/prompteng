import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BadgeInfo,
  Cpu,
  Layers3,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { GenerateOverlay } from '@/components/GenerateOverlay'
import { runExperiment } from '@/lib/api'
import type { ScoreWeights, VariationIn } from '@/types'

const defaultWeights: ScoreWeights = {
  clarity: 0.25,
  relevance: 0.25,
  depth: 0.25,
  creativity: 0.25,
}

function emptyVariation(i: number): VariationIn {
  return { label: `Variant ${i + 1}`, prompt_text: '' }
}

export function LabPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [basePrompt, setBasePrompt] = useState(
    'Explain how retrieval-augmented generation reduces hallucinations in domain-specific Q&A.',
  )
  const [variations, setVariations] = useState<VariationIn[]>([
    emptyVariation(0),
    emptyVariation(1),
    emptyVariation(2),
  ])
  const [weights, setWeights] = useState<ScoreWeights>({ ...defaultWeights })
  const [model, setModel] = useState('openai/gpt-4o-mini')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedWeights = useMemo(() => {
    const total = weights.clarity + weights.relevance + weights.depth + weights.creativity
    if (total <= 0) return { ...defaultWeights }
    return {
      clarity: weights.clarity / total,
      relevance: weights.relevance / total,
      depth: weights.depth / total,
      creativity: weights.creativity / total,
    }
  }, [weights])

  const addVariation = () => {
    if (variations.length >= 5) return
    setVariations((rows) => [...rows, emptyVariation(rows.length)])
  }

  const removeVariation = (idx: number) => {
    if (variations.length <= 1) return
    setVariations((rows) => rows.filter((_, i) => i !== idx))
  }

  const updateVariation = (idx: number, patch: Partial<VariationIn>) => {
    setVariations((rows) => rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }

  const handleRun = async () => {
    setError(null)

    const filled = variations.map((item) => ({
      ...item,
      prompt_text: item.prompt_text.trim(),
    }))

    if (!basePrompt.trim()) {
      setError('Add a base prompt before running the experiment.')
      return
    }

    if (filled.some((item) => !item.prompt_text)) {
      setError('Each variation needs complete prompt text so the comparison is meaningful.')
      return
    }

    setLoading(true)
    try {
      const result = await runExperiment({
        title: title.trim() || null,
        base_prompt: basePrompt.trim(),
        variations: filled,
        weights: normalizedWeights,
        model: model.trim() || null,
      })
      navigate(`/experiments/${result.experiment_id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed')
      setLoading(false)
    }
  }

  return (
    <>
      <GenerateOverlay open={loading} />

      <div className="space-y-6 sm:space-y-8">
        <section className="rounded-[28px] border border-lab-border bg-white p-4 shadow-panel sm:rounded-[40px] sm:p-7 lg:p-10">
          <div className="grid gap-6 lg:gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
                <Sparkles className="h-3.5 w-3.5" />
                Workspace
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[#182535] sm:text-4xl">
                Build the experiment in a cleaner studio.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-800 sm:text-base sm:leading-8">
                This page is now only for setup. Results open in their own report page after generation so the writing
                flow stays focused and uncluttered.
              </p>

              <div className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#6b4f39]">
                    Experiment title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Customer support prompt refinement"
                    className="lab-input w-full rounded-[24px] border border-lab-border px-5 py-4 text-sm placeholder:text-[#7f8ea0] outline-none transition focus:border-orange-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#6b4f39]">
                    Base prompt
                  </label>
                  <textarea
                    value={basePrompt}
                    onChange={(e) => setBasePrompt(e.target.value)}
                    rows={9}
                    className="lab-input w-full rounded-[28px] border border-lab-border px-5 py-5 text-sm leading-8 placeholder:text-[#7f8ea0] outline-none transition focus:border-orange-300 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-5">
              <div className="rounded-[24px] border border-lab-border bg-lab-surface p-4 sm:rounded-[30px] sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lab-accent2 ring-1 ring-[#eadfce]">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b4f39]">Model Route</p>
                    <h3 className="font-display text-xl font-semibold text-lab-ink">OpenRouter model</h3>
                  </div>
                </div>

                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="openai/gpt-4o-mini"
                  className="lab-input w-full rounded-[22px] border border-lab-border px-4 py-3.5 font-mono text-sm placeholder:text-[#8a98a8] outline-none transition focus:border-sky-300"
                />
                <p className="mt-3 text-sm leading-7 text-slate-800">
                  Recommended for cheaper iteration: <span className="font-semibold text-lab-ink">openai/gpt-4o-mini</span>
                </p>
              </div>

              <div className="rounded-[24px] border border-lab-border bg-lab-surface p-4 sm:rounded-[30px] sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lab-accent3 ring-1 ring-[#eadfce]">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b4f39]">Evaluation</p>
                    <h3 className="font-display text-xl font-semibold text-[#182535]">Scoring weights</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {(['clarity', 'relevance', 'depth', 'creativity'] as const).map((metric) => (
                    <div key={metric} className="rounded-[22px] bg-white p-4 ring-1 ring-[#eadfce]">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold capitalize text-lab-ink">{metric}</span>
                        <span className="font-mono text-slate-500">{weights[metric].toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={weights[metric]}
                        onChange={(e) =>
                          setWeights((current) => ({
                            ...current,
                            [metric]: Number.parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-lab-accent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] bg-gradient-to-r from-orange-50 via-white to-sky-50 p-4 ring-1 ring-[#eadfce] sm:rounded-[30px] sm:p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lab-accent ring-1 ring-[#eadfce]">
                    <BadgeInfo className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#182535]">Generate experience</h3>
                </div>
                <p className="text-sm leading-7 text-slate-800">
                  Clicking Generate opens a dedicated loading overlay and then sends you straight to the report page.
                </p>

                <button
                  type="button"
                  onClick={handleRun}
                  disabled={loading}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lab-accent px-6 py-3.5 text-sm font-semibold text-white shadow-float transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Experiment
                  <ArrowRight className="h-4 w-4" />
                </button>

                {error && (
                  <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-lab-border bg-white p-4 shadow-panel sm:rounded-[40px] sm:p-7 lg:p-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6b4f39]">Prompt Variations</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-[#182535] sm:text-3xl">Write the alternatives clearly</h3>
              <p className="mt-2 text-sm leading-7 text-slate-800">
                Each card is a complete prompt version so the system can compare direction, quality, and consistency.
              </p>
            </div>
            <button
              type="button"
              onClick={addVariation}
              disabled={variations.length >= 5}
              className="inline-flex items-center gap-2 rounded-full border border-lab-border bg-lab-surface px-5 py-3 text-sm font-semibold text-lab-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add variation
            </button>
          </div>

          <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
            {variations.map((variation, index) => (
              <motion.div
                key={index}
                layout
                className="rounded-[24px] border border-lab-border bg-lab-surface p-4 sm:rounded-[32px] sm:p-6"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lab-accent2 ring-1 ring-[#eadfce]">
                      <Layers3 className="h-5 w-5" />
                    </div>
                    <input
                      value={variation.label}
                      onChange={(e) => updateVariation(index, { label: e.target.value })}
                      className="lab-input min-w-0 flex-1 rounded-full border border-lab-border px-4 py-2.5 text-sm font-semibold placeholder:text-[#8a98a8] outline-none sm:w-auto"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVariation(index)}
                    disabled={variations.length <= 1}
                    className="self-end rounded-full border border-transparent p-2.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 sm:self-auto"
                    aria-label="Remove variation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={variation.prompt_text}
                  onChange={(e) => updateVariation(index, { prompt_text: e.target.value })}
                  placeholder="Write a full alternative prompt with its own framing, tone, constraints, and output style."
                  rows={8}
                  className="lab-input w-full rounded-[26px] border border-lab-border px-5 py-5 text-sm leading-8 placeholder:text-[#8a98a8] outline-none transition focus:border-orange-300"
                />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
