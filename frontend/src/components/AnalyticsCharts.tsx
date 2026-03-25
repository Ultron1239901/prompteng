import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { VariationResultOut } from '@/types'

const COLORS = ['#d97745', '#326789', '#6f8f72', '#b7791f']

export function ScoreBarChart({ results }: { results: VariationResultOut[] }) {
  const data = results.map((result) => ({
    name: result.label.slice(0, 18),
    clarity: result.evaluation.clarity,
    relevance: result.evaluation.relevance,
    depth: result.evaluation.depth,
    creativity: result.evaluation.creativity,
  }))

  return (
    <div className="h-80 w-full rounded-[28px] border border-lab-border bg-lab-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#ddcfbf" />
          <XAxis dataKey="name" tick={{ fill: '#7a6b5c', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fill: '#7a6b5c', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#fffdf9',
              border: '1px solid #e7dac8',
              borderRadius: 18,
              boxShadow: '0 18px 40px -24px rgba(69, 46, 26, 0.28)',
            }}
          />
          <Bar dataKey="clarity" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
          <Bar dataKey="relevance" fill={COLORS[1]} radius={[8, 8, 0, 0]} />
          <Bar dataKey="depth" fill={COLORS[2]} radius={[8, 8, 0, 0]} />
          <Bar dataKey="creativity" fill={COLORS[3]} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RadarForPrompt({ result, color }: { result: VariationResultOut; color: string }) {
  const data = [
    { metric: 'Clarity', value: result.evaluation.clarity },
    { metric: 'Relevance', value: result.evaluation.relevance },
    { metric: 'Depth', value: result.evaluation.depth },
    { metric: 'Creativity', value: result.evaluation.creativity },
  ]

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="78%" data={data}>
          <PolarGrid stroke="#d8c7b4" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#7a6b5c', fontSize: 11 }} />
          <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
          <Tooltip
            contentStyle={{
              background: '#fffdf9',
              border: '1px solid #e7dac8',
              borderRadius: 18,
              boxShadow: '0 18px 40px -24px rgba(69, 46, 26, 0.28)',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
