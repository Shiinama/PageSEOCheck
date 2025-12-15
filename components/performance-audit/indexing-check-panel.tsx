'use client'

import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import type { AIModel, IndexingCheckResult } from '@/actions/indexing-check'

interface IndexingCheckPanelProps {
  result: IndexingCheckResult | null
  loading: boolean
}

const modelLabels: Record<AIModel, string> = {
  chatgpt: 'ChatGPT'
}

export default function IndexingCheckPanel({ result, loading }: IndexingCheckPanelProps) {
  const t = useTranslations('indexingCheck')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            <span className="text-muted-foreground ml-2">{t('checking')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return null
  }

  const availableModels = Object.entries(result.models).filter(([_, value]) => value !== null) as [
    AIModel,
    NonNullable<IndexingCheckResult['models'][AIModel]>
  ][]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google收录检查 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('google.title')}</h4>
            {result.google.indexed ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <Badge variant="default" className="bg-green-500">
                  {t('google.indexed')}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <Badge variant="destructive">{t('google.notIndexed')}</Badge>
              </div>
            )}
          </div>
          {result.google.resultCount !== undefined && (
            <p className="text-muted-foreground text-sm">
              {t('google.resultCount', { count: result.google.resultCount })}
            </p>
          )}
          {result.google.error && (
            <div className="bg-destructive/10 flex items-start gap-2 rounded-lg p-3">
              <AlertCircle className="text-destructive mt-0.5 h-4 w-4" />
              <p className="text-destructive text-sm">{result.google.error}</p>
            </div>
          )}
        </div>

        {/* AI模型收录检查 */}
        {availableModels.map(([model, modelResult]) => (
          <div key={model} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {t('chatgpt.title')} ({modelLabels[model]})
              </h4>
            </div>

            {modelResult.error && (
              <div className="bg-destructive/10 flex items-start gap-2 rounded-lg p-3">
                <AlertCircle className="text-destructive mt-0.5 h-4 w-4" />
                <p className="text-destructive text-sm">{modelResult.error}</p>
              </div>
            )}

            {/* 探针详情 */}
            <div className="space-y-4 rounded-lg border p-4">
              {/* 训练数据探针 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('chatgpt.probes.training')}</span>
                  <div className="flex items-center gap-2">
                    {modelResult?.training?.detected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <Badge variant="default" className="bg-green-500 text-xs">
                          YES
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <Badge variant="secondary" className="text-xs">
                          NO
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                {modelResult.training.response && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">{modelResult.training.response}</p>
                )}
              </div>

              {/* RAG检索探针 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('chatgpt.probes.rag')}</span>
                  <div className="flex items-center gap-2">
                    {modelResult.rag.detected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <Badge variant="default" className="bg-green-500 text-xs">
                          YES
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <Badge variant="secondary" className="text-xs">
                          NO
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                {modelResult.rag.response && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">{modelResult.rag.response}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 检查时间 */}
        <div className="text-muted-foreground text-xs">
          {t('checkedAt')}: {new Date(result.checkedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
