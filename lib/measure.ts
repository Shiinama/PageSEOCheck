import type { PageSpeedMeta } from './page-speed-meta'

type GoogleAudit = {
  numericValue?: number
  displayValue?: string
  score?: number | null
  title?: string
  description?: string
  details?: {
    items?: Array<Record<string, unknown>>
    [key: string]: unknown
  }
  [key: string]: unknown
}

type LighthouseCategory = {
  score?: number | null
  title?: string
  description?: string
  manualDescription?: string
  [key: string]: unknown
}

type LighthouseEnvironment = {
  networkUserAgent?: string
  hostUserAgent?: string
  benchmarkIndex?: number
  [key: string]: unknown
}

type LighthouseConfigSettings = {
  formFactor?: string
  locale?: string
  channel?: string
  [key: string]: unknown
}

type FieldDataMetric = {
  percentile?: number
  category?: string
  distributions?: Array<{
    min?: number
    max?: number
    proportion?: number
  }>
}

type LoadingExperience = {
  id?: string
  metrics?: Record<string, FieldDataMetric>
  overall_category?: string
  initial_url?: string
}

type GooglePagespeedResponse = {
  captchaResult?: string
  kind?: string
  id?: string
  loadingExperience?: LoadingExperience
  originLoadingExperience?: LoadingExperience
  lighthouseResult?: {
    requestedUrl?: string
    finalUrl?: string
    lighthouseVersion?: string
    userAgent?: string
    fetchTime?: string
    environment?: LighthouseEnvironment
    runWarnings?: string[]
    configSettings?: LighthouseConfigSettings
    categories?: {
      performance?: LighthouseCategory
      accessibility?: LighthouseCategory
      'best-practices'?: LighthouseCategory
      seo?: LighthouseCategory
      pwa?: LighthouseCategory
      [key: string]: LighthouseCategory | undefined
    }
    categoryGroups?: Record<string, { title?: string; description?: string; [key: string]: unknown }>
    audits?: Record<string, GoogleAudit>
    fullPageScreenshot?: {
      screenshot?: {
        data?: string
        width?: number
        height?: number
      }
      nodes?: Record<string, unknown>
    }
    i18n?: {
      rendererFormattedStrings?: Record<string, string>
    }
    timing?: {
      entries?: Array<Record<string, unknown>>
      total?: number
    }
    stackPacks?: Array<{
      id?: string
      title?: string
      iconDataURL?: string
      descriptions?: Record<string, string>
    }>
    entities?: Array<{
      name?: string
      isUnrecognized?: boolean
      isFirstParty?: boolean
      [key: string]: unknown
    }>
  }
  version?: {
    major?: number
    minor?: number
  }
  analysisUTCTimestamp?: string
}

export type FieldMetric = {
  value: number | null
  category?: string
}

export type ResourceStatus = {
  url: string
  exists: boolean
  status: number | null
  message: string
}

export type MetaInfo = {
  title: string | null
  description: string | null
  titleLength: number
  descriptionLength: number
  titleLimit: number
  descriptionLimit: number
  titleStatus: 'missing' | 'within' | 'long'
  descriptionStatus: 'missing' | 'within' | 'long'
}

export type ContentSummary = {
  htmlCharacters: number
  textCharacters: number
  wordCount: number
}

export type MeasureResponse = {
  measuredAt: string
  measuredUrl: string
  strategy: 'mobile' | 'desktop'
  performanceScore: number | null
  performanceLabel: string
  performanceDetail: string
  coreWebVitals: {
    lcp: FieldMetric
    cls: FieldMetric
    fid: FieldMetric
    fieldSummary: string
    labSummary: string
  }
  mobileFriendly: {
    status: 'pass' | 'fail' | 'unknown'
    detail: string
    message: string
  }
  scope: 'root' | 'page'
  rootUrl: string
  isHttps: boolean
  robots: ResourceStatus
  sitemap: ResourceStatus
  meta: MetaInfo
  contentSummary: ContentSummary
  pageSpeedMeta?: PageSpeedMeta
  loadingExperience?: LoadingExperience
  originLoadingExperience?: LoadingExperience
}

const PAGESPEED_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

const FIELD_KEYS = {
  lcp: 'LARGEST_CONTENTFUL_PAINT_MS',
  cls: 'CUMULATIVE_LAYOUT_SHIFT_SCORE',
  fid: 'FIRST_INPUT_DELAY_MS'
} as const

const normalizeUrl = (rawUrl: string) => {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    throw new Error('Empty URL')
  }

  const hasScheme = /^[a-z]+:\/\//i.test(trimmed)
  const prefixed = hasScheme ? trimmed : `https://${trimmed}`
  return new URL(prefixed).toString()
}

