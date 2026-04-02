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
  Internship: { bg: 'rgba(67,97,238,0.15)', color: '#7b8ff7', border: 'rgba(67,97,238,0.3)' },
  Hackathon: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  Fellowship: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  'Open Source': { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
}

function urgencyColor(days) {
  if (days <= 7) return '#ef4444'
  if (days <= 30) return '#f4a400'
  return '#22c55e'
}

function MatchBar({ score }) {
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#f4a400' : '#94a3b8'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, height: '4px', background: 'rgba(30,30,53,0.8)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '2px', boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color, whiteSpace: 'nowrap' }}>{score}% match</span>
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
    <div style={{ display: 'flex', gap: '0', height: '100%' }}>
      {/* Left filter sidebar */}
      <div style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '1px solid rgba(67,97,238,0.12)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'rgba(10,10,15,0.5)',
      }}>
        <div className="animate-in stagger-1">
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '12px', color: '#64748b', letterSpacing: '0.1em', marginBottom: '10px' }}>TYPE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['All', 'Internship', 'Hackathon', 'Fellowship', 'Open Source'].map(t => (
              <button key={t} onClick={() => setActiveType(t)} style={{
                textAlign: 'left', padding: '7px 10px', borderRadius: '6px',
                border: 'none', background: activeType === t ? 'rgba(67,97,238,0.12)' : 'transparent',
                color: activeType === t ? '#7b8ff7' : '#64748b',
                fontFamily: 'Inter, sans-serif', fontSize: '13px',
                cursor: 'pointer', fontWeight: activeType === t ? '600' : '400',
                borderLeft: activeType === t ? '2px solid #4361ee' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(30,30,53,0.8)' }} />

        <div className="animate-in stagger-2">
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '12px', color: '#64748b', letterSpacing: '0.1em', marginBottom: '10px' }}>YOUR STACK</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {STACK_FILTERS.map(s => (
              <button key={s} onClick={() => toggleStack(s)} style={{
                padding: '4px 10px', borderRadius: '12px',
                border: activeStack.includes(s) ? '1px solid rgba(67,97,238,0.5)' : '1px solid rgba(30,30,53,0.8)',
                background: activeStack.includes(s) ? 'rgba(67,97,238,0.15)' : 'transparent',
                color: activeStack.includes(s) ? '#7b8ff7' : '#475569',
                fontFamily: 'Space Mono, monospace', fontSize: '10px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(30,30,53,0.8)' }} />

        <div className="animate-in stagger-3">
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '12px', color: '#64748b', letterSpacing: '0.1em', marginBottom: '10px' }}>OPTIONS</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div
              onClick={() => setRemoteOnly(v => !v)}
              style={{
                width: '36px', height: '20px',
                background: remoteOnly ? '#4361ee' : 'rgba(30,30,53,0.8)',
                border: remoteOnly ? '1px solid rgba(67,97,238,0.5)' : '1px solid rgba(30,30,53,0.9)',
                borderRadius: '10px',
                position: 'relative',
                transition: 'all 0.2s',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: remoteOnly ? '18px' : '2px',
                width: '14px', height: '14px',
                background: '#fff',
                borderRadius: '50%',
                transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#94a3b8' }}>Remote only</span>
          </label>
        </div>

        <button
          onClick={() => { setActiveType('All'); setActiveStack([]); setRemoteOnly(false) }}
          style={{
            marginTop: 'auto', padding: '8px',
            background: 'transparent',
            border: '1px solid rgba(30,30,53,0.8)',
            borderRadius: '6px', color: '#64748b',
            fontFamily: 'Inter, sans-serif', fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(67,97,238,0.3)'; e.currentTarget.style.color = '#94a3b8' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,30,53,0.8)'; e.currentTarget.style.color = '#64748b' }}
        >Clear filters</button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Deadline tracker */}
        <div className="animate-in stagger-1" style={{
          background: 'rgba(12,12,20,0.85)',
          border: '1px solid rgba(67,97,238,0.15)',
          borderRadius: '12px',
          padding: '16px 20px',
        }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} className="pulse-dot" />
            Upcoming Deadlines
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            {DEADLINES.map((d, i) => (
              <div key={i} style={{
                flex: 1,
                padding: '12px 16px',
                background: `${d.color}0d`,
                border: `1px solid ${d.color}30`,
                borderLeft: `3px solid ${d.color}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0' }}>{d.company}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#64748b' }}>{d.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: '700', fontSize: '18px', color: d.color }}>{d.days}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#64748b' }}>days left</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="animate-in stagger-2" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {TYPE_FILTERS.map(f => (
            <button key={f} onClick={() => setActiveType(f)} style={{
              padding: '6px 16px', borderRadius: '20px',
              border: activeType === f ? '1px solid #4361ee' : '1px solid rgba(30,30,53,0.8)',
              background: activeType === f ? 'rgba(67,97,238,0.15)' : 'transparent',
              color: activeType === f ? '#7b8ff7' : '#64748b',
              fontSize: '13px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              boxShadow: activeType === f ? '0 0 12px rgba(67,97,238,0.2)' : 'none',
              transition: 'all 0.18s',
            }}>{f}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748b' }}>
            {filtered.length} results
          </span>
        </div>

        {/* Opportunity cards */}
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', gap: '20px' }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <rect x="15" y="15" width="50" height="50" rx="6" fill="none" stroke="rgba(67,97,238,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx="40" cy="40" r="12" fill="rgba(67,97,238,0.1)" stroke="rgba(67,97,238,0.3)" strokeWidth="1.5" />
              <line x1="40" y1="28" x2="40" y2="35" stroke="rgba(67,97,238,0.5)" strokeWidth="2" strokeLinecap="round" />
              <line x1="40" y1="44" x2="40" y2="52" stroke="rgba(67,97,238,0.5)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '16px', color: '#e2e8f0' }}>No opportunities match your filters</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748b' }}>Try clearing some filters to see more results</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {filtered.map((op, i) => {
              const typeStyle = TYPE_COLORS[op.type] || TYPE_COLORS.Internship
              const urgency = urgencyColor(op.daysLeft)
              return (
                <div
                  key={op.id}
                  className={`glass-card animate-in stagger-${Math.min(i + 3, 8)}`}
                  style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: `${op.companyColor}20`,
                        border: `1px solid ${op.companyColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Syne, sans-serif', fontWeight: '800',
                        fontSize: '13px', color: op.companyColor,
                        flexShrink: 0,
                      }}>{op.companyInitial}</div>
                      <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '12px', color: '#e2e8f0' }}>{op.company}</div>
                        {op.remote && (
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '1px 5px', borderRadius: '3px' }}>REMOTE</span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: '4px', fontSize: '10px',
                      fontFamily: 'Space Mono, monospace', fontWeight: '700',
                      background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}`,
                      whiteSpace: 'nowrap',
                    }}>{op.type.toUpperCase()}</span>
                  </div>

                  {/* Role */}
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13.5px', color: '#e2e8f0', lineHeight: '1.3', marginBottom: '4px' }}>
                      {op.role}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#64748b' }}>
                      📍 {op.location}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {op.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '2px 7px', borderRadius: '4px',
                        background: 'rgba(15,15,26,0.8)',
                        border: '1px solid rgba(30,30,53,0.9)',
                        fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#64748b',
                      }}>{tag}</span>
                    ))}
                  </div>

                  {/* Match bar */}
                  <MatchBar score={op.match} />

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: urgency }}>
                      ⏱ {op.daysLeft}d left
                    </div>
                    <button style={{
                      padding: '7px 14px',
                      background: 'linear-gradient(135deg, #4361ee, #6b7ff7)',
                      border: 'none', borderRadius: '6px',
                      color: '#fff', fontFamily: 'Inter, sans-serif',
                      fontWeight: '600', fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 0 14px rgba(67,97,238,0.35)',
                      transition: 'all 0.18s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(67,97,238,0.55)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 14px rgba(67,97,238,0.35)'}
                    >Apply →</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
