'use client'

import { useState, useCallback } from 'react'

const INDUSTRIES = [
  'Education Management', 'Professional Training and Coaching', 'E-Learning',
  'Information Technology and Services', 'Computer Software', 'Higher Education',
  'Management Consulting', 'Human Resources', 'Staffing and Recruiting',
  'Corporate Training', 'Cybersecurity', 'Cloud Computing',
  'Artificial Intelligence', 'Data Science', 'DevOps',
]

const REGIONS = [
  'United States', 'United Kingdom', 'Canada', 'India', 'Australia',
  'Germany', 'Singapore', 'UAE', 'Netherlands', 'France',
  'California, United States', 'New York, United States',
  'London Area, United Kingdom', 'Ontario, Canada', 'Bangalore, India',
]

const HEADCOUNTS = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+',
]

const CERTIFICATIONS = [
  'Agile', 'Scrum', 'DevOps', 'Cloud Computing', 'AWS', 'Azure',
  'Cybersecurity', 'AI / Machine Learning', 'ITIL', 'PMP',
  'Data Science', 'Blockchain', 'IoT', 'Six Sigma', 'SAFe',
  'Kubernetes', 'Agentic AI', 'Generative AI',
]

interface LeadResult {
  'Serial': number
  'Date': string
  'ATP Name': string
  'Source of Lead': string
  'Key Certifications offered by ATP': string
  'Region/Country': string
  'Website': string
  'Email ID (all available on website)': string
  'LinkedIn URL': string
  'Partner Fit Score': string
  'Fit Reason': string
  'Suggested Approach': string
  [key: string]: string | number
}

function TagSelector({
  label,
  options,
  selected,
  onToggle,
  suggested,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (val: string) => void
  suggested?: string[]
}) {
  const [showAll, setShowAll] = useState(false)
  const visibleOptions = showAll ? options : options.slice(0, 6)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className="tag-pill tag-pill-active"
          >
            {item}
            <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ))}
        {visibleOptions
          .filter((o) => !selected.includes(o))
          .map((item) => (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={`tag-pill ${
                suggested?.includes(item) ? 'tag-pill-suggested' : 'tag-pill-inactive'
              }`}
            >
              <span className="text-green-600 text-xs mr-0.5">+</span>
              {item}
              {suggested?.includes(item) && (
                <span className="text-[10px] text-blue-400 ml-1">suggested</span>
              )}
            </button>
          ))}
      </div>
      {options.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-gsdc-blue hover:underline mt-1"
        >
          {showAll ? 'Show less' : `+ ${options.length - 6} more`}
        </button>
      )}
    </div>
  )
}