const formatLabMetric = (value: number | null, type: 'time' | 'cls' | 'fid') => {
  if (value === null) return '—'
  if (type === 'cls') {
    return value.toFixed(2)
  }
  const formatted = type === 'time' ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`
  return formatted
}

const getAuditValue = (audits: Record<string, GoogleAudit> | undefined, key: string): number | null => {
  const audit = audits?.[key]
  if (!audit || typeof audit.numericValue !== 'number') {
    return null
  }
  return audit.numericValue
}

type FieldSummaryInput = {
  lcp?: FieldMetric
  cls?: FieldMetric
  fid?: FieldMetric
}

const buildFieldSummary = (metrics?: FieldSummaryInput) => {
  if (!metrics) return 'Field data not available yet.'
  const entries: string[] = []

  const metricsMap: Array<[keyof FieldSummaryInput, string]> = [
    ['lcp', 'LCP'],
    ['cls', 'CLS'],
    ['fid', 'FID']
  ]

  metricsMap.forEach(([key, label]) => {
    const metric = metrics[key]
    if (metric?.category) {
      entries.push(`${label} ${metric.category}`)
    }
  })

  return entries.length ? `Field data: ${entries.join(' · ')}` : 'Field data currently unavailable.'
}

const fetchPageSnapshot = async (url: string) => {
  try {
    const response = await fetch(url)
    const html = await response.text()
    return {
      html,
      status: response.status,
      ok: response.ok
    }
  } catch (error) {
    console.error('[Measure] Failed to fetch page snapshot', error)
    return {
      html: '',
      status: null,
      ok: false
    }
  }
}

const probeUrl = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })

    if (response.ok) {
      return
    }

    if (response.status === 405) {
      const fallback = await fetch(url, { cache: 'no-store' })
      if (fallback.ok) {
        return
      }
    }

    throw new Error(`Received status ${response.status}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Unable to reach ${url}: ${message}`)
  }
}

const stripTags = (input: string) =>
  input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const extractTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? match[1].trim() : null
}

const extractMetaDescription = (html: string) => {
  const primary =
    html.match(/<meta\b[^>]*name=(["'])description\1[^>]*content=(["'])([\s\S]*?)\2[^>]*>/i) ||
    html.match(/<meta\b[^>]*content=(["'])([\s\S]*?)\1[^>]*name=(["'])description\3[^>]*>/i)

  return primary ? primary[3]?.trim() || null : null
}

const TITLE_LIMIT = 60
const DESCRIPTION_LIMIT = 160

const checkResource = async (url: string): Promise<ResourceStatus> => {
  try {
    const response = await fetch(url, { cache: 'no-store' })
    return {
      url,
      exists: response.ok,
      status: response.status,
      message: response.ok ? 'Available' : `Status ${response.status}`
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to evaluate resource'
    return {
      url,
      exists: false,
      status: null,
      message
    }
  }
}

const locateSitemap = async (rootUrl: string): Promise<ResourceStatus> => {
  const candidates = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml']
  let fallback: ResourceStatus | null = null

  for (const candidate of candidates) {
    const resource = await checkResource(`${rootUrl}${candidate}`)
    if (!fallback) {
      fallback = resource
    }
    if (resource.exists) {
      return resource
    }
  }

  return (
    fallback ?? {
      url: `${rootUrl}/sitemap.xml`,
      exists: false,
      status: null,
      message: 'Sitemap not found'
    }
  )
}

async function callPageSpeedApi(payloadUrl: string, strategy: 'mobile' | 'desktop') {
  const pagespeedUrl = new URL(PAGESPEED_URL)
  pagespeedUrl.searchParams.set('url', payloadUrl)
  pagespeedUrl.searchParams.set('strategy', strategy)
  // Don't specify category to get all categories (performance, accessibility, best-practices, seo, pwa)
  // This ensures we get complete Lighthouse data including all audits

  const apiKey = process.env.PAGESPEED_API_KEY || process.env.NEXT_PUBLIC_PAGESPEED_API_KEY
  if (apiKey) {
    pagespeedUrl.searchParams.set('key', apiKey)
  }

  const response = await fetch(pagespeedUrl.toString(), {
    next: { revalidate: 60 }
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => 'Unknown error from PageSpeed Insights.')
    throw new Error(detail.slice(0, 1024))
  }

  return (await response.json()) as GooglePagespeedResponse
}

export async function measurePageSpeed(
  rawUrl: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<MeasureResponse> {
  const normalizedUrl = normalizeUrl(rawUrl)

  await probeUrl(normalizedUrl)

  const url = new URL(normalizedUrl)
  const rootUrl = `${url.protocol}//${url.host}`
  const scope: MeasureResponse['scope'] = url.pathname === '/' || url.pathname === '' ? 'root' : 'page'
  const isHttps = url.protocol === 'https:'

  const [data, snapshot, robots, sitemap] = await Promise.all([
    callPageSpeedApi(normalizedUrl, strategy),
    fetchPageSnapshot(normalizedUrl),
    checkResource(`${rootUrl}/robots.txt`),
    locateSitemap(rootUrl)
  ])
  const htmlContent = snapshot.html || ''
  const lighthouse = data.lighthouseResult

  const performanceScore =
    typeof lighthouse?.categories?.performance?.score === 'number'
      ? Math.round(lighthouse.categories.performance.score * 100)
      : null

  const lcpLab = getAuditValue(lighthouse?.audits, 'largest-contentful-paint')
  const clsLab = getAuditValue(lighthouse?.audits, 'cumulative-layout-shift')
  const fidLab = getAuditValue(lighthouse?.audits, 'first-input-delay')

  const fieldData = data.loadingExperience?.metrics

  const coreWebVitals = {
    lcp: {
      value: lcpLab,
      category: fieldData?.[FIELD_KEYS.lcp]?.category
    },
    cls: {
      value: clsLab,
      category: fieldData?.[FIELD_KEYS.cls]?.category
    },
    fid: {
      value: fidLab,
      category: fieldData?.[FIELD_KEYS.fid]?.category
    },
    fieldSummary: buildFieldSummary({
      lcp: {
        value: lcpLab,
        category: fieldData?.[FIELD_KEYS.lcp]?.category
      },
      cls: {
        value: clsLab,
        category: fieldData?.[FIELD_KEYS.cls]?.category
      },
      fid: {
        value: fidLab,
        category: fieldData?.[FIELD_KEYS.fid]?.category
      }
    }),
    labSummary: `Lab data: LCP ${formatLabMetric(lcpLab, 'time')} · CLS ${formatLabMetric(clsLab, 'cls')} · FID ${formatLabMetric(
      fidLab,
      'fid'
    )}`
  }

  const mobileAudit = lighthouse?.audits?.['mobile-friendly']
  const mobileScore = typeof mobileAudit?.score === 'number' ? mobileAudit.score : null
  const mobileFriendlyStatus: MeasureResponse['mobileFriendly']['status'] =
    mobileScore === 1 ? 'pass' : mobileScore === 0 ? 'fail' : 'unknown'

  const mobileFriendly: MeasureResponse['mobileFriendly'] = {
    status: mobileFriendlyStatus,
    detail:
      mobileAudit?.displayValue ||
      mobileAudit?.description ||
      'Lighthouse evaluated viewport, tap targets, and text sizing for mobile experience.',
    message:
      mobileFriendlyStatus === 'pass'
        ? 'Viewport and tap targets pass mobile-friendly checks.'
        : mobileFriendlyStatus === 'fail'
          ? 'Lighthouse detected mobile-specific issues that need attention.'
          : 'Mobile-friendly status is not available for this scan.'
  }

  const performanceLabel = `Lighthouse (${strategy})`
  const performanceDetail = `Measured ${normalizedUrl} with PageSpeed Insights (${strategy}). ${coreWebVitals.fieldSummary}`
  const cleanedText = stripTags(htmlContent)
  const wordCount = cleanedText ? cleanedText.split(' ').filter(Boolean).length : 0

  const title = extractTitle(htmlContent)
  const description = extractMetaDescription(htmlContent)

  const meta: MetaInfo = {
    title,
    description,
    titleLength: title ? title.length : 0,
    descriptionLength: description ? description.length : 0,
    titleLimit: TITLE_LIMIT,
    descriptionLimit: DESCRIPTION_LIMIT,
    titleStatus: !title ? 'missing' : title.length > TITLE_LIMIT ? 'long' : 'within',
    descriptionStatus: !description ? 'missing' : description.length > DESCRIPTION_LIMIT ? 'long' : 'within'
  }

  // Extract complete Lighthouse data for pageSpeedMeta
  const pageSpeedMeta: PageSpeedMeta | undefined = lighthouse
    ? {
        fetchTime: lighthouse.fetchTime || data.analysisUTCTimestamp,
        environment: lighthouse.environment
          ? {
              networkUserAgent: lighthouse.environment.networkUserAgent,
              hostUserAgent: lighthouse.environment.hostUserAgent,
              benchmarkIndex: lighthouse.environment.benchmarkIndex,
              ...lighthouse.environment
            }
          : undefined,
        configSettings: lighthouse.configSettings
          ? {
              formFactor: lighthouse.configSettings.formFactor,
              locale: lighthouse.configSettings.locale,
              channel: lighthouse.configSettings.channel,
              ...lighthouse.configSettings
            }
          : undefined,
        audits: lighthouse.audits
          ? Object.fromEntries(
              Object.entries(lighthouse.audits).map(([key, audit]) => [
                key,
                {
                  displayValue: audit.displayValue,
                  numericValue: audit.numericValue,
                  description: audit.description,
                  score: audit.score,
                  details: audit.details
                }
              ])
            )
          : undefined
      }
    : undefined

  return {
    measuredAt: new Date().toISOString(),
    measuredUrl: normalizedUrl,
    strategy,
    performanceScore,
    performanceLabel,
    performanceDetail,
    coreWebVitals,
    mobileFriendly,
    scope,
    rootUrl,
    isHttps,
    robots,
    sitemap,
    meta,
    contentSummary: {
      htmlCharacters: htmlContent.length,
      textCharacters: cleanedText.length,
      wordCount
    },
    pageSpeedMeta,
    loadingExperience: data.loadingExperience,
    originLoadingExperience: data.originLoadingExperience
  }
}
