'use client'

import { useTranslations } from 'next-intl'

import type { MeasureResponse } from '@/lib/measure'

const formatResourceStatus = (
  resource: { exists: boolean; status: number | null },
  t: ReturnType<typeof useTranslations>
) => (resource.exists ? t('present') : resource.status ? `${t('missing')} (HTTP ${resource.status})` : t('unavailable'))

type IndexingPanelProps = {
  measurement: MeasureResponse
}

export default function IndexingPanel({ measurement }: IndexingPanelProps) {
  const t = useTranslations('seoChecker.indexingPanel')
  return (
    <div className="min-w-0 space-y-4">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">{t('title')}</p>
        <h4 className="text-foreground mt-2 text-lg font-semibold">{t('subtitle')}</h4>
      </div>
      <div className="space-y-4 text-sm">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground min-w-0 font-medium">{t('robotsTxt')}</span>
            <span className="text-foreground shrink-0 font-semibold">
              {formatResourceStatus(measurement.robots, t)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs break-all">{measurement.robots.url}</p>
        </div>
        <div className="border-border/40 border-b pt-4" aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground min-w-0 font-medium">{t('sitemap')}</span>
            <span className="text-foreground shrink-0 font-semibold">
              {formatResourceStatus(measurement.sitemap, t)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs break-all">{measurement.sitemap.url}</p>
        </div>
      </div>
    </div>
  )
}
