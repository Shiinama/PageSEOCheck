'use client'

import { useTranslations } from 'next-intl'

import type { MeasureResponse } from '@/lib/measure'

type MetricHighlight = {
  label: string
  value: string
  trend: string
  detail: string
}

const buildHighlights = (report: MeasureResponse, t: ReturnType<typeof useTranslations>): MetricHighlight[] => {
  const performanceValue = report.performanceScore !== null ? `${report.performanceScore}` : '—'
  const seoReadinessValue = `${report.seoReadiness.overall}`

  const getReadinessLabel = (score: number) => {
    if (score < 60) return t('signalOverview.notSeoReady')
    if (score < 80) return t('signalOverview.optimizable')
    return t('signalOverview.seoReady')
  }

  const getReadinessDetail = (readiness: MeasureResponse['seoReadiness']) => {
    const parts = [
      `${t('signalOverview.crawlability')}: ${readiness.crawlability}`,
      `${t('signalOverview.onPage')}: ${readiness.basicOnPage}`,
      `${t('signalOverview.tech')}: ${readiness.techExperience}`,
      `${t('signalOverview.opportunity')}: ${readiness.seoOpportunity}`
    ]
    return parts.join(' · ')
  }

  return [
    {
      label: t('signalOverview.seoReadiness'),
      value: seoReadinessValue,
      trend: getReadinessLabel(report.seoReadiness.overall),
      detail: getReadinessDetail(report.seoReadiness)
    },
    {
      label: t('signalOverview.performance'),
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
  const t = useTranslations('seoChecker')
  const metrics = buildHighlights(measurement, t)

  return (
    <div className="w-full space-y-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="border-border/40 bg-muted/20 rounded-2xl border p-6 transition-shadow hover:shadow-md"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <p className="text-muted-foreground text-sm font-semibold">{metric.label}</p>
                <span className="text-muted-foreground/80 bg-muted/50 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tracking-[0.2em] uppercase">
                  {t('signalOverview.live')}
                </span>
              </div>
              <h4 className="text-primary mb-2 text-4xl leading-tight font-bold">{metric.value}</h4>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">{metric.trend}</p>
            <p className="text-foreground/90 text-sm leading-relaxed">{metric.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
