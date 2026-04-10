import React, { useState } from 'react'

const TYPE_FILTERS = ['All', 'Internships', 'Hackathons', 'Fellowships', 'Open Source', 'Remote Only']

const DEADLINES = [
  { company: 'Stripe', role: 'SWE Intern', days: 3, color: '#ef4444' },
  { company: 'MLH Fellowship', role: 'Spring Batch', days: 11, color: '#f4a400' },
  { company: 'Google STEP', role: 'Freshman/Soph', days: 28, color: '#f4a400' },
]

const OPPORTUNITIES = [
  {
    id: 1, type: 'Internship', company: 'Stripe', companyInitial: 'S', companyColor: '#635BFF',
    role: 'Software Engineering Intern', location: 'San Francisco, CA', remote: true,
    deadline: '2026-04-04', daysLeft: 3, match: 94,
    tags: ['React', 'Go', 'Payments'],
  },
  {
    id: 2, type: 'Hackathon', company: 'HackMIT', companyInitial: 'H', companyColor: '#FF5C5C',
    role: 'Participant — $25K in prizes', location: 'Cambridge, MA', remote: false,
    deadline: '2026-04-14', daysLeft: 13, match: 88,
    tags: ['Any stack', 'Team of 4'],
  },
  {
    id: 3, type: 'Fellowship', company: 'MLH Fellowship', companyInitial: 'M', companyColor: '#E23744',
    role: 'Open Source Software Fellow', location: 'Remote', remote: true,
    deadline: '2026-04-12', daysLeft: 11, match: 82,
    tags: ['Open Source', 'Mentorship', '$6K stipend'],
  },
  {
    id: 4, type: 'Internship', company: 'Google', companyInitial: 'G', companyColor: '#4285F4',
    role: 'STEP Intern (Freshman/Soph)', location: 'Mountain View, CA', remote: false,
    deadline: '2026-04-29', daysLeft: 28, match: 79,
    tags: ['C++', 'Python', 'Algorithms'],
  },
  {
    id: 5, type: 'Open Source', company: 'CNCF', companyInitial: 'C', companyColor: '#00b4d8',
    role: 'LFX Mentorship — Kubernetes', location: 'Remote', remote: true,
    deadline: '2026-05-01', daysLeft: 30, match: 73,
    tags: ['Go', 'Kubernetes', '$3K stipend'],
  },
  {
    id: 6, type: 'Internship', company: 'Figma', companyInitial: 'F', companyColor: '#F24E1E',
    role: 'Product Engineering Intern', location: 'New York, NY', remote: false,
    deadline: '2026-05-10', daysLeft: 39, match: 86,
    tags: ['React', 'TypeScript', 'Design Systems'],
  },
  {
    id: 7, type: 'Hackathon', company: 'TreeHacks', companyInitial: 'T', companyColor: '#34A853',
    role: 'Participant — Stanford Hackathon', location: 'Stanford, CA', remote: false,
    deadline: '2026-04-20', daysLeft: 19, match: 91,
    tags: ['AI', 'Hardware', '$15K prizes'],
  },
  {
    id: 8, type: 'Fellowship', company: 'Kleiner Perkins', companyInitial: 'K', companyColor: '#4361ee',
    role: 'KP Engineering Fellow', location: 'San Francisco, CA', remote: false,
    deadline: '2026-05-05', daysLeft: 34, match: 77,
    tags: ['Startup', 'VC Network', 'Mentorship'],
  },
  {
    id: 9, type: 'Open Source', company: 'GSoC', companyInitial: 'G', companyColor: '#FBBC04',
    role: 'Google Summer of Code Contributor', location: 'Remote', remote: true,
    deadline: '2026-04-08', daysLeft: 7, match: 85,
    tags: ['Any language', '$1.5K–$6.6K', 'Mentored'],
  },
]

const STACK_FILTERS = ['React', 'Python', 'Go', 'TypeScript', 'Rust', 'C++']

