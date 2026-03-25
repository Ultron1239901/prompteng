import { AnimatePresence, motion } from 'framer-motion'
import { BrainCircuit, Loader2, Orbit, Sparkles } from 'lucide-react'

const stages = [
  'Preparing your experiment canvas',
  'Generating prompt responses',
  'Scoring quality, depth, and clarity',
  'Synthesizing the strongest direction',
]

export function GenerateOverlay({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="glass-panel soft-ring relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/70 p-8"
          >
            <div className="mesh-orb mesh-orb--warm right-[-2rem] top-[-2rem] h-32 w-32" />
            <div className="mesh-orb mesh-orb--cool bottom-[-2rem] left-[-1rem] h-28 w-28" />

            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
                <Sparkles className="h-3.5 w-3.5" />
                Generating
              </div>

              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-sky-500 text-white shadow-float">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-lab-ink">
                    Building your experiment report
                  </h2>
                  <p className="mt-1 text-sm text-slate-700">
                    We are running the full OpenRouter workflow and preparing a cleaner multi-section result view.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {stages.map((stage, index) => (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl border border-lab-border bg-white/75 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2 text-lab-accent2">
                      {index % 2 === 0 ? <BrainCircuit className="h-4 w-4" /> : <Orbit className="h-4 w-4" />}
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
                        Step {index + 1}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-lab-ink">{stage}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
