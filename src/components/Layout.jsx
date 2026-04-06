import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OnboardingModal from './onboarding/OnboardingModal'
import ProfilePanel from './profile/ProfilePanel'

const NAV_ITEMS = [
  {
    to: '/news',
    label: 'News',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
      </svg>
    ),
  },
  {
    to: '/roadmap',
    label: 'Roadmap',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/>
        <path d="m4.22 4.22 2.12 2.12"/><path d="m17.66 17.66 2.12 2.12"/>
        <path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.22 19.78 2.12-2.12"/>
        <path d="m17.66 6.34 2.12-2.12"/>
      </svg>
    ),
  },
  {
    to: '/resume',
    label: 'Resume',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    to: '/interview',
    label: 'Interview Prep',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    to: '/opportunities',
    label: 'Opportunities',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
]

const PAGE_TITLES = {
  '/news': 'News Feed',
  '/roadmap': 'Learning Roadmap',
  '/resume': 'Resume Reviewer',
  '/interview': 'Interview Prep',
  '/opportunities': 'Opportunities',
}

export default function Layout({ children }) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Axiom'
  const [notifOpen, setNotifOpen] = useState(false)
  const [profilePanelOpen, setProfilePanelOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const { user, profile, careerProfile, loading, signOut } = useAuth()

  // Auto-show onboarding when user has no career profile
  useEffect(() => {
    if (!loading && user && careerProfile === null) {
      setIsEditMode(false)
      setOnboardingOpen(true)
    }
  }, [loading, user, careerProfile])

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const nameParts = displayName.trim().split(' ')
  const shortName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : nameParts[0]
  const initial = displayName[0]?.toUpperCase() || 'U'
  const yearLabel = profile?.year || 'CS Student'
  const streak = 7

  function openEditProfile() {
    setIsEditMode(true)
    setOnboardingOpen(true)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        minWidth: '220px',
        background: '#0d0d0f',
        borderRight: '1px solid #1e1e22',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e1e22' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '24px', height: '24px',
              background: '#4361ee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: '#fff',
              fontFamily: "'IBM Plex Sans', sans-serif",
              flexShrink: 0,
            }}>A</div>
            <span style={{
              fontFamily: "'DM Serif Display', serif",
              fontWeight: 400,
              fontSize: '17px',
              color: '#f4f4f5',
              letterSpacing: '-0.01em',
            }}>Axiom</span>
          </div>
          <div style={{ marginTop: '5px', fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee', letterSpacing: '0.1em' }}>
            CS_CAREER_OS v2.4
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                textDecoration: 'none',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '13px',
                fontWeight: isActive ? '500' : '400',
                color: isActive ? '#f4f4f5' : '#71717a',
                background: isActive ? '#111113' : 'transparent',
                borderLeft: isActive ? '2px solid #4361ee' : '2px solid transparent',
                transition: 'all 0.12s ease',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? '#4361ee' : '#52525b', transition: 'color 0.12s', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e22' }}>
          {/* Streak indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            background: 'rgba(244, 164, 0, 0.06)',
            border: '1px solid rgba(244, 164, 0, 0.15)',
            marginBottom: '10px',
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#f4a400', letterSpacing: '0.08em' }}>STREAK</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '12px', color: '#f4a400', marginLeft: 'auto' }}>{streak} days</span>
          </div>
          {/* User card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: '#4361ee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: '#fff',
              fontFamily: "'IBM Plex Sans', sans-serif",
              flexShrink: 0,
            }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', fontWeight: '500', color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#71717a' }}>{yearLabel}</div>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              style={{
                flexShrink: 0,
                width: '26px', height: '26px',
                background: 'transparent',
                border: '1px solid #1e1e22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: '#52525b',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#52525b' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: '48px',
          background: '#09090b',
          borderBottom: '1px solid #1e1e22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 40,
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 600,
            fontSize: '13px',
            color: '#f4f4f5',
            letterSpacing: '0.01em',
          }}>
            {title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: '#111113',
              border: '1px solid #1e1e22',
              padding: '5px 10px',
              fontSize: '12px', color: '#71717a',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span>Search...</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', background: 'rgba(67,97,238,0.12)', padding: '1px 4px', color: '#4361ee' }}>⌘K</span>
            </div>

            {/* Bell */}
            <button
              onClick={() => setNotifOpen(v => !v)}
              style={{
                position: 'relative',
                width: '32px', height: '32px',
                background: '#111113',
                border: '1px solid #1e1e22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#71717a',
                transition: 'all 0.12s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{
                position: 'absolute', top: '7px', right: '7px',
                width: '5px', height: '5px',
                background: '#ef4444',
              }} />
            </button>

            {/* Avatar — opens profile panel */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfilePanelOpen(v => !v)}
                style={{
                  width: '28px', height: '28px',
                  background: profilePanelOpen ? '#4361ee' : '#4361ee',
                  border: `1px solid ${profilePanelOpen ? '#6b7eff' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '700', color: '#fff',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  outline: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6b7eff' }}
                onMouseLeave={e => { if (!profilePanelOpen) e.currentTarget.style.borderColor = 'transparent' }}
              >
                {initial}
              </button>

              {profilePanelOpen && (
                <ProfilePanel
                  onClose={() => setProfilePanelOpen(false)}
                  onEditProfile={openEditProfile}
                />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'transparent' }}>
          <div className="page-transition" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>

      {/* Onboarding / Edit Profile Modal */}
      {onboardingOpen && (
        <OnboardingModal
          isEditMode={isEditMode}
          initialData={isEditMode ? careerProfile : null}
          onClose={isEditMode ? () => setOnboardingOpen(false) : undefined}
          onSuccess={() => setOnboardingOpen(false)}
        />
      )}
    </div>
  )
}
