import React, { useState, useRef } from 'react'

const SCORE = 74

const STRENGTHS = [
  { icon: '⚡', issue: 'Strong technical stack', fix: 'React, Python, and Go are highly sought after. Your project variety demonstrates breadth.' },
  { icon: '🔗', issue: 'GitHub links present', fix: 'Recruiters and engineers can validate your work. Ensure repos are public and well-documented.' },
  { icon: '📐', issue: 'Clean single-page format', fix: 'Your resume fits on one page which is ideal for SWE roles. ATS systems parse it cleanly.' },
]

const IMPROVEMENTS = [
  { icon: '📊', issue: 'Weak impact quantification', fix: 'Add metrics to bullets: "Reduced API latency by 40%" instead of "Optimized API performance".' },
  { icon: '🔍', issue: 'Missing keywords for ATS', fix: 'Add: distributed systems, REST APIs, CI/CD, microservices, agile. These appear in 80% of SWE JDs.' },
  { icon: '📝', issue: 'Objective statement is generic', fix: 'Replace with a 2-line summary. "CS Junior targeting SWE internship, shipping full-stack projects since 2023."' },
]

const CRITICAL = [
  { icon: '🚨', issue: 'No internship experience listed', fix: 'Add personal projects as work experience. Reframe them: "Contract Developer, Personal Projects (2023–Present)".' },
  { icon: '⚠️', issue: 'GPA below 3.5 threshold', fix: 'Consider omitting GPA or list relevant coursework instead. Highlight projects and hackathon wins.' },
]

const TAGS = [
  { label: 'ATS Friendly', score: 68, color: '#f4a400' },
  { label: 'Project Impact', score: 45, color: '#ef4444' },
  { label: 'Tech Stack', score: 91, color: '#22c55e' },
  { label: 'Formatting', score: 88, color: '#22c55e' },
]

function ScoreRing({ score }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f4a400' : '#ef4444'
  const glow = score >= 80 ? 'rgba(34,197,94,0.5)' : score >= 60 ? 'rgba(244,164,0,0.5)' : 'rgba(239,68,68,0.5)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Background ring */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(30,30,53,0.8)" strokeWidth="10" />
        {/* Score ring */}
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 70 70)"
          style={{ filter: `drop-shadow(0 0 8px ${glow})`, transition: 'stroke-dasharray 1.2s ease' }}
        />
        {/* Decorative inner ring */}
        <circle cx="70" cy="70" r="44" fill="none" stroke="rgba(67,97,238,0.1)" strokeWidth="1" strokeDasharray="3 3" />
        {/* Score text */}
        <text x="70" y="62" textAnchor="middle" fill="#fff" fontFamily="Syne, sans-serif" fontSize="28" fontWeight="800">{score}</text>
        <text x="70" y="80" textAnchor="middle" fill="#64748b" fontFamily="Space Mono, monospace" fontSize="10">/100</text>
        <text x="70" y="96" textAnchor="middle" fill={color} fontFamily="Space Mono, monospace" fontSize="9" fontWeight="700">
          {score >= 80 ? 'STRONG' : score >= 60 ? 'GOOD' : 'NEEDS WORK'}
        </text>
      </svg>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0' }}>Resume Score</div>
    </div>
  )
}

