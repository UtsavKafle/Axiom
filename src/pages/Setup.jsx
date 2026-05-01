import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/* ─── constants ─────────────────────────────── */

const TOTAL = 7

const STEP_META = [
  { id: 'year',      label: 'YEAR' },
  { id: 'goal',      label: 'CAREER GOAL' },
  { id: 'interests', label: 'INTERESTS' },
  { id: 'level',     label: 'EXPERIENCE' },
  { id: 'role',      label: 'TARGET ROLE' },
  { id: 'timeline',  label: 'TIMELINE' },
  { id: 'skills',    label: 'SKILLS' },
]

const STEP_TITLES = [
  'What year are you in?',
  "What's your career goal?",
  'What are your interests?',
  "What's your experience level?",
  'What role are you targeting?',
  'Set your timeline & availability',
  'What skills do you already have?',
]

const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']

const GOAL_OPTIONS = ['Big Tech', 'Startup', 'Research / PhD', 'Government', 'Consulting']

const INTEREST_OPTIONS = [
  'AI / ML', 'Web Dev', 'Mobile', 'Systems',
  'Data Science', 'Security', 'Cloud / DevOps', 'Algorithms',
]

const LEVEL_OPTIONS = [
  {
    id: 'beginner',
    label: 'Beginner',
    badge: '0–1 YR',
    desc: 'Building fundamentals in data structures and CS theory.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    badge: '1–2 YR',
    desc: 'Comfortable with algorithms, ready to tackle real interviews.',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    badge: '2+ YR',
    desc: 'Internship or research experience, familiar with system design.',
  },
]

const ROLE_OPTIONS = [
  'Frontend', 'Backend', 'Full Stack', 'ML Engineer',
  'Data Scientist', 'DevOps', 'Mobile', 'Security',
]

const PRESET_SKILLS = [
  'Python', 'Java', 'JavaScript', 'C++', 'React', 'SQL',
  'Git', 'Data Structures', 'Algorithms', 'System Design',
  'TypeScript', 'Node.js',
]

/* ─── small helpers ─────────────────────────── */

function Spinner({ size = 16 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'axiom-setup-spin 0.7s linear infinite' }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function RadioRow({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '13px 16px',
        background: active ? 'rgba(67,97,238,0.08)' : '#111113',
        border: `1px solid ${active ? '#4361ee' : '#1e1e22'}`,
        cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#2a2a32' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = active ? '#4361ee' : '#1e1e22' }}
    >
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${active ? '#4361ee' : '#3f3f46'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.12s',
      }}>
        {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4361ee' }} />}
      </div>
      <span style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '13px', fontWeight: active ? 500 : 400,
        color: active ? '#f4f4f5' : '#a1a1aa',
      }}>
        {label}
      </span>
    </button>
  )
}

/* ─── main component ────────────────────────── */