const TYPE_COLORS = {
  Internship:    { bg: 'rgba(67,97,238,0.15)',  color: '#4361ee', border: 'rgba(67,97,238,0.3)' },
  Hackathon:     { bg: 'rgba(244,164,0,0.15)',  color: '#f4a400', border: 'rgba(244,164,0,0.3)' },
  Fellowship:    { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  'Open Source': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
}

function urgencyColor(days) {
  if (days <= 7) return '#ef4444'
  if (days <= 30) return '#f4a400'
  return '#22c55e'
}

function MatchBar({ score }) {
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#f4a400' : '#71717a'
  const barBg = score > 80
    ? 'linear-gradient(90deg, #4361ee, #22c55e)'
    : score >= 50
    ? 'linear-gradient(90deg, #f4a400, #4361ee)'
    : color
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: barBg }} />
      </div>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color, whiteSpace: 'nowrap' }}>{score}%</span>
    </div>
  )
}

export default function Opportunities() {
  const [activeType, setActiveType] = useState('All')
  const [activeStack, setActiveStack] = useState([])
  const [remoteOnly, setRemoteOnly] = useState(false)

  function toggleStack(tag) {
    setActiveStack(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const filtered = OPPORTUNITIES.filter(op => {
    const typeMatch = activeType === 'All'
      || (activeType === 'Remote Only' ? op.remote : op.type === activeType.replace('s', '').replace('ies', 'y').replace('ships', 'ship'))
    const stackMatch = activeStack.length === 0 || activeStack.some(s => op.tags.some(t => t.toLowerCase().includes(s.toLowerCase())))
    const remoteMatch = !remoteOnly || op.remote
    return typeMatch && stackMatch && remoteMatch
  })

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left filter sidebar */}
      <div style={{
        width: '200px',
        flexShrink: 0,
        borderRight: '1px solid #1e1e22',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0d0f',
        overflowY: 'auto',
      }}>
        {/* Type filter */}
        <div className="animate-in stagger-1 glass-card" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, marginBottom: '4px' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '9px', color: '#52525b', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>TYPE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {['All', 'Internship', 'Hackathon', 'Fellowship', 'Open Source'].map(t => (
              <button key={t} onClick={() => setActiveType(t)} style={{
                textAlign: 'left', padding: '7px 8px',
                border: 'none',
                background: activeType === t ? 'rgba(67,97,238,0.1)' : 'transparent',
                color: activeType === t ? '#4361ee' : '#71717a',
                fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px',
                cursor: 'pointer', fontWeight: activeType === t ? '500' : '400',
                borderRadius: activeType === t ? '6px' : '0',
                transition: 'all 0.1s',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Stack filter */}
        <div className="animate-in stagger-2 glass-card" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, marginBottom: '4px' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '9px', color: '#52525b', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>YOUR STACK</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {STACK_FILTERS.map(s => (
              <button key={s} onClick={() => toggleStack(s)} style={{
                padding: '3px 8px',
                border: activeStack.includes(s) ? '1px solid rgba(67,97,238,0.4)' : '1px solid #1e1e22',
                background: activeStack.includes(s) ? 'rgba(67,97,238,0.12)' : 'transparent',
                color: activeStack.includes(s) ? '#6b83f0' : '#52525b',
                fontFamily: "'Space Mono', monospace", fontSize: '9px',
                cursor: 'pointer', transition: 'all 0.1s',
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="animate-in stagger-3 glass-card" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, marginBottom: '4px' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '9px', color: '#52525b', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>OPTIONS</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div
              onClick={() => setRemoteOnly(v => !v)}
              style={{
                width: '32px', height: '18px',
                background: remoteOnly ? '#4361ee' : '#1e1e22',
                border: remoteOnly ? '1px solid rgba(67,97,238,0.5)' : '1px solid #2a2a32',
                borderRadius: '9px',
                position: 'relative',
                transition: 'all 0.15s',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: remoteOnly ? '16px' : '2px',
                width: '12px', height: '12px',
                background: '#fff',
                borderRadius: '50%',
                transition: 'left 0.15s',
              }} />
            </div>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa' }}>Remote only</span>
          </label>
        </div>

        <button
          onClick={() => { setActiveType('All'); setActiveStack([]); setRemoteOnly(false) }}
          style={{
            margin: '12px 16px', padding: '7px',
            background: 'transparent',
            border: '1px solid #1e1e22',
            color: '#52525b',
            fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(67,97,238,0.3)'; e.currentTarget.style.color = '#a1a1aa' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#52525b' }}
        >Clear filters</button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Deadline tracker — sticky bar */}
        <div className="animate-in stagger-1" style={{
          background: 'rgba(239,68,68,0.08)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
            <span className="pulse-dot" style={{ width: '5px', height: '5px', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', letterSpacing: '0.08em' }}>DEADLINES</span>
          </div>
          {DEADLINES.map((d, i) => (
            <div key={i}
              className={`glass-card${d.days <= 7 ? ' glow-red' : d.days <= 14 ? ' glow-amber' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderLeft: `2px solid ${d.color}`,
                borderRadius: '6px',
              }}>
              <div>
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '12px', color: '#f4f4f5' }}>{d.company}</span>
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#71717a' }}> — {d.role}</span>
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '13px', color: d.color, marginLeft: '4px' }}>{d.days}d</span>
            </div>
          ))}
        </div>

        {/* Type filter pills + count */}
        <div className="animate-in stagger-2" style={{
          display: 'flex', gap: '0', padding: '0 20px',
          borderBottom: '1px solid #1e1e22',
          background: '#09090b',
          alignItems: 'center',
          height: '44px',
          flexShrink: 0,
        }}>
          {TYPE_FILTERS.map(f => (
            <button key={f} onClick={() => setActiveType(f)} style={{
              padding: '0 12px', height: '44px',
              border: 'none',
              borderBottom: activeType === f ? '2px solid #4361ee' : '2px solid transparent',
              background: 'transparent',
              color: activeType === f ? '#f4f4f5' : '#71717a',
              fontSize: '12px', cursor: 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: activeType === f ? '500' : '400',
              transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}>{f}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b' }}>
            {filtered.length} results
          </span>
        </div>

        {/* Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', gap: '16px' }}>
              <svg width="60" height="60" viewBox="0 0 80 80">
                <rect x="15" y="15" width="50" height="50" fill="none" stroke="rgba(67,97,238,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="40" cy="40" r="10" fill="rgba(67,97,238,0.06)" stroke="rgba(67,97,238,0.2)" strokeWidth="1" />
              </svg>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '14px', color: '#f4f4f5' }}>No opportunities match your filters</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a' }}>Try clearing some filters to see more results</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {filtered.map((op, i) => {
                const typeStyle = TYPE_COLORS[op.type] || TYPE_COLORS.Internship
                const urgency = urgencyColor(op.daysLeft)
                return (
                  <div
                    key={op.id}
                    className={`glass-card animate-in stagger-${Math.min(i + 3, 8)}`}
                    style={{
                      padding: '16px',
                      display: 'flex', flexDirection: 'column', gap: '10px',
                      background: '#09090b',
                      transition: 'background 0.1s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(67,97,238,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  >
                    {/* Type badge + company */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{
                        padding: '2px 7px', fontSize: '9px',
                        fontFamily: "'Space Mono', monospace", fontWeight: '700',
                        background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}`,
                        whiteSpace: 'nowrap', letterSpacing: '0.05em',
                      }}>{op.type.toUpperCase()}</span>
                      {op.remote && (
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#a1a1aa', background: 'rgba(255,255,255,0.08)', padding: '2px 5px', border: '1px solid rgba(255,255,255,0.15)' }}>REMOTE</span>
                      )}
                    </div>

                    {/* Company + role */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{
                          width: '28px', height: '28px',
                          background: `${op.companyColor}14`,
                          border: `1px solid ${op.companyColor}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'Space Mono', monospace", fontWeight: '700',
                          fontSize: '11px', color: op.companyColor, flexShrink: 0,
                          boxShadow: '0 0 0 2px rgba(255,255,255,0.1)',
                        }}>{op.companyInitial}</div>
                        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '13px', color: '#f4f4f5' }}>{op.company}</div>
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa', lineHeight: '1.35', marginBottom: '3px' }}>
                        {op.role}
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#52525b' }}>
                        {op.location}
                      </div>
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {op.tags.map(tag => (
                        <span key={tag} style={{
                          padding: '2px 6px',
                          background: '#111113',
                          border: '1px solid #1e1e22',
                          fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b',
                        }}>{tag}</span>
                      ))}
                    </div>

                    {/* Match bar */}
                    <MatchBar score={op.match} />

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: urgency }}>
                        {op.daysLeft}d left
                      </div>
                      <button style={{
                        padding: '6px 14px',
                        background: '#4361ee',
                        border: 'none',
                        color: '#fff', fontFamily: "'IBM Plex Sans', sans-serif",
                        fontWeight: '500', fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.boxShadow = '0 0 24px rgba(67,97,238,0.25), 0 0 48px rgba(67,97,238,0.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = 'none' }}
                      >Apply →</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
