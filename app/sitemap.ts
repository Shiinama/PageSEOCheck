import { unstable_noStore } from 'next/cache'

import { locales } from '@/i18n/routing'

import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  unstable_noStore()

  const routes = ['']

  const entries: MetadataRoute.Sitemap = []

  for (const route of routes) {
    entries.push({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}${route}`,
      alternates: {
        languages: Object.fromEntries(
          locales
            .filter((locale) => locale.code !== 'en')
            .map((locale) => [locale.code, `${process.env.NEXT_PUBLIC_BASE_URL}/${locale.code}${route}`])
        )
      }
    })
  }

  return entries
}
