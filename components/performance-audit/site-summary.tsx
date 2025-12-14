'use client'

import type { MeasureResponse } from '@/lib/measure'

type SiteSummaryProps = {
  measurement: MeasureResponse
}

export default function SiteSummary({ measurement }: SiteSummaryProps) {
  return (
    <div className="min-w-0 space-y-4">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">Scope & security</p>
        <h4 className="text-foreground mt-2 text-lg font-semibold">
          {measurement.scope === 'root' ? 'Root site' : 'Specific page'}
        </h4>
      </div>
      <div className="space-y-4 text-sm">
        <div className="min-w-0">
          <p className="text-muted-foreground">Analyzed host</p>
          <p className="text-foreground mt-1 font-mono text-xs break-all">{measurement.rootUrl}</p>
        </div>
        <div className="border-border/40 border-b pt-4" aria-hidden="true" />
        <div>
          <p className="text-muted-foreground">Protocol</p>
          <p className="mt-1">
            <span className={`font-semibold ${measurement.isHttps ? 'text-foreground' : 'text-destructive'}`}>
              {measurement.isHttps ? 'HTTPS' : 'HTTP only'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
