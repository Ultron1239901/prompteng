import { motion } from 'framer-motion'

import { clsx } from 'clsx'

export function PromptStrengthMeter({ value, label }: { value: number; label: string }) {
  const safeValue = Math.max(0, Math.min(100, value))
  const tier =
    safeValue >= 80 ? 'Excellent' : safeValue >= 60 ? 'Strong' : safeValue >= 40 ? 'Promising' : 'Developing'

  return (
    <div className="rounded-[26px] border border-lab-border bg-lab-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-lab-muted">{label}</span>
        <span
          className={clsx(
            'rounded-full px-3 py-1 text-xs font-semibold',
            safeValue >= 80 && 'bg-emerald-100 text-emerald-700',
            safeValue >= 60 && safeValue < 80 && 'bg-sky-100 text-sky-700',
            safeValue >= 40 && safeValue < 60 && 'bg-amber-100 text-amber-700',
            safeValue < 40 && 'bg-rose-100 text-rose-700',
          )}
        >
          {tier}
        </span>
      </div>

      <div className="relative h-4 overflow-hidden rounded-full bg-white">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#d97745] via-[#d6a25e] to-[#326789]"
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>0%</span>
        <span className="font-mono text-lab-ink">{safeValue.toFixed(0)}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}
