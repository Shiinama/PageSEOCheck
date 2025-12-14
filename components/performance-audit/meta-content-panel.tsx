'use client'

import { useTranslations } from 'next-intl'

import type { MeasureResponse } from '@/lib/measure'

const formatMetaStatus = (
  status: 'missing' | 'within' | 'long',
  length: number,
  limit: number,
  t: ReturnType<typeof useTranslations>
) => {
  if (status === 'missing') return t('missing')
  if (status === 'long') return t('tooLong', { length, limit })
  return t('withinLimit', { length, limit })
}

const getStatusColor = (status: 'missing' | 'within' | 'long') => {
  if (status === 'missing') return 'text-destructive'
  if (status === 'long') return 'text-primary'
  return 'text-foreground'
}

type MetaContentPanelProps = {
  measurement: MeasureResponse
}

export default function MetaContentPanel({ measurement }: MetaContentPanelProps) {
  const t = useTranslations('seoChecker.metaContentPanel')
  return (
    <div className="min-w-0 space-y-4">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">{t('title')}</p>
        <h4 className="text-foreground mt-2 text-lg font-semibold">{t('subtitle')}</h4>
      </div>
      <div className="space-y-4 text-sm">
        <div className="min-w-0">
          <p className="text-muted-foreground font-medium">{t('titleLabel')}</p>
          <p className="text-foreground mt-1 font-semibold">{measurement.meta.title ?? t('missing')}</p>
          <p className={`mt-1 text-xs font-medium ${getStatusColor(measurement.meta.titleStatus)}`}>
            {formatMetaStatus(
              measurement.meta.titleStatus,
              measurement.meta.titleLength,
              measurement.meta.titleLimit,
              t
            )}
          </p>
        </div>
        <div className="border-border/40 border-b pt-4" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-muted-foreground font-medium">{t('description')}</p>
          <p className="text-foreground mt-1 font-semibold">{measurement.meta.description ?? t('missing')}</p>
          <p className={`mt-1 text-xs font-medium ${getStatusColor(measurement.meta.descriptionStatus)}`}>
            {formatMetaStatus(
              measurement.meta.descriptionStatus,
              measurement.meta.descriptionLength,
              measurement.meta.descriptionLimit,
              t
            )}
          </p>
        </div>
        <div className="border-border/40 border-t pt-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-[0.3em] uppercase">
            {t('contentSummary')}
          </p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              {t('contentTextLength')}{' '}
              <span className="text-foreground font-semibold">{measurement.contentSummary.textCharacters}</span>{' '}
              {t('characters')}
            </p>
            <p>
              {t('wordCount')}{' '}
              <span className="text-foreground font-semibold">{measurement.contentSummary.wordCount}</span>
            </p>
            <p>
              {t('htmlSize')}{' '}
              <span className="text-foreground font-semibold">{measurement.contentSummary.htmlCharacters}</span>{' '}
              {t('characters')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