export default function Setup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward

  const [form, setForm] = useState({
    year: '',
    goal: '',
    interests: [],
    level: '',
    target_role: '',
    timeline_weeks: 12,
    hours_per_week: 10,
    current_skills: [],
  })

  const [skillInput, setSkillInput] = useState('')
  const [launching, setLaunching] = useState(false)

  /* ── navigation ── */

  function goNext() {
    if (step < TOTAL - 1) {
      setDirection(1)
      setStep(s => s + 1)
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1)
      setStep(s => s - 1)
    }
  }

  /* ── validation ── */

  function canProceed() {
    switch (step) {
      case 0: return !!form.year
      case 1: return !!form.goal
      case 2: return form.interests.length > 0
      case 3: return !!form.level
      case 4: return !!form.target_role
      case 5: return form.timeline_weeks > 0 && form.hours_per_week >= 1
      case 6: return form.current_skills.length > 0
      default: return false
    }
  }

  /* ── submit ── */

  async function handleLaunch() {
    if (!user) return
    setLaunching(true)

    await supabase.from('profiles').update({
      year: form.year,
      goal: form.goal,
      interests: form.interests,
    }).eq('id', user.id)

    await supabase.from('user_profiles').upsert({
      user_id: user.id,
      level: form.level,
      target_role: form.target_role,
      timeline_weeks: form.timeline_weeks,
      hours_per_week: form.hours_per_week,
      current_skills: form.current_skills,
    }, { onConflict: 'user_id' })

    try {
      await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          level: form.level,
          target_role: form.target_role,
          timeline_weeks: form.timeline_weeks,
          hours_per_week: form.hours_per_week,
          current_skills: form.current_skills,
        }),
      })
    } catch {
      // Non-fatal — navigate regardless
    }

    navigate('/news')
  }

  /* ── interests helpers ── */

  function toggleInterest(item) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(item)
        ? f.interests.filter(i => i !== item)
        : [...f.interests, item],
    }))
  }

  /* ── skills helpers ── */

  function toggleSkill(skill) {
    setForm(f => ({
      ...f,
      current_skills: f.current_skills.includes(skill)
        ? f.current_skills.filter(s => s !== skill)
        : [...f.current_skills, skill],
    }))
  }

  function addCustomSkill() {
    const trimmed = skillInput.trim()
    if (!trimmed || form.current_skills.includes(trimmed)) { setSkillInput(''); return }
    setForm(f => ({ ...f, current_skills: [...f.current_skills, trimmed] }))
    setSkillInput('')
  }

  function removeSkill(skill) {
    setForm(f => ({ ...f, current_skills: f.current_skills.filter(s => s !== skill) }))
  }

  /* ── derived values ── */

  const progressPct = ((step + 1) / TOTAL) * 100
  const timelinePct = ((form.timeline_weeks - 4) / (52 - 4)) * 100
  const hoursPct    = ((form.hours_per_week - 1) / (40 - 1)) * 100

  /* ── step content ── */

  function renderStep() {
    switch (step) {

      /* ── Step 0: Year ── */
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {YEAR_OPTIONS.map(y => (
              <RadioRow
                key={y}
                label={y}
                active={form.year === y}
                onClick={() => setForm(f => ({ ...f, year: y }))}
              />
            ))}
          </div>
        )

      /* ── Step 1: Career Goal ── */
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {GOAL_OPTIONS.map(g => (
              <RadioRow
                key={g}
                label={g}
                active={form.goal === g}
                onClick={() => setForm(f => ({ ...f, goal: g }))}
              />
            ))}
          </div>
        )

      /* ── Step 2: Interests ── */
      case 2:
        return (
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '12px' }}>
              SELECT ALL THAT APPLY
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {INTEREST_OPTIONS.map(item => {
                const sel = form.interests.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '9px 14px',
                      background: sel ? 'rgba(67,97,238,0.1)' : '#111113',
                      border: `1px solid ${sel ? '#4361ee' : '#1e1e22'}`,
                      color: sel ? '#f4f4f5' : '#71717a',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '13px', fontWeight: sel ? 500 : 400,
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = '#2a2a32' }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = '#1e1e22' }}
                  >
                    {sel && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4361ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {item}
                  </button>
                )
              })}
            </div>
          </div>
        )

      /* ── Step 3: Experience Level ── */
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {LEVEL_OPTIONS.map(lvl => {
              const sel = form.level === lvl.id
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, level: lvl.id }))}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    padding: '14px 16px',
                    background: sel ? 'rgba(67,97,238,0.08)' : '#111113',
                    border: `1px solid ${sel ? '#4361ee' : '#1e1e22'}`,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = '#2a2a32' }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = sel ? '#4361ee' : '#1e1e22' }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${sel ? '#4361ee' : '#3f3f46'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: '1px', transition: 'border-color 0.12s',
                  }}>
                    {sel && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4361ee' }} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '13px', color: sel ? '#f4f4f5' : '#a1a1aa' }}>
                        {lvl.label}
                      </span>
                      <span style={{
                        fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.06em',
                        color: sel ? '#4361ee' : '#52525b',
                        background: sel ? 'rgba(67,97,238,0.12)' : 'rgba(63,63,70,0.4)',
                        padding: '1px 5px',
                      }}>
                        {lvl.badge}
                      </span>
                    </div>
                    <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a', lineHeight: 1.5, margin: 0 }}>
                      {lvl.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )

      /* ── Step 4: Target Role ── */
      case 4:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {ROLE_OPTIONS.map(role => {
              const sel = form.target_role === role
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, target_role: role }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '13px 14px',
                    background: sel ? 'rgba(67,97,238,0.08)' : '#111113',
                    border: `1px solid ${sel ? '#4361ee' : '#1e1e22'}`,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = '#2a2a32' }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = '#1e1e22' }}
                >
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    background: sel ? '#4361ee' : '#3f3f46',
                    transition: 'background 0.12s',
                  }} />
                  <span style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '13px', fontWeight: sel ? 500 : 400,
                    color: sel ? '#f4f4f5' : '#a1a1aa',
                    lineHeight: 1.3,
                  }}>
                    {role}
                  </span>
                </button>
              )
            })}
          </div>
        )

      /* ── Step 5: Timeline & Hours ── */
      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Timeline slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', letterSpacing: '0.08em' }}>
                  WEEKS UNTIL JOB-READY
                </label>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '22px', color: '#4361ee', lineHeight: 1 }}>
                  {form.timeline_weeks}
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', fontWeight: 400, marginLeft: '3px' }}>wks</span>
                </span>
              </div>
              <input
                type="range"
                className="axiom-slider"
                min={4}
                max={52}
                step={1}
                value={form.timeline_weeks}
                style={{ '--slider-pct': `${timelinePct}%` }}
                onChange={e => setForm(f => ({ ...f, timeline_weeks: Number(e.target.value) }))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#3f3f46' }}>4 wks</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#3f3f46' }}>52 wks</span>
              </div>
            </div>

            {/* Hours slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', letterSpacing: '0.08em' }}>
                  HOURS PER WEEK YOU CAN COMMIT
                </label>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '22px', color: '#4361ee', lineHeight: 1 }}>
                  {form.hours_per_week}
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', fontWeight: 400, marginLeft: '3px' }}>hrs</span>
                </span>
              </div>
              <input
                type="range"
                className="axiom-slider"
                min={1}
                max={40}
                step={1}
                value={form.hours_per_week}
                style={{ '--slider-pct': `${hoursPct}%` }}
                onChange={e => setForm(f => ({ ...f, hours_per_week: Number(e.target.value) }))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#3f3f46' }}>1 hr</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#3f3f46' }}>40 hrs</span>
              </div>
            </div>
          </div>
        )

      /* ── Step 6: Skills ── */
      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Preset chips */}
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '10px' }}>
                SELECT ALL THAT APPLY
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_SKILLS.map(skill => {
                  const sel = form.current_skills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px',
                        background: sel ? 'rgba(67,97,238,0.1)' : '#111113',
                        border: `1px solid ${sel ? '#4361ee' : '#1e1e22'}`,
                        color: sel ? '#4361ee' : '#71717a',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: '12px', fontWeight: sel ? 500 : 400,
                        cursor: 'pointer', transition: 'all 0.1s',
                      }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = '#2a2a32' }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = '#1e1e22' }}
                    >
                      {sel && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom skills display */}
            {form.current_skills.filter(s => !PRESET_SKILLS.includes(s)).length > 0 && (
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  CUSTOM SKILLS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {form.current_skills.filter(s => !PRESET_SKILLS.includes(s)).map(skill => (
                    <span
                      key={skill}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 8px',
                        fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px',
                        color: '#f4a400',
                        background: 'rgba(244,164,0,0.08)',
                        border: '1px solid rgba(244,164,0,0.25)',
                      }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#71717a', display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom skill input */}
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '8px' }}>
                ADD CUSTOM SKILL
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addCustomSkill() }
                    if (e.key === 'Backspace' && skillInput === '' && form.current_skills.length > 0) {
                      removeSkill(form.current_skills[form.current_skills.length - 1])
                    }
                  }}
                  placeholder="e.g. Rust, GraphQL, Docker..."
                  style={{
                    flex: 1, padding: '8px 12px',
                    background: '#111113', border: '1px solid #1e1e22',
                    color: '#f4f4f5', fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '12px', outline: 'none', transition: 'border-color 0.12s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(67,97,238,0.5)' }}
                  onBlur={e => { e.target.style.borderColor = '#1e1e22' }}
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  disabled={!skillInput.trim()}
                  style={{
                    padding: '8px 14px',
                    background: skillInput.trim() ? '#4361ee' : '#111113',
                    border: `1px solid ${skillInput.trim() ? '#4361ee' : '#1e1e22'}`,
                    color: skillInput.trim() ? '#fff' : '#52525b',
                    fontFamily: "'Space Mono', monospace", fontSize: '11px',
                    cursor: skillInput.trim() ? 'pointer' : 'default',
                    transition: 'all 0.12s', letterSpacing: '0.04em',
                  }}
                >
                  ADD
                </button>
              </div>
            </div>

            {form.current_skills.length > 0 && (
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>
                {form.current_skills.length} skill{form.current_skills.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        )

      default: return null
    }
  }

  /* ── launching overlay ── */

  if (launching) {
    return (
      <div style={{
        minHeight: '100vh', background: '#09090b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="axiom-grid" />
        <style>{`@keyframes axiom-setup-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ color: '#4361ee' }}>
            <Spinner size={32} />
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#4361ee', letterSpacing: '0.12em', textAlign: 'center' }}>
            Building your roadmap...
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#52525b' }}>
            This may take a moment
          </div>
        </div>
      </div>
    )
  }

  /* ── main render ── */

  const isLast = step === TOTAL - 1

  return (
    <div style={{
      minHeight: '100vh', background: '#09090b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative', overflow: 'hidden',
    }}>
      <div className="axiom-grid" />

      <style>{`
        @keyframes axiom-setup-spin { to { transform: rotate(360deg); } }
        @keyframes axiom-slide-right {
          from { transform: translateX(52px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes axiom-slide-left {
          from { transform: translateX(-52px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px' }}>

        {/* Logo mark */}
        <div
          className="animate-in stagger-1"
          style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '24px', justifyContent: 'center' }}
        >
          <div style={{
            width: '28px', height: '28px', background: '#4361ee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: '#fff',
          }}>A</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: '20px', color: '#f4f4f5', letterSpacing: '-0.01em' }}>
            Axiom
          </span>
        </div>

        {/* Card */}
        <div
          className="glass-card bracket-corner animate-in stagger-2"
          style={{
            background: '#09090b',
            border: '1px solid #1e1e22',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Progress bar */}
          <div style={{ height: '3px', background: '#1e1e22', flexShrink: 0 }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: '#4361ee',
              transition: 'width 0.35s ease',
            }} />
          </div>

          {/* Header */}
          <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
            {/* Step label */}
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '9px', letterSpacing: '0.14em',
              color: '#4361ee', marginBottom: '8px',
            }}>
              STEP {step + 1} OF {TOTAL} — {STEP_META[step].label}
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700, fontSize: '22px',
              color: '#f4f4f5', margin: 0, lineHeight: 1.2,
            }}>
              {STEP_TITLES[step]}
            </h2>

            {/* Step segment bar */}
            <div style={{ display: 'flex', gap: '5px', marginTop: '16px', marginBottom: '4px' }}>
              {STEP_META.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '2px', flex: 1,
                    background: i <= step ? '#4361ee' : '#1e1e22',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Step content — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            <div
              key={step}
              style={{
                animation: `${direction > 0 ? 'axiom-slide-right' : 'axiom-slide-left'} 0.28s ease forwards`,
              }}
            >
              {renderStep()}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 28px',
            borderTop: '1px solid #1e1e22',
            display: 'flex', alignItems: 'center',
            gap: '10px', flexShrink: 0,
            background: '#09090b',
          }}>
            {/* Back button — ghost style, left side */}
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                style={{
                  padding: '10px 18px', flexShrink: 0,
                  background: 'transparent',
                  border: '1px solid #1e1e22',
                  color: '#71717a',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '11px', letterSpacing: '0.04em',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#71717a' }}
              >
                ← BACK
              </button>
            ) : (
              <div style={{ width: '80px', flexShrink: 0 }} />
            )}

            {/* Next / Launch button — solid, fills remaining space */}
            <button
              type="button"
              disabled={!canProceed()}
              onClick={isLast ? handleLaunch : goNext}
              style={{
                flex: 1,
                padding: '11px',
                background: canProceed() ? '#4361ee' : '#111113',
                border: `1px solid ${canProceed() ? '#4361ee' : '#1e1e22'}`,
                color: canProceed() ? '#fff' : '#52525b',
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px', letterSpacing: '0.06em',
                fontWeight: 600,
                cursor: canProceed() ? 'pointer' : 'default',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (canProceed()) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {isLast ? 'Launch Axiom →' : 'NEXT →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
