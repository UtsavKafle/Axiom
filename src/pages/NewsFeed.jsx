import React, { useState, useEffect } from 'react'

const CATEGORIES = ['All', 'AI', 'Security', 'Web', 'Open Source', 'Jobs']

const HERO = {
  category: 'AI',
  title: 'OpenAI Releases GPT-5 with 10x Reasoning Improvements — What It Means for CS Careers',
  summary: 'The latest frontier model ships with native code execution, multi-agent orchestration, and a new "o3-level" reasoning mode. Industry experts weigh in on how this reshapes the software engineering landscape for 2026 graduates.',
  source: 'MIT Technology Review',
  time: '2h ago',
  readTime: '6 min read',
  tag: 'BREAKING',
}

const HEADLINES = [
  'Microsoft acquires AI code review startup for $2.1B',
  'Google\'s new AlphaCode 3 solves competitive programming at grandmaster level',
  'Meta open-sources Llama 4 weights — 405B parameter model now free',
  'GitHub Copilot adds real-time pair-debugging mode in VS Code',
  'FAANG internship applications for Summer 2027 open early',
  'Rust overtakes Python as most loved language for 4th straight year',
  'Apple announces M4 Ultra — 512GB unified memory for ML workloads',
  'New CVE in OpenSSL affects 40% of production web servers worldwide',
]

const NEWS_CARDS = [
  {
    id: 1, category: 'AI', breaking: true,
    headline: 'Anthropic\'s Claude 4 Opus sets new MMLU benchmark at 97.3%',
    summary: 'The latest model demonstrates near-human performance across 57 academic subjects, raising questions about AI in technical interviews.',
    source: 'The Verge', time: '45m ago', readTime: '4 min read',
  },
  {
    id: 2, category: 'Security',
    headline: 'Critical RCE vulnerability discovered in Apache Log4j 3.x — patch now',
    summary: 'Security researchers at Mandiant disclosed a zero-day impacting millions of Java applications. A CVSS 10.0 rating was assigned.',
    source: 'Krebs on Security', time: '1h ago', readTime: '5 min read',
  },
  {
    id: 3, category: 'Jobs',
    headline: 'Stripe is hiring 800 engineers in 2026 — remote-first, $200k base',
    summary: 'The fintech giant doubles down on distributed teams and launches a new university recruitment program targeting top CS programs.',
    source: 'TechCrunch', time: '3h ago', readTime: '3 min read',
  },
  {
    id: 4, category: 'Web',
    headline: 'React 20 drops with built-in server components and Rust compiler',
    summary: 'The Meta-backed framework ships its most ambitious update yet, promising 4x faster builds and native streaming SSR without a framework.',
    source: 'JavaScript Weekly', time: '5h ago', readTime: '7 min read',
  },
  {
    id: 5, category: 'Open Source',
    headline: 'Linux kernel 7.0 merges Rust as first-class language alongside C',
    summary: 'After years of debate, Linus Torvalds formally accepts Rust for core subsystems. The first Rust-written driver ships in the kernel tree.',
    source: 'LWN.net', time: '6h ago', readTime: '8 min read',
  },
  {
    id: 6, category: 'AI', breaking: false,
    headline: 'Stanford HAI Report: AI will automate 38% of entry-level dev tasks by 2028',
    summary: 'The annual AI Index report urges universities to shift CS curricula toward AI collaboration, system design, and product thinking.',
    source: 'Stanford HAI', time: '8h ago', readTime: '12 min read',
  },
]

const TRENDING = [
  { rank: 1, topic: 'Agentic AI workflows', delta: '+340%' },
  { rank: 2, topic: 'Rust systems programming', delta: '+180%' },
  { rank: 3, topic: 'FAANG interview prep', delta: '+120%' },
  { rank: 4, topic: 'WebAssembly WASI 2.0', delta: '+95%' },
  { rank: 5, topic: 'Distributed systems design', delta: '+78%' },
]

const YOUR_STACK = [
  { label: 'React 20 ships', tag: 'React' },
  { label: 'Python 4.0 RC1 released', tag: 'Python' },
  { label: 'Vercel adds GPU compute tier', tag: 'DevOps' },
]

