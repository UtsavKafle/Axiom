import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function OnboardingModal({ isEditMode = false, onClose }) {
  const navigate = useNavigate()

  function handleBackdropClick(e) {
    if (isEditMode && e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9,9,11,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="glass-card modal-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center',
          position: 'relative',
          background: '#09090b',
          border: '1px solid #1e1e22',
        }}
      >
        {isEditMode && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '28px', height: '28px',
              background: 'transparent',
              border: '1px solid #1e1e22',
              cursor: 'pointer', color: '#52525b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#52525b' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Icon */}
        <div style={{
          width: '48px', height: '48px',
          background: 'rgba(67,97,238,0.1)',
          border: '1px solid rgba(67,97,238,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4361ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
        </div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700, fontSize: '20px',
          color: '#f4f4f5', margin: 0,
        }}>
          Profile Setup Required
        </h2>

        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '11px', color: '#52525b',
          lineHeight: 1.7, margin: 0,
        }}>
          Complete your profile setup to generate your roadmap.
        </p>

        <button
          type="button"
          onClick={() => navigate('/setup')}
          style={{
            marginTop: '8px',
            padding: '11px 28px',
            background: '#4361ee',
            border: 'none', color: '#fff',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px', letterSpacing: '0.06em',
            fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Go to Setup →
        </button>
      </div>
    </div>
  )
}
