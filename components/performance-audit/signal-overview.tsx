'use client'

import type { MeasureResponse } from '@/lib/measure'

type MetricHighlight = {
  label: string
  value: string
  trend: string
  detail: string
}

const buildHighlights = (report: MeasureResponse): MetricHighlight[] => {
  const performanceValue = report.performanceScore !== null ? `${report.performanceScore}` : '—'

  return [
    {
      label: 'Performance',
      value: performanceValue,
      trend: report.performanceLabel,
      detail: report.performanceDetail
    }
  ]
}

type SignalOverviewProps = {
  measurement: MeasureResponse
}

export default function SignalOverview({ measurement }: SignalOverviewProps) {
  const metrics = buildHighlights(measurement)

  return (
    <div className="w-full space-y-6">
      {metrics.map((metric, index) => (
        <div key={metric.label} className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-muted-foreground min-w-0 flex-1 text-sm font-semibold">{metric.label}</p>
            <span className="text-muted-foreground/80 bg-muted/50 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tracking-[0.2em] uppercase">
              Live
            </span>
          </div>
          <h4 className="text-primary text-3xl leading-tight font-bold">{metric.value}</h4>
          <p className="text-muted-foreground text-sm">{metric.trend}</p>
          <p className="text-foreground/90 text-sm leading-relaxed">{metric.detail}</p>
          {index < metrics.length - 1 && <div className="border-border/40 border-b pt-6" aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}