function FeedbackCard({ item, accentColor, glowColor }) {
  return (
    <div style={{
      background: 'rgba(12,12,20,0.8)',
      border: `1px solid ${accentColor}25`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: '10px',
      padding: '14px 16px',
      marginBottom: '10px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${glowColor}` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '18px', lineHeight: '1', marginTop: '1px' }}>{item.icon}</span>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '600', fontSize: '13.5px', color: '#e2e8f0', marginBottom: '6px' }}>
            {item.issue}
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12.5px', color: '#64748b', lineHeight: '1.6' }}>
            {item.fix}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '24px', padding: '40px' }}>
      {/* Geometric illustration */}
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4361ee" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7b8ff7" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <polygon points="60,10 110,85 10,85" fill="url(#emptyGrad)" stroke="rgba(67,97,238,0.4)" strokeWidth="1.5" />
        <polygon points="60,30 90,75 30,75" fill="none" stroke="rgba(67,97,238,0.2)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="60" cy="55" r="12" fill="rgba(67,97,238,0.15)" stroke="rgba(67,97,238,0.4)" strokeWidth="1.5" />
        <line x1="60" y1="10" x2="60" y2="30" stroke="rgba(67,97,238,0.3)" strokeWidth="1" />
        <circle cx="60" cy="8" r="3" fill="#4361ee" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '16px', color: '#e2e8f0', marginBottom: '8px' }}>
          Ready for Analysis
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748b', lineHeight: '1.6', maxWidth: '240px' }}>
          Upload your resume on the left and our AI will give you detailed, CS-specific feedback in seconds.
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {['ATS Score', 'Impact', 'Keywords', 'Format'].map(tag => (
          <span key={tag} style={{
            padding: '4px 10px',
            background: 'rgba(67,97,238,0.08)',
            border: '1px solid rgba(67,97,238,0.15)',
            borderRadius: '12px',
            fontFamily: 'Space Mono, monospace',
            fontSize: '10px',
            color: '#4361ee',
          }}>{tag}</span>
        ))}
      </div>
    </div>
  )
}

