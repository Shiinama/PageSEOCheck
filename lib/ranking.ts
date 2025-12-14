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
  seoReadiness: {
    crawlability: number
    basicOnPage: number
    contentSemantics: number
    techExperience: number
    seoOpportunity: number
    overall: number
  }
}

export type RankingData = {
  entries: RankingEntry[]
  updatedAt: string
}

// KV Key prefixes for the new paginated design
const RANKING_ENTRY_PREFIX = 'seo_ranking:entry:'
const RANKING_PAGE_PREFIX = 'seo_ranking:page:'
const RANKING_META_KEY = 'seo_ranking:meta'
const RANKING_INDEX_KEY = 'seo_ranking:index' // For sorting/updating
const LEGACY_RANKING_KEY = 'seo_ranking' // For backward compatibility

const MAX_ENTRIES = 100
const DEFAULT_PAGE_SIZE = 20

/**
 * Helper to create entry key
 */
function getEntryKey(rootUrl: string): string {
  return `${RANKING_ENTRY_PREFIX}${rootUrl}`
}

/**
 * Helper to create page key
 */
function getPageKey(pageNumber: number): string {
  return `${RANKING_PAGE_PREFIX}${pageNumber}`
}

/**
 * Calculate SEO Readiness Score using the new 5-layer model
 * Uses the seoReadiness.overall score from measurement
 */
export async function calculateAIScore(measurement: MeasureResponse): Promise<number> {
  // Use the new SEO Readiness overall score
  return measurement.seoReadiness.overall
}

/**
 * Get ranking entry from measurement
 * Only root URLs should be passed to this function
 */
export function createRankingEntry(measurement: MeasureResponse, score: number): RankingEntry {
  return {
    url: measurement.rootUrl, // Use rootUrl as the primary URL since we only store root URLs
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
    contentScore: Math.min(Math.round((measurement.contentSummary.wordCount / 500) * 100), 100),
    seoReadiness: measurement.seoReadiness
  }
}

/**
 * Ranking index structure stored in KV (for sorting/updating)
 */
type RankingIndex = {
  entries: Array<{ url: string; score: number }> // Sorted by score descending
  updatedAt: string
}

/**
 * Ranking metadata structure
 */
type RankingMeta = {
  totalEntries: number
  totalPages: number
  pageSize: number
  updatedAt: string
}

/**
 * Ranking page structure stored in KV
 */
type RankingPage = {
  entries: RankingEntry[]
  pageNumber: number
  updatedAt: string
}

/**
 * Migrate legacy ranking data to new structure
 */
async function migrateLegacyRanking(): Promise<void> {
  const kv = createKV()
  try {
    const legacyData = await kv.get(LEGACY_RANKING_KEY, 'json')
    if (legacyData && typeof legacyData === 'object' && 'entries' in legacyData) {
      const rankingData = legacyData as RankingData
      if (rankingData.entries.length > 0) {
        // Migrate entries to new structure
        const urls: string[] = []
        const entryKeys: string[] = []
        const entryValues: RankingEntry[] = []

        for (const entry of rankingData.entries) {
          urls.push(entry.rootUrl)
          entryKeys.push(getEntryKey(entry.rootUrl))
          entryValues.push(entry)
        }

        // Batch write entries
        const putPromises = entryKeys.map((key, index) => kv.put(key, JSON.stringify(entryValues[index])))
        await Promise.all(putPromises)

        // Write index with scores (for sorting/updating)
        const index: RankingIndex = {
          entries: rankingData.entries.map((e) => ({ url: e.rootUrl, score: e.score })),
          updatedAt: rankingData.updatedAt
        }
        await kv.put(RANKING_INDEX_KEY, JSON.stringify(index))

        // Write pages (true KV pagination)
        const pageSize = DEFAULT_PAGE_SIZE
        const totalPages = Math.ceil(rankingData.entries.length / pageSize)
        const pagePromises: Promise<void>[] = []

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const startIndex = (pageNum - 1) * pageSize
          const endIndex = Math.min(startIndex + pageSize, rankingData.entries.length)
          const pageEntries = rankingData.entries.slice(startIndex, endIndex)

          const page: RankingPage = {
            entries: pageEntries,
            pageNumber: pageNum,
            updatedAt: rankingData.updatedAt
          }
          pagePromises.push(kv.put(getPageKey(pageNum), JSON.stringify(page)))
        }
        await Promise.all(pagePromises)

        // Write meta
        const meta: RankingMeta = {
          totalEntries: urls.length,
          totalPages,
          pageSize,
          updatedAt: rankingData.updatedAt
        }
        await kv.put(RANKING_META_KEY, JSON.stringify(meta))

        // Delete legacy key
        await kv.delete(LEGACY_RANKING_KEY)
      }
    }
  } catch (error) {
    console.error('Failed to migrate legacy ranking:', error)
  }
}

/**
 * Get current ranking from KV (new paginated structure)
 *
 * NOTE: This function reads ALL entries from KV. For better performance,
 * use getPaginatedRanking() instead when you only need a specific page.
 * This function is kept for backward compatibility and special use cases.
 */
