import { jsPDF } from 'jspdf'

import type { ExperimentDetail, ExperimentRunResponse, VariationResultOut } from '@/types'

function resultsFromRunOrDetail(
  data: ExperimentRunResponse | ExperimentDetail,
): VariationResultOut[] {
  return data.results
}

export function exportExperimentJson(data: ExperimentRunResponse | ExperimentDetail): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `promptlab-experiment-${'experiment_id' in data ? data.experiment_id : data.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportExperimentPdf(data: ExperimentRunResponse | ExperimentDetail): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  let y = margin
  const line = (text: string, size = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, 515)
    for (const ln of lines as string[]) {
      if (y > 770) {
        doc.addPage()
        y = margin
      }
      doc.text(ln, margin, y)
      y += size + 4
    }
  }

  const id = 'experiment_id' in data ? data.experiment_id : data.id
  line('PromptLab AI — Experiment Report', 16, 'bold')
  line(`Experiment ID: ${id}`, 11)
  line(`Model: ${data.model_name} (${data.provider})`, 11)
  if ('created_at' in data && data.created_at) line(`Created: ${data.created_at}`, 9)

  const results = resultsFromRunOrDetail(data)
  line('', 8)

  for (const r of results) {
    line(`${r.label}${r.is_winner ? '  ★ WINNER' : ''}`, 12, 'bold')
    line(
      `Scores — clarity: ${r.evaluation.clarity.toFixed(1)}, relevance: ${r.evaluation.relevance.toFixed(1)}, depth: ${r.evaluation.depth.toFixed(1)}, creativity: ${r.evaluation.creativity.toFixed(1)}`,
      9,
    )
    line(`Weighted: ${r.weighted_score.toFixed(2)} | Strength: ${r.strength_score.toFixed(0)}%`, 9)
    line(`Bias: ${r.bias.severity.toUpperCase()} — ${r.bias.flags.join(', ') || 'none'}`, 9)
    line(`Prompt: ${r.prompt_text.slice(0, 2000)}${r.prompt_text.length > 2000 ? '…' : ''}`, 9)
    line(`Response: ${r.response_text.slice(0, 3000)}${r.response_text.length > 3000 ? '…' : ''}`, 9)
    line('', 6)
  }

  if ('winner_explanation' in data && data.winner_explanation) {
    line('Why the winner won', 12, 'bold')
    line(data.winner_explanation, 10)
  }

  if (data.consistency) {
    line('Consistency check', 12, 'bold')
    line(`Score: ${data.consistency.overall_score.toFixed(1)} / 10`, 10)
    line(data.consistency.summary, 10)
  }

  if (data.optimization) {
    line('Optimization', 12, 'bold')
    line(`Improved prompt: ${data.optimization.improved_prompt}`, 10)
    line(`Rationale: ${data.optimization.explanation}`, 10)
  }

  doc.save(`promptlab-report-${id}.pdf`)
}
