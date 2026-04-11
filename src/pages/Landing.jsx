import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: '01',
    name: 'News Feed',
    tag: 'LIVE',
    desc: 'Real-time CS and tech news curated for students. Stay ahead of the industry with what actually matters.',
    accent: '#4361ee',
  },
  {
    id: '02',
    name: 'Personalized Roadmap',
    tag: 'AI',
    desc: 'NeetCode-style skill roadmaps personalized to your year, tech stack, and target role — powered by IBM watsonx.',
    accent: '#f4a400',
  },
  {
    id: '03',
    name: 'Resume Reviewer',
    tag: 'AI',
    desc: 'CS-specific resume scoring across ATS, impact, tech, and format. Deterministic scores, AI-generated feedback.',
    accent: '#4361ee',
  },
  {
    id: '04',
    name: 'Interview Prep',
    tag: 'TRENDING',
    desc: 'Trending questions by company, system design topics, and an AI-powered practice panel with live code feedback.',
    accent: '#f4a400',
  },
  {
    id: '05',
    name: 'Opportunity Feed',
    tag: 'NEW',
    desc: 'Internships, hackathons, and fellowships filtered to your stack, year, and career goals — all in one place.',
    accent: '#4361ee',
  },
]

const TEAM = [
  {
    name: 'Apurwa Khanal',
    initials: 'AK',
    role: 'Full-Stack Engineer',
    focus: 'Backend systems, AI orchestration, and API architecture.',
    accent: '#4361ee',
  },
  {
    name: 'Utsav Kafle',
    initials: 'UK',
    role: 'Full-Stack Engineer',
    focus: 'Frontend architecture, component design, and user experience.',
    accent: '#f4a400',
  },
  {
    name: 'Dipendra Kandel',
    initials: 'DK',
    role: 'Full-Stack Engineer',
    focus: 'Platform engineering, data pipelines, and infrastructure.',
    accent: '#4361ee',
  },
]

const TICKER_ITEMS = [
  '[ REAL-TIME TECH NEWS ]',
  '[ AI-PERSONALIZED ROADMAPS ]',
  '[ RESUME SCORING ENGINE ]',
  '[ INTERVIEW PRACTICE ]',
  '[ OPPORTUNITY FEED ]',
  '[ IBM WATSONX AI ]',
  '[ BUILT FOR CS STUDENTS ]',
  '[ SUPABASE + FASTAPI ]',
  '[ OPEN TO ALL STUDENTS ]',
]

const TERMINAL_LINES = [
  { text: '> axiom.init()', delay: 0 },
  { text: '> loading career intelligence...', delay: 600 },
  { text: '> connecting to watsonx AI...', delay: 1300 },
  { text: '> ██████████████████ 100%', delay: 2100 },
  { text: '> all systems ready.', delay: 2900 },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({ feature }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#111113' : '#0d0d0f',
        padding: '28px',
        position: 'relative',
        transition: 'background 0.15s, border-left-color 0.15s',
        borderLeft: `2px solid ${hovered ? feature.accent : 'transparent'}`,
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '32px', color: '#1e1e22', fontWeight: '700', lineHeight: 1 }}>
          {feature.id}
        </span>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '8px',
          color: feature.accent,
          border: `1px solid ${feature.accent}40`,
          background: `${feature.accent}0d`,
          padding: '3px 8px',
          letterSpacing: '0.12em',
        }}>
          {feature.tag}
        </span>
      </div>
      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', fontWeight: '400', marginBottom: '10px', color: hovered ? '#f4f4f5' : '#d4d4d8', transition: 'color 0.15s' }}>
        {feature.name}
      </h3>
      <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: '#52525b', lineHeight: '1.65' }}>
        {feature.desc}
      </p>
      {hovered && (
        <div style={{ position: 'absolute', bottom: '16px', right: '20px', fontFamily: "'Space Mono', monospace", fontSize: '9px', color: feature.accent, opacity: 0.6 }}>
          →
        </div>
      )}
    </div>
  )
}

