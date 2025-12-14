import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import AnalysisPanel from '@/components/performance-audit/analysis-panel'
import PerformanceAuditResults from '@/components/performance-audit/results'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seoChecker')
  return {
    title: t('metaTitle'),
    description: t('metaDescription')
  }
}

export default async function Home() {
  const t = await getTranslations('seoChecker')
  return (
    <div className="w-full space-y-8">
      <header className="text-center">
        <h1 className="text-primary text-4xl leading-tight font-bold md:text-5xl">{t('title')}</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-base md:text-lg">{t('description')}</p>
      </header>

      <AnalysisPanel />

      <PerformanceAuditResults />
    </div>
  )
}
