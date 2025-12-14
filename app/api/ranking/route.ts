import { NextResponse } from 'next/server'

import {
  getRanking,
  updateRanking,
  calculateAndUpdateRanking,
  createRankingEntry,
  calculateAIScore
} from '@/lib/ranking'
import type { MeasureResponse } from '@/lib/measure'

export async function GET() {
  try {
    const ranking = await getRanking()
    return NextResponse.json(ranking)
  } catch (error) {
    console.error('Failed to get ranking:', error)
    return NextResponse.json({ error: 'Failed to get ranking' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const measurement = body.measurement as MeasureResponse

    if (!measurement) {
      return NextResponse.json({ error: 'Measurement data required' }, { status: 400 })
    }

    const entry = await calculateAndUpdateRanking(measurement)
    return NextResponse.json({ entry, success: true })
  } catch (error) {
    console.error('Failed to update ranking:', error)
    return NextResponse.json({ error: 'Failed to update ranking' }, { status: 500 })
  }
}
