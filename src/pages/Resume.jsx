import React, { useState, useRef, useEffect } from 'react'

function scoreColor(s) {
  return s >= 80 ? '#22c55e' : s >= 60 ? '#f4a400' : '#ef4444'
}

function ScoreRing({ score }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f4a400' : '#ef4444'
  const glow = score >= 80 ? 'rgba(34,197,94,0.4)' : score >= 60 ? 'rgba(244,164,0,0.4)' : 'rgba(239,68,68,0.4)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1e1e22" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="square"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 70 70)"
          style={{ filter: `drop-shadow(0 0 6px ${glow})`, transition: 'stroke-dasharray 1.2s ease' }}
        />
        <circle cx="70" cy="70" r="44" fill="none" stroke="rgba(67,97,238,0.08)" strokeWidth="1" strokeDasharray="2 3" />
        <text x="70" y="62" textAnchor="middle" fill="#f4f4f5" fontFamily="IBM Plex Sans" fontSize="26" fontWeight="600">{score}</text>
        <text x="70" y="78" textAnchor="middle" fill="#71717a" fontFamily="Space Mono" fontSize="9">/100</text>
        <text x="70" y="94" textAnchor="middle" fill={color} fontFamily="Space Mono" fontSize="8" fontWeight="700">
          {score >= 80 ? 'STRONG' : score >= 60 ? 'GOOD' : 'NEEDS WORK'}
        </text>
      </svg>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '12px', color: '#a1a1aa' }}>Resume Score</div>
    </div>
  )
}

function FeedbackRow({ item, accentColor, typeLabel }) {
  return (
    <div style={{
      background: '#111113',
      border: '1px solid #1e1e22',
      borderLeft: `2px solid ${accentColor}`,
      padding: '12px 14px',
      marginBottom: '1px',
      transition: 'background 0.12s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#161618' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#111113' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: accentColor, background: `${accentColor}12`, padding: '2px 6px', border: `1px solid ${accentColor}25`, whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px' }}>
          {typeLabel}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '13px', color: '#f4f4f5', marginBottom: '4px' }}>
            {item.issue}
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a', lineHeight: '1.6' }}>
            {item.fix}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="glass-card" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '400px', gap: '28px', padding: '48px 40px',
      animation: 'glowPulse 3s ease-in-out infinite',
    }}>
      <svg width="64" height="64" viewBox="0 0 120 120">
        <polygon points="60,10 110,85 10,85" fill="rgba(67,97,238,0.06)" stroke="rgba(67,97,238,0.3)" strokeWidth="1" />
        <polygon points="60,30 90,75 30,75" fill="none" stroke="rgba(67,97,238,0.15)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="60" cy="55" r="10" fill="rgba(67,97,238,0.08)" stroke="rgba(67,97,238,0.3)" strokeWidth="1" />
        <circle cx="60" cy="8" r="2.5" fill="#4361ee" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '22px', color: '#f4f4f5', marginBottom: '10px' }}>
          Ready for Analysis
        </div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: '#71717a', lineHeight: '1.65', maxWidth: '280px' }}>
          Upload your resume on the left and our AI will give you detailed, CS-specific feedback in seconds.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '320px' }}>
        {['ATS Score', 'Impact', 'Keywords', 'Format'].map(tag => (
          <span key={tag} className="glass-card" style={{
            padding: '12px 14px',
            border: '1px solid rgba(67,97,238,0.2)',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            color: '#4361ee',
            textAlign: 'center',
            display: 'block',
          }}>{tag}</span>
        ))}
      </div>
    </div>
  )
}

