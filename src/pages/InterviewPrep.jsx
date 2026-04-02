import React, { useState } from 'react'

const FILTERS = ['All', 'Coding', 'System Design', 'Behavioral']
const COMPANIES = ['All Companies', 'Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Stripe', 'Airbnb']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

const STATS = [
  { label: 'Questions Practiced', value: '147', icon: '📝', color: '#4361ee' },
  { label: 'Current Streak', value: '7 days', icon: '🔥', color: '#f4a400' },
  { label: 'Topics Covered', value: '18 / 30', icon: '🗂️', color: '#22c55e' },
  { label: 'Mock Interviews', value: '4', icon: '🎙️', color: '#c084fc' },
]

const QUESTIONS = [
  { id: 1, company: 'G', companyName: 'Google', companyColor: '#4285F4', title: 'LRU Cache', topic: 'Design', topicColor: '#c084fc', difficulty: 'Medium', asked: '2 weeks ago', type: 'Coding' },
  { id: 2, company: 'M', companyName: 'Meta', companyColor: '#1877F2', title: 'Binary Tree Maximum Path Sum', topic: 'Trees', topicColor: '#22c55e', difficulty: 'Hard', asked: '1 week ago', type: 'Coding' },
  { id: 3, company: 'A', companyName: 'Amazon', companyColor: '#FF9900', title: 'Design a URL Shortener', topic: 'System Design', topicColor: '#7b8ff7', difficulty: 'Medium', asked: '3 days ago', type: 'System Design' },
  { id: 4, company: 'S', companyName: 'Stripe', companyColor: '#635BFF', title: 'Tell me about a time you failed', topic: 'Behavioral', topicColor: '#f4a400', difficulty: 'Easy', asked: '5 days ago', type: 'Behavioral' },
  { id: 5, company: 'Ap', companyName: 'Apple', companyColor: '#555', title: 'Trapping Rain Water', topic: 'Arrays', topicColor: '#4361ee', difficulty: 'Hard', asked: '4 days ago', type: 'Coding' },
  { id: 6, company: 'Ms', companyName: 'Microsoft', companyColor: '#00A4EF', title: 'Design Twitter / X', topic: 'System Design', topicColor: '#7b8ff7', difficulty: 'Hard', asked: '1 week ago', type: 'System Design' },
  { id: 7, company: 'G', companyName: 'Google', companyColor: '#4285F4', title: 'Word Ladder', topic: 'Graphs', topicColor: '#22c55e', difficulty: 'Medium', asked: '3 weeks ago', type: 'Coding' },
  { id: 8, company: 'A', companyName: 'Airbnb', companyColor: '#FF5A5F', title: 'Why do you want to work here?', topic: 'Behavioral', topicColor: '#f4a400', difficulty: 'Easy', asked: '2 days ago', type: 'Behavioral' },
  { id: 9, company: 'M', companyName: 'Meta', companyColor: '#1877F2', title: 'Longest Consecutive Sequence', topic: 'Arrays', topicColor: '#4361ee', difficulty: 'Medium', asked: '6 days ago', type: 'Coding' },
]

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
  Easy: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  Medium: { bg: 'rgba(244,164,0,0.12)', color: '#f4a400', border: 'rgba(244,164,0,0.25)' },
  Hard: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
}

