export const METRIC_AUDIT_KEYS = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'speed-index',
  'interactive',
  'total-blocking-time',
  'max-potential-fid',
  'cumulative-layout-shift'
] as const

export const OPPORTUNITY_AUDIT_KEYS = [
  'render-blocking-insight',
  'unused-javascript',
  'legacy-javascript-insight',
  'cache-insight',
  'third-parties-insight'
] as const

export const RESOURCE_SUMMARY_KEY = 'resource-summary'

export type ResourceSummaryItem = {
  resourceType?: string
  transferSize?: number
  requestCount?: number
}

export type LighthouseAuditDetails = {
  items?: ResourceSummaryItem[]
  [key: string]: unknown
}

export type LighthouseAudit = {
  displayValue?: string
  numericValue?: number
  description?: string
  score?: number | null
  details?: LighthouseAuditDetails
}

export type LighthouseEnvironment = {
  networkUserAgent?: string
  hostUserAgent?: string
  benchmarkIndex?: number
  [key: string]: unknown
}

export type LighthouseConfigSettings = {
  formFactor?: string
  locale?: string
  channel?: string
  [key: string]: unknown
}

export type PerformanceMeta = {
  fetchTime?: string
  environment?: LighthouseEnvironment
  configSettings?: LighthouseConfigSettings
  audits?: Record<string, LighthouseAudit>
}

// Keep PageSpeedMeta as an alias for backward compatibility
export type PageSpeedMeta = PerformanceMeta