export default function Resume() {
  const _saved = (() => { try { return JSON.parse(sessionStorage.getItem('axiom_resume') || 'null') } catch { return null } })()

  const [analyzed, setAnalyzed] = useState(!!_saved)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [pasteMode, setPasteMode] = useState(_saved?.pasteMode ?? false)
  const [pasteText, setPasteText] = useState(_saved?.pasteText ?? '')
  const [fileName, setFileName] = useState(_saved?.fileName ?? null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [result, setResult] = useState(_saved?.result ?? null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  function processFile(file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFileName(file.name)
    setUploadedFile(file)
    setAnalyzed(false)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setError(null)
    try {
      const formData = new FormData()
      if (!pasteMode && uploadedFile) {
        formData.append('file', uploadedFile)
      } else {
        formData.append('text', pasteText)
      }
      const res = await fetch('/api/resume/analyze', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
      setAnalyzed(true)
      sessionStorage.setItem('axiom_resume', JSON.stringify({
        result: data,
        fileName: pasteMode ? null : fileName,
        pasteText: pasteMode ? pasteText : '',
        pasteMode,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAnalyzed(false)
    setAnalyzing(false)
    setFileName(null)
    setUploadedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setPasteText('')
    sessionStorage.removeItem('axiom_resume')
  }

  const isPDF = fileName?.toLowerCase().endsWith('.pdf') || uploadedFile?.type === 'application/pdf'

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left: Upload */}
      <div className="glass-card" style={{ borderRadius: 0,
        width: '44%',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden',
      }}>
        <div className="animate-in stagger-1" style={{ flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: '22px', color: '#f4f4f5', marginBottom: '4px' }}>
            Resume Reviewer
          </h2>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a' }}>
            AI-powered analysis with CS-specific recommendations
          </p>
        </div>

        {/* Toggle */}
        <div className="animate-in stagger-2" style={{ display: 'flex', gap: '0', background: '#111113', border: '1px solid #1e1e22', padding: '3px', flexShrink: 0 }}>
          {['Upload PDF', 'Paste Text'].map((mode, i) => (
            <button key={mode} onClick={() => setPasteMode(i === 1)} style={{
              flex: 1, padding: '7px',
              background: pasteMode === (i === 1) ? '#4361ee' : 'rgba(255,255,255,0.03)',
              border: pasteMode === (i === 1) ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              backdropFilter: 'blur(12px)',
              color: pasteMode === (i === 1) ? '#ffffff' : '#71717a',
              fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', fontWeight: '500',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>{mode}</button>
          ))}
        </div>

        {/* Upload area */}
        {!pasteMode ? (
          <>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleFile} />

            {!fileName ? (
              <div
                className="animate-in stagger-3"
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                style={{
                  flex: 1,
                  border: `2px dashed ${dragOver ? '#4361ee' : 'rgba(67,97,238,0.3)'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  background: 'rgba(67,97,238,0.04)',
                  boxShadow: dragOver ? '0 0 24px rgba(67,97,238,0.25), 0 0 48px rgba(67,97,238,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  minHeight: '240px',
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4361ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '14px', color: '#f4f4f5', marginBottom: '4px' }}>
                    Drop your resume here
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a' }}>
                    PDF, Word, or plain text · max 5MB
                  </div>
                </div>
                <div
                  className="gradient-border"
                  style={{
                    padding: '6px 16px',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '12px',
                    color: '#4361ee',
                    cursor: 'pointer',
                    transition: 'box-shadow 200ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(67,97,238,0.25), 0 0 48px rgba(67,97,238,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                >Browse files</div>
              </div>
            ) : (
              <div className="animate-in stagger-3" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
                {/* File info */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px',
                  background: '#111113',
                  border: '1px solid #1e1e22',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: '32px', height: '32px',
                    background: 'rgba(67,97,238,0.08)',
                    border: '1px solid rgba(67,97,238,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', flexShrink: 0,
                  }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#6b83f0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{fileName}</div>
                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#71717a', marginTop: '1px' }}>
                      {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(0)} KB` : ''}
                      {isPDF ? ' · PDF' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => fileRef.current.click()}
                    style={{
                      padding: '4px 10px',
                      background: 'transparent',
                      border: '1px solid #1e1e22',
                      color: '#71717a',
                      fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(67,97,238,0.4)'; e.currentTarget.style.color = '#6b83f0' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#71717a' }}
                  >Replace</button>
                </div>

                {/* Preview */}
                {isPDF ? (
                  <div style={{
                    flex: 1, overflow: 'hidden',
                    border: '1px solid #1e1e22',
                    background: '#fff', minHeight: 0,
                  }}>
                    <iframe
                      src={previewUrl}
                      title="Resume Preview"
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block', minHeight: '300px' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    flex: 1, border: '1px solid #1e1e22',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '8px', background: '#111113', minHeight: '180px',
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(67,97,238,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a', textAlign: 'center', lineHeight: '1.5' }}>
                      Preview not available for this file type.<br/>Click Analyze to process.
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="animate-in stagger-3" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '240px' }}>
            <textarea
              placeholder="Paste your resume text here..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              style={{
                flex: 1,
                background: '#111113',
                border: '1px solid #1e1e22',
                padding: '14px',
                color: '#a1a1aa',
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none',
                minHeight: '220px',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(67,97,238,0.4)'}
              onBlur={e => e.currentTarget.style.borderColor = '#1e1e22'}
            />
          </div>
        )}

        {/* Analyze button */}
        {error && (
          <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#f87171' }}>
            // Error: {error}
          </div>
        )}

        {(fileName || (pasteMode && pasteText.trim())) && !analyzed && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="animate-in stagger-4"
            style={{
              padding: '12px',
              background: analyzing ? 'rgba(67,97,238,0.25)' : '#4361ee',
              border: 'none',
              color: '#fff',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: '600',
              fontSize: '14px',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            {analyzing ? (
              <>
                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Analyzing resume...
              </>
            ) : '⚡ Analyze with AI'}
          </button>
        )}
      </div>

      {/* Right: Feedback */}
      <div style={{
        flex: 1,
        padding: '28px 24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: '#09090b',
      }}>
        {!analyzed && !analyzing ? (
          <EmptyState />
        ) : analyzing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '36px', textAlign: 'center' }}>
              <div style={{
                width: '48px', height: '48px',
                border: '2px solid rgba(67,97,238,0.2)',
                borderTopColor: '#4361ee',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '15px', color: '#f4f4f5' }}>Analyzing your resume...</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a' }}>Checking ATS · Scanning keywords · Measuring impact</div>
            </div>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ background: '#111113', border: '1px solid #1e1e22', padding: '14px' }}>
                <div className="skeleton" style={{ height: '13px', width: '55%', marginBottom: '7px' }} />
                <div className="skeleton" style={{ height: '11px', width: '88%', marginBottom: '4px' }} />
                <div className="skeleton" style={{ height: '11px', width: '72%' }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Score + checks */}
            <div className="animate-in stagger-1" style={{
              padding: '20px',
              background: '#111113',
              border: '1px solid #1e1e22',
              display: 'flex', alignItems: 'center', gap: '28px',
            }}>
              <ScoreRing score={result.overall_score} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '12px', color: '#f4f4f5', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CS-Specific Checks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'ATS Friendly',   score: result.ats_score },
                    { label: 'Project Impact', score: result.impact_score },
                    { label: 'Tech Stack',     score: result.tech_score },
                    { label: 'Formatting',     score: result.format_score },
                  ].map(tag => {
                    const color = scoreColor(tag.score)
                    return (
                      <div key={tag.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#a1a1aa', width: '96px' }}>{tag.label}</span>
                        <div style={{ flex: 1, height: '4px', background: '#1e1e22', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${tag.score}%`, background: color }} />
                        </div>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color, width: '28px', textAlign: 'right' }}>{tag.score}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="animate-in stagger-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '6px', height: '6px', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '12px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Strengths</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', marginLeft: '2px' }}>{result.strengths.length} found</span>
              </div>
              {result.strengths.map((item, i) => <FeedbackRow key={i} item={item} accentColor="#22c55e" typeLabel="STRENGTH" />)}
            </div>

            {/* Improvements */}
            <div className="animate-in stagger-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '6px', height: '6px', background: '#f4a400', display: 'inline-block' }} />
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '12px', color: '#f4a400', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Improvements</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', marginLeft: '2px' }}>{result.improvements.length} suggestions</span>
              </div>
              {result.improvements.map((item, i) => <FeedbackRow key={i} item={item} accentColor="#f4a400" typeLabel="FIX" />)}
            </div>

            {/* Critical */}
            {result.critical.length > 0 && (
            <div className="animate-in stagger-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '6px', height: '6px', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Critical Issues</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', marginLeft: '2px' }}>{result.critical.length} issues</span>
              </div>
              {result.critical.map((item, i) => <FeedbackRow key={i} item={item} accentColor="#ef4444" typeLabel="CRITICAL" />)}
            </div>
            )}

            <button
              onClick={handleReset}
              style={{
                padding: '10px',
                background: 'transparent',
                border: '1px solid #1e1e22',
                color: '#71717a',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(67,97,238,0.3)'; e.currentTarget.style.color = '#6b83f0' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#71717a' }}
            >
              ← Analyze a different resume
            </button>
          </>
        )}
      </div>
    </div>
  )
}