export default function InterviewPrep() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeCompany, setActiveCompany] = useState('All Companies')
  const [activeDiff, setActiveDiff] = useState('All')

  const filtered = QUESTIONS.filter(q => {
    const typeMatch = activeFilter === 'All' || q.type === activeFilter
    const compMatch = activeCompany === 'All Companies' || q.companyName === activeCompany
    const diffMatch = activeDiff === 'All' || q.difficulty === activeDiff
    return typeMatch && compMatch && diffMatch
  })

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Stats bar */}
      <div className="animate-in stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
        {STATS.map(stat => (
          <div key={stat.label} className="glass-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '24px' }}>{stat.icon}</span>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '20px', color: stat.color }}>{stat.value}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

          {/* Filter bar */}
          <div className="animate-in stagger-2" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 16px',
            background: 'rgba(12,12,20,0.8)',
            border: '1px solid rgba(67,97,238,0.12)',
            borderRadius: '10px',
            flexWrap: 'wrap',
          }}>
            {/* Type */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} style={{
                  padding: '5px 14px', borderRadius: '16px',
                  border: activeFilter === f ? '1px solid #4361ee' : '1px solid rgba(30,30,53,0.8)',
                  background: activeFilter === f ? 'rgba(67,97,238,0.15)' : 'transparent',
                  color: activeFilter === f ? '#7b8ff7' : '#64748b',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.18s',
                }}>{f}</button>
              ))}
            </div>

            <div style={{ width: '1px', height: '20px', background: 'rgba(30,30,53,0.8)' }} />

            {/* Company */}
            <select
              value={activeCompany}
              onChange={e => setActiveCompany(e.target.value)}
              style={{
                background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(30,30,53,0.8)',
                borderRadius: '6px', color: '#94a3b8', padding: '5px 10px',
                fontFamily: 'Inter, sans-serif', fontSize: '12px', cursor: 'pointer',
                outline: 'none',
              }}
            >
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div style={{ width: '1px', height: '20px', background: 'rgba(30,30,53,0.8)' }} />

            {/* Difficulty */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {DIFFICULTIES.map(d => {
                const cfg = d !== 'All' ? DIFF_CONFIG[d] : null
                return (
                  <button key={d} onClick={() => setActiveDiff(d)} style={{
                    padding: '5px 14px', borderRadius: '16px',
                    border: activeDiff === d ? `1px solid ${cfg?.border || '#4361ee'}` : '1px solid rgba(30,30,53,0.8)',
                    background: activeDiff === d ? (cfg?.bg || 'rgba(67,97,238,0.15)') : 'transparent',
                    color: activeDiff === d ? (cfg?.color || '#7b8ff7') : '#64748b',
                    fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.18s',
                  }}>{d}</button>
                )
              })}
            </div>

            <div style={{ marginLeft: 'auto', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748b' }}>
              {filtered.length} questions
            </div>
          </div>

          {/* Question grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {filtered.map((q, i) => {
              const diff = DIFF_CONFIG[q.difficulty]
              return (
                <div
                  key={q.id}
                  className={`glass-card animate-in stagger-${Math.min(i + 3, 8)}`}
                  style={{ padding: '18px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    {/* Company logo placeholder */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: `${q.companyColor}20`,
                      border: `1px solid ${q.companyColor}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Syne, sans-serif', fontWeight: '800',
                      fontSize: '12px', color: q.companyColor,
                    }}>{q.company}</div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '10px',
                      background: diff.bg, color: diff.color,
                      border: `1px solid ${diff.border}`,
                      fontSize: '11px', fontFamily: 'Space Mono, monospace',
                      fontWeight: '700',
                    }}>{q.difficulty}</span>
                  </div>

                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#e2e8f0', marginBottom: '10px', lineHeight: '1.3' }}>
                    {q.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px',
                        background: `${q.topicColor}18`,
                        color: q.topicColor,
                        fontSize: '11px', fontFamily: 'Space Mono, monospace',
                      }}>{q.topic}</span>
                    </div>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#475569' }}>
                      Asked {q.asked}
                    </span>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                    <button style={{
                      flex: 1, padding: '7px',
                      background: 'rgba(67,97,238,0.1)',
                      border: '1px solid rgba(67,97,238,0.25)',
                      borderRadius: '6px', color: '#7b8ff7',
                      fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.18s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(67,97,238,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(67,97,238,0.1)'}
                    >Practice →</button>
                    <button style={{
                      padding: '7px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(30,30,53,0.8)',
                      borderRadius: '6px', color: '#64748b',
                      fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}>💾</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Weekly Study Plan */}
          <div className="glass-card animate-in stagger-6" style={{ padding: '22px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Weekly Study Plan
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee', background: 'rgba(67,97,238,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Apr 2026</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
              {WEEKLY_PLAN.map((day, i) => (
                <div key={day.day} style={{
                  background: day.done ? 'rgba(67,97,238,0.1)' : 'rgba(15,15,26,0.6)',
                  border: `1px solid ${day.done ? 'rgba(67,97,238,0.3)' : 'rgba(30,30,53,0.8)'}`,
                  borderRadius: '8px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  {day.done && (
                    <div style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: '#22c55e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', color: '#fff', fontWeight: '700',
                    }}>✓</div>
                  )}
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: day.done ? '#7b8ff7' : '#e2e8f0', marginBottom: '8px' }}>{day.day}</div>
                  {day.tasks.map((task, ti) => (
                    <div key={ti} style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#64748b', lineHeight: '1.5', marginBottom: '2px' }}>{task}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: Trending */}
        <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="glass-card animate-in stagger-3" style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#fff', marginBottom: '4px' }}>
              Trending This Week
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748b', marginBottom: '16px' }}>
              Hot topics companies are asking
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {TRENDING_TOPICS.map((t, i) => (
                <div key={i} style={{
                  padding: '12px 14px',
                  background: 'rgba(12,12,20,0.8)',
                  border: '1px solid rgba(30,30,53,0.8)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.18s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(67,97,238,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,30,53,0.8)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12.5px', color: '#e2e8f0', fontWeight: '500', lineHeight: '1.3', flex: 1 }}>{t.topic}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {t.companies.map(c => (
                        <span key={c} style={{
                          width: '20px', height: '20px', borderRadius: '4px',
                          background: 'rgba(67,97,238,0.15)',
                          border: '1px solid rgba(67,97,238,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '9px', color: '#7b8ff7', fontFamily: 'Syne, sans-serif', fontWeight: '700',
                        }}>{c}</span>
                      ))}
                    </div>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: t.trend.includes('🔥') ? '#ef4444' : '#f4a400' }}>{t.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick start mock */}
          <div className="glass-card animate-in stagger-4" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(67,97,238,0.1), rgba(18,18,31,0.9))' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#fff', marginBottom: '8px' }}>
              Start Mock Interview
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: '1.6' }}>
              Simulate a real FAANG-style interview with timed coding and behavioral questions.
            </div>
            <button style={{
              width: '100%', padding: '10px',
              background: 'linear-gradient(135deg, #4361ee, #6b7ff7)',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontFamily: 'Syne, sans-serif',
              fontWeight: '700', fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(67,97,238,0.35)',
            }}>
              🎙️ Start Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
