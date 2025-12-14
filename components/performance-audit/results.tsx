'use client'

import { useTranslations } from 'next-intl'

import IndexingPanel from '@/components/performance-audit/indexing-panel'
import InsightsPanel from '@/components/performance-audit/insights-panel'
import MetaContentPanel from '@/components/performance-audit/meta-content-panel'
import SEOReadinessPanel from '@/components/performance-audit/seo-readiness-panel'
import SignalOverview from '@/components/performance-audit/signal-overview'
import SiteSummary from '@/components/performance-audit/site-summary'
import { useMeasurementStore } from '@/stores/performance-measurement'

export default function PerformanceAuditResults() {
  const t = useTranslations('seoChecker.results')
  const measurement = useMeasurementStore((state) => state.measurement)

  if (!measurement) return null

  return (
    <article className="border-border/60 bg-card/80 w-full min-w-0 rounded-3xl border p-6 shadow-sm backdrop-blur-sm">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">{t('signalOverview')}</p>
          <h3 className="text-primary mt-2 text-2xl font-semibold">{t('title')}</h3>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs font-medium">{t('scoresUpdate')}</p>
      </header>

      <SignalOverview measurement={measurement} />

      <div className="border-border/40 mt-8 border-t pt-8">
        <SEOReadinessPanel measurement={measurement} />
      </div>

      <div className="border-border/40 mt-8 border-t pt-8">
        <InsightsPanel measurement={measurement} />
      </div>

      <div className="border-border/40 mt-8 grid gap-6 border-t pt-8 sm:grid-cols-2 lg:grid-cols-3">
        <SiteSummary measurement={measurement} />
        <IndexingPanel measurement={measurement} />
        <MetaContentPanel measurement={measurement} />
      </div>
    </article>
  )
}
