import { createAI } from './ai'
import { createKV } from './kv'

import type { MeasureResponse } from './measure'

export type RankingEntry = {
  url: string
  rootUrl: string
  score: number
  measuredAt: string
  performanceScore: number | null
  coreWebVitals: {
    lcp: number | null
    cls: number | null
    fid: number | null
  }
  mobileFriendly: boolean
  isHttps: boolean
  hasRobots: boolean
  hasSitemap: boolean
  metaScore: number
  contentScore: number
}

export type RankingData = {
  entries: RankingEntry[]
  updatedAt: string
}

const RANKING_KEY = 'seo_ranking'
const MAX_ENTRIES = 100

/**
 * Calculate a comprehensive SEO score using AI
 */
export async function calculateAIScore(measurement: MeasureResponse): Promise<number> {
  const ai = createAI()

  // Extract key metrics
  const metrics = {
    performanceScore: measurement.performanceScore ?? 0,
    lcp: measurement.coreWebVitals.lcp.value,
    cls: measurement.coreWebVitals.cls.value,
    fid: measurement.coreWebVitals.fid.value,
    mobileFriendly: measurement.mobileFriendly.status === 'pass' ? 1 : 0,
    isHttps: measurement.isHttps ? 1 : 0,
    hasRobots: measurement.robots.exists ? 1 : 0,
    hasSitemap: measurement.sitemap.exists ? 1 : 0,
    titleStatus: measurement.meta.titleStatus === 'within' ? 1 : measurement.meta.titleStatus === 'long' ? 0.5 : 0,
    descriptionStatus:
      measurement.meta.descriptionStatus === 'within' ? 1 : measurement.meta.descriptionStatus === 'long' ? 0.5 : 0,
    contentScore: Math.min(measurement.contentSummary.wordCount / 500, 1) // Normalize to 0-1, 500 words = full score
  }

  // Create a prompt for AI to calculate comprehensive score
  const prompt = `You are an SEO expert. Calculate a comprehensive SEO score (0-100) based on these metrics:

Performance Score: ${metrics.performanceScore}/100
Core Web Vitals:
- LCP: ${metrics.lcp}ms (good: <2500ms)
- CLS: ${metrics.cls} (good: <0.1)
- FID: ${metrics.fid}ms (good: <100ms)
Mobile Friendly: ${metrics.mobileFriendly === 1 ? 'Yes' : 'No'}
HTTPS: ${metrics.isHttps === 1 ? 'Yes' : 'No'}
Robots.txt: ${metrics.hasRobots === 1 ? 'Present' : 'Missing'}
Sitemap: ${metrics.hasSitemap === 1 ? 'Present' : 'Missing'}
Title: ${metrics.titleStatus === 1 ? 'Good' : metrics.titleStatus === 0.5 ? 'Too long' : 'Missing'}
Description: ${metrics.descriptionStatus === 1 ? 'Good' : metrics.descriptionStatus === 0.5 ? 'Too long' : 'Missing'}
Content: ${measurement.contentSummary.wordCount} words

Consider all factors and provide a single score from 0-100. Return only the number, no explanation.`

  try {
    // Use Cloudflare AI to get score
    const fullPrompt = `You are an SEO expert. Calculate a comprehensive SEO score (0-100) based on these metrics:

${prompt}

Return only a single number from 0-100, no explanation.`

    const result = await ai.run('@cf/meta/llama-3-8b-instruct', {
      prompt: fullPrompt,
      max_tokens: 10,
      temperature: 0.3
    })

    // Extract number from response
    const scoreText =
      (result as { response?: string; text?: string }).response || (result as { text?: string }).text || ''
    const scoreMatch = scoreText.match(/\d+/)
    const aiScore = scoreMatch ? parseInt(scoreMatch[0], 10) : null

    if (aiScore !== null && aiScore >= 0 && aiScore <= 100) {
      return aiScore
    }
  } catch (error) {
    console.error('AI score calculation failed:', error)
  }

  // Fallback to weighted calculation if AI fails
  return calculateWeightedScore(metrics)
}

/**
 * Fallback weighted score calculation
 */
