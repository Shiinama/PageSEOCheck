'use client'

import type { MeasureResponse } from '@/lib/measure'

const formatResourceStatus = (resource: { exists: boolean; status: number | null }) =>
  resource.exists ? 'Present' : resource.status ? `Missing (HTTP ${resource.status})` : 'Unavailable'

type IndexingPanelProps = {
  measurement: MeasureResponse
}

export default function IndexingPanel({ measurement }: IndexingPanelProps) {
  return (
    <div className="min-w-0 space-y-4">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">Indexing hints</p>
        <h4 className="text-foreground mt-2 text-lg font-semibold">Robots & sitemaps</h4>
      </div>
      <div className="space-y-4 text-sm">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground min-w-0 font-medium">Robots.txt</span>
            <span className="text-foreground shrink-0 font-semibold">{formatResourceStatus(measurement.robots)}</span>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs break-all">{measurement.robots.url}</p>
        </div>
        <div className="border-border/40 border-b pt-4" aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground min-w-0 font-medium">Sitemap</span>
            <span className="text-foreground shrink-0 font-semibold">{formatResourceStatus(measurement.sitemap)}</span>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs break-all">{measurement.sitemap.url}</p>
        </div>
      </div>
    </div>
  )
}
