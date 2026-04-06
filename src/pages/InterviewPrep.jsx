import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PracticePanel from '../components/PracticePanel'

// ── Static display data (not in DB) ─────────────────────────────────────────

const FILTERS = ['All', 'Coding', 'System Design', 'Behavioral']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

const TRENDING_TOPICS = [
  { topic: 'Agentic AI Design Patterns', companies: ['G', 'M', 'A'], trend: '🔥 Hot' },
  { topic: 'Distributed Caching (Redis)', companies: ['S', 'Ms'], trend: '↑ Rising' },
  { topic: 'Dynamic Programming', companies: ['G', 'A', 'M'], trend: '📌 Classic' },
  { topic: 'Behavioral: Conflict resolution', companies: ['A', 'Ap'], trend: '↑ Rising' },
  { topic: 'System Design: Rate Limiter', companies: ['S', 'G'], trend: '🔥 Hot' },
]

const WEEKLY_PLAN = [
  { day: 'Mon', tasks: ['2x Easy Arrays', 'Review Big-O'], done: true },
  { day: 'Tue', tasks: ['1x Medium DP', 'System Design reading'], done: true },
  { day: 'Wed', tasks: ['Mock interview', '1x Hard Graph'], done: false },
  { day: 'Thu', tasks: ['Behavioral prep', '2x Medium Trees'], done: false },
  { day: 'Fri', tasks: ['1x Hard Design', 'Review mistakes'], done: false },
  { day: 'Sat', tasks: ['Full mock session', 'Rest'], done: false },
  { day: 'Sun', tasks: ['Review & plan next week'], done: false },
]

const DIFF_CONFIG = {
  Easy:   { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  Medium: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  Hard:   { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
}

// ── Helper functions ─────────────────────────────────────────────────────────

const COMPANY_COLORS = {
  Google: '#4285F4', Meta: '#1877F2', Facebook: '#1877F2',
  Amazon: '#FF9900', Apple: '#888888', Microsoft: '#00A4EF',
  Stripe: '#635BFF', Airbnb: '#FF5A5F', Netflix: '#E50914',
  Uber: '#000000', Twitter: '#1DA1F2', LinkedIn: '#0A66C2',
  Spotify: '#1DB954', Shopify: '#96BF48', Coinbase: '#0052FF',
  Palantir: '#101827', Snowflake: '#29B5E8', Databricks: '#FF3621',
}

const TOPIC_COLORS = ['#4361ee', '#22c55e', '#6b83f0', '#f4a400', '#22d3ee', '#4ade80', '#f87171', '#06b6d4']

function getCompanyColor(name) {
  return COMPANY_COLORS[name] || '#6b83f0'
}

function getTopicColor(topic) {
  if (!topic) return '#6b83f0'
  let hash = 0
  for (const c of topic) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length]
}

function getCompanyInitial(name) {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2)
  return words.slice(0, 2).map(w => w[0]).join('')
}

