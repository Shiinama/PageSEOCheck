'use client'

import { Globe, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useOpenAIConfigStore } from '@/stores/openai-config'

// 预定义的模型列表
const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', supportsWebSearch: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', supportsWebSearch: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', supportsWebSearch: false },
  { id: 'gpt-4', name: 'GPT-4', supportsWebSearch: false },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', supportsWebSearch: false }
]

export default function OpenAIConfig() {
  const t = useTranslations('openaiConfig')
  const { model, useProxy, setModel, setUseProxy, getConfig } = useOpenAIConfigStore()

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === model)

  const config = getConfig()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 模型选择 */}
        <div className="space-y-2">
          <Label htmlFor="openai-model">{t('modelLabel')}</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="openai-model">
              <SelectValue placeholder={t('modelPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <span>{m.name}</span>
                    {m.supportsWebSearch && <Globe className="h-3 w-3 text-blue-500" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModel && (
            <div className="text-muted-foreground text-sm">
              {selectedModel.supportsWebSearch ? (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span>{t('webSearchEnabled')}</span>
                </div>
              ) : (
                <span>{t('webSearchDisabled')}</span>
              )}
            </div>
          )}
        </div>

        {/* Proxy 选项 */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="use-proxy">{t('useProxyLabel')}</Label>
            <p className="text-muted-foreground text-sm">{t('useProxyDescription')}</p>
          </div>
          <Switch id="use-proxy" checked={useProxy} onCheckedChange={setUseProxy} />
        </div>

        {/* 配置状态 */}
        {config && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-xs">
              {t('configSaved')}: {selectedModel?.name || config.model}
              {selectedModel?.supportsWebSearch && ` (${t('withWebSearch')})`}
              {config.useProxy && ` • ${t('proxyEnabled')}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
