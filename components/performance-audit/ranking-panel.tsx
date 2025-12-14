'use client'

import { useEffect, useState } from 'react'

import type { RankingData, RankingEntry } from '@/lib/ranking'

export default function RankingPanel() {
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRanking() {
      try {
        const response = await fetch('/api/ranking')
        if (!response.ok) {
          throw new Error('Failed to fetch ranking')
        }
        const data = await response.json()
        setRanking(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ranking')
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
  }, [])

  if (loading) {
    return (
      <div className="border-border/60 bg-card/80 w-full min-w-0 rounded-3xl border p-6 shadow-sm backdrop-blur-sm">
        <p className="text-muted-foreground text-sm">Loading ranking...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-border/60 bg-card/80 w-full min-w-0 rounded-3xl border p-6 shadow-sm backdrop-blur-sm">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  if (!ranking || ranking.entries.length === 0) {
    return (
      <div className="border-border/60 bg-card/80 w-full min-w-0 rounded-3xl border p-6 shadow-sm backdrop-blur-sm">
        <p className="text-muted-foreground text-sm">
          No rankings yet. Submit a URL to start building the leaderboard.
        </p>
      </div>
    )
  }

  return (
    <div className="border-border/60 bg-card/80 w-full min-w-0 rounded-3xl border p-6 shadow-sm backdrop-blur-sm">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">SEO Leaderboard</p>
          <h3 className="text-primary mt-2 text-2xl font-semibold">Top performing websites</h3>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs font-medium">
          Updated {new Date(ranking.updatedAt).toLocaleString()}
        </p>
      </header>

      <div className="space-y-4">
        {ranking.entries.map((entry, index) => (
          <RankingItem key={`${entry.url}-${index}`} entry={entry} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

type RankingItemProps = {
  entry: RankingEntry
  rank: number
}

function RankingItem({ entry, rank }: RankingItemProps) {
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-primary text-primary-foreground'
    if (rank === 2) return 'bg-muted text-foreground'
    if (rank === 3) return 'bg-muted/80 text-foreground'
    return 'bg-background/50 text-muted-foreground'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary'
    if (score >= 60) return 'text-foreground'
    return 'text-muted-foreground'
  }

  return (
    <div className="border-border/40 flex items-center gap-4 rounded-2xl border p-4 transition-shadow hover:shadow-sm">
      <div
        className={`${getRankBadgeColor(rank)} flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold`}
      >
        {rank}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-foreground truncate text-base font-semibold">{entry.rootUrl}</h4>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{entry.url}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-2xl font-bold ${getScoreColor(entry.score)}`}>{entry.score}</p>
            <p className="text-muted-foreground text-xs">Score</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Performance</p>
            <p className="text-foreground font-semibold">{entry.performanceScore ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">LCP</p>
            <p className="text-foreground font-semibold">
              {entry.coreWebVitals.lcp ? `${(entry.coreWebVitals.lcp / 1000).toFixed(1)}s` : '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Mobile</p>
            <p className={`font-semibold ${entry.mobileFriendly ? 'text-primary' : 'text-destructive'}`}>
              {entry.mobileFriendly ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">HTTPS</p>
            <p className={`font-semibold ${entry.isHttps ? 'text-primary' : 'text-destructive'}`}>
              {entry.isHttps ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
