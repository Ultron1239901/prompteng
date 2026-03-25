import { motion } from 'framer-motion'

export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-2xl bg-white/80 ${className ?? ''}`}
      animate={{ opacity: [0.5, 0.95, 0.5] }}
      transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export function RunSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-[28px] border border-lab-border bg-lab-surface p-5">
          <SkeletonPulse className="mb-3 h-5 w-1/3" />
          <SkeletonPulse className="mb-3 h-28 w-full" />
          <SkeletonPulse className="h-20 w-full" />
        </div>
      ))}
    </div>
  )
}