export async function getRanking(): Promise<RankingData> {
  const kv = createKV()

  try {
    // Try new structure first
    const [indexData, metaData] = await Promise.all([
      kv.get(RANKING_INDEX_KEY, 'json') as Promise<RankingIndex | null>,
      kv.get(RANKING_META_KEY, 'json') as Promise<RankingMeta | null>
    ])

    if (indexData && indexData.entries && indexData.entries.length > 0) {
      // Get all entries in batch
      const urls = indexData.entries.map((e) => e.url)
      const entryKeys = urls.map((url) => getEntryKey(url))
      const entryMap = (await kv.get(entryKeys, 'json')) as Map<string, RankingEntry | null>

      // Convert map to array, preserving order
      const entries: RankingEntry[] = []
      for (const url of urls) {
        const entry = entryMap.get(getEntryKey(url))
        if (entry) {
          entries.push(entry)
        }
      }

      return {
        entries,
        updatedAt: metaData?.updatedAt || indexData.updatedAt
      }
    }

    // Try legacy structure and migrate
    const legacyData = await kv.get(LEGACY_RANKING_KEY, 'json')
    if (legacyData && typeof legacyData === 'object' && 'entries' in legacyData) {
      await migrateLegacyRanking()
      // Recursively call to get migrated data
      return getRanking()
    }
  } catch (error) {
    console.error('Failed to get ranking:', error)
  }

  return { entries: [], updatedAt: new Date().toISOString() }
}

export type PaginatedRankingData = {
  entries: RankingEntry[]
  totalEntries: number
  currentPage: number
  totalPages: number
  pageSize: number
  updatedAt: string
}

/**
 * Get paginated ranking data (true KV pagination - only reads the requested page)
 */
export async function getPaginatedRanking(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedRankingData> {
  const kv = createKV()
  const normalizedPage = Math.max(1, Math.floor(page))
  const normalizedPageSize = Math.max(1, Math.floor(pageSize))

  try {
    // Get meta to check if paginated structure exists
    const metaData = (await kv.get(RANKING_META_KEY, 'json')) as RankingMeta | null

    // If new paginated structure exists and page size matches
    if (metaData && metaData.pageSize === normalizedPageSize) {
      // Only read the specific page from KV
      const pageData = (await kv.get(getPageKey(normalizedPage), 'json')) as RankingPage | null

      if (pageData && pageData.entries) {
        return {
          entries: pageData.entries,
          totalEntries: metaData.totalEntries,
          currentPage: normalizedPage,
          totalPages: metaData.totalPages,
          pageSize: normalizedPageSize,
          updatedAt: metaData.updatedAt
        }
      }

      // Page doesn't exist (out of range)
      return {
        entries: [],
        totalEntries: metaData.totalEntries,
        currentPage: normalizedPage,
        totalPages: metaData.totalPages,
        pageSize: normalizedPageSize,
        updatedAt: metaData.updatedAt
      }
    }

    // Fallback: check if index-based structure exists (needs migration)
    const indexData = (await kv.get(RANKING_INDEX_KEY, 'json')) as RankingIndex | null
    if (indexData && indexData.entries && indexData.entries.length > 0) {
      // Migrate to page-based structure
      await rebuildPagesFromIndex()
      // Retry after migration
      return getPaginatedRanking(page, pageSize)
    }

    // Fallback to legacy structure
    const legacyData = await kv.get(LEGACY_RANKING_KEY, 'json')
    if (legacyData && typeof legacyData === 'object' && 'entries' in legacyData) {
      await migrateLegacyRanking()
      // Retry after migration
      return getPaginatedRanking(page, pageSize)
    }
  } catch (error) {
    console.error('Failed to get paginated ranking:', error)
  }

  // Return empty result
  return {
    entries: [],
    totalEntries: 0,
    currentPage: normalizedPage,
    totalPages: 0,
    pageSize: normalizedPageSize,
    updatedAt: new Date().toISOString()
  }
}

/**
 * Rebuild pages from index (migration helper)
 */
async function rebuildPagesFromIndex(): Promise<void> {
  const kv = createKV()
  const indexData = (await kv.get(RANKING_INDEX_KEY, 'json')) as RankingIndex | null

  if (!indexData || !indexData.entries || indexData.entries.length === 0) {
    return
  }

  const pageSize = DEFAULT_PAGE_SIZE
  const urls = indexData.entries.map((e) => e.url)
  const entryKeys = urls.map((url) => getEntryKey(url))
  const entryMap = (await kv.get(entryKeys, 'json')) as Map<string, RankingEntry | null>

  // Build entries array in order
  const entries: RankingEntry[] = []
  for (const url of urls) {
    const entry = entryMap.get(getEntryKey(url))
    if (entry) {
      entries.push(entry)
    }
  }

  // Rebuild pages
  const totalPages = Math.ceil(entries.length / pageSize)
  const pagePromises: Promise<void>[] = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const startIndex = (pageNum - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, entries.length)
    const pageEntries = entries.slice(startIndex, endIndex)

    const page: RankingPage = {
      entries: pageEntries,
      pageNumber: pageNum,
      updatedAt: indexData.updatedAt
    }
    pagePromises.push(kv.put(getPageKey(pageNum), JSON.stringify(page)))
  }
  await Promise.all(pagePromises)

  // Update meta
  const meta: RankingMeta = {
    totalEntries: entries.length,
    totalPages,
    pageSize,
    updatedAt: indexData.updatedAt
  }
  await kv.put(RANKING_META_KEY, JSON.stringify(meta))
}