export default function Resume() {
  const [analyzed, setAnalyzed] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [fileName, setFileName] = useState(null)
  const fileRef = useRef()

  function simulate() {
    setAnalyzing(true)
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true) }, 2200)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) { setFileName(file.name); simulate() }
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (file) { setFileName(file.name); simulate() }
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left: Upload */}
      <div style={{
        width: '45%',
        borderRight: '1px solid rgba(67,97,238,0.12)',
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'rgba(10,10,15,0.4)',
      }}>
        <div className="animate-in stagger-1">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '22px', color: '#fff', marginBottom: '6px' }}>
            Resume Reviewer
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748b' }}>
            AI-powered analysis with CS-specific recommendations
          </p>
        </div>

        {/* Toggle */}
        <div className="animate-in stagger-2" style={{ display: 'flex', gap: '0', background: 'rgba(12,12,20,0.8)', border: '1px solid rgba(30,30,53,0.8)', borderRadius: '8px', padding: '4px' }}>
          {['Upload PDF', 'Paste Text'].map((mode, i) => (
            <button key={mode} onClick={() => setPasteMode(i === 1)} style={{
              flex: 1, padding: '8px',
              background: pasteMode === (i === 1) ? 'rgba(67,97,238,0.2)' : 'transparent',
              border: pasteMode === (i === 1) ? '1px solid rgba(67,97,238,0.3)' : '1px solid transparent',
              borderRadius: '6px',
              color: pasteMode === (i === 1) ? '#7b8ff7' : '#64748b',
              fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', transition: 'all 0.18s',
            }}>{mode}</button>
          ))}
        </div>

        {/* Drop zone */}
        {!pasteMode ? (
          <div
            className="bracket-corner animate-in stagger-3"
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              flex: 1,
              border: `2px dashed ${dragOver ? '#4361ee' : 'rgba(67,97,238,0.25)'}`,
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              cursor: 'pointer',
              background: dragOver ? 'rgba(67,97,238,0.06)' : 'rgba(12,12,20,0.4)',
              transition: 'all 0.2s ease',
              minHeight: '280px',
              boxShadow: dragOver ? '0 0 40px rgba(67,97,238,0.15) inset' : 'none',
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleFile} />

            {fileName ? (
              <>
                <div style={{ width: '56px', height: '56px', background: 'rgba(67,97,238,0.15)', border: '1px solid rgba(67,97,238,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📄</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#7b8ff7', textAlign: 'center' }}>{fileName}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748b' }}>Click to replace</div>
              </>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(67,97,238,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '15px', color: '#e2e8f0', marginBottom: '6px' }}>
                    Drop your resume here
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748b' }}>
                    PDF, Word, or plain text · max 5MB
                  </div>
                </div>
                <div style={{
                  padding: '8px 20px',
                  background: 'rgba(67,97,238,0.12)',
                  border: '1px solid rgba(67,97,238,0.3)',
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#7b8ff7',
                }}>Browse files</div>
              </>
            )}
          </div>
        ) : (
          <div className="animate-in stagger-3" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '280px' }}>
            <textarea
              placeholder="Paste your resume text here..."
              style={{
                flex: 1,
                background: 'rgba(12,12,20,0.8)',
                border: '1px solid rgba(67,97,238,0.2)',
                borderRadius: '10px',
                padding: '16px',
                color: '#94a3b8',
                fontFamily: 'Space Mono, monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none',
                minHeight: '240px',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(67,97,238,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(67,97,238,0.2)'}
            />
          </div>
        )}

        {/* Analyze button */}
        {!analyzed && (
          <button
            onClick={simulate}
            disabled={analyzing}
            className="animate-in stagger-4"
            style={{
              padding: '14px',
              background: analyzing ? 'rgba(67,97,238,0.3)' : 'linear-gradient(135deg, #4361ee 0%, #6b7ff7 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              fontWeight: '700',
              fontSize: '15px',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              boxShadow: analyzing ? 'none' : '0 0 28px rgba(67,97,238,0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {analyzing ? (
              <>
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
        padding: '36px 32px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {!analyzed && !analyzing ? (
          <EmptyState />
        ) : analyzing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px', textAlign: 'center' }}>
              <div style={{
                width: '60px', height: '60px',
                border: '3px solid rgba(67,97,238,0.2)',
                borderTopColor: '#4361ee',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '16px', color: '#e2e8f0' }}>Analyzing your resume...</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748b' }}>Checking ATS compatibility · Scanning for keywords · Measuring impact</div>
            </div>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ background: 'rgba(12,12,20,0.8)', borderRadius: '10px', padding: '16px' }}>
                <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '90%', marginBottom: '4px' }} />
                <div className="skeleton" style={{ height: '12px', width: '75%' }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Score + tags */}
            <div className="glass-card bracket-corner animate-in stagger-1" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '32px' }}>
              <ScoreRing score={SCORE} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#e2e8f0', marginBottom: '14px' }}>CS-Specific Checks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {TAGS.map(tag => (
                    <div key={tag.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#94a3b8', width: '100px' }}>{tag.label}</span>
                      <div style={{ flex: 1, height: '5px', background: 'rgba(30,30,53,0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${tag.score}%`, background: tag.color, borderRadius: '3px', boxShadow: `0 0 6px ${tag.color}` }} />
                      </div>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: tag.color, width: '32px', textAlign: 'right' }}>{tag.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="animate-in stagger-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#22c55e' }}>Strengths</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>{STRENGTHS.length} found</span>
              </div>
              {STRENGTHS.map((item, i) => <FeedbackCard key={i} item={item} accentColor="#22c55e" glowColor="rgba(34,197,94,0.1)" />)}
            </div>

            {/* Improvements */}
            <div className="animate-in stagger-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f4a400', display: 'inline-block', boxShadow: '0 0 8px #f4a400' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#f4a400' }}>Improvements</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>{IMPROVEMENTS.length} suggestions</span>
              </div>
              {IMPROVEMENTS.map((item, i) => <FeedbackCard key={i} item={item} accentColor="#f4a400" glowColor="rgba(244,164,0,0.1)" />)}
            </div>

            {/* Critical */}
            <div className="animate-in stagger-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#ef4444' }}>Critical Issues</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>{CRITICAL.length} issues</span>
              </div>
              {CRITICAL.map((item, i) => <FeedbackCard key={i} item={item} accentColor="#ef4444" glowColor="rgba(239,68,68,0.1)" />)}
            </div>

            <button
              onClick={() => setAnalyzed(false)}
              style={{
                padding: '12px',
                background: 'transparent',
                border: '1px solid rgba(67,97,238,0.2)',
                borderRadius: '8px',
                color: '#4361ee',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(67,97,238,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              ← Analyze a different resume
            </button>
          </>
        )}
      </div>
    </div>
  )
}
