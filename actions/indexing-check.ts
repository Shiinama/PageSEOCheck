'use server'

import OpenAI from 'openai'

export type AIModel = 'chatgpt'

// OpenRouter 模型映射
const MODEL_MAP: Record<AIModel, string> = {
  chatgpt: 'openai/gpt-4o'
}

export interface GoogleIndexingResult {
  indexed: boolean
  resultCount?: number
  error?: string
}

export interface AIProbeResult {
  level: 'none' | 'training' | 'rag'
  model: AIModel
  details: {
    training: {
      detected: boolean
      confidence: 'low' | 'medium' | 'high'
      response?: string
    }
    rag: {
      detected: boolean
      confidence: 'low' | 'medium' | 'high'
      response?: string
    }
  }
  error?: string
}

export interface IndexingCheckResult {
  url: string
  google: GoogleIndexingResult
  models: Record<AIModel, AIProbeResult | null>
  checkedAt: string
}

/**
 * 创建 OpenRouter 客户端
 */
function createOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey
  })
}

/**
 * 检查页面是否被Google收录
 * 使用site:查询方案
 */
export async function checkGoogleIndexing(url: string): Promise<GoogleIndexingResult> {
  try {
    // 使用 site:完整URL 检查页面是否被索引
    const searchQuery = `site:${url}`

    // 直接抓取Google搜索结果页面
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=10`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 3600 } // 缓存1小时
    })

    if (!response.ok) {
      throw new Error(`Google search error: ${response.statusText}`)
    }

    const html = await response.text()

    console.log(html, 'checkGoogleIndexing')

    // 检查是否有"没有找到"的提示，如果没有这个提示就说明有结果（被索引了）
    const noResults =
      html.includes('did not match any documents') || html.includes('没有找到') || html.includes('No results found')

    const indexed = !noResults

    return {
      indexed,
      resultCount: indexed ? 1 : 0
    }
  } catch (error) {
    return {
      indexed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 检查页面是否被AI模型收录
 * 使用两层探针方案：
 * 1. 训练语料探针：检查模型训练数据中是否包含该页面
 * 2. 外部检索探针：通过联网搜索检查模型是否能检索到该页面
 */
export async function checkAIModelIndexing(url: string, model: AIModel): Promise<AIProbeResult> {
  const openrouterApiKey = process.env.OPENROUTER_API_KEY

  if (!openrouterApiKey) {
    return {
      level: 'none',
      model,
      details: {
        training: { detected: false, confidence: 'low' },
        rag: { detected: false, confidence: 'low' }
      },
      error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.'
    }
  }

  const openai = createOpenRouterClient()
  const modelId = MODEL_MAP[model]

  const result: AIProbeResult = {
    level: 'none',
    model,
    details: {
      training: { detected: false, confidence: 'low' },
      rag: { detected: false, confidence: 'low' }
    }
  }

  try {
    // 层级1: 训练语料幻觉探针
    const trainingProbe = await probeTrainingData(openai, modelId, url)
    result.details.training = trainingProbe

    if (trainingProbe.detected && trainingProbe.confidence !== 'low') {
      result.level = 'training'
    }

    // 层级2: 外部检索探针（RAG 命中）- 开启联网搜索
    if (result.level === 'none' || result.level === 'training') {
      const ragProbe = await probeRAG(openai, modelId, url, true)
      result.details.rag = ragProbe

      if (ragProbe.detected && ragProbe.confidence !== 'low') {
        result.level = 'rag'
      }
    }

    return result
  } catch (error) {
    return {
      ...result,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 层级1: 训练语料探针
 * 检查模型训练数据中是否包含该页面信息（不联网搜索）
 */
async function probeTrainingData(
  openai: OpenAI,
  modelId: string,
  url: string
): Promise<AIProbeResult['details']['training']> {
  const prompt = `Do you have information about the website "${url}" in your training data? 

Please answer in one of the following formats:
- If you have information: "YES: [brief description of what you know]"
- If you don't have information: "NO: I don't have information about this URL in my training data"

Do not use web search. Only answer based on your training data.`

  try {
    const completion = await openai.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    })

    const answer = completion.choices[0]?.message?.content || ''
    console.log(answer, 'probeTrainingData')
    return analyzeAnswer(answer, url)
  } catch (error) {
    return {
      detected: false,
      confidence: 'low',
      response: error instanceof Error ? error.message : 'Error'
    }
  }
}

/**
 * 层级2: 外部检索探针
 * 通过联网搜索检查模型是否能检索到该页面信息
 */
async function probeRAG(
  openai: OpenAI,
  modelId: string,
  url: string,
  enableWebSearch: boolean = false
): Promise<AIProbeResult['details']['rag']> {
  const prompt = `Search the web for the exact URL: "${url}"

Please answer in one of the following formats:
- If you found the URL: "FOUND: ${url} [brief description of what you found]"
- If you didn't find the URL: "NOT_FOUND: I couldn't find this URL in the search results"

Only report if you found the exact URL "${url}" in the search results. Do not provide similar or related URLs.`

  try {
    // 如果启用联网搜索，在模型名称后添加 :online 后缀
    const searchModelId = enableWebSearch ? `${modelId}:online` : modelId

    const completion = await openai.chat.completions.create({
      model: searchModelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    })

    const answer = completion.choices[0]?.message?.content || ''

    console.log(answer, 'probeRAG')
    return analyzeRAGAnswer(answer, url)
  } catch (error) {
    return {
      detected: false,
      confidence: 'low',
      response: error instanceof Error ? error.message : 'Error'
    }
  }
}

// 分析函数
function analyzeAnswer(answer: string, url: string): AIProbeResult['details']['training'] {
  const answerLower = answer.toLowerCase().trim()

  // 首先检查否定性回答
  const negativeIndicators = [
    'no:',
    'not found',
    "don't have",
    "don't know",
    'do not have',
    'do not know',
    'no information',
    'cannot find',
    "couldn't find",
    'unable to find',
    'not in my training',
    'not in training data'
  ]

  const isNegative = negativeIndicators.some((indicator) => answerLower.includes(indicator))

  // 检查肯定性回答
  const positiveIndicators = ['yes:', 'found:', 'have information', 'know about']
  const isPositive = positiveIndicators.some(
    (indicator) => answerLower.startsWith(indicator) || answerLower.includes(indicator)
  )

  // 检查答案中是否包含目标URL（作为确认）
  const urlRegex = /https?:\/\/[^\s\)]+/g
  const urls = answer.match(urlRegex) || []
  const hasTargetUrl = urls.some((u) => {
    const normalizedUrl = u.replace(/\/$/, '')
    const normalizedTarget = url.replace(/\/$/, '')
    return normalizedUrl === normalizedTarget || normalizedUrl.includes(normalizedTarget.replace(/^https?:\/\//, ''))
  })

  // 也检查URL的简化形式（不含协议）
  const urlWithoutProtocol = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const hasUrlInText = answer.includes(url) || answer.includes(urlWithoutProtocol)

  let detected = false
  let confidence: 'low' | 'medium' | 'high' = 'low'

  // 如果明确是否定回答，直接返回未检测到
  if (isNegative && !isPositive) {
    detected = false
    confidence = 'low'
  }
  // 如果是肯定回答且包含目标URL
  else if (isPositive && hasTargetUrl) {
    detected = true
    confidence = 'high'
  }
  // 如果是肯定回答但没有明确URL
  else if (isPositive && hasUrlInText) {
    detected = true
    confidence = 'medium'
  }
  // 如果包含URL但不是否定回答（可能是隐含的肯定）
  else if (hasTargetUrl && !isNegative) {
    detected = true
    confidence = 'high'
  }
  // 如果只是提到URL但可能是否定回答的一部分
  else if (hasUrlInText && !isNegative && !isPositive) {
    detected = true
    confidence = 'low'
  }

  return {
    detected,
    confidence,
    response: answer
  }
}

function analyzeRAGAnswer(answer: string, url: string): AIProbeResult['details']['rag'] {
  const answerLower = answer.toLowerCase().trim()

  // 首先检查否定性回答
  const negativeIndicators = [
    'not_found:',
    'not found',
    "couldn't find",
    'could not find',
    'cannot find',
    'unable to find',
    "didn't find",
    'did not find',
    'no results',
    'no search results'
  ]

  const isNegative = negativeIndicators.some(
    (indicator) => answerLower.startsWith(indicator) || answerLower.includes(indicator)
  )

  // 检查肯定性回答
  const positiveIndicators = ['found:', 'yes:', 'located:', 'discovered:']
  const isPositive = positiveIndicators.some(
    (indicator) => answerLower.startsWith(indicator) || answerLower.includes(indicator)
  )

  // 检查答案中是否包含目标URL（作为确认）
  const urlRegex = /https?:\/\/[^\s\)]+/g
  const urls = answer.match(urlRegex) || []
  const hasTargetUrl = urls.some((u) => {
    const normalizedUrl = u.replace(/\/$/, '')
    const normalizedTarget = url.replace(/\/$/, '')
    return normalizedUrl === normalizedTarget || normalizedUrl.includes(normalizedTarget.replace(/^https?:\/\//, ''))
  })

  // 也检查URL的简化形式（不含协议）
  const urlWithoutProtocol = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const hasUrlInText = answer.includes(url) || answer.includes(urlWithoutProtocol)

  let detected = false
  let confidence: 'low' | 'medium' | 'high' = 'low'

  // 如果明确是否定回答，直接返回未检测到
  if (isNegative && !isPositive) {
    detected = false
    confidence = 'low'
  }
  // 如果是肯定回答且包含目标URL
  else if (isPositive && hasTargetUrl) {
    detected = true
    confidence = 'high'
  }
  // 如果是肯定回答但没有明确URL
  else if (isPositive && hasUrlInText) {
    detected = true
    confidence = 'medium'
  }
  // 如果包含URL但不是否定回答（可能是隐含的肯定）
  else if (hasTargetUrl && !isNegative) {
    detected = true
    confidence = 'high'
  }
  // 如果只是提到URL但可能是否定回答的一部分
  else if (hasUrlInText && !isNegative && !isPositive) {
    detected = true
    confidence = 'low'
  }

  return {
    detected,
    confidence,
    response: answer
  }
}

/**
 * 综合检查函数
 */
export async function checkIndexing(url: string, models: AIModel[] = ['chatgpt']): Promise<IndexingCheckResult> {
  const checks: Array<Promise<[AIModel, AIProbeResult | null]>> = []

  if (models.includes('chatgpt')) {
    checks.push(
      checkAIModelIndexing(url, 'chatgpt')
        .then((result): [AIModel, AIProbeResult | null] => ['chatgpt', result])
        .catch((): [AIModel, AIProbeResult | null] => ['chatgpt', null])
    )
  }

  const [google, ...modelResults] = await Promise.all([checkGoogleIndexing(url), ...checks])

  const modelsMap: Record<AIModel, AIProbeResult | null> = {
    chatgpt: null
  }

  for (const [model, result] of modelResults) {
    modelsMap[model] = result
  }

  return {
    url,
    google,
    models: modelsMap,
    checkedAt: new Date().toISOString()
  }
}
