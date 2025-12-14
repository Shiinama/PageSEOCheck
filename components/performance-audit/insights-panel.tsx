'use client'

import type { MeasureResponse } from '@/lib/measure'

type MetricDefinition = {
  key: string
  label: string
  format: (value: number) => string
}

const METRIC_AUDITS: MetricDefinition[] = [
  {
    key: 'first-contentful-paint',
    label: 'First Contentful Paint',
    format: (value) => `${(value / 1000).toFixed(1)}s`
  },
  {
    key: 'largest-contentful-paint',
    label: 'Largest Contentful Paint',
    format: (value) => `${(value / 1000).toFixed(1)}s`
  },
  { key: 'speed-index', label: 'Speed Index', format: (value) => `${Math.round(value)}ms` },
  { key: 'interactive', label: 'Time to Interactive', format: (value) => `${(value / 1000).toFixed(1)}s` },
  { key: 'total-blocking-time', label: 'Total Blocking Time', format: (value) => `${Math.round(value)}ms` },
  { key: 'max-potential-fid', label: 'Max Potential FID', format: (value) => `${Math.round(value)}ms` },
  { key: 'cumulative-layout-shift', label: 'Cumulative Layout Shift', format: (value) => value.toFixed(2) }
]

const OPPORTUNITY_AUDITS: Array<{ key: string; label: string }> = [
  { key: 'render-blocking-insight', label: 'Render blocking' },
  { key: 'unused-javascript', label: 'Unused JavaScript' },
  { key: 'legacy-javascript-insight', label: 'Legacy JavaScript' },
  { key: 'cache-insight', label: 'Cache hints' },
  { key: 'third-parties-insight', label: 'Third parties' }
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
  const audits = measurement.pageSpeedMeta?.audits
  const configSettings = measurement.pageSpeedMeta?.configSettings
  const environment = measurement.pageSpeedMeta?.environment

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
          <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">Lighthouse insights</p>
          <h4 className="text-foreground mt-2 text-xl font-semibold">Expand on the lab results</h4>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs font-medium">
          {measurement.pageSpeedMeta?.fetchTime
            ? new Date(measurement.pageSpeedMeta.fetchTime).toLocaleString()
            : 'Lab data snapshot'}
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <div className="mb-4">
            <p className="text-foreground text-sm font-semibold">Core lab metrics</p>
            <p className="text-muted-foreground mt-1 text-xs">Performance measurements from Lighthouse</p>
          </div>
          <dl className="space-y-5">
            {METRIC_AUDITS.map((metric, index) => {
              const audit = audits?.[metric.key]
              const isLast = index === METRIC_AUDITS.length - 1
              return (
                <div key={metric.key} className="space-y-2">
                  <dt className="text-muted-foreground text-xs font-medium tracking-[0.3em] uppercase">
                    {metric.label}
                  </dt>
                  <dd className="text-primary text-2xl font-bold">{formatMetricValue(audit, metric.format)}</dd>
                  {audit?.description && (
                    <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{audit.description}</p>
                  )}
                  {!isLast && <div className="border-border/40 mt-4 border-b" aria-hidden="true" />}
                </div>
              )
            })}
          </dl>
        </section>

        <div className="border-border/40 border-t pt-8">
          <section>
            <div className="mb-4">
              <p className="text-foreground text-sm font-semibold">Resource summary</p>
              <p className="text-muted-foreground mt-1 text-xs">Network transfer and request statistics</p>
            </div>
            <div className="text-muted-foreground space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 font-medium">Total requests</span>
                <span className="text-foreground shrink-0 text-base font-bold">
                  {formatCount(totalRow?.requestCount)}
                </span>
              </div>
              <div className="border-border/40 border-b" aria-hidden="true" />
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 font-medium">Total transfer</span>
                <span className="text-primary shrink-0 text-base font-bold">{formatBytes(totalRow?.transferSize)}</span>
              </div>
              <div className="border-border/40 border-b" aria-hidden="true" />
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 font-medium">Script transfer</span>
                <span className="text-foreground shrink-0 text-base font-bold">
                  {formatBytes(scriptRow?.transferSize)}
                </span>
              </div>
              <div className="border-border/40 border-b" aria-hidden="true" />
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 font-medium">Third-party transfer</span>
                <span className="text-foreground shrink-0 text-base font-bold">
                  {formatBytes(thirdPartyRow?.transferSize)}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="border-border/40 border-t pt-8">
          <section>
            <div className="mb-4">
              <p className="text-foreground text-sm font-semibold">Scanning environment</p>
              <p className="text-muted-foreground mt-1 text-xs">Device and network configuration</p>
            </div>
            <div className="text-muted-foreground grid gap-4 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <span className="font-medium">Device</span>
                <p className="text-foreground font-semibold">{configSettings?.formFactor ?? 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium">Benchmark</span>
                <p className="text-primary font-semibold">
                  {environment?.benchmarkIndex ? environment.benchmarkIndex.toFixed(1) : 'N/A'}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="font-medium">Network UA</span>
                <p className="text-foreground mt-1 font-mono text-xs leading-relaxed break-all">
                  {environment?.networkUserAgent ?? '—'}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="font-medium">Host UA</span>
                <p className="text-foreground mt-1 font-mono text-xs leading-relaxed break-all">
                  {environment?.hostUserAgent ?? '—'}
                </p>
              </div>
            </div>
          </section>

          <div className="border-border/40 mt-8 space-y-4 border-t pt-8">
            <div>
              <p className="text-foreground text-sm font-semibold">Opportunities</p>
              <p className="text-muted-foreground mt-1 text-xs">Optimization suggestions</p>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              {OPPORTUNITY_AUDITS.filter((opportunity) => audits?.[opportunity.key]).map((opportunity) => {
                const audit = audits?.[opportunity.key]
                return (
                  <div key={opportunity.key} className="space-y-2">
                    <p className="text-foreground font-semibold">{opportunity.label}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {audit?.displayValue ?? audit?.description ?? 'No issues reported'}
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
