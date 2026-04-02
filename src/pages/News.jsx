import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { label: 'News', path: '/news' },
  { label: 'Roadmap', path: '/roadmap' },
  { label: 'Resume', path: '/resume' },
  { label: 'Interview', path: '/interview' },
  { label: 'Opportunities', path: '/opportunities' },
]

const MOCK_NEWS = [
  {
    id: 1,
    title: 'OpenAI releases GPT-5 with extended context and reasoning improvements',
    source: 'TechCrunch',
    category: 'AI',
    summary: 'The latest model shows significant gains in multi-step reasoning and code generation benchmarks, with a 200k token context window.',
    url: '#',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 2,
    title: 'Meta open-sources its next-generation distributed training framework',
    source: 'The Verge',
    category: 'Open Source',
    summary: 'The framework achieves 40% faster training speeds on large transformer models and is designed to run across heterogeneous hardware.',
    url: '#',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 3,
    title: 'Google DeepMind publishes breakthrough in protein structure prediction',
    source: 'Nature',
    category: 'Research',
    summary: 'AlphaFold 3 now predicts interactions between proteins and DNA/RNA with unprecedented accuracy, opening new doors for drug discovery.',
    url: '#',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 4,
    title: 'Rust overtakes Go in backend service adoption among startups',
    source: 'Stack Overflow Blog',
    category: 'Engineering',
    summary: 'New survey data shows Rust adoption in production systems up 60% YoY, driven by performance demands and memory safety guarantees.',
    url: '#',
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: 5,
    title: 'FAANG companies shift hiring toward systems and infra roles in 2025',
    source: 'Levels.fyi',
    category: 'Careers',
    summary: 'Data from 12,000+ job postings shows a 35% increase in infrastructure and platform engineering roles compared to last year.',
    url: '#',
    created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
  },
  {
    id: 6,
    title: 'WebAssembly 2.0 spec finalized — garbage collection and threading land',
    source: 'MDN Blog',
    category: 'Web',
    summary: 'The finalized spec brings native GC support and shared memory threading, making complex languages like Java and C# first-class on the web.',
    url: '#',
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
]

const CATEGORY_COLORS = {
  AI: '#4361ee',
  'Open Source': '#22c55e',
  Research: '#7b8ff7',
  Engineering: '#f4a400',
  Careers: '#f97316',
  Web: '#06b6d4',
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function News() {
  const { profile, signOut } = useAuth()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetch('http://localhost:8000/news')
      .then(r => {
        if (!r.ok) throw new Error('Backend unreachable')
        return r.json()
      })
      .then(data => {
        setNews(data.length > 0 ? data : MOCK_NEWS)
        setLoading(false)
      })
      .catch(() => {
        setNews(MOCK_NEWS)
        setLoading(false)
        setError('Backend offline — showing demo data')
      })
  }, [])

  const categories = ['All', ...Array.from(new Set(news.map(n => n.category).filter(Boolean)))]
  const filtered = filter === 'All' ? news : news.filter(n => n.category === filter)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', position: 'relative' }}>
      <div className="axiom-grid" />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(67,97,238,0.15)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', height: '56px', gap: '32px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '16px', flexShrink: 0 }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #4361ee, #7b8ff7)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '14px', color: '#fff',
            boxShadow: '0 0 16px rgba(67,97,238,0.4)',
          }}>A</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: '#fff', letterSpacing: '-0.02em' }}>
            AXIOM
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = item.path === '/news'
            return (
              <a key={item.label} href={item.path} style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontFamily: 'Space Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                color: active ? '#fff' : '#64748b',
                background: active ? 'rgba(67,97,238,0.15)' : 'transparent',
                border: `1px solid ${active ? 'rgba(67,97,238,0.35)' : 'transparent'}`,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!active) { e.target.style.color = '#e2e8f0'; e.target.style.background = 'rgba(67,97,238,0.06)' } }}
                onMouseLeave={e => { if (!active) { e.target.style.color = '#64748b'; e.target.style.background = 'transparent' } }}
              >
                {item.label}
              </a>
            )
          })}
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'Space Mono, monospace', fontSize: '11px',
            color: '#64748b', letterSpacing: '0.05em',
          }}>
            {profile?.full_name || 'engineer'}
          </div>
          <button onClick={signOut} style={{
            padding: '5px 12px',
            background: 'transparent',
            border: '1px solid rgba(67,97,238,0.25)',
            borderRadius: '6px',
            color: '#64748b',
            fontFamily: 'Space Mono, monospace',
            fontSize: '10px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.target.style.color = '#ef4444'; e.target.style.borderColor = 'rgba(239,68,68,0.4)' }}
            onMouseLeave={e => { e.target.style.color = '#64748b'; e.target.style.borderColor = 'rgba(67,97,238,0.25)' }}
          >
            SIGN OUT
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontFamily: 'Space Mono, monospace', fontSize: '10px',
            color: '#4361ee', letterSpacing: '0.2em', marginBottom: '8px',
          }}>
            [ INDUSTRY_FEED // LIVE ]
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '28px', color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px',
          }}>
            Tech News Feed
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748b' }}>
            Real-time CS & industry updates curated for your career track.
          </p>
          {error && (
            <div style={{
              marginTop: '12px', padding: '8px 14px',
              background: 'rgba(244,164,0,0.08)', border: '1px solid rgba(244,164,0,0.25)',
              borderRadius: '6px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#f4a400',
              letterSpacing: '0.06em',
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {categories.map(cat => {
            const active = filter === cat
            const color = CATEGORY_COLORS[cat] || '#4361ee'
            return (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: '5px 14px',
                borderRadius: '6px',
                border: `1px solid ${active ? color : 'rgba(67,97,238,0.2)'}`,
                background: active ? `${color}1a` : 'transparent',
                color: active ? '#fff' : '#64748b',
                fontFamily: 'Space Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {cat.toUpperCase()}
              </button>
            )
          })}
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '200px', fontFamily: 'Space Mono, monospace',
            fontSize: '11px', color: '#4361ee', letterSpacing: '0.15em',
          }}>
            LOADING FEED...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((item, i) => {
              const catColor = CATEGORY_COLORS[item.category] || '#4361ee'
              return (
                <a
                  key={item.id}
                  href={item.url || '#'}
                  target={item.url && item.url !== '#' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className={`animate-in stagger-${Math.min(i + 1, 5)}`}
                  style={{
                    display: 'block',
                    background: 'rgba(15,15,26,0.8)',
                    border: '1px solid rgba(67,97,238,0.12)',
                    borderLeft: `3px solid ${catColor}`,
                    borderRadius: '10px',
                    padding: '20px 24px',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    position: 'relative',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `rgba(67,97,238,0.35)`
                    e.currentTarget.style.background = 'rgba(20,20,40,0.9)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(67,97,238,0.12)'
                    e.currentTarget.style.background = 'rgba(15,15,26,0.8)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      {/* Meta row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        {item.category && (
                          <span style={{
                            fontFamily: 'Space Mono, monospace', fontSize: '9px',
                            color: catColor, letterSpacing: '0.15em',
                            background: `${catColor}18`,
                            border: `1px solid ${catColor}40`,
                            padding: '2px 8px', borderRadius: '4px',
                          }}>
                            {item.category.toUpperCase()}
                          </span>
                        )}
                        {item.source && (
                          <span style={{
                            fontFamily: 'Space Mono, monospace', fontSize: '9px',
                            color: '#64748b', letterSpacing: '0.05em',
                          }}>
                            {item.source}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        fontSize: '15px', color: '#e2e8f0',
                        lineHeight: 1.4, marginBottom: '8px',
                        letterSpacing: '-0.01em',
                      }}>
                        {item.title}
                      </h2>

                      {/* Summary */}
                      {item.summary && (
                        <p style={{
                          fontFamily: 'Inter, sans-serif', fontSize: '13px',
                          color: '#64748b', lineHeight: 1.6,
                        }}>
                          {item.summary}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <div style={{
                      fontFamily: 'Space Mono, monospace', fontSize: '10px',
                      color: '#3d4f6b', letterSpacing: '0.05em', flexShrink: 0, marginTop: '2px',
                    }}>
                      {timeAgo(item.created_at)}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
