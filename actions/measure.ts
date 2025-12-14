'use server'

import { measurePageSpeed } from '@/lib/measure'

export default async function measurePerformance(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
) {
  return measurePageSpeed(url, strategy)
}
