'use client'

import { FormEvent, useMemo, useState } from 'react'

import { useMeasurementStore } from '@/stores/performance-measurement'

const formatTimestamp = (value: string | null) => {
  if (!value) return null
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return null
  }
}

export default function AnalysisPanel() {
  const [targetUrl, setTargetUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const runAnalysis = useMeasurementStore((state) => state.runAnalysis)
  const loading = useMeasurementStore((state) => state.loading)
  const error = useMeasurementStore((state) => state.error)
  const lastRun = useMeasurementStore((state) => state.lastRun)
  const lastUrl = useMeasurementStore((state) => state.lastUrl)
  const measurement = useMeasurementStore((state) => state.measurement)

  const formattedLastRun = useMemo(() => formatTimestamp(lastRun), [lastRun])
  const hasResults = Boolean(measurement)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = targetUrl.trim()

    if (!trimmed) {
      setValidationError('Please provide a URL to analyze.')
      return
    }

    setValidationError(null)

    const result = await runAnalysis(trimmed)
    if (result) {
      setTargetUrl(result.measuredUrl)
    }
  }

  return (
    <section className="border-border/60 bg-card/80 rounded-3xl border p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">Live analysis</p>
          <h2 className="text-foreground mt-2 text-2xl font-semibold">Get instant insights</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Enter any public URL and we crawl, audit, and summarize the most impactful SEO signals for you.
          </p>
        </div>
        <div className="text-muted-foreground shrink-0 text-xs font-medium md:text-sm">
          {formattedLastRun ? (
            <>
              Last run {formattedLastRun}
              {lastUrl ? ` · ${lastUrl}` : ''}
            </>
          ) : (
            'Scores update every time you request a check.'
          )}
        </div>
      </div>
      <form className="mt-8 flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="targetUrl">
          Target URL
        </label>
        <input
          id="targetUrl"
          type="url"
          value={targetUrl}
          onChange={(event) => setTargetUrl(event.target.value)}
          placeholder="https://example.com/page-to-audit"
          className="border-input focus:ring-primary/70 bg-background/50 flex-1 rounded-2xl border px-4 py-3 text-base focus:ring-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-5 py-3 text-sm font-semibold tracking-wide uppercase transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Analyzing...' : 'Analyze URL'}
        </button>
      </form>
      {(validationError || error) && (
        <p className="text-destructive mt-4 text-sm" role="alert" aria-live="assertive">
          {validationError || error}
        </p>
      )}
      {!hasResults && loading && (
        <p className="text-muted-foreground mt-4 text-sm">Analyzing... please wait for the latest data.</p>
      )}
      {!hasResults && !loading && !validationError && !error && (
        <p className="text-muted-foreground mt-4 text-sm">No results yet. Submit a URL to start the audit.</p>
      )}
    </section>
  )
}