// Safely parse companies jsonb — handles string[] or {name}[]
function parseCompanies(raw) {
  if (!raw) return []
  const arr = Array.isArray(raw) ? raw : []
  return arr.map(c => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
}

function daysAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

function calculateStreak(progressRows) {
  const dateSet = new Set(
    progressRows
      .filter(r => r.practiced_at)
      .map(r => new Date(r.practiced_at).toISOString().split('T')[0])
  )
  if (dateSet.size === 0) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  // If nothing practiced today, start counting from yesterday
  const todayStr = cursor.toISOString().split('T')[0]
  if (!dateSet.has(todayStr)) cursor.setDate(cursor.getDate() - 1)

  while (true) {
    const str = cursor.toISOString().split('T')[0]
    if (dateSet.has(str)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

// ── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '20px 28px 1fr 80px 80px 72px 80px 72px',
      padding: '11px 16px',
      borderBottom: '1px solid #1e1e22',
      alignItems: 'center',
      gap: '0',
    }}>
      <div className="skeleton" style={{ width: '6px', height: '6px' }} />
      <div className="skeleton" style={{ width: '16px', height: '10px', margin: '0 4px' }} />
      <div className="skeleton" style={{ height: '13px', width: '60%', margin: '0 4px' }} />
      <div className="skeleton" style={{ height: '18px', width: '40px', margin: '0 4px' }} />
      <div className="skeleton" style={{ height: '18px', width: '44px', margin: '0 4px' }} />
      <div className="skeleton" style={{ height: '18px', width: '48px', margin: '0 4px' }} />
      <div className="skeleton" style={{ height: '10px', width: '52px', margin: '0 4px' }} />
      <div className="skeleton" style={{ height: '26px', width: '60px', margin: '0 4px' }} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InterviewPrep() {
  const { user } = useAuth()

  const [questions, setQuestions]         = useState([])
  const [progress, setProgress]           = useState({}) // { [question_id]: row }
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [practiceLoading, setPracticeLoading] = useState({}) // { [question_id]: bool }

  const [activeFilter, setActiveFilter]   = useState('All')
  const [activeCompany, setActiveCompany] = useState('All Companies')
  const [activeDiff, setActiveDiff]       = useState('All')

  const [panelQuestion, setPanelQuestion] = useState(null) // question object or null

  // ── Fetch questions ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from('questions')
          .select('*')
          .order('created_at', { ascending: false })
        if (err) throw err
        setQuestions(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Fetch user progress ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setProgress({}); return }
    async function loadProgress() {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
      if (data) {
        const map = {}
        data.forEach(row => { map[row.question_id] = row })
        setProgress(map)
      }
    }
    loadProgress()
  }, [user?.id])

  // ── Practice button handler ──────────────────────────────────────────────
  async function handlePractice(questionId) {
    if (!user?.id) return
    const existing = progress[questionId]
    if (existing?.status === 'completed') return

    setPracticeLoading(p => ({ ...p, [questionId]: true }))
    try {
      if (!existing) {
        const { data } = await supabase
          .from('user_progress')
          .insert({ user_id: user.id, question_id: questionId, status: 'in_progress', practiced_at: new Date().toISOString() })
          .select()
          .single()
        if (data) setProgress(p => ({ ...p, [questionId]: data }))
      } else if (existing.status === 'in_progress') {
        const { data } = await supabase
          .from('user_progress')
          .update({ status: 'completed', practiced_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()
        if (data) setProgress(p => ({ ...p, [questionId]: data }))
      }
    } finally {
      setPracticeLoading(p => ({ ...p, [questionId]: false }))
    }
  }

  // ── Open practice panel (marks in_progress if fresh) ────────────────────
  function openPanel(question) {
    setPanelQuestion(question)
    if (user?.id && !progress[question.id]) {
      handlePractice(question.id)
    }
  }

  // ── Mark complete from inside the panel ──────────────────────────────────
  async function handleMarkComplete(questionId) {
    if (!user?.id) return
    const existing = progress[questionId]
    if (existing?.status === 'completed') return
    setPracticeLoading(p => ({ ...p, [questionId]: true }))
    try {
      if (!existing) {
        const { data } = await supabase
          .from('user_progress')
          .insert({ user_id: user.id, question_id: questionId, status: 'completed', practiced_at: new Date().toISOString() })
          .select().single()
        if (data) setProgress(p => ({ ...p, [questionId]: data }))
      } else {
        const { data } = await supabase
          .from('user_progress')
          .update({ status: 'completed', practiced_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select().single()
        if (data) setProgress(p => ({ ...p, [questionId]: data }))
      }
    } finally {
      setPracticeLoading(p => ({ ...p, [questionId]: false }))
    }
  }

  // ── Derived: company dropdown list ──────────────────────────────────────
  const companiesList = useMemo(() => {
    const set = new Set()
    questions.forEach(q => parseCompanies(q.companies).forEach(c => set.add(c)))
    return ['All Companies', ...Array.from(set).sort()]
  }, [questions])

  // ── Derived: stat cards ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const rows = Object.values(progress)
    const completed = rows.filter(r => r.status === 'completed')
    const streak = calculateStreak(rows)
    const completedIds = new Set(completed.map(r => r.question_id))
    const completedTopics = new Set(
      questions.filter(q => completedIds.has(q.id)).map(q => q.topic).filter(Boolean)
    )
    const totalTopics = new Set(questions.map(q => q.topic).filter(Boolean)).size
    return [
      { label: 'Questions Practiced', value: String(completed.length),                          icon: '📝', color: '#4361ee' },
      { label: 'Current Streak',       value: `${streak} day${streak !== 1 ? 's' : ''}`,        icon: '🔥', color: '#f4a400' },
      { label: 'Topics Covered',       value: `${completedTopics.size} / ${totalTopics}`,        icon: '🗂️', color: '#22c55e' },
      { label: 'Mock Interviews',       value: '0',                                              icon: '🎙️', color: '#4361ee' },
    ]
  }, [progress, questions])

  // ── Derived: filtered questions ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return questions.filter(q => {
      const typeMatch  = activeFilter === 'All' || (q.category || '').toLowerCase() === activeFilter.toLowerCase()
      const companies  = parseCompanies(q.companies)
      const compMatch  = activeCompany === 'All Companies' || companies.includes(activeCompany)
      const diffMatch  = activeDiff === 'All' || q.difficulty === activeDiff
      return typeMatch && compMatch && diffMatch
    })
  }, [questions, activeFilter, activeCompany, activeDiff])

  // ── Status dot color from user_progress ─────────────────────────────────
  function statusDotColor(questionId) {
    const row = progress[questionId]
    if (!row) return '#3f3f46'
    if (row.status === 'completed') return '#22c55e'
    if (row.status === 'in_progress') return '#f4a400'
    return '#3f3f46'
  }

  // ── Practice button label/style ──────────────────────────────────────────
  function practiceBtn(questionId) {
    const row = progress[questionId]
    const busy = practiceLoading[questionId]
    if (busy) return { label: '...', disabled: true, bg: 'rgba(67,97,238,0.1)', color: '#3f3f46', border: '1px solid rgba(67,97,238,0.1)' }
    if (!row || row.status === 'not_started') return { label: 'Practice', disabled: false, bg: 'rgba(67,97,238,0.1)', color: '#6b83f0', border: '1px solid rgba(67,97,238,0.2)' }
    if (row.status === 'in_progress') return { label: 'Mark Done', disabled: false, bg: 'rgba(244,164,0,0.1)', color: '#f4a400', border: '1px solid rgba(244,164,0,0.25)' }
    return { label: 'Done ✓', disabled: true, bg: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* Stats bar */}
      <div className="animate-in stagger-1" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        borderBottom: '1px solid #1e1e22',
        flexShrink: 0,
      }}>
        {stats.map((stat, i) => (
          <div key={stat.label} style={{
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '12px',
            borderRight: i < 3 ? '1px solid #1e1e22' : 'none',
            background: '#0d0d0f',
          }}>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '18px', color: stat.color }}>{stat.value}</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#52525b', marginTop: '1px' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #1e1e22' }}>

          {/* Filter bar */}
          <div className="animate-in stagger-2" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            padding: '0 16px',
            background: '#0d0d0f',
            borderBottom: '1px solid #1e1e22',
            flexWrap: 'nowrap',
            height: '44px',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {/* Type filters */}
            <div style={{ display: 'flex', gap: '0', marginRight: '12px' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} style={{
                  padding: '0 12px', height: '44px',
                  border: 'none',
                  borderBottom: activeFilter === f ? '2px solid #4361ee' : '2px solid transparent',
                  background: 'transparent',
                  color: activeFilter === f ? '#f4f4f5' : '#71717a',
                  fontSize: '12px', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
                  fontWeight: activeFilter === f ? '500' : '400',
                  transition: 'all 0.12s', whiteSpace: 'nowrap',
                }}>{f}</button>
              ))}
            </div>

            <div style={{ width: '1px', height: '20px', background: '#1e1e22', marginRight: '12px', flexShrink: 0 }} />

            {/* Company dropdown — built from DB */}
            <select
              value={activeCompany}
              onChange={e => setActiveCompany(e.target.value)}
              style={{
                background: '#111113', border: '1px solid #1e1e22',
                color: '#a1a1aa', padding: '4px 8px',
                fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', cursor: 'pointer',
                outline: 'none', marginRight: '12px',
              }}
            >
              {companiesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div style={{ width: '1px', height: '20px', background: '#1e1e22', marginRight: '12px', flexShrink: 0 }} />

            {/* Difficulty */}
            <div style={{ display: 'flex', gap: '0' }}>
              {DIFFICULTIES.map(d => {
                const cfg = d !== 'All' ? DIFF_CONFIG[d] : null
                return (
                  <button key={d} onClick={() => setActiveDiff(d)} style={{
                    padding: '4px 10px',
                    border: activeDiff === d ? `1px solid ${cfg?.border || 'rgba(67,97,238,0.3)'}` : '1px solid transparent',
                    background: activeDiff === d ? (cfg?.bg || 'rgba(67,97,238,0.08)') : 'transparent',
                    color: activeDiff === d ? (cfg?.color || '#6b83f0') : '#71717a',
                    fontSize: '11px', cursor: 'pointer', fontFamily: "'Space Mono', monospace",
                    transition: 'all 0.12s', marginRight: '4px',
                  }}>{d}</button>
                )
              })}
            </div>

            <div style={{ marginLeft: 'auto', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', whiteSpace: 'nowrap' }}>
              {loading ? '...' : `${filtered.length} questions`}
            </div>
          </div>

          {/* Question table */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '20px 28px 1fr 80px 80px 72px 80px 72px',
              gap: '0',
              padding: '8px 16px',
              borderBottom: '1px solid #1e1e22',
              background: '#09090b',
              position: 'sticky', top: 0, zIndex: 10,
            }}>
              {['', '#', 'Title', 'Company', 'Topic', 'Difficulty', 'Asked', ''].map((h, i) => (
                <span key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 4px' }}>{h}</span>
              ))}
            </div>

            {/* Loading skeletons */}
            {loading && Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)}

            {/* Error state */}
            {!loading && error && (
              <div style={{
                padding: '24px 16px',
                fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#f87171',
                borderBottom: '1px solid #1e1e22',
                background: 'rgba(239,68,68,0.04)',
                borderLeft: '2px solid #ef4444',
              }}>
                // Error: {error}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: '#52525b' }}>
                  No questions match your filters.
                </div>
              </div>
            )}

            {/* Question rows */}
            {!loading && !error && filtered.map((q, i) => {
              const diff      = DIFF_CONFIG[q.difficulty] || DIFF_CONFIG.Medium
              const companies = parseCompanies(q.companies)
              const btn       = practiceBtn(q.id)

              return (
                <div
                  key={q.id}
                  className={`animate-in stagger-${Math.min(i + 2, 8)}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 28px 1fr 80px 80px 72px 80px 72px',
                    gap: '0',
                    padding: '11px 16px',
                    borderBottom: '1px solid #1e1e22',
                    background: '#09090b',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#111113' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#09090b' }}
                >
                  {/* Status dot — from user_progress */}
                  <div style={{
                    width: '6px', height: '6px',
                    background: statusDotColor(q.id),
                    marginRight: '4px',
                    borderRadius: '50%',
                    transition: 'background 0.2s',
                  }} />

                  {/* Index */}
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#3f3f46', padding: '0 4px' }}>{i + 1}</span>

                  {/* Title */}
                  <span
                    onClick={() => openPanel(q)}
                    style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', fontWeight: '400', color: '#f4f4f5', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#6b83f0' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#f4f4f5' }}
                  >{q.title}</span>

                  {/* Company — first 3 badges */}
                  <div style={{ padding: '0 4px', display: 'flex', gap: '2px', overflow: 'hidden' }}>
                    {companies.slice(0, 3).map((company, ci) => {
                      const color = getCompanyColor(company)
                      return (
                        <span key={ci} style={{
                          padding: '2px 5px',
                          background: `${color}12`,
                          border: `1px solid ${color}30`,
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '9px', color, fontWeight: '700',
                          whiteSpace: 'nowrap',
                        }}>{getCompanyInitial(company)}</span>
                      )
                    })}
                  </div>

                  {/* Topic */}
                  <div style={{ padding: '0 4px' }}>
                    {q.topic && (
                      <span style={{
                        padding: '2px 6px',
                        background: `${getTopicColor(q.topic)}10`,
                        border: `1px solid ${getTopicColor(q.topic)}25`,
                        fontFamily: "'Space Mono', monospace", fontSize: '9px', color: getTopicColor(q.topic),
                        whiteSpace: 'nowrap', overflow: 'hidden', display: 'block', textOverflow: 'ellipsis',
                      }}>{q.topic}</span>
                    )}
                  </div>

                  {/* Difficulty */}
                  <div style={{ padding: '0 4px' }}>
                    <span style={{
                      padding: '2px 7px',
                      background: diff.bg, color: diff.color,
                      border: `1px solid ${diff.border}`,
                      fontSize: '10px', fontFamily: "'Space Mono', monospace", fontWeight: '700',
                    }}>{q.difficulty}</span>
                  </div>

                  {/* Asked — from created_at */}
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', padding: '0 4px', whiteSpace: 'nowrap' }}>
                    {q.created_at ? daysAgo(q.created_at) : '—'}
                  </span>

                  {/* Practice button */}
                  <div style={{ display: 'flex', gap: '4px', padding: '0 4px' }}>
                    <button
                      disabled={btn.disabled}
                      onClick={e => { e.stopPropagation(); if (!btn.disabled) openPanel(q) }}
                      style={{
                        padding: '4px 8px',
                        background: btn.bg,
                        border: btn.border,
                        color: btn.color,
                        fontSize: '11px',
                        cursor: btn.disabled ? 'default' : 'pointer',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        transition: 'all 0.12s', whiteSpace: 'nowrap',
                        opacity: btn.disabled && !practiceLoading[q.id] ? 0.7 : 1,
                      }}
                      onMouseEnter={e => { if (!btn.disabled) e.currentTarget.style.opacity = '0.8' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >{btn.label}</button>
                  </div>
                </div>
              )
            })}

            {/* Weekly Study Plan */}
            <div style={{ padding: '20px 16px', borderTop: '1px solid #1e1e22', background: '#09090b' }}>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '13px', color: '#f4f4f5', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Weekly Study Plan
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee', background: 'rgba(67,97,238,0.08)', padding: '2px 6px', border: '1px solid rgba(67,97,238,0.15)' }}>Apr 2026</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {WEEKLY_PLAN.map((day) => (
                  <div key={day.day} style={{
                    background: day.done ? 'rgba(67,97,238,0.08)' : '#111113',
                    border: `1px solid ${day.done ? 'rgba(67,97,238,0.25)' : '#1e1e22'}`,
                    padding: '10px 8px',
                    textAlign: 'center',
                    position: 'relative',
                  }}>
                    {day.done && (
                      <div style={{
                        position: 'absolute', top: '-5px', right: '-5px',
                        width: '14px', height: '14px',
                        background: '#22c55e',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '8px', color: '#fff', fontWeight: '700',
                      }}>✓</div>
                    )}
                    <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '11px', color: day.done ? '#6b83f0' : '#f4f4f5', marginBottom: '6px' }}>{day.day}</div>
                    {day.tasks.map((task, ti) => (
                      <div key={ti} style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '10px', color: '#71717a', lineHeight: '1.4', marginBottom: '1px' }}>{task}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0d0d0f', overflowY: 'auto' }}>

          {/* Trending */}
          <div className="animate-in stagger-3" style={{ padding: '16px', borderBottom: '1px solid #1e1e22' }}>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '12px', color: '#f4f4f5', marginBottom: '3px' }}>
              Trending This Week
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', marginBottom: '14px' }}>
              Hot topics companies are asking
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {TRENDING_TOPICS.map((t, i) => (
                <div key={i} style={{
                  padding: '10px 0',
                  borderBottom: i < TRENDING_TOPICS.length - 1 ? '1px solid #1e1e22' : 'none',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#3f3f46', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#f4f4f5', fontWeight: '400', lineHeight: '1.35' }}>{t.topic}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '16px' }}>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {t.companies.map(c => (
                        <span key={c} style={{
                          width: '18px', height: '18px',
                          background: 'rgba(67,97,238,0.1)',
                          border: '1px solid rgba(67,97,238,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '8px', color: '#6b83f0', fontFamily: "'Space Mono', monospace", fontWeight: '700',
                        }}>{c}</span>
                      ))}
                    </div>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: t.trend.includes('🔥') ? '#ef4444' : '#f4a400' }}>{t.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Mock */}
          <div className="animate-in stagger-4" style={{ padding: '16px' }}>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '13px', color: '#f4f4f5', marginBottom: '6px' }}>
              Start Mock Interview
            </div>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a', marginBottom: '14px', lineHeight: '1.55' }}>
              Simulate a real FAANG-style interview with timed coding and behavioral questions.
            </div>
            <button style={{
              width: '100%', padding: '9px',
              background: '#4361ee',
              border: 'none',
              color: '#fff', fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: '600', fontSize: '12px',
              cursor: 'pointer',
              transition: 'opacity 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Start Now →
            </button>
          </div>
        </div>
      </div>

      {/* Practice panel — slides in over main content */}
      {panelQuestion && (
        <PracticePanel
          question={panelQuestion}
          progressRow={progress[panelQuestion.id]}
          onClose={() => setPanelQuestion(null)}
          onMarkComplete={handleMarkComplete}
        />
      )}
    </div>
  )
}