const CATEGORY_COLORS = {
  AI: { bg: 'rgba(67,97,238,0.15)', color: '#7b8ff7' },
  Security: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  Web: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  'Open Source': { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
  Jobs: { bg: 'rgba(244,164,0,0.15)', color: '#f4a400' },
}

function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div className="skeleton" style={{ width: '60px', height: '20px' }} />
        <div className="skeleton" style={{ width: '80px', height: '20px' }} />
      </div>
      <div className="skeleton" style={{ height: '22px', marginBottom: '8px', width: '90%' }} />
      <div className="skeleton" style={{ height: '16px', marginBottom: '4px', width: '100%' }} />
      <div className="skeleton" style={{ height: '16px', width: '70%' }} />
    </div>
  )
}

function NewsCard({ card, index }) {
  const catStyle = CATEGORY_COLORS[card.category] || { bg: 'rgba(67,97,238,0.15)', color: '#7b8ff7' }
  return (
    <div
      className={`glass-card animate-in stagger-${Math.min(index + 1, 8)}`}
      style={{
        padding: '18px 20px',
        borderLeft: card.breaking ? '3px solid #f4a400' : undefined,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
          fontFamily: 'Space Mono, monospace', letterSpacing: '0.06em',
          background: catStyle.bg, color: catStyle.color,
        }}>{card.category}</span>
        {card.breaking && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f4a400', fontFamily: 'Space Mono, monospace' }}>
            <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            BREAKING
          </span>
        )}
      </div>
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: '600', fontSize: '14.5px', color: '#e2e8f0', lineHeight: '1.4', marginBottom: '8px' }}>
        {card.headline}
      </h3>
      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {card.summary}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>
        <span>{card.source}</span>
        <span style={{ color: '#1e1e35' }}>•</span>
        <span>{card.time}</span>
        <span style={{ color: '#1e1e35' }}>•</span>
        <span>{card.readTime}</span>
      </div>
    </div>
  )
}

