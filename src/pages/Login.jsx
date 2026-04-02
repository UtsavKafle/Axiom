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
      <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase' }}>
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
        background: 'rgba(10,10,15,0.8)',
        border: `1px solid ${focused ? 'rgba(67,97,238,0.55)' : 'rgba(67,97,238,0.18)'}`,
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#e2e8f0',
        fontFamily: 'Inter, sans-serif',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.18s',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function Pill({ label, active, onClick, accent = 'blue' }) {
  const on = active
    ? accent === 'amber'
      ? { background: 'rgba(244,164,0,0.12)', color: '#f4a400', border: '1px solid rgba(244,164,0,0.35)' }
      : { background: 'rgba(67,97,238,0.15)', color: '#7b8ff7', border: '1px solid rgba(67,97,238,0.4)' }
    : { background: 'transparent', color: '#475569', border: '1px solid rgba(30,30,53,0.9)' }
  return (
    <button type="button" onClick={onClick} style={{
      ...on,
      padding: '5px 12px',
      borderRadius: '6px',
      fontFamily: 'Space Mono, monospace',
      fontSize: '10px',
      letterSpacing: '0.04em',
      cursor: 'pointer',
      transition: 'all 0.15s',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#4361ee', letterSpacing: '0.12em' }}>
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
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <div className="axiom-grid" />

      {/* Glow */}
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,97,238,0.07) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div className="animate-in stagger-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', gap: '10px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #4361ee, #7b8ff7)',
            boxShadow: '0 0 28px rgba(67,97,238,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '18px', color: '#fff',
          }}>A</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '22px', color: '#fff', letterSpacing: '-0.02em' }}>Axiom</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee', letterSpacing: '0.14em', marginTop: '3px' }}>CS_CAREER_OS v2.4</div>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card bracket-corner animate-in stagger-2" style={{ padding: '28px' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(30,30,53,0.9)', borderRadius: '8px', padding: '3px', marginBottom: '24px' }}>
            {['login', 'signup'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => switchMode(tab)}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '6px',
                  background: mode === tab ? 'rgba(67,97,238,0.15)' : 'transparent',
                  border: mode === tab ? '1px solid rgba(67,97,238,0.3)' : '1px solid transparent',
                  color: mode === tab ? '#e2e8f0' : '#475569',
                  fontFamily: 'Space Mono, monospace', fontSize: '11px',
                  fontWeight: mode === tab ? '600' : '400',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  boxShadow: mode === tab ? '0 0 10px rgba(67,97,238,0.18)' : 'none',
                }}
              >
                {tab === 'login' ? 'SIGN_IN' : 'SIGN_UP'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {YEARS.map(y => <Pill key={y} label={y} active={year === y} onClick={() => setYear(y)} />)}
                </div>
              </Field>
            )}

            {mode === 'signup' && (
              <Field label="Career Goal">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {GOALS.map(g => <Pill key={g} label={g} active={goal === g} onClick={() => setGoal(g)} accent="amber" />)}
                </div>
              </Field>
            )}

            {mode === 'signup' && (
              <Field label="Interests">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {INTERESTS.map(item => <Pill key={item} label={item} active={interests.includes(item)} onClick={() => toggleInterest(item)} />)}
                </div>
              </Field>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#f87171' }}>
                ERR: {error}
              </div>
            )}

            {info && (
              <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#4ade80' }}>
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px',
                background: submitting ? 'rgba(67,97,238,0.25)' : 'linear-gradient(135deg, #4361ee 0%, #6b7ff7 100%)',
                border: 'none',
                borderRadius: '8px',
                color: submitting ? '#64748b' : '#fff',
                fontFamily: 'Syne, sans-serif',
                fontWeight: '700',
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 0 24px rgba(67,97,238,0.4)',
                transition: 'all 0.2s',
                marginTop: '4px',
              }}
            >
              {submitting ? 'Processing...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>

          </form>
        </div>

        <div className="animate-in stagger-3" style={{ textAlign: 'center', marginTop: '20px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#1e1e35' }}>
          // AXIOM — built for CS students
        </div>

      </div>
    </div>
  )
}
