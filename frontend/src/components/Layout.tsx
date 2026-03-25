import { motion } from 'framer-motion'
import { FlaskConical, History, LayoutDashboard, Sparkles } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { clsx } from 'clsx'

const navCls = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200',
    isActive
      ? 'bg-white text-lab-ink shadow-float ring-1 ring-[#eadfce]'
      : 'text-slate-800 hover:bg-white/70 hover:text-lab-ink',
  )

export function Layout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-page-wash">
      <div className="mesh-orb mesh-orb--warm left-[-4rem] top-16 h-48 w-48" />
      <div className="mesh-orb mesh-orb--cool right-[-3rem] top-24 h-56 w-56" />

      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col px-3 pb-10 pt-3 sm:px-6 sm:pb-16 sm:pt-6 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-panel soft-ring sticky top-3 z-20 mb-6 rounded-[24px] border border-lab-border px-4 py-4 sm:top-4 sm:mb-10 sm:rounded-[32px] sm:px-6 sm:py-5"
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3 sm:items-center sm:gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-orange-100 via-white to-sky-100 shadow-float ring-1 ring-[#eadfce] sm:h-16 sm:w-16 sm:rounded-[28px]">
                <FlaskConical className="h-8 w-8 text-lab-accent2" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b4f39] sm:text-xs sm:tracking-[0.32em]">
                  PromptLab Studio
                </p>
                <h1 className="font-display text-[1.35rem] font-semibold leading-tight tracking-tight text-[#182535] sm:text-[2rem]">
                  Professional prompt experimentation, reimagined.
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-800 sm:text-[15px] sm:leading-7">
                  Build better prompts with a cleaner workflow, richer analysis, and a calmer visual system.
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2 rounded-[22px] bg-lab-panel/80 p-2 sm:rounded-full sm:p-2.5">
              <NavLink to="/" end className={navCls}>
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </NavLink>
              <NavLink to="/workspace" className={navCls}>
                <Sparkles className="h-4 w-4" />
                Workspace
              </NavLink>
              <NavLink to="/history" className={navCls}>
                <History className="h-4 w-4" />
                History
              </NavLink>
            </nav>
          </div>
        </motion.header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
