'use server'

import { OpenRouter } from '@openrouter/sdk'

export type AIModel = 'chatgpt'

// OpenRouter 模型映射
const MODEL_MAP: Record<AIModel, string> = {
  chatgpt: 'openai/gpt-5.1'
}

export interface GoogleIndexingResult {
  indexed: boolean
  resultCount?: number
  error?: string
}

export interface AIProbeResult {
  model: AIModel
  training: {
    detected: boolean
    response?: string
  }
  rag: {
    detected: boolean
    response?: string
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

  return new OpenRouter({
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
      model,
      training: { detected: false },
      rag: { detected: false },
      error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.'
    }
  }

  const openai = createOpenRouterClient()
  const modelId = MODEL_MAP[model]

  try {
    // 训练数据探针
    const trainingProbe = await probeTrainingData(openai, modelId, url)

    // RAG检索探针（开启联网搜索）
    const ragProbe = await probeRAG(openai, modelId, url, true)

    return {
      model,
      training: trainingProbe,
      rag: ragProbe
    }
  } catch (error) {
    return {
      model,
      training: { detected: false },
      rag: { detected: false },
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 层级1: 训练语料探针
 * 检查模型训练数据中是否包含该页面信息（不联网搜索）
 */
async function probeTrainingData(openai: OpenRouter, modelId: string, url: string): Promise<AIProbeResult['training']> {
  const prompt = `Do you know anything about ${url}? Answer only YES or NO.`

  try {
    const completion = await openai.chat.send({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 200
    })

    const answer = (completion.choices[0]?.message?.content as string) || ''
    return analyzeAnswer(answer)
  } catch (error) {
    return {
      detected: false,
      response: error instanceof Error ? error.message : 'Error'
    }
  }
}

/**
 * 层级2: 外部检索探针
 * 通过联网搜索检查模型是否能检索到该页面信息
 */
async function probeRAG(
  openai: OpenRouter,
  modelId: string,
  url: string,
  enableWebSearch: boolean = false
): Promise<AIProbeResult['rag']> {
  const prompt = `Can you find the exact URL ${url} on the web? Answer only YES or NO.`

  try {
    // 如果启用联网搜索，在模型名称后添加 :online 后缀
    const searchModelId = enableWebSearch ? `${modelId}:online` : modelId

    const completion = await openai.chat.send({
      model: searchModelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 200
    })

    const answer = (completion.choices[0]?.message?.content as string) || ''

    return analyzeRAGAnswer(answer)
  } catch (error) {
    return {
      detected: false,
      response: error instanceof Error ? error.message : 'Error'
    }
  }
}

// 分析函数 - 简化为只判断 YES/NO
function analyzeAnswer(answer: string): AIProbeResult['training'] {
  const answerLower = answer.toLowerCase().trim()

  // 检查肯定回答
  const positiveIndicators = ['yes', 'yes:', 'found', 'know', 'have information']
  const isPositive = positiveIndicators.some(
    (indicator) =>
      answerLower === indicator || answerLower.startsWith(indicator + ' ') || answerLower.startsWith(indicator + ':')
  )

  // 检查否定回答
  const negativeIndicators = [
    'no',
    'no:',
    "don't know",
    "don't have",
    "can't say",
    "don't have access",
    "can't determine",
    'not found',
    'no information'
  ]
  const isNegative = negativeIndicators.some(
    (indicator) =>
      answerLower === indicator ||
      answerLower.startsWith(indicator + ' ') ||
      answerLower.startsWith(indicator + ':') ||
      answerLower.includes(indicator)
  )

  // 如果明确是肯定回答，返回 detected: true
  // 如果明确是否定回答，返回 detected: false
  // 如果都不明确，默认返回 false
  const detected = isPositive && !isNegative

  return {
    detected,
    response: answer
  }
}

function analyzeRAGAnswer(answer: string): AIProbeResult['rag'] {
  const answerLower = answer.toLowerCase().trim()

  // 检查肯定回答
  const positiveIndicators = ['yes', 'yes:', 'found', 'located', 'discovered']
  const isPositive = positiveIndicators.some(
    (indicator) =>
      answerLower === indicator || answerLower.startsWith(indicator + ' ') || answerLower.startsWith(indicator + ':')
  )

  // 检查否定回答
  const negativeIndicators = [
    'no',
    'no:',
    'not found',
    "couldn't find",
    'cannot find',
    'unable to find',
    "didn't find",
    'no results'
  ]
  const isNegative = negativeIndicators.some(
    (indicator) =>
      answerLower === indicator ||
      answerLower.startsWith(indicator + ' ') ||
      answerLower.startsWith(indicator + ':') ||
      answerLower.includes(indicator)
  )

  // 如果明确是肯定回答，返回 detected: true
  // 如果明确是否定回答，返回 detected: false
  // 如果都不明确，默认返回 false
  const detected = isPositive && !isNegative

  return {
    detected,
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