/**
 * Update ranking with new entry (true KV pagination)
 * Uses rootUrl as the unique identifier (only root URLs are stored)
 * Rebuilds pages after update
 */
export async function updateRanking(entry: RankingEntry): Promise<void> {
  const kv = createKV()
  const now = new Date().toISOString()

  try {
    // Get current index (only contains URLs and scores, not full entries)
    const indexData = (await kv.get(RANKING_INDEX_KEY, 'json')) as RankingIndex | null
    let indexEntries = indexData?.entries || []

    // Check if entry already exists and remove it
    indexEntries = indexEntries.filter((e) => e.url !== entry.rootUrl)

    // Add new entry
    indexEntries.push({ url: entry.rootUrl, score: entry.score })

    // Sort by score descending
    indexEntries.sort((a, b) => b.score - a.score)

    // Keep only top entries
    const topEntries = indexEntries.slice(0, MAX_ENTRIES)
    const topUrls = topEntries.map((e) => e.url)

    // Save the new entry
    await kv.put(getEntryKey(entry.rootUrl), JSON.stringify(entry))

    // Update index
    const newIndex: RankingIndex = {
      entries: topEntries,
      updatedAt: now
    }
    await kv.put(RANKING_INDEX_KEY, JSON.stringify(newIndex))

    // Get all entries for rebuilding pages (only top entries)
    const entryKeys = topUrls.map((url) => getEntryKey(url))
    const entryMap = (await kv.get(entryKeys, 'json')) as Map<string, RankingEntry | null>

    // Build entries array in order
    const entries: RankingEntry[] = []
    for (const url of topUrls) {
      const e = entryMap.get(getEntryKey(url))
      if (e) {
        entries.push(e)
      }
    }

    // Rebuild all pages
    const pageSize = DEFAULT_PAGE_SIZE
    const totalPages = Math.ceil(entries.length / pageSize)
    const pagePromises: Promise<void>[] = []

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const startIndex = (pageNum - 1) * pageSize
      const endIndex = Math.min(startIndex + pageSize, entries.length)
      const pageEntries = entries.slice(startIndex, endIndex)

      const page: RankingPage = {
        entries: pageEntries,
        pageNumber: pageNum,
        updatedAt: now
      }
      pagePromises.push(kv.put(getPageKey(pageNum), JSON.stringify(page)))
    }
    await Promise.all(pagePromises)

    // Delete old pages that are no longer needed
    const oldMeta = (await kv.get(RANKING_META_KEY, 'json')) as RankingMeta | null
    if (oldMeta && oldMeta.totalPages > totalPages) {
      const deletePromises = []
      for (let pageNum = totalPages + 1; pageNum <= oldMeta.totalPages; pageNum++) {
        deletePromises.push(kv.delete(getPageKey(pageNum)))
      }
      await Promise.all(deletePromises)
    }

    // Update meta
    const meta: RankingMeta = {
      totalEntries: entries.length,
      totalPages,
      pageSize,
      updatedAt: now
    }
    await kv.put(RANKING_META_KEY, JSON.stringify(meta))

    // If entry was removed from top, delete its KV entry
    const removedUrls = indexEntries.slice(MAX_ENTRIES).map((e) => e.url)
    if (removedUrls.length > 0) {
      const deletePromises = removedUrls.map((url) => kv.delete(getEntryKey(url)))
      await Promise.all(deletePromises)
    }
  } catch (error) {
    console.error('Failed to update ranking:', error)
    // Fallback: try to read legacy structure and migrate
    try {
      const legacyData = await kv.get(LEGACY_RANKING_KEY, 'json')
      if (legacyData && typeof legacyData === 'object' && 'entries' in legacyData) {
        // Migrate legacy data first
        await migrateLegacyRanking()
        // Then update with new entry
        await updateRanking(entry)
        return
      }
    } catch (fallbackError) {
      console.error('Failed to handle fallback:', fallbackError)
    }
    throw error
  }
}

/**
 * Calculate and update ranking for a measurement
 * Only processes root URLs, ignores sub-routes
 */
export async function calculateAndUpdateRanking(measurement: MeasureResponse): Promise<RankingEntry | null> {
  // Only process root URLs, skip sub-routes
  if (measurement.scope !== 'root') {
    return null
  }

  const score = await calculateAIScore(measurement)
  const entry = createRankingEntry(measurement, score)
  await updateRanking(entry)
  return entry
}
