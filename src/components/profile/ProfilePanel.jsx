import React, { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

const LEVEL_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ProfilePanel({ onClose, onEditProfile }) {
  const { user, careerProfile, signOut } = useAuth()
  const panelRef = useRef(null)

  // Close on click outside
  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    // Small delay so the click that opened the panel doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 50)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handle) }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handle(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  const memberSince = user?.created_at
  const email = user?.email || '—'

  const hasCareerProfile = !!careerProfile

  return (
    <div
      ref={panelRef}
      className="panel-in"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '300px',
        background: '#0d0d0f',
        border: '1px solid #1e1e22',
        zIndex: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Section A — Account Info */}
      <div style={{ padding: '16px', borderBottom: '1px solid #1e1e22' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee', letterSpacing: '0.1em', marginBottom: '12px' }}>
          ACCOUNT
        </div>

        {/* Avatar + email */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: '#4361ee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 700, fontSize: '14px', color: '#fff',
            flexShrink: 0,
          }}>
            {email[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#71717a', marginTop: '2px' }}>
              Member since {formatDate(memberSince)}
            </div>
          </div>
        </div>

        <button
          onClick={() => { onClose(); signOut() }}
          style={{
            width: '100%',
            padding: '7px 0',
            background: 'transparent',
            border: '1px solid #1e1e22',
            color: '#71717a',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            cursor: 'pointer',
            letterSpacing: '0.06em',
            transition: 'all 0.12s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#71717a' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          SIGN OUT
        </button>
      </div>

      {/* Section B — Career Profile */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee', letterSpacing: '0.1em' }}>
            CAREER PROFILE
          </div>
          <button
            onClick={() => { onClose(); onEditProfile() }}
            style={{
              padding: '3px 10px',
              background: 'transparent',
              border: '1px solid #1e1e22',
              color: '#71717a',
              fontFamily: "'Space Mono', monospace",
              fontSize: '9px',
              cursor: 'pointer',
              letterSpacing: '0.06em',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.color = '#4361ee' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#71717a' }}
          >
            EDIT
          </button>
        </div>

        {hasCareerProfile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ProfileRow label="Level" value={LEVEL_LABELS[careerProfile.level] || careerProfile.level} />
            <ProfileRow label="Target Role" value={careerProfile.target_role} />
            <ProfileRow label="Timeline" value={`${careerProfile.timeline_weeks} weeks`} />
            <ProfileRow label="Availability" value={`${careerProfile.hours_per_week} hrs / week`} />

            {careerProfile.current_skills?.length > 0 && (
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  SKILLS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {careerProfile.current_skills.slice(0, 8).map((s) => (
                    <span key={s} style={{
                      padding: '2px 7px',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '11px',
                      color: '#71717a',
                      background: '#111113',
                      border: '1px solid #1e1e22',
                    }}>
                      {s}
                    </span>
                  ))}
                  {careerProfile.current_skills.length > 8 && (
                    <span style={{ padding: '2px 7px', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>
                      +{careerProfile.current_skills.length - 8}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: '14px',
            background: '#111113',
            border: '1px solid #1e1e22',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a', margin: '0 0 10px' }}>
              No career profile yet.
            </p>
            <button
              onClick={() => { onClose(); onEditProfile() }}
              style={{
                padding: '6px 14px',
                background: '#4361ee',
                border: '1px solid #4361ee',
                color: '#fff',
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              SET UP PROFILE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', letterSpacing: '0.06em', flexShrink: 0 }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa', textAlign: 'right' }}>
        {value || '—'}
      </span>
    </div>
  )
}
