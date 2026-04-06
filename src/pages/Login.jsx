import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']
const GOALS = ['Big Tech', 'Startup', 'Research / PhD', 'Government', 'Consulting']
const INTERESTS = ['AI / ML', 'Web Dev', 'Mobile', 'Systems', 'Data Science', 'Security', 'Cloud / DevOps', 'Algorithms']

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', color: '#52525b', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ type = 'text', value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={{
        background: '#09090b',
        border: `1px solid ${focused ? 'rgba(67,97,238,0.5)' : '#2a2a32'}`,
        padding: '9px 12px',
        fontSize: '13px',
        color: '#f4f4f5',
        fontFamily: "'IBM Plex Sans', sans-serif",
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.12s',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function Pill({ label, active, onClick, accent = 'blue' }) {
  const on = active
    ? accent === 'amber'
      ? { background: 'rgba(244,164,0,0.1)', color: '#f4a400', border: '1px solid rgba(244,164,0,0.3)' }
      : { background: 'rgba(67,97,238,0.12)', color: '#6b83f0', border: '1px solid rgba(67,97,238,0.3)' }
    : { background: 'transparent', color: '#52525b', border: '1px solid #1e1e22' }
  return (
    <button type="button" onClick={onClick} style={{
      ...on,
      padding: '4px 10px',
      fontFamily: "'Space Mono', monospace",
      fontSize: '10px',
      cursor: 'pointer',
      transition: 'all 0.1s',
    }}>
      {label}
    </button>
  )
}

export default function Login() {
  const { user, loading, refreshProfile } = useAuth()
  const [mode, setMode] = useState('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [goal, setGoal] = useState('')
  const [interests, setInterests] = useState([])

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#4361ee', letterSpacing: '0.12em' }}>
        LOADING...
      </div>
    )
  }

  if (user) return <Navigate to="/news" replace />

  function toggleInterest(item) {
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
  }

  function switchMode(tab) {
    setMode(tab)
    setError('')
    setInfo('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
    } else {
      if (!year) { setError('Please select your year.'); setSubmitting(false); return }
      if (!goal) { setError('Please select your career goal.'); setSubmitting(false); return }
      if (interests.length === 0) { setError('Select at least one interest.'); setSubmitting(false); return }

      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) {
        setError(err.message)
      } else if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: name.trim(),
          year,
          goal,
          interests: interests.join(', '),
        })
        if (data.session) {
          await refreshProfile(data.user.id)
        } else {
          setInfo('Account created! Check your email to confirm, then sign in.')
          setMode('login')
          setPassword('')
        }
      }
    }

    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <div className="axiom-grid" />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px' }}>

        {/* Logo */}
        <div className="animate-in stagger-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', gap: '8px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: '#4361ee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '700', fontSize: '16px', color: '#fff',
          }}>A</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: '24px', color: '#f4f4f5', letterSpacing: '-0.01em' }}>Axiom</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee', letterSpacing: '0.14em', marginTop: '2px' }}>CS_CAREER_OS v2.4</div>
          </div>
        </div>

        {/* Card */}
        <div className="animate-in stagger-2" style={{
          background: '#111113',
          border: '1px solid #1e1e22',
          padding: '24px',
        }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: '#09090b', border: '1px solid #1e1e22', padding: '3px', marginBottom: '20px' }}>
            {['login', 'signup'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => switchMode(tab)}
                style={{
                  flex: 1, padding: '7px',
                  background: mode === tab ? 'rgba(67,97,238,0.12)' : 'transparent',
                  border: mode === tab ? '1px solid rgba(67,97,238,0.25)' : '1px solid transparent',
                  color: mode === tab ? '#f4f4f5' : '#52525b',
                  fontFamily: "'Space Mono', monospace", fontSize: '10px',
                  fontWeight: mode === tab ? '700' : '400',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
              >
                {tab === 'login' ? 'SIGN_IN' : 'SIGN_UP'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {mode === 'signup' && (
              <Field label="Full Name">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required />
              </Field>
            )}

            <Field label="Email">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required />
            </Field>

            <Field label="Password">
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>

            {mode === 'signup' && (
              <Field label="Year">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {YEARS.map(y => <Pill key={y} label={y} active={year === y} onClick={() => setYear(y)} />)}
                </div>
              </Field>
            )}

            {mode === 'signup' && (
              <Field label="Career Goal">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {GOALS.map(g => <Pill key={g} label={g} active={goal === g} onClick={() => setGoal(g)} accent="amber" />)}
                </div>
              </Field>
            )}

            {mode === 'signup' && (
              <Field label="Interests">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {INTERESTS.map(item => <Pill key={item} label={item} active={interests.includes(item)} onClick={() => toggleInterest(item)} />)}
                </div>
              </Field>
            )}

            {error && (
              <div style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '2px solid #ef4444', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#f87171' }}>
                ERR: {error}
              </div>
            )}

            {info && (
              <div style={{ padding: '9px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderLeft: '2px solid #22c55e', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#4ade80' }}>
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '11px',
                background: submitting ? 'rgba(67,97,238,0.2)' : '#4361ee',
                border: 'none',
                color: submitting ? '#71717a' : '#fff',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: '600',
                fontSize: '13px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.12s',
                marginTop: '4px',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {submitting ? 'Processing...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>

          </form>
        </div>

        <div className="animate-in stagger-3" style={{ textAlign: 'center', marginTop: '16px', fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#2a2a32' }}>
          // AXIOM — built for CS students
        </div>

      </div>
    </div>
  )
}
