import { motion } from 'framer-motion'
import { ArrowRight, Compass, FolderKanban, GalleryVerticalEnd, History, Sparkles, WandSparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { listExperiments } from '@/lib/api'
import type { ExperimentListItem } from '@/types'

const sections = [
  {
    title: 'Overview',
    description: 'Start from a calm landing page that explains the flow and highlights your recent work.',
    icon: Compass,
  },
  {
    title: 'Workspace',
    description: 'Build experiments in a dedicated prompt studio instead of mixing setup and results together.',
    icon: FolderKanban,
  },
  {
    title: 'Reports',
    description: 'Open saved runs in cleaner report pages with charts, winner logic, and exports.',
    icon: GalleryVerticalEnd,
  },
]

export function HomePage() {
  const [recent, setRecent] = useState<ExperimentListItem[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await listExperiments()
        if (!cancelled) setRecent(rows.slice(0, 3))
      } catch {
        if (!cancelled) setRecent([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[42px] border border-lab-border bg-white px-7 py-10 shadow-panel sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="mesh-orb mesh-orb--warm right-10 top-8 h-36 w-36" />
        <div className="mesh-orb mesh-orb--cool bottom-10 right-28 h-28 w-28" />

        <div className="relative grid gap-10 xl:grid-cols-[1.12fr_0.88fr] xl:items-center">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
              <Sparkles className="h-3.5 w-3.5" />
              Refined Studio
            </div>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-[#182535] sm:text-5xl">
              A lighter, cleaner prompt studio with a real product feel.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-800">
              PromptLab now separates discovery, authoring, and reporting into distinct pages so the app feels more
              professional and less crowded while you work.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/workspace"
                className="inline-flex items-center gap-2 rounded-full bg-lab-accent px-6 py-3.5 text-sm font-semibold text-white shadow-float transition hover:translate-y-[-1px]"
              >
                Open Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/history"
                className="inline-flex items-center gap-2 rounded-full border border-lab-border bg-lab-surface px-6 py-3.5 text-sm font-semibold text-lab-ink transition hover:bg-white"
              >
                Browse Reports
                <History className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-5">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[30px] border border-lab-border bg-white/95 p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-[#dcc7ad] shadow-sm">
                  <section.icon className="h-5 w-5 text-lab-accent2" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#182535]">{section.title}</h3>
                <p className="mt-2 text-[15px] leading-8 text-[#243548]">{section.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[36px] border border-lab-border bg-white p-7 shadow-panel sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a5a43]">Product Flow</p>
          <h3 className="mt-3 font-display text-3xl font-semibold text-[#182535]">Designed around separate pages</h3>
          <div className="mt-8 space-y-5">
            {[
              'Overview gives the project a welcoming starting point and quick access to your recent runs.',
              'Workspace is focused only on writing prompts, setting weights, and launching the experiment.',
              'History and Report pages are reserved for reading, comparing, and exporting finished results.',
            ].map((line, index) => (
              <div key={line} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-sm font-bold text-orange-800">
                  0{index + 1}
                </div>
                <p className="pt-2 text-[15px] leading-8 text-[#243548]">{line}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] border border-lab-border bg-white p-7 shadow-panel sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a5a43]">Recent Reports</p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-[#182535]">Latest experiments</h3>
            </div>
            <Link to="/history" className="text-sm font-semibold text-[#3b5f84]">
              View all
            </Link>
          </div>

          <div className="mt-7 space-y-4">
            {recent.length === 0 && (
              <div className="rounded-[26px] border border-dashed border-lab-border bg-white p-6 text-sm text-slate-800">
                No experiments yet. Open Workspace to run the first polished report.
              </div>
            )}

            {recent.map((run) => (
              <Link
                key={run.id}
                to={`/experiments/${run.id}`}
                className="flex flex-col gap-4 rounded-[28px] border border-lab-border bg-white p-5 transition hover:bg-[#fffaf4] md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-display text-xl font-semibold text-[#182535]">{run.title || `Experiment #${run.id}`}</p>
                  <p className="mt-1 text-sm text-[#314255]">{run.model_name} - {run.variation_count} prompts</p>
                  {run.status === 'failed' && (
                    <p className="mt-2 text-sm font-medium text-rose-700">
                      Last run failed. Open the report for the exact error and retry with a lower-cost model.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-[#243548]">
                  <span className="rounded-full bg-[#f7efe4] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#6e5642]">
                    {run.status}
                  </span>
                  <span>{new Date(run.created_at).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-7 rounded-[26px] bg-gradient-to-r from-orange-50 via-white to-sky-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lab-accent shadow-sm ring-1 ring-[#eadfce]">
                <WandSparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display text-xl font-semibold text-[#182535]">Cleaner reading experience</h4>
                <p className="mt-2 text-[15px] leading-8 text-[#243548]">
                  Result pages now prioritize breathing room, hierarchy, and readable sections instead of stacking
                  everything into a single crowded screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
