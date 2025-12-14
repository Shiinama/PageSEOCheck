'use server'

import { getLocale } from 'next-intl/server'

import { measurePageSpeed } from '@/lib/measure'

export default async function measurePerformance(url: string, strategy: 'mobile' | 'desktop' = 'mobile') {
  const locale = await getLocale()
  return measurePageSpeed(url, strategy, locale)
}