export default function NewsFeed() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(7)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [])

  const filtered = activeCategory === 'All'
    ? NEWS_CARDS
    : NEWS_CARDS.filter(c => c.category === activeCategory)

  const streakDeg = (streak / 30) * 360
  const circumference = 2 * Math.PI * 28

  return (
    <div style={{ padding: '28px', display: 'flex', gap: '28px', minHeight: '100%' }}>
      {/* Left feed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

        {/* Hero */}
        <div className="bracket-corner animate-in stagger-1" style={{
          background: 'linear-gradient(135deg, rgba(67,97,238,0.12) 0%, rgba(18,18,31,0.9) 60%)',
          border: '1px solid rgba(67,97,238,0.3)',
          borderRadius: '14px',
          padding: '28px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(67,97,238,0.22)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(ellipse at top right, rgba(67,97,238,0.1), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', background: 'rgba(67,97,238,0.2)', color: '#7b8ff7', padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.08em' }}>AI</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#f4a400' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              FEATURED STORY
            </span>
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '22px', color: '#fff', lineHeight: '1.3', marginBottom: '14px', maxWidth: '700px' }}>
            {HERO.title}
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '18px', maxWidth: '620px' }}>
            {HERO.summary}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>
              <span>{HERO.source}</span>
              <span>•</span>
              <span>{HERO.time}</span>
              <span>•</span>
              <span>{HERO.readTime}</span>
            </div>
            <button style={{
              marginLeft: 'auto',
              padding: '8px 18px',
              background: '#4361ee',
              border: 'none',
              borderRadius: '7px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 0 20px rgba(67,97,238,0.4)',
              transition: 'all 0.18s',
            }}>Read Story →</button>
          </div>
        </div>

        {/* Headlines ticker */}
        <div className="animate-in stagger-2" style={{
          background: 'rgba(12,12,20,0.8)',
          border: '1px solid rgba(67,97,238,0.12)',
          borderRadius: '8px',
          padding: '10px 0',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to right, rgba(12,12,20,1), transparent)', zIndex: 2 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to left, rgba(12,12,20,1), transparent)', zIndex: 2 }} />
          <div style={{ paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', position: 'relative', zIndex: 3 }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#f4a400', letterSpacing: '0.1em', fontWeight: '700' }}>// LIVE</span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="ticker-inner" style={{ paddingLeft: '20px' }}>
              {[...HEADLINES, ...HEADLINES].map((h, i) => (
                <span key={i} style={{
                  fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#94a3b8',
                  display: 'inline-flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer',
                  transition: 'color 0.18s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <span style={{ color: '#4361ee' }}>▸</span> {h}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Category filters */}
        <div className="animate-in stagger-3" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: activeCategory === cat ? '1px solid #4361ee' : '1px solid rgba(30,30,53,0.8)',
                background: activeCategory === cat ? 'rgba(67,97,238,0.15)' : 'rgba(15,15,26,0.6)',
                color: activeCategory === cat ? '#7b8ff7' : '#64748b',
                fontSize: '13px',
                fontWeight: activeCategory === cat ? '600' : '400',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: activeCategory === cat ? '0 0 12px rgba(67,97,238,0.2)' : 'none',
                transition: 'all 0.18s',
              }}
            >{cat}</button>
          ))}
        </div>

        {/* News grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : filtered.map((card, i) => <NewsCard key={card.id} card={card} index={i} />)
          }
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Daily streak */}
        <div className="glass-card bracket-corner animate-in stagger-2" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '16px', textAlign: 'left' }}>
            Daily Streak
          </div>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: '0 auto', display: 'block' }}>
            <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(30,30,53,0.8)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="28"
              fill="none"
              stroke="url(#streakGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(streak / 30) * circumference} ${circumference}`}
              className="ring-gauge"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <defs>
              <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4361ee" />
                <stop offset="100%" stopColor="#f4a400" />
              </linearGradient>
            </defs>
            <text x="40" y="37" textAnchor="middle" fill="#fff" fontFamily="Syne" fontSize="18" fontWeight="800">{streak}</text>
            <text x="40" y="52" textAnchor="middle" fill="#64748b" fontFamily="Space Mono" fontSize="9">DAYS</text>
          </svg>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#f4a400', marginTop: '10px' }}>
            🔥 Keep it up! Best: 14 days
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{
                width: '28px', height: '28px',
                borderRadius: '6px',
                background: i < 5 ? 'rgba(67,97,238,0.25)' : 'rgba(30,30,53,0.4)',
                border: i < 5 ? '1px solid rgba(67,97,238,0.4)' : '1px solid rgba(30,30,53,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontFamily: 'Space Mono, monospace',
                color: i < 5 ? '#7b8ff7' : '#374151',
              }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="glass-card animate-in stagger-3" style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Trending in CS
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee' }}>24h</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {TRENDING.map(item => (
              <div key={item.rank} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: '700', color: item.rank <= 3 ? '#4361ee' : '#1e1e35', minWidth: '24px' }}>
                  {item.rank}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>{item.topic}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#22c55e' }}>{item.delta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Stack News */}
        <div className="glass-card animate-in stagger-4" style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '4px' }}>
            Your Stack News
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748b', marginBottom: '14px' }}>
            React · Python · Node.js
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {YOUR_STACK.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px',
                background: 'rgba(15,15,26,0.6)',
                borderRadius: '8px',
                border: '1px solid rgba(30,30,53,0.8)',
                cursor: 'pointer',
                transition: 'border-color 0.18s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(67,97,238,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,30,53,0.8)'}
              >
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', background: 'rgba(67,97,238,0.15)', color: '#7b8ff7', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap', marginTop: '1px' }}>{item.tag}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12.5px', color: '#94a3b8', lineHeight: '1.4' }}>{item.label}</span>
              </div>
            ))}
          </div>
          <button style={{
            marginTop: '12px', width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid rgba(67,97,238,0.2)',
            borderRadius: '7px',
            color: '#4361ee', fontSize: '12px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(67,97,238,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >Customize stack →</button>
        </div>
      </div>
    </div>
  )
}
