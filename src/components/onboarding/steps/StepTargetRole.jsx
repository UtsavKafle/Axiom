import React from 'react'

const ROLES = [
  {
    id: 'Software Engineer',
    label: 'Software Engineer',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    id: 'Frontend Engineer',
    label: 'Frontend Engineer',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    id: 'Backend Engineer',
    label: 'Backend Engineer',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'ML Engineer',
    label: 'ML Engineer',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"/>
        <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5"/>
        <path d="M12 22a4 4 0 0 1-4-4c0-1.5.8-2.8 2-3.5"/>
        <path d="M2 12a4 4 0 0 1 4-4c1.5 0 2.8.8 3.5 2"/>
        <path d="M22 12a4 4 0 0 1-4 4c-1.5 0-2.8-.8-3.5-2"/>
      </svg>
    ),
  },
  {
    id: 'DevOps / Cloud',
    label: 'DevOps / Cloud',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
      </svg>
    ),
  },
  {
    id: 'Mobile Engineer',
    label: 'Mobile Engineer',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'Security Engineer',
    label: 'Security Engineer',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
]

export default function StepTargetRole({ value, onChange }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
    }}>
      {ROLES.map((role) => {
        const sel = value === role.id
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '13px 14px',
              background: sel ? 'rgba(67,97,238,0.08)' : '#111113',
              border: `1px solid ${sel ? '#4361ee' : '#1e1e22'}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = '#2a2a32' }}
            onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = '#1e1e22' }}
          >
            <span style={{ color: sel ? '#4361ee' : '#52525b', flexShrink: 0, transition: 'color 0.12s' }}>
              {role.icon}
            </span>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', fontWeight: sel ? 500 : 400, color: sel ? '#f4f4f5' : '#a1a1aa', lineHeight: 1.3 }}>
              {role.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