function calculateWeightedScore(metrics: {
  performanceScore: number
  lcp: number | null
  cls: number | null
  fid: number | null
  mobileFriendly: number
  isHttps: number
  hasRobots: number
  hasSitemap: number
  titleStatus: number
  descriptionStatus: number
  contentScore: number
}): number {
  // Normalize Core Web Vitals
  const lcpScore = metrics.lcp !== null ? Math.max(0, 1 - (metrics.lcp - 2500) / 2500) : 0.5
  const clsScore = metrics.cls !== null ? Math.max(0, 1 - metrics.cls / 0.25) : 0.5
  const fidScore = metrics.fid !== null ? Math.max(0, 1 - (metrics.fid - 100) / 100) : 0.5

  // Weighted average
  const weights = {
    performance: 0.3,
    coreWebVitals: 0.25, // Average of LCP, CLS, FID
    mobileFriendly: 0.1,
    security: 0.05, // HTTPS
    indexing: 0.1, // Robots + Sitemap
    meta: 0.1, // Title + Description
    content: 0.1
  }

  const coreWebVitalsAvg = (lcpScore + clsScore + fidScore) / 3
  const indexingScore = (metrics.hasRobots + metrics.hasSitemap) / 2
  const metaScore = (metrics.titleStatus + metrics.descriptionStatus) / 2

  const score =
    weights.performance * (metrics.performanceScore / 100) +
    weights.coreWebVitals * coreWebVitalsAvg +
    weights.mobileFriendly * metrics.mobileFriendly +
    weights.security * metrics.isHttps +
    weights.indexing * indexingScore +
    weights.meta * metaScore +
    weights.content * metrics.contentScore

  return Math.round(score * 100)
}

/**
 * Get ranking entry from measurement
 */
export function createRankingEntry(measurement: MeasureResponse, score: number): RankingEntry {
  return {
    url: measurement.measuredUrl,
    rootUrl: measurement.rootUrl,
    score,
    measuredAt: measurement.measuredAt,
    performanceScore: measurement.performanceScore,
    coreWebVitals: {
      lcp: measurement.coreWebVitals.lcp.value,
      cls: measurement.coreWebVitals.cls.value,
      fid: measurement.coreWebVitals.fid.value
    },
    mobileFriendly: measurement.mobileFriendly.status === 'pass',
    isHttps: measurement.isHttps,
    hasRobots: measurement.robots.exists,
    hasSitemap: measurement.sitemap.exists,
    metaScore: measurement.meta.titleStatus === 'within' && measurement.meta.descriptionStatus === 'within' ? 100 : 50,
    contentScore: Math.min(Math.round((measurement.contentSummary.wordCount / 500) * 100), 100)
  }
}

/**
 * Get current ranking from KV
 */
export async function getRanking(): Promise<RankingData> {
  const kv = createKV()
  try {
    const data = await kv.get(RANKING_KEY, 'json')
    if (data && typeof data === 'object' && 'entries' in data) {
      return data as RankingData
    }
  } catch (error) {
    console.error('Failed to get ranking:', error)
  }
  return { entries: [], updatedAt: new Date().toISOString() }
}

/**
 * Update ranking with new entry
 */
export async function updateRanking(entry: RankingEntry): Promise<RankingData> {
  const kv = createKV()
  const current = await getRanking()

  // Remove existing entry for this URL if it exists
  const filtered = current.entries.filter((e) => e.url !== entry.url && e.rootUrl !== entry.rootUrl)

  // Add new entry
  const updated = [...filtered, entry]

  // Sort by score descending
  updated.sort((a, b) => b.score - a.score)

  // Keep only top entries
  const entries = updated.slice(0, MAX_ENTRIES)

  const ranking: RankingData = {
    entries,
    updatedAt: new Date().toISOString()
  }

  // Save to KV
  await kv.put(RANKING_KEY, JSON.stringify(ranking))

  return ranking
}

/**
 * Calculate and update ranking for a measurement
 */
export async function calculateAndUpdateRanking(measurement: MeasureResponse): Promise<RankingEntry> {
  const score = await calculateAIScore(measurement)
  const entry = createRankingEntry(measurement, score)
  await updateRanking(entry)
  return entry
}
