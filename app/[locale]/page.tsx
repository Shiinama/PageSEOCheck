import { Metadata } from 'next'

import AnalysisPanel from '@/components/performance-audit/analysis-panel'
import PerformanceAuditResults from '@/components/performance-audit/results'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'SEO Checker – Free SEO Analysis Tool for Any Website',
    description:
      'Check your website SEO for free. Analyze performance, speed, Core Web Vitals, and SEO issues instantly. Simple, fast, and no signup.'
  }
}

export default function Home() {
  return (
    <div className="w-full space-y-8">
      <header className="text-center">
        <h1 className="text-primary text-4xl leading-tight font-bold md:text-5xl">
          Free SEO Analysis Tool For Any Website
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-base md:text-lg">
          Check your website SEO for free. Analyze performance, speed, Core Web Vitals, and SEO issues instantly.
          Simple, fast, and no signup.
        </p>
      </header>

      <AnalysisPanel />

      <PerformanceAuditResults />
    </div>
  )
}
