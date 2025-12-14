'use client'

import { useTranslations } from 'next-intl'

import type { MeasureResponse } from '@/lib/measure'

type MetricDefinition = {
  key: string
  labelKey: string
  format: (value: number) => string
}

const METRIC_AUDITS: MetricDefinition[] = [
  {
    key: 'first-contentful-paint',
    labelKey: 'firstContentfulPaint',
    format: (value) => `${(value / 1000).toFixed(1)}s`
  },
  {
    key: 'largest-contentful-paint',
    labelKey: 'largestContentfulPaint',
    format: (value) => `${(value / 1000).toFixed(1)}s`
  },
  { key: 'speed-index', labelKey: 'speedIndex', format: (value) => `${Math.round(value)}ms` },
  { key: 'interactive', labelKey: 'timeToInteractive', format: (value) => `${(value / 1000).toFixed(1)}s` },
  { key: 'total-blocking-time', labelKey: 'totalBlockingTime', format: (value) => `${Math.round(value)}ms` },
  { key: 'max-potential-fid', labelKey: 'maxPotentialFid', format: (value) => `${Math.round(value)}ms` },
  { key: 'cumulative-layout-shift', labelKey: 'cumulativeLayoutShift', format: (value) => value.toFixed(2) }
]

const OPPORTUNITY_AUDITS: Array<{ key: string; labelKey: string }> = [
  { key: 'render-blocking-insight', labelKey: 'renderBlocking' },
  { key: 'unused-javascript', labelKey: 'unusedJavascript' },
  { key: 'legacy-javascript-insight', labelKey: 'legacyJavascript' }
]

const formatBytes = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? `${(value / 1024).toFixed(1)} KB` : '—'

const formatCount = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? `${value}` : '—')

const formatMetricValue = (
  audit?: { displayValue?: string; numericValue?: number },
  formatter?: (value: number) => string
) => {
  if (audit?.displayValue) {
    return audit.displayValue
  }
  if (typeof audit?.numericValue === 'number' && formatter) {
    return formatter(audit.numericValue)
  }
  return '—'
}

type InsightsPanelProps = {
  measurement: MeasureResponse
}

export default function InsightsPanel({ measurement }: InsightsPanelProps) {
  const t = useTranslations('seoChecker.insightsPanel')
  const audits = measurement.performanceMeta?.audits
  const configSettings = measurement.performanceMeta?.configSettings
  const environment = measurement.performanceMeta?.environment

  const resourceSummary = audits?.['resource-summary']?.details as
    | {
        items?: Array<{ resourceType?: string; transferSize?: number; requestCount?: number }>
      }
    | null
    | undefined
  const totalRow = resourceSummary?.items?.find((item) => item.resourceType === 'total')
  const scriptRow = resourceSummary?.items?.find((item) => item.resourceType === 'script')
  const thirdPartyRow = resourceSummary?.items?.find((item) => item.resourceType === 'third-party')

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">{t('title')}</p>
          <h4 className="text-foreground mt-2 text-xl font-semibold">{t('subtitle')}</h4>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs font-medium">
          {measurement.performanceMeta?.fetchTime
            ? new Date(measurement.performanceMeta.fetchTime).toLocaleString()
            : t('labDataSnapshot')}
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <div className="mb-6">
            <p className="text-foreground text-sm font-semibold">{t('coreLabMetrics.title')}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t('coreLabMetrics.description')}</p>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METRIC_AUDITS.map((metric) => {
              const audit = audits?.[metric.key]
              return (
                <div
                  key={metric.key}
                  className="border-border/40 bg-muted/20 rounded-xl border p-4 transition-shadow hover:shadow-sm"
                >
                  <dt className="text-muted-foreground mb-2 text-xs font-medium tracking-[0.2em] uppercase">
                    {t(`coreLabMetrics.${metric.labelKey}`)}
                  </dt>
                  <dd className="text-primary text-2xl font-bold">{formatMetricValue(audit, metric.format)}</dd>
                </div>
              )
            })}
          </dl>
        </section>

        <div className="border-border/40 border-t pt-8">
          <section>
            <div className="mb-6">
              <p className="text-foreground text-sm font-semibold">{t('resourceSummary.title')}</p>
              <p className="text-muted-foreground mt-1 text-xs">{t('resourceSummary.description')}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
                <p className="text-muted-foreground mb-2 text-xs font-medium">{t('resourceSummary.totalRequests')}</p>
                <p className="text-foreground text-2xl font-bold">{formatCount(totalRow?.requestCount)}</p>
              </div>
              <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
                <p className="text-muted-foreground mb-2 text-xs font-medium">{t('resourceSummary.totalTransfer')}</p>
                <p className="text-primary text-2xl font-bold">{formatBytes(totalRow?.transferSize)}</p>
              </div>
              <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
                <p className="text-muted-foreground mb-2 text-xs font-medium">{t('resourceSummary.scriptTransfer')}</p>
                <p className="text-foreground text-2xl font-bold">{formatBytes(scriptRow?.transferSize)}</p>
              </div>
              <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  {t('resourceSummary.thirdPartyTransfer')}
                </p>
                <p className="text-foreground text-2xl font-bold">{formatBytes(thirdPartyRow?.transferSize)}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="border-border/40 border-t pt-8">
          <section>
            <div className="mb-6">
              <p className="text-foreground text-sm font-semibold">{t('scanningEnvironment.title')}</p>
              <p className="text-muted-foreground mt-1 text-xs">{t('scanningEnvironment.description')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
                <p className="text-muted-foreground mb-2 text-xs font-medium">{t('scanningEnvironment.device')}</p>
                <p className="text-foreground text-lg font-semibold capitalize">
                  {configSettings?.formFactor ?? t('scanningEnvironment.unknown')}
                </p>
              </div>
              <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
                <p className="text-muted-foreground mb-2 text-xs font-medium">{t('scanningEnvironment.benchmark')}</p>
                <p className="text-primary text-lg font-semibold">
                  {environment?.benchmarkIndex ? environment.benchmarkIndex.toFixed(1) : 'N/A'}
                </p>
              </div>
              {environment?.networkUserAgent && (
                <div className="border-border/40 bg-muted/20 rounded-xl border p-4 sm:col-span-2">
                  <p className="text-muted-foreground mb-2 text-xs font-medium">{t('scanningEnvironment.networkUA')}</p>
                  <p className="text-foreground font-mono text-xs leading-relaxed break-all">
                    {environment.networkUserAgent}
                  </p>
                </div>
              )}
              {environment?.hostUserAgent && (
                <div className="border-border/40 bg-muted/20 rounded-xl border p-4 sm:col-span-2">
                  <p className="text-muted-foreground mb-2 text-xs font-medium">{t('scanningEnvironment.hostUA')}</p>
                  <p className="text-foreground font-mono text-xs leading-relaxed break-all">
                    {environment.hostUserAgent}
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="border-border/40 mt-8 border-t pt-8">
            <div className="mb-6">
              <p className="text-foreground text-sm font-semibold">{t('opportunities.title')}</p>
              <p className="text-muted-foreground mt-1 text-xs">{t('opportunities.description')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {OPPORTUNITY_AUDITS.filter((opportunity) => audits?.[opportunity.key]).map((opportunity) => {
                const audit = audits?.[opportunity.key]
                return (
                  <div key={opportunity.key} className="border-border/40 bg-muted/20 rounded-xl border p-4">
                    <p className="text-foreground mb-2 font-semibold">{t(`opportunities.${opportunity.labelKey}`)}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {audit?.displayValue ?? audit?.description ?? t('opportunities.noIssuesReported')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