export default function Home() {
  const [industries, setIndustries] = useState<string[]>(['Education Management', 'Professional Training and Coaching'])
  const [regions, setRegions] = useState<string[]>(['United States', 'United Kingdom'])
  const [headcounts, setHeadcounts] = useState<string[]>(['11-50', '51-200'])
  const [certifications, setCertifications] = useState<string[]>([])
  const [keywords, setKeywords] = useState('corporate training certification partner')
  const [maxResults, setMaxResults] = useState(10)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState<LeadResult[]>([])
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(true)

  const toggle = useCallback(
    (list: string[], setList: (v: string[]) => void) => (val: string) => {
      setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val])
    },
    []
  )

  const handleSearch = async () => {
    if (!webhookUrl) {
      setError('Please enter your n8n webhook URL in the settings panel.')
      setShowSettings(true)
      return
    }

    setLoading(true)
    setError('')
    setResults([])
    setProgress('Sending filters to n8n workflow...')

    try {
      const payload = {
        industry: industries.join(', '),
        regions,
        headcount: headcounts,
        keywords,
        certifications: certifications.join(', '),
        maxResults,
      }

      setProgress('Researching companies... This may take 1-3 minutes.')

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Workflow returned status ${res.status}`)

      const data = await res.json()

      if (data.success && data.leads) {
        setResults(data.leads)
        setProgress(`Found ${data.leads.length} potential partners!`)
      } else if (Array.isArray(data)) {
        setResults(data)
        setProgress(`Found ${data.length} potential partners!`)
      } else {
        setResults(data.leads || [data])
        setProgress('Research complete!')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to run research: ${message}. Make sure your n8n workflow is active and the webhook URL is correct.`)
      setProgress('')
    } finally {
      setLoading(false)
    }
  }

  const downloadExcel = async () => {
    if (results.length === 0) return

    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(results)

    const colWidths = Object.keys(results[0]).map((key) => ({
      wch: Math.max(key.length, 20),
    }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lead Research')
    XLSX.writeFile(wb, `GSDC_Lead_Research_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const fitColor = (score: string) => {
    if (score === 'High') return 'bg-green-100 text-green-800'
    if (score === 'Medium') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gsdc-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">GSDC Lead Finder</h1>
                <p className="text-xs text-gray-500">Partner Research Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {results.length > 0 && (
                <button
                  onClick={downloadExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-gsdc-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gsdc-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  n8n Webhook URL
                </h3>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://n8n.novelvista.com/webhook/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gsdc-blue focus:border-transparent outline-none"
                />
                <p className="text-[11px] text-gray-400">
                  Paste your n8n webhook URL here. The workflow will be triggered with the filters below.
                </p>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-800">Filters</h2>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-gsdc-blue rounded-full">
                  {industries.length + regions.length + headcounts.length + certifications.length} active
                </span>
              </div>

              <TagSelector
                label="Industry"
                options={INDUSTRIES}
                selected={industries}
                onToggle={toggle(industries, setIndustries)}
              />

              <TagSelector
                label="Company Headcount"
                options={HEADCOUNTS}
                selected={headcounts}
                onToggle={toggle(headcounts, setHeadcounts)}
              />

              <TagSelector
                label="Headquarters Location"
                options={REGIONS}
                selected={regions}
                onToggle={toggle(regions, setRegions)}
                suggested={['India', 'Canada']}
              />

              <TagSelector
                label="Certification Focus"
                options={CERTIFICATIONS}
                selected={certifications}
                onToggle={toggle(certifications, setCertifications)}
                suggested={['Agentic AI', 'Cloud Computing', 'Cybersecurity']}
              />

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Search Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. corporate training, IT certification"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gsdc-blue focus:border-transparent outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Max Results: <span className="text-gsdc-blue">{maxResults}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gsdc-blue"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>1 company</span>
                  <span>50 companies</span>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-3 bg-gsdc-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Researching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Partners
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3">
            {/* Status Bar */}
            {(progress || error) && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-gsdc-blue border border-blue-200'
              }`}>
                {error || progress}
              </div>
            )}

            {/* Empty State */}
            {results.length === 0 && !loading && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gsdc-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Find Partners</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Configure your filters on the left panel and click &quot;Find Partners&quot; to start
                  automated research. The tool will search for companies matching your criteria,
                  scrape their websites, and analyze them for GSDC partnership fit.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">1</div>
                    <p className="text-xs text-gray-500">Set Filters</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">2</div>
                    <p className="text-xs text-gray-500">Run Research</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">3</div>
                    <p className="text-xs text-gray-500">Download Sheet</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-800">
                    {results.length} Potential Partners Found
                  </h2>
                  <button
                    onClick={downloadExcel}
                    className="text-sm text-gsdc-blue hover:underline font-medium"
                  >
                    Export All to Excel
                  </button>
                </div>

                {results.map((lead, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-gsdc-blue font-bold text-lg">
                            {(lead['ATP Name'] || '?')[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base">
                            {lead['ATP Name']}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {lead['Key Certifications offered by ATP']} &bull; {lead['Region/Country']}
                          </p>
                          {lead['Fit Reason'] && (
                            <p className="text-xs text-gray-400 mt-1">{lead['Fit Reason']}</p>
                          )}
                        </div>
                      </div>
                      {lead['Partner Fit Score'] && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${fitColor(lead['Partner Fit Score'])}`}>
                          {lead['Partner Fit Score']} Fit
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                      {lead['Website'] && (
                        <a
                          href={lead['Website']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-gsdc-blue hover:underline"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          Website
                        </a>
                      )}
                      {lead['LinkedIn URL'] && (
                        <a
                          href={lead['LinkedIn URL']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-gsdc-blue hover:underline"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </a>
                      )}
                      {lead['Email ID (all available on website)'] && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {lead['Email ID (all available on website)']}
                        </span>
                      )}
                      {lead['Suggested Approach'] && (
                        <span className="flex items-center gap-1 text-gsdc-orange">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          {lead['Suggested Approach']}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-gray-400">
          <span>GSDC Lead Finder v1.0 &bull; Powered by n8n + AI</span>
          <a
            href="https://www.gsdcouncil.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gsdc-blue hover:underline"
          >
            gsdcouncil.org
          </a>
        </div>
      </footer>
    </div>
  )
}
