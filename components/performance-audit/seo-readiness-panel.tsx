'use client'

import { useTranslations } from 'next-intl'

import type { MeasureResponse } from '@/lib/measure'

type SEOReadinessPanelProps = {
  measurement: MeasureResponse
}

export default function SEOReadinessPanel({ measurement }: SEOReadinessPanelProps) {
  const t = useTranslations('seoChecker.seoReadinessPanel')
  const { seoReadiness, crawlability, canonical, headings, meta } = measurement

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary'
    if (score >= 60) return 'text-foreground'
    return 'text-destructive'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-primary/10 text-primary'
    if (score >= 60) return 'bg-muted text-foreground'
    return 'bg-destructive/10 text-destructive'
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-foreground text-sm font-semibold">{t('title')}</p>
        <p className="text-muted-foreground mt-1 text-xs">{t('subtitle')}</p>
      </div>

      <div className="space-y-4">
        {/* Layer 1: Crawlability & Indexability (30%) */}
        <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-semibold">{t('layer1.title')}</p>
              <p className="text-muted-foreground text-xs">{t('layer1.weight')}</p>
            </div>
            <span className={`${getScoreBadge(seoReadiness.crawlability)} rounded-full px-3 py-1 text-sm font-bold`}>
              {seoReadiness.crawlability}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer1.httpStatus')}</span>
              <span className={crawlability.httpStatus === 200 ? 'text-primary font-semibold' : 'text-destructive'}>
                {crawlability.httpStatus ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer1.blockedByRobots')}</span>
              <span className={!crawlability.isBlockedByRobots ? 'text-primary font-semibold' : 'text-destructive'}>
                {crawlability.isBlockedByRobots ? t('yes') : t('no')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer1.hasNoindex')}</span>
              <span className={!crawlability.hasNoindex ? 'text-primary font-semibold' : 'text-destructive'}>
                {crawlability.hasNoindex ? t('yes') : t('no')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer1.canonical')}</span>
              <span
                className={
                  canonical.exists && canonical.pointsToSelf ? 'text-primary font-semibold' : 'text-muted-foreground'
                }
              >
                {canonical.exists
                  ? canonical.pointsToSelf
                    ? t('layer1.valid')
                    : t('layer1.pointsElsewhere')
                  : t('layer1.missing')}
              </span>
            </div>
          </div>
        </div>

        {/* Layer 2: Basic On-Page (25%) */}
        <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-semibold">{t('layer2.title')}</p>
              <p className="text-muted-foreground text-xs">{t('layer2.weight')}</p>
            </div>
            <span className={`${getScoreBadge(seoReadiness.basicOnPage)} rounded-full px-3 py-1 text-sm font-bold`}>
              {seoReadiness.basicOnPage}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer2.titleLabel')}</span>
              <span className={meta.titleStatus === 'within' ? 'text-primary font-semibold' : 'text-destructive'}>
                {meta.titleStatus === 'within'
                  ? t('layer1.valid')
                  : meta.titleStatus === 'long'
                    ? t('tooLong')
                    : t('layer1.missing')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer2.description')}</span>
              <span className={meta.descriptionStatus === 'within' ? 'text-primary font-semibold' : 'text-destructive'}>
                {meta.descriptionStatus === 'within'
                  ? t('layer1.valid')
                  : meta.descriptionStatus === 'long'
                    ? t('tooLong')
                    : t('layer1.missing')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer2.h1Count')}</span>
              <span className={headings.hasUniqueH1 ? 'text-primary font-semibold' : 'text-destructive'}>
                {headings.h1Count} {headings.hasUniqueH1 ? `(${t('layer2.unique')})` : `(${t('layer2.multiple')})`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer2.h2h3Structure')}</span>
              <span className={headings.hasProperStructure ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                {headings.h2Count} H2, {headings.h3Count} H3
              </span>
            </div>
          </div>
        </div>

        {/* Layer 3: Tech & UX (15%) */}
        <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-semibold">{t('layer3.title')}</p>
              <p className="text-muted-foreground text-xs">{t('layer3.weight')}</p>
            </div>
            <span className={`${getScoreBadge(seoReadiness.techExperience)} rounded-full px-3 py-1 text-sm font-bold`}>
              {seoReadiness.techExperience}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer3.lcp')}</span>
              <span
                className={
                  measurement.coreWebVitals.lcp.value !== null && measurement.coreWebVitals.lcp.value < 4000
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                }
              >
                {measurement.coreWebVitals.lcp.value
                  ? `${(measurement.coreWebVitals.lcp.value / 1000).toFixed(1)}s`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer3.mobileFriendly')}</span>
              <span
                className={
                  measurement.mobileFriendly.status === 'pass' ? 'text-primary font-semibold' : 'text-destructive'
                }
              >
                {measurement.mobileFriendly.status === 'pass' ? t('yes') : t('no')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer3.https')}</span>
              <span className={measurement.isHttps ? 'text-primary font-semibold' : 'text-destructive'}>
                {measurement.isHttps ? t('yes') : t('no')}
              </span>
            </div>
          </div>
        </div>

        {/* Layer 4: SEO Opportunity (10%) */}
        <div className="border-border/40 bg-muted/20 rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm font-semibold">{t('layer4.title')}</p>
              <p className="text-muted-foreground text-xs">{t('layer4.weight')}</p>
            </div>
            <span className={`${getScoreBadge(seoReadiness.seoOpportunity)} rounded-full px-3 py-1 text-sm font-bold`}>
              {seoReadiness.seoOpportunity}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('layer4.structureQuality')}</span>
              <span className={headings.hasProperStructure ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                {headings.hasProperStructure ? t('layer4.good') : t('layer4.needsImprovement')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Score Summary */}
      <div className="border-border/40 bg-card/50 mt-6 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm font-semibold">{t('overall.title')}</p>
            <p className="text-muted-foreground text-xs">
              {seoReadiness.overall < 60
                ? t('overall.notSeoReady')
                : seoReadiness.overall < 80
                  ? t('overall.optimizable')
                  : t('overall.seoReady')}
            </p>
          </div>
          <span className={`${getScoreColor(seoReadiness.overall)} text-3xl font-bold`}>{seoReadiness.overall}</span>
        </div>
      </div>
    </div>
  )
}