function TeamCard({ member }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? member.accent + '50' : '#1e1e22'}`,
        background: '#111113',
        padding: '28px',
        position: 'relative',
        transition: 'border-color 0.18s',
      }}
    >
      {/* Corner brackets */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '10px', borderTop: `1px solid ${member.accent}50`, borderLeft: `1px solid ${member.accent}50` }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderBottom: `1px solid ${member.accent}50`, borderRight: `1px solid ${member.accent}50` }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <div style={{
          width: '46px', height: '46px',
          background: `${member.accent}15`,
          border: `1px solid ${member.accent}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'DM Serif Display', serif",
          fontSize: '16px', color: member.accent, flexShrink: 0,
          transition: 'background 0.15s',
          ...(hovered ? { background: `${member.accent}25` } : {}),
        }}>
          {member.initials}
        </div>
        <div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '15px', fontWeight: '600', color: '#f4f4f5' }}>
            {member.name}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: member.accent, letterSpacing: '0.1em', marginTop: '3px' }}>
            {member.role}
          </div>
        </div>
      </div>
      <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: '#52525b', lineHeight: '1.65' }}>
        {member.focus}
      </p>
    </div>
  )
}

function Terminal() {
  const [visibleLines, setVisibleLines] = useState([])

  useEffect(() => {
    TERMINAL_LINES.forEach(({ text, delay }) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, text])
      }, delay)
    })
  }, [])

  return (
    <div style={{
      background: '#0a0a0d',
      border: '1px solid #1e1e22',
      padding: '20px 24px',
      width: '100%',
      maxWidth: '440px',
      position: 'relative',
    }}>
      {/* Terminal header bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2a2a32' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2a2a32' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2a2a32' }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#3f3f46', marginLeft: '8px', letterSpacing: '0.1em' }}>
          axiom_terminal
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' }}>
        {visibleLines.map((line, i) => (
          <div key={i} style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            color: line.includes('ready') ? '#22c55e' : line.includes('███') ? '#4361ee' : '#52525b',
            letterSpacing: '0.04em',
            lineHeight: 1.4,
          }}>
            {line}
          </div>
        ))}
        {visibleLines.length < TERMINAL_LINES.length && (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#4361ee' }}>
            <span style={{ animation: 'pulseDot 0.8s ease-in-out infinite', display: 'inline-block' }}>▋</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (loading) return null
  if (user) { navigate('/news', { replace: true }); return null }

  const goLogin = () => navigate('/login')
  const goSignup = () => navigate('/login', { state: { mode: 'signup' } })

  return (
    <div style={{ background: '#09090b', color: '#f4f4f5', minHeight: '100vh', position: 'relative' }}>
      <div className="axiom-grid" />

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '52px', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(9,9,11,0.9)' : 'transparent',
        borderBottom: scrolled ? '1px solid #1e1e22' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'background 0.2s, border-color 0.2s, backdrop-filter 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', background: '#4361ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '700', fontSize: '13px', color: '#fff' }}>
            A
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#f4f4f5' }}>Axiom</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: '#4361ee', letterSpacing: '0.14em', opacity: 0.7 }}>v2.4</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={goLogin}
            style={{ padding: '6px 16px', background: 'transparent', border: '1px solid #2a2a32', color: '#71717a', fontFamily: "'Space Mono', monospace", fontSize: '10px', cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.color = '#f4f4f5' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a32'; e.currentTarget.style.color = '#71717a' }}
          >
            SIGN_IN
          </button>
          <button
            onClick={goSignup}
            style={{ padding: '6px 16px', background: '#4361ee', border: '1px solid #4361ee', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: '10px', cursor: 'pointer', letterSpacing: '0.08em', transition: 'opacity 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            GET_STARTED
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 32px 80px', position: 'relative' }}>
        {/* Corner accents */}
        {[
          { top: '68px', left: '24px', borderTop: '1px solid rgba(67,97,238,0.3)', borderLeft: '1px solid rgba(67,97,238,0.3)' },
          { top: '68px', right: '24px', borderTop: '1px solid rgba(67,97,238,0.3)', borderRight: '1px solid rgba(67,97,238,0.3)' },
          { bottom: '32px', left: '24px', borderBottom: '1px solid rgba(67,97,238,0.15)', borderLeft: '1px solid rgba(67,97,238,0.15)' },
          { bottom: '32px', right: '24px', borderBottom: '1px solid rgba(67,97,238,0.15)', borderRight: '1px solid rgba(67,97,238,0.15)' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: '36px', height: '36px', ...s }} />
        ))}

        {/* Glow blob behind headline */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(67,97,238,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          {/* Badge */}
          <div className="animate-in stagger-1" style={{ marginBottom: '28px' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#4361ee', letterSpacing: '0.16em', background: 'rgba(67,97,238,0.08)', border: '1px solid rgba(67,97,238,0.2)', padding: '5px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4361ee', display: 'inline-block' }} />
              CS_CAREER_OS — POWERED BY IBM WATSONX
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-in stagger-2" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(44px, 8vw, 88px)', fontWeight: '400', lineHeight: '1.08', letterSpacing: '-0.025em', marginBottom: '28px', color: '#f4f4f5' }}>
            The Career OS<br />
            <span style={{ color: '#4361ee' }}>for CS Students.</span>
          </h1>

          {/* Subtext */}
          <p className="animate-in stagger-3" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '17px', color: '#71717a', maxWidth: '560px', lineHeight: '1.75', marginBottom: '40px' }}>
            Real-time news, AI roadmaps, resume scoring, interview prep, and opportunity feeds — all in one precision-built platform.
          </p>

          {/* CTAs */}
          <div className="animate-in stagger-4" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '56px' }}>
            <button
              onClick={goSignup}
              style={{ padding: '13px 32px', background: '#4361ee', border: 'none', color: '#fff', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.12s', letterSpacing: '0.01em' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Get Started →
            </button>
            <button
              onClick={goLogin}
              style={{ padding: '13px 32px', background: 'transparent', border: '1px solid #2a2a32', color: '#a1a1aa', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '14px', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.color = '#f4f4f5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a32'; e.currentTarget.style.color = '#a1a1aa' }}
            >
              Sign In
            </button>
          </div>

          {/* Stats + Terminal */}
          <div className="animate-in stagger-5" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}>
            {/* Stats bar */}
            <div style={{ border: '1px solid #1e1e22', background: '#111113', display: 'flex', flexShrink: 0 }}>
              {[
                { val: '5', label: 'CORE TOOLS', color: '#4361ee' },
                { val: '85+', label: "INTERVIEW Q'S", color: '#f4a400' },
                { val: 'AI', label: 'POWERED', color: '#4361ee' },
                { val: '∞', label: 'STUDENT ACCESS', color: '#f4a400' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '16px 24px', borderRight: i < 3 ? '1px solid #1e1e22' : 'none', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: '#3f3f46', letterSpacing: '0.1em', marginTop: '6px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Terminal */}
            <Terminal />
          </div>
        </div>
      </section>

      {/* ── TICKER ─────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #1e1e22', borderBottom: '1px solid #1e1e22', overflow: 'hidden', padding: '10px 0', background: 'rgba(67,97,238,0.02)' }}>
        <div className="ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#2a2a32', letterSpacing: '0.1em', flexShrink: 0 }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', maxWidth: '1140px', margin: '0 auto' }}>
        <div style={{ marginBottom: '52px' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#4361ee', letterSpacing: '0.14em', marginBottom: '14px' }}>// CORE_FEATURES</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: '400', letterSpacing: '-0.015em', lineHeight: 1.15 }}>
            Everything you need to<br />
            <span style={{ color: '#4361ee' }}>land the role.</span>
          </h2>
        </div>
        {/* Grid: 3 top, 2 bottom */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#1e1e22', marginBottom: '1px' }}>
          {FEATURES.slice(0, 3).map(f => <FeatureCard key={f.id} feature={f} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#1e1e22' }}>
          {FEATURES.slice(3).map(f => <FeatureCard key={f.id} feature={f} />)}
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', borderTop: '1px solid #1e1e22', borderBottom: '1px solid #1e1e22', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#f4a400', letterSpacing: '0.14em', marginBottom: '16px' }}>// ABOUT</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: '400', letterSpacing: '-0.015em', marginBottom: '28px', lineHeight: 1.15 }}>
            Built by CS students,<br />
            <span style={{ color: '#f4a400' }}>for CS students.</span>
          </h2>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '16px', color: '#71717a', lineHeight: '1.8', marginBottom: '20px' }}>
            Axiom was born from a simple frustration: the tools CS students actually need are scattered across a dozen different platforms. Job boards, LeetCode, Notion roadmaps, LinkedIn, resume templates — it's noise.
          </p>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '16px', color: '#71717a', lineHeight: '1.8' }}>
            We built Axiom to be the single career operating system — powered by IBM watsonx AI, designed with precision, and built to actually move the needle when it comes to landing internships, new grad roles, and research positions.
          </p>
        </div>
      </section>

      {/* ── TEAM ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 32px', maxWidth: '1140px', margin: '0 auto' }}>
        <div style={{ marginBottom: '52px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#4361ee', letterSpacing: '0.14em', marginBottom: '14px' }}>// MEET_THE_TEAM</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: '400', letterSpacing: '-0.015em', lineHeight: 1.15 }}>
            The people behind <span style={{ color: '#4361ee' }}>Axiom</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {TEAM.map(member => <TeamCard key={member.name} member={member} />)}
        </div>

        {/* Mission card */}
        <div style={{ border: '1px solid #1e1e22', background: '#111113', padding: '32px 36px', position: 'relative', display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', borderTop: '1px solid rgba(244,164,0,0.35)', borderLeft: '1px solid rgba(244,164,0,0.35)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderBottom: '1px solid rgba(244,164,0,0.35)', borderRight: '1px solid rgba(244,164,0,0.35)' }} />
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#f4a400', letterSpacing: '0.14em', marginBottom: '8px' }}>// MISSION</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#f4a400', lineHeight: 1 }}>Why We Built This</div>
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '14px', color: '#71717a', lineHeight: '1.75' }}>
              We're a small team of CS students who got tired of the fragmented career prep landscape. Axiom is our answer — a precision-built, AI-powered platform that gives every CS student access to the same career intelligence that top performers have always had. No paywalls, no noise, no generic advice.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1e1e22', background: 'rgba(67,97,238,0.04)', padding: '72px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(67,97,238,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#4361ee', letterSpacing: '0.14em', marginBottom: '16px' }}>// GET_STARTED</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '400', letterSpacing: '-0.015em', marginBottom: '12px' }}>
            Ready to level up your career?
          </h2>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '15px', color: '#71717a', marginBottom: '36px' }}>
            Free for all CS students. No credit card required.
          </p>
          <button
            onClick={goSignup}
            style={{ padding: '14px 40px', background: '#4361ee', border: 'none', color: '#fff', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'opacity 0.12s', letterSpacing: '0.01em' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Create Your Account →
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #1e1e22', padding: '28px 32px' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '22px', height: '22px', background: '#4361ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '700', fontSize: '11px', color: '#fff' }}>A</div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#3f3f46', letterSpacing: '0.1em' }}>AXIOM // CS_CAREER_OS</span>
          </div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#2a2a32', letterSpacing: '0.08em' }}>
            // Built with IBM watsonx AI · Supabase · FastAPI · React
          </span>
        </div>
      </footer>
    </div>
  )
}
