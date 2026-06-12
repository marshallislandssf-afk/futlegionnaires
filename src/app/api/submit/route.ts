import { NextRequest, NextResponse } from 'next/server'
import { submitPlayerProfile } from '@/lib/players'
import type { PlayerSubmission } from '@/types'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body: PlayerSubmission = await request.json()

    // Basic validation
    if (!body.name || !body.nationality_1 || !body.submitter_email) {
      return NextResponse.json(
        { error: 'name, nationality_1 and submitter_email are required' },
        { status: 400 }
      )
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.submitter_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const result = await submitPlayerProfile(body)
    return NextResponse.json(
      { success: true, submission_id: result.id, message: 'Your profile has been submitted for review. We\'ll be in touch shortly.' },
      { status: 201 }
    )
  } catch (err) {
    console.error('Submission error:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
