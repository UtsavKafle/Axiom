import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/news',
    label: 'News',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
      </svg>
    ),
  },
  {
    to: '/roadmap',
    label: 'Roadmap',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    to: '/opportunities',
    label: 'Opportunities',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        minWidth: '220px',
        background: 'rgba(10,10,15,0.95)',
        borderRight: '1px solid rgba(67,97,238,0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        zIndex: 50,
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(67,97,238,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, #4361ee, #7b8ff7)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(67,97,238,0.5)',
              fontSize: '14px', fontWeight: '800', color: '#fff',
              fontFamily: 'Syne, sans-serif',
            }}>A</div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.02em' }}>Axiom</span>
          </div>
          <div style={{ marginTop: '6px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee', letterSpacing: '0.12em' }}>
            CS_CAREER_OS v2.4
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13.5px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#fff' : '#64748b',
                background: isActive ? 'rgba(67,97,238,0.12)' : 'transparent',
                borderLeft: isActive ? '2px solid #4361ee' : '2px solid transparent',
                boxShadow: isActive ? '0 0 16px rgba(67,97,238,0.12) inset' : 'none',
                transition: 'all 0.18s ease',
                position: 'relative',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? '#4361ee' : '#64748b', transition: 'color 0.18s', filter: isActive ? 'drop-shadow(0 0 6px rgba(67,97,238,0.8))' : 'none' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span style={{
                      marginLeft: 'auto',
                      width: '6px', height: '6px',
                      borderRadius: '50%',
                      background: '#4361ee',
                      boxShadow: '0 0 8px #4361ee',
                    }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(67,97,238,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4361ee 0%, #f4a400 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', color: '#fff',
            border: '2px solid rgba(67,97,238,0.4)',
            flexShrink: 0,
          }}>U</div>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>Utsav K.</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee' }}>CS Junior</div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: '60px',
          background: 'rgba(10,10,15,0.9)',
          borderBottom: '1px solid rgba(67,97,238,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          backdropFilter: 'blur(20px)',
          zIndex: 40,
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            color: '#fff',
            letterSpacing: '-0.01em',
          }}>
            {title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(30,30,53,0.6)',
              border: '1px solid rgba(67,97,238,0.15)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px', color: '#64748b',
              fontFamily: 'Inter, sans-serif',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span>Search...</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', background: 'rgba(67,97,238,0.15)', padding: '1px 5px', borderRadius: '4px', color: '#4361ee' }}>⌘K</span>
            </div>

            {/* Bell */}
            <button
              onClick={() => setNotifOpen(v => !v)}
              style={{
                position: 'relative',
                width: '36px', height: '36px',
                borderRadius: '8px',
                background: 'rgba(30,30,53,0.6)',
                border: '1px solid rgba(67,97,238,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b',
                transition: 'all 0.18s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '7px', height: '7px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 6px #ef4444',
              }} />
            </button>

            {/* Avatar */}
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4361ee, #f4a400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700', color: '#fff',
              border: '2px solid rgba(67,97,238,0.4)',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(67,97,238,0.3)',
            }}>U</div>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'transparent',
        }}>
          <div className="page-transition" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
