import { getTranslations } from 'next-intl/server'

import type { PerformanceMeta } from './page-speed-meta'

type Audit = {
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

type PerformanceResponse = {
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
    audits?: Record<string, Audit>
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

export type CrawlabilityInfo = {
  httpStatus: number | null
  isBlockedByRobots: boolean
  hasNoindex: boolean
  hasNofollow: boolean
  requiresJsForContent: boolean
  isAccessible: boolean
}

export type CanonicalInfo = {
  exists: boolean
  url: string | null
  pointsToSelf: boolean
  hasParameterPollution: boolean
}

export type HeadingsStructure = {
  h1Count: number
  h1Text: string | null
  h2Count: number
  h3Count: number
  hasUniqueH1: boolean
  h1MatchesTitle: boolean
  hasProperStructure: boolean
}

export type SEOReadinessScores = {
  crawlability: number // 0-100
  basicOnPage: number // 0-100
  techExperience: number // 0-100
  seoOpportunity: number // 0-100
  overall: number // 0-100
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
  crawlability: CrawlabilityInfo
  canonical: CanonicalInfo
  headings: HeadingsStructure
  seoReadiness: SEOReadinessScores
  performanceMeta?: PerformanceMeta
  loadingExperience?: LoadingExperience
  originLoadingExperience?: LoadingExperience
}

// Performance API endpoint
const PERFORMANCE_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

// 字段数据键名映射
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

const getAuditValue = (audits: Record<string, Audit> | undefined, key: string): number | null => {
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

// Build field data summary
const buildFieldSummary = async (metrics?: FieldSummaryInput, locale?: string): Promise<string> => {
  const t = locale ? await getTranslations({ locale, namespace: 'seoChecker.measure' }) : null

  if (!metrics) {
    return t?.('fieldDataUnavailable') ?? 'Field data unavailable'
  }

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

  if (entries.length) {
    const prefix = t?.('fieldDataPrefix') ?? 'Field data'
    return `${prefix}: ${entries.join(' · ')}`
  }

  return t?.('fieldDataCurrentlyUnavailable') ?? 'Field data currently unavailable'
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

const extractCanonical = (html: string, currentUrl: string): CanonicalInfo => {
  const canonicalMatch =
    html.match(/<link\b[^>]*rel=(["'])canonical\1[^>]*href=(["'])([\s\S]*?)\2[^>]*>/i) ||
    html.match(/<link\b[^>]*href=(["'])([\s\S]*?)\1[^>]*rel=(["'])canonical\3[^>]*>/i)

  if (!canonicalMatch) {
    return {
      exists: false,
      url: null,
      pointsToSelf: false,
      hasParameterPollution: false
    }
  }

  const canonicalUrl = canonicalMatch[3]?.trim() || null
  if (!canonicalUrl) {
    return {
      exists: true,
      url: null,
      pointsToSelf: false,
      hasParameterPollution: false
    }
  }

  try {
    const current = new URL(currentUrl)
    const canonical = new URL(canonicalUrl, currentUrl)
    const pointsToSelf = canonical.href === current.href
    const hasParameterPollution = /[?&](utm_|ref=|source=|campaign=)/i.test(currentUrl)

    return {
      exists: true,
      url: canonicalUrl,
      pointsToSelf,
      hasParameterPollution
    }
  } catch {
    return {
      exists: true,
      url: canonicalUrl,
      pointsToSelf: false,
      hasParameterPollution: false
    }
  }
}

// 检查 robots.txt 是否阻止该 URL
const checkRobotsBlocking = async (url: string, rootUrl: string): Promise<boolean> => {
  try {
    const robotsUrl = `${rootUrl}/robots.txt`
    const response = await fetch(robotsUrl, { cache: 'no-store' })
    if (!response.ok) return false

    const robotsTxt = await response.text()
    const urlPath = new URL(url).pathname
    const lines = robotsTxt.split('\n')
    let inUniversalAgent = false
    let isDisallowed = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (/^User-agent:\s*\*/i.test(trimmed)) {
        inUniversalAgent = true
        isDisallowed = false
      } else if (/^User-agent:/i.test(trimmed)) {
        inUniversalAgent = false
      } else if (inUniversalAgent && /^Disallow:\s*\/$/i.test(trimmed)) {
        isDisallowed = true
      } else if (inUniversalAgent && /^Disallow:/i.test(trimmed)) {
        const disallowPath = trimmed.replace(/^Disallow:\s*/i, '').trim()
        if (urlPath.startsWith(disallowPath)) {
          isDisallowed = true
        }
      }
    }

    return isDisallowed
  } catch {
    return false
  }
}

const checkNoindexNofollow = (html: string) => {
  const metaRobots =
    html.match(/<meta\b[^>]*name=(["'])robots\1[^>]*content=(["'])([\s\S]*?)\2[^>]*>/i) ||
    html.match(/<meta\b[^>]*content=(["'])([\s\S]*?)\1[^>]*name=(["'])robots\3[^>]*>/i)

  if (!metaRobots) {
    return { hasNoindex: false, hasNofollow: false }
  }

  const content = metaRobots[3]?.toLowerCase() || ''
  return {
    hasNoindex: /noindex/i.test(content),
    hasNofollow: /nofollow/i.test(content)
  }
}

const analyzeHeadings = (html: string, title: string | null): HeadingsStructure => {
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []
  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || []

  const h1Count = h1Matches.length
  const h2Count = h2Matches.length
  const h3Count = h3Matches.length

  const firstH1 = h1Matches[0]
  const h1Text = firstH1 ? stripTags(firstH1).trim() : null

  const hasUniqueH1 = h1Count === 1
  const h1MatchesTitle =
    title && h1Text
      ? h1Text.toLowerCase().includes(title.toLowerCase().substring(0, 20)) ||
        title.toLowerCase().includes(h1Text.toLowerCase().substring(0, 20))
      : false
  const hasProperStructure = hasUniqueH1 && (h2Count > 0 || h3Count > 0)

  return {
    h1Count,
    h1Text,
    h2Count,
    h3Count,
    hasUniqueH1,
    h1MatchesTitle,
    hasProperStructure
  }
}

// 计算可抓取性分数（第1层，40%权重）
function calculateCrawlabilityScore(crawlability: CrawlabilityInfo, canonical: CanonicalInfo): number {
  let score = 0
  if (crawlability.httpStatus === 200) score += 20
  if (!crawlability.isBlockedByRobots) score += 20
  if (!crawlability.hasNoindex) score += 20
  if (!crawlability.requiresJsForContent) score += 15
  if (canonical.exists && canonical.pointsToSelf) score += 15
  if (!canonical.hasParameterPollution) score += 10
  return Math.min(score, 100)
}

// 计算基础页面优化分数（第2层，35%权重）
function calculateBasicOnPageScore(meta: MetaInfo, headings: HeadingsStructure): number {
  let score = 0
  if (meta.title && meta.titleStatus === 'within') score += 30
  else if (meta.title && meta.titleStatus === 'long') score += 15
  if (meta.description && meta.descriptionStatus === 'within') score += 20
  else if (meta.description && meta.descriptionStatus === 'long') score += 10
  if (headings.hasUniqueH1) score += 25
  if (headings.h1MatchesTitle) score += 10
  if (headings.hasProperStructure) score += 15
  return Math.min(score, 100)
}

// 计算技术体验分数（第3层，15%权重）
function calculateTechExperienceScore(
  coreWebVitals: MeasureResponse['coreWebVitals'],
  mobileFriendly: MeasureResponse['mobileFriendly'],
  isHttps: boolean
): number {
  let score = 0
  const lcp = coreWebVitals.lcp.value
  const cls = coreWebVitals.cls.value

  if (lcp !== null && lcp < 4000)
    score += 30 // LCP < 4s
  else if (lcp !== null && lcp < 6000) score += 15
  if (cls !== null && cls < 0.25) score += 20 // CLS < 0.25
  if (mobileFriendly.status === 'pass') score += 30
  else if (mobileFriendly.status === 'unknown') score += 15
  if (isHttps) score += 20

  return Math.min(score, 100)
}

// 计算 SEO 机会分数（第4层，10%权重）
function calculateSEOOpportunityScore(meta: MetaInfo, headings: HeadingsStructure, canonical: CanonicalInfo): number {
  let score = 0
  if (headings.hasProperStructure) score += 40
  if (meta.title && meta.description) score += 30
  if (canonical.exists) score += 30

  return Math.min(score, 100)
}

/**
 * 基于 4 层模型计算 SEO 就绪度分数
 * 第1层（40%）：可抓取性和可索引性
 * 第2层（35%）：基础页面优化
 * 第3层（15%）：技术和用户体验信号
 * 第4层（10%）：SEO 机会
 */
function calculateSEOReadiness(
  crawlability: CrawlabilityInfo,
  canonical: CanonicalInfo,
  meta: MetaInfo,
  headings: HeadingsStructure,
  mobileFriendly: MeasureResponse['mobileFriendly'],
  coreWebVitals: MeasureResponse['coreWebVitals'],
  isHttps: boolean
): SEOReadinessScores {
  const crawlabilityFinal = calculateCrawlabilityScore(crawlability, canonical)
  const basicOnPageFinal = calculateBasicOnPageScore(meta, headings)
  const techExperienceFinal = calculateTechExperienceScore(coreWebVitals, mobileFriendly, isHttps)
  const seoOpportunityFinal = calculateSEOOpportunityScore(meta, headings, canonical)

  // 加权总分
  const overall =
    crawlabilityFinal * 0.4 + basicOnPageFinal * 0.35 + techExperienceFinal * 0.15 + seoOpportunityFinal * 0.1

  return {
    crawlability: crawlabilityFinal,
    basicOnPage: basicOnPageFinal,
    techExperience: techExperienceFinal,
    seoOpportunity: seoOpportunityFinal,
    overall: Math.round(overall)
  }
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

// Call Performance API
async function callPerformanceApi(payloadUrl: string, strategy: 'mobile' | 'desktop', locale?: string) {
  const performanceUrl = new URL(PERFORMANCE_API_URL)
  performanceUrl.searchParams.set('url', payloadUrl)
  performanceUrl.searchParams.set('strategy', strategy)
  // Don't specify category to get all categories (performance, accessibility, best-practices, seo, pwa)
  // Ensure we get complete Lighthouse data, including all audit items

  const apiKey = process.env.PAGESPEED_API_KEY || process.env.NEXT_PUBLIC_PAGESPEED_API_KEY
  if (apiKey) {
    performanceUrl.searchParams.set('key', apiKey)
  }

  const response = await fetch(performanceUrl.toString(), {
    next: { revalidate: 120 }
  })

  if (!response.ok) {
    const t = locale ? await getTranslations({ locale, namespace: 'seoChecker.measure' }) : null
    const errorMessage = t?.('apiError') ?? 'Performance API error'
    const detail = await response.text().catch(() => errorMessage)
    throw new Error(detail.slice(0, 1024))
  }

  return (await response.json()) as PerformanceResponse
}

export async function measurePageSpeed(
  rawUrl: string,
  strategy: 'mobile' | 'desktop' = 'mobile',
  locale?: string
): Promise<MeasureResponse> {
  const t = locale ? await getTranslations({ locale, namespace: 'seoChecker.measure' }) : null
  const normalizedUrl = normalizeUrl(rawUrl)

  await probeUrl(normalizedUrl)

  const url = new URL(normalizedUrl)
  const rootUrl = `${url.protocol}//${url.host}`
  const scope: MeasureResponse['scope'] = url.pathname === '/' || url.pathname === '' ? 'root' : 'page'
  const isHttps = url.protocol === 'https:'

  const [data, snapshot, robots, sitemap] = await Promise.all([
    callPerformanceApi(normalizedUrl, strategy, locale),
    fetchPageSnapshot(normalizedUrl),
    checkResource(`${rootUrl}/robots.txt`),
    locateSitemap(rootUrl)
  ])
  const htmlContent = snapshot.html || ''
  const lighthouse = data.lighthouseResult
  const cleanedText = stripTags(htmlContent)

  // SEO 检测逻辑
  const httpStatus = snapshot.status
  const isBlockedByRobots = await checkRobotsBlocking(normalizedUrl, rootUrl)
  const { hasNoindex, hasNofollow } = checkNoindexNofollow(htmlContent)
  const requiresJsForContent =
    /<script[^>]*>[\s\S]*?document\.(write|createElement)/i.test(htmlContent) && cleanedText.length < 100
  const isAccessible = httpStatus === 200 && !isBlockedByRobots && !hasNoindex

  const crawlability: CrawlabilityInfo = {
    httpStatus,
    isBlockedByRobots,
    hasNoindex,
    hasNofollow,
    requiresJsForContent,
    isAccessible
  }

  const canonical = extractCanonical(htmlContent, normalizedUrl)

  const performanceScore =
    typeof lighthouse?.categories?.performance?.score === 'number'
      ? Math.round(lighthouse.categories.performance.score * 100)
      : null

  const lcpLab = getAuditValue(lighthouse?.audits, 'largest-contentful-paint')
  const clsLab = getAuditValue(lighthouse?.audits, 'cumulative-layout-shift')
  const fidLab = getAuditValue(lighthouse?.audits, 'first-input-delay')

  const fieldData = data.loadingExperience?.metrics

  const metrics = {
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
  }

  const fieldSummary = await buildFieldSummary(metrics, locale)

  const coreWebVitals = {
    ...metrics,
    fieldSummary,
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
      (t?.('mobileFriendlyEvaluated') ?? 'Evaluated viewport, tap targets, and text sizing for mobile experience.'),
    message:
      mobileFriendlyStatus === 'pass'
        ? (t?.('mobileFriendlyPass') ?? 'Viewport and tap targets pass mobile-friendly checks.')
        : mobileFriendlyStatus === 'fail'
          ? (t?.('mobileFriendlyFail') ?? 'Detected mobile-specific issues that need attention.')
          : (t?.('mobileFriendlyUnavailable') ?? 'Mobile-friendly status is not available for this scan.')
  }

  const performanceLabel = t?.('performanceLabel', { strategy }) ?? `Performance (${strategy})`
  const performanceDetail =
    t?.('performanceDetail', {
      strategy,
      url: normalizedUrl,
      summary: coreWebVitals.fieldSummary
    }) ?? `Measured ${normalizedUrl} using ${strategy} strategy. ${coreWebVitals.fieldSummary}`
  const wordCount = cleanedText ? cleanedText.split(' ').filter(Boolean).length : 0

  const title = extractTitle(htmlContent)
  const description = extractMetaDescription(htmlContent)

  const headings = analyzeHeadings(htmlContent, title)

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

  // Extract complete Lighthouse data for performanceMeta
  const performanceMeta: PerformanceMeta | undefined = lighthouse
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

  const seoReadiness = calculateSEOReadiness(
    crawlability,
    canonical,
    meta,
    headings,
    mobileFriendly,
    coreWebVitals,
    isHttps
  )

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
    crawlability,
    canonical,
    headings,
    seoReadiness,
    performanceMeta,
    loadingExperience: data.loadingExperience,
    originLoadingExperience: data.originLoadingExperience
  }
}
