'use client'

import { useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'

import { useIndexingCheckStore } from '@/stores/indexing-check'

import IndexingCheckPanel from './indexing-check-panel'

export default function IndexingCheckInput() {
  const t = useTranslations('indexingCheck')
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const checkIndexing = useIndexingCheckStore((state) => state.checkIndexing)
  const loading = useIndexingCheckStore((state) => state.loading)
  const error = useIndexingCheckStore((state) => state.error)
  const result = useIndexingCheckStore((state) => state.result)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = url.trim()

    if (!trimmed) {
      setValidationError(t('validationError'))
      return
    }

    // 验证URL格式
    try {
      new URL(trimmed)
    } catch {
      setValidationError(t('invalidUrl'))
      return
    }

    setValidationError(null)
    await checkIndexing(trimmed)
  }

  return (
    <div className="space-y-6">
      <section className="border-border/60 bg-card/80 rounded-3xl border p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">{t('sectionTitle')}</p>
            <h2 className="text-foreground mt-2 text-2xl font-semibold">{t('inputTitle')}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{t('inputDescription')}</p>
          </div>
        </div>
        <form className="mt-6 flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="indexingUrl">
            {t('urlLabel')}
          </label>
          <input
            id="indexingUrl"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={t('urlPlaceholder')}
            className="border-input focus:ring-primary/70 bg-background/50 flex-1 rounded-2xl border px-4 py-3 text-base focus:ring-2 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-5 py-3 text-sm font-semibold tracking-wide uppercase transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t('checking') : t('checkButton')}
          </button>
        </form>
        {(validationError || error) && (
          <p className="text-destructive mt-4 text-sm" role="alert" aria-live="assertive">
            {validationError || error}
          </p>
        )}
      </section>

      <IndexingCheckPanel result={result} loading={loading} />
    </div>
  )
}
