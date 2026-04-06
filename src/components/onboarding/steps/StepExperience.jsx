import React from 'react'

const LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    badge: '0–1 YR',
    desc: 'You know basic programming concepts but have limited project experience. Building fundamentals in data structures and CS theory.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    badge: '1–2 YR',
    desc: 'Completed core CS coursework and built personal projects. Comfortable with algorithms and ready to tackle real interviews.',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    badge: '2+ YR',
    desc: 'Internship or research experience, solving medium-hard problems, familiar with system design and distributed systems.',
  },
]

export default function StepExperience({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {LEVELS.map((lvl) => {
        const sel = value === lvl.id
        return (
          <button
            key={lvl.id}
            type="button"
            onClick={() => onChange(lvl.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 16px',
              background: sel ? 'rgba(67,97,238,0.08)' : '#111113',
              border: `1px solid ${sel ? '#4361ee' : '#1e1e22'}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.12s',
              width: '100%',
            }}
            onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = '#2a2a32' }}
            onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = '#1e1e22' }}
          >
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: `2px solid ${sel ? '#4361ee' : '#3f3f46'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: '1px', transition: 'border-color 0.12s',
            }}>
              {sel && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4361ee' }} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '13px', color: sel ? '#f4f4f5' : '#a1a1aa' }}>
                  {lvl.label}
                </span>
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.08em',
                  color: sel ? '#4361ee' : '#52525b',
                  background: sel ? 'rgba(67,97,238,0.12)' : 'rgba(63,63,70,0.4)',
                  padding: '1px 5px',
                }}>
                  {lvl.badge}
                </span>
              </div>
              <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a', lineHeight: '1.5', margin: 0 }}>
                {lvl.desc}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
