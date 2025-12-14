'use client'

import type { MeasureResponse } from '@/lib/measure'

const formatMetaStatus = (status: 'missing' | 'within' | 'long', length: number, limit: number) => {
  if (status === 'missing') return 'Missing'
  if (status === 'long') return `Too long (${length}/${limit})`
  return `Within limit (${length}/${limit})`
}

const getStatusColor = (status: 'missing' | 'within' | 'long') => {
  if (status === 'missing') return 'text-destructive'
  if (status === 'long') return 'text-primary'
  return 'text-foreground'
}

type MetaContentPanelProps = {
  measurement: MeasureResponse
}

export default function MetaContentPanel({ measurement }: MetaContentPanelProps) {
  return (
    <div className="min-w-0 space-y-4">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">Meta & content</p>
        <h4 className="text-foreground mt-2 text-lg font-semibold">Meta lengths</h4>
      </div>
      <div className="space-y-4 text-sm">
        <div className="min-w-0">
          <p className="text-muted-foreground font-medium">Title</p>
          <p className="text-foreground mt-1 font-semibold">{measurement.meta.title ?? 'Missing'}</p>
          <p className={`mt-1 text-xs font-medium ${getStatusColor(measurement.meta.titleStatus)}`}>
            {formatMetaStatus(measurement.meta.titleStatus, measurement.meta.titleLength, measurement.meta.titleLimit)}
          </p>
        </div>
        <div className="border-border/40 border-b pt-4" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-muted-foreground font-medium">Description</p>
          <p className="text-foreground mt-1 font-semibold">{measurement.meta.description ?? 'Missing'}</p>
          <p className={`mt-1 text-xs font-medium ${getStatusColor(measurement.meta.descriptionStatus)}`}>
            {formatMetaStatus(
              measurement.meta.descriptionStatus,
              measurement.meta.descriptionLength,
              measurement.meta.descriptionLimit
            )}
          </p>
        </div>
        <div className="border-border/40 border-t pt-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-[0.3em] uppercase">Content summary</p>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              Content text length:{' '}
              <span className="text-foreground font-semibold">{measurement.contentSummary.textCharacters}</span>{' '}
              characters
            </p>
            <p>
              Word count: <span className="text-foreground font-semibold">{measurement.contentSummary.wordCount}</span>
            </p>
            <p>
              HTML size:{' '}
              <span className="text-foreground font-semibold">{measurement.contentSummary.htmlCharacters}</span>{' '}
              characters
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
