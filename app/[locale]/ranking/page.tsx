import { Metadata } from 'next'

import RankingPanel from '@/components/performance-audit/ranking-panel'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'SEO Leaderboard – Top Performing Websites',
    description: 'View the top performing websites ranked by comprehensive SEO scores. See how your site compares.'
  }
}

export default function RankingPage() {
  return (
    <div className="w-full space-y-8">
      <header className="text-center">
        <h1 className="text-primary text-4xl leading-tight font-bold md:text-5xl">SEO Leaderboard</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-base md:text-lg">
          Discover the top performing websites ranked by comprehensive SEO scores. Rankings are calculated using AI and
          multiple SEO factors including performance, Core Web Vitals, mobile friendliness, and more.
        </p>
      </header>

      <RankingPanel />
    </div>
  )
}
