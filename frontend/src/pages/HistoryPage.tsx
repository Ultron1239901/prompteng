import { motion } from 'framer-motion'
import { ArrowRight, Clock3, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { listExperiments } from '@/lib/api'
import type { ExperimentListItem } from '@/types'

export function HistoryPage() {
  const [rows, setRows] = useState<ExperimentListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const data = await listExperiments()
        if (!cancel) setRows(data)
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : 'Failed to load')
      }
    })()
    return () => {
      cancel = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-lab-border bg-white p-4 shadow-panel sm:rounded-[32px] sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6b4f39]">History</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-[#182535] sm:text-3xl">Browse saved experiments</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-800">
          Review finished runs, reopen polished result pages, and track how your prompt strategy evolves over time.
        </p>
      </section>

      {error && (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {rows === null && !error && (
        <div className="flex items-center gap-3 rounded-[28px] border border-lab-border bg-white px-5 py-4 text-slate-800 shadow-panel">
          <Loader2 className="h-5 w-5 animate-spin text-lab-accent2" />
          Loading experiment history...
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows?.map((row, index) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-[24px] border border-lab-border bg-white p-4 shadow-panel sm:rounded-[30px] sm:p-5"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b4f39]">Experiment #{row.id}</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-lab-ink">
                  {row.title || 'Untitled experiment'}
                </h3>
              </div>
              <span
                className={
                  row.status === 'completed'
                    ? 'w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
                    : row.status === 'failed'
                      ? 'w-fit rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700'
                      : 'w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700'
                }
              >
                {row.status}
              </span>
            </div>

            <div className="space-y-2 rounded-[20px] bg-lab-surface p-4 text-sm text-[#243548] sm:rounded-[24px]">
              <p className="inline-flex items-center gap-2 break-all font-medium text-[#243548]">
                <Clock3 className="h-4 w-4 text-lab-accent2" />
                {new Date(row.created_at).toLocaleString()}
              </p>
              <p className="break-all font-medium text-[#243548]">{row.model_name}</p>
              <p className="font-medium text-[#243548]">{row.variation_count} prompt variants evaluated</p>
              {row.status === 'failed' && (
                <p className="font-medium text-rose-700">This run failed. Open it to review the backend error.</p>
              )}
            </div>

            <Link
              to={`/experiments/${row.id}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-lab-accent2 transition hover:gap-3"
            >
              Open detail view
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      {rows && rows.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-lab-border bg-white px-5 py-8 text-center text-sm text-slate-800 shadow-panel">
          No experiments yet. Head to Workspace and run your first one.
        </div>
      )}
    </div>
  )
}
