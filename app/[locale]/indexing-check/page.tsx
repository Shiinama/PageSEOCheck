import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import IndexingCheckInput from '@/components/performance-audit/indexing-check-input'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('indexingCheck')
  return {
    title: t('metaTitle'),
    description: t('metaDescription')
  }
}

export default async function IndexingCheckPage() {
  const t = await getTranslations('indexingCheck')
  return (
    <div className="w-full space-y-8">
      <header className="text-center">
        <h1 className="text-primary text-4xl leading-tight font-bold md:text-5xl">{t('title')}</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-base md:text-lg">{t('description')}</p>
      </header>

      <IndexingCheckInput />
    </div>
  )
}
