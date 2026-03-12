import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const webhookUrl = body.webhookUrl

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'webhookUrl is required' },
        { status: 400 }
      )
    }

    // Forward request to n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        industry: body.industry,
        regions: body.regions,
        headcount: body.headcount,
        keywords: body.keywords,
        certifications: body.certifications,
        maxResults: body.maxResults,
      }),
    })

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: `n8n returned status ${n8nResponse.status}` },
        { status: 502 }
      )
    }

    const data = await n8nResponse.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process research: ${message}` },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
