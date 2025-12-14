'use client'

import { Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { FaDiscord, FaTwitter } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

import { Button } from '@/components/ui/button'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations('login.form')

  const [isLoading, setIsLoading] = useState({
    google: false,
    twitter: false,
    discord: false
  })

  const handleSignIn = async (provider: 'google' | 'twitter' | 'discord') => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }))
    try {
      const result = await signIn(provider, {
        redirect: false
      })

      if (result?.ok && !result?.error && onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => handleSignIn('google')} disabled={isLoading.google} variant="outline" className="w-full">
        {isLoading.google ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FcGoogle className="mr-2 h-5 w-5" />}
        {t('continueWithGoogle')}
      </Button>

      <Button onClick={() => handleSignIn('twitter')} disabled={isLoading.twitter} variant="outline" className="w-full">
        {isLoading.twitter ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FaTwitter className="mr-2 h-5 w-5 text-[#1DA1F2]" />
        )}
        {t('continueWithTwitter')}
      </Button>

      <Button onClick={() => handleSignIn('discord')} disabled={isLoading.discord} variant="outline" className="w-full">
        {isLoading.discord ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FaDiscord className="mr-2 h-5 w-5 text-[#5865F2]" />
        )}
        {t('continueWithDiscord')}
      </Button>
    </div>
  )
}
