import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { label: 'News Feed', desc: 'Real-time CS & tech industry news', color: '#4361ee' },
  { label: 'Roadmap', desc: 'AI-personalized learning path', color: '#7b8ff7' },
  { label: 'Resume Review', desc: 'CS-specific feedback & scoring', color: '#f4a400' },
  { label: 'Interview Prep', desc: 'Patterns, questions, system design', color: '#22c55e' },
  { label: 'Opportunities', desc: 'Internships, hackathons, fellowships', color: '#4361ee' },
]

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']
const TARGET_ROLES = [
  'Software Engineer',
  'ML / AI Engineer',
  'Data Scientist',
  'DevOps / SRE',
  'Security Engineer',
  'Product Engineer',
  'Embedded / Systems',
]
const STACKS = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'C++', 'Go', 'Rust', 'C#', 'Swift', 'Kotlin']

const TERMINAL_LINES = [
  '> initializing axiom_os v2.4...',
  '> loading career modules [■■■■■■■■░░] 82%',
  '> syncing industry data feeds...',
  '> ai orchestrator: READY',
  '> welcome back, engineer.',
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tab, setTab] = useState('login')
  const [terminalLine, setTerminalLine] = useState(0)

  // login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // signup state
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    year: '',
    targetRole: '',
    gpa: '',
    techStack: [],
  })
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/news', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    if (terminalLine >= TERMINAL_LINES.length) return
    const t = setTimeout(() => setTerminalLine(l => l + 1), 600)
    return () => clearTimeout(t)
  }, [terminalLine])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) setLoginError(error.message)
    setLoginLoading(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setSignupError('')
    if (!form.year || !form.targetRole) {
      setSignupError('Please complete all required fields.')
      return
    }
    setSignupLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    })

    if (error) {
      setSignupError(error.message)
      setSignupLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.fullName,
        year: form.year,
        target_role: form.targetRole,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        tech_stack: form.techStack,
      })
    }

    setSignupLoading(false)
  }

  function toggleStack(s) {
    setForm(f => ({
      ...f,
      techStack: f.techStack.includes(s)
        ? f.techStack.filter(x => x !== s)
        : [...f.techStack, s],
    }))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'stretch',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid bg */}
      <div className="axiom-grid" />

      {/* Glow orbs */}
      <div style={{
        position: 'fixed', top: '15%', left: '10%',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(67,97,238,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', right: '5%',
        width: '300px', height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,164,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* LEFT — Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px 60px 64px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #4361ee, #7b8ff7)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '800', color: '#fff',
            fontFamily: 'Syne, sans-serif',
            boxShadow: '0 0 24px rgba(67,97,238,0.5)',
          }}>A</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: '#fff', letterSpacing: '-0.02em' }}>
            AXIOM
          </span>
          <span style={{
            fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee',
            background: 'rgba(67,97,238,0.1)', border: '1px solid rgba(67,97,238,0.3)',
            padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.1em',
          }}>v2.4</span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontFamily: 'Space Mono, monospace', fontSize: '11px',
            color: '#4361ee', letterSpacing: '0.2em', marginBottom: '16px',
            textTransform: 'uppercase',
          }}>
            [ CS_CAREER_OS ]
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(32px, 3.5vw, 52px)',
            lineHeight: 1.1,
            color: '#fff',
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}>
            Your CS Career,<br />
            <span style={{ color: '#4361ee' }}>Operating</span> System.
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            color: '#64748b',
            lineHeight: 1.7,
            maxWidth: '420px',
          }}>
            One platform for news, personalized roadmaps, resume review,
            interview prep, and opportunities — built for CS students,
            powered by agentic AI.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
          {FEATURES.map((f, i) => (
            <div key={f.label} className={`animate-in stagger-${i + 1}`} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: f.color,
                boxShadow: `0 0 8px ${f.color}`,
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '13px', color: '#e2e8f0' }}>
                {f.label}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748b' }}>
                — {f.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Terminal */}
        <div style={{
          background: 'rgba(10,10,15,0.8)',
          border: '1px solid rgba(67,97,238,0.2)',
          borderRadius: '10px',
          padding: '16px 20px',
          maxWidth: '400px',
          fontFamily: 'Space Mono, monospace',
          fontSize: '11px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: '-1px', left: '-1px', right: '-1px', bottom: '-1px',
            borderRadius: '10px',
            pointerEvents: 'none',
          }} className="bracket-corner" />
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {['#ef4444', '#f4a400', '#22c55e'].map(c => (
              <div key={c} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          {TERMINAL_LINES.slice(0, terminalLine).map((line, i) => (
            <div key={i} style={{
              color: i === terminalLine - 1 ? '#e2e8f0' : '#64748b',
              marginBottom: '4px',
              transition: 'color 0.3s',
            }}>
              {line}
              {i === terminalLine - 1 && terminalLine < TERMINAL_LINES.length && (
                <span style={{ animation: 'pulseDot 1s infinite', display: 'inline-block', marginLeft: '2px', color: '#4361ee' }}>█</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{
        width: '1px',
        background: 'linear-gradient(to bottom, transparent, rgba(67,97,238,0.2) 20%, rgba(67,97,238,0.2) 80%, transparent)',
        flexShrink: 0,
        alignSelf: 'stretch',
        zIndex: 1,
      }} />

      {/* RIGHT — Auth card */}
      <div style={{
        width: '460px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 48px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(18,18,31,0.8)',
            border: '1px solid rgba(67,97,238,0.15)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '28px',
          }}>
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  background: tab === t ? 'rgba(67,97,238,0.2)' : 'transparent',
                  color: tab === t ? '#fff' : '#64748b',
                  boxShadow: tab === t ? '0 0 16px rgba(67,97,238,0.15) inset' : 'none',
                  borderLeft: tab === t ? '1px solid rgba(67,97,238,0.4)' : '1px solid transparent',
                }}
              >
                {t === 'login' ? '[ LOGIN ]' : '[ SIGN UP ]'}
              </button>
            ))}
          </div>

          {/* Auth form card */}
          <div style={{
            background: 'rgba(15,15,26,0.9)',
            border: '1px solid rgba(67,97,238,0.18)',
            borderRadius: '14px',
            padding: '32px',
            backdropFilter: 'blur(20px)',
            position: 'relative',
          }} className="bracket-corner">

            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    fontSize: '20px', color: '#fff', marginBottom: '6px',
                  }}>Welcome back.</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#4361ee', letterSpacing: '0.1em' }}>
                    AUTH_MODULE :: LOGIN
                  </div>
                </div>

                <Field label="EMAIL" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" placeholder="you@university.edu" />
                <Field label="PASSWORD" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} type="password" placeholder="••••••••••" />

                {loginError && <ErrorMsg msg={loginError} />}

                <SubmitBtn loading={loginLoading} label="ENTER AXIOM →" />

                <div style={{ textAlign: 'center', marginTop: '20px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748b' }}>
                  No account?{' '}
                  <button type="button" onClick={() => setTab('signup')} style={{
                    background: 'none', border: 'none', color: '#4361ee',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
                  }}>Sign up →</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    fontSize: '20px', color: '#fff', marginBottom: '6px',
                  }}>Create your profile.</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#4361ee', letterSpacing: '0.1em' }}>
                    AUTH_MODULE :: REGISTER
                  </div>
                </div>

                {/* Identity */}
                <SectionLabel label="IDENTITY" />
                <Field label="FULL NAME" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Jane Smith" required />
                <Field label="EMAIL" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="you@university.edu" required />
                <Field label="PASSWORD" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="password" placeholder="min. 8 characters" required />

                {/* Academic */}
                <SectionLabel label="ACADEMIC" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <SelectField
                    label="YEAR"
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    options={YEARS}
                    required
                  />
                  <Field
                    label="GPA"
                    value={form.gpa}
                    onChange={e => setForm(f => ({ ...f, gpa: e.target.value }))}
                    type="number"
                    placeholder="3.8"
                    min="0" max="4" step="0.01"
                  />
                </div>
                <SelectField
                  label="TARGET ROLE"
                  value={form.targetRole}
                  onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}
                  options={TARGET_ROLES}
                  required
                />

                {/* Stack */}
                <SectionLabel label="TECH STACK" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                  {STACKS.map(s => {
                    const active = form.techStack.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleStack(s)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${active ? '#4361ee' : 'rgba(67,97,238,0.2)'}`,
                          background: active ? 'rgba(67,97,238,0.15)' : 'transparent',
                          color: active ? '#fff' : '#64748b',
                          fontFamily: 'Space Mono, monospace',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: active ? '0 0 10px rgba(67,97,238,0.2)' : 'none',
                        }}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>

                {signupError && <ErrorMsg msg={signupError} />}

                <SubmitBtn loading={signupLoading} label="CREATE ACCOUNT →" />

                <div style={{ textAlign: 'center', marginTop: '20px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748b' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')} style={{
                    background: 'none', border: 'none', color: '#4361ee',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
                  }}>Login →</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required, min, max, step }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontFamily: 'Space Mono, monospace',
        fontSize: '10px',
        color: '#4361ee',
        letterSpacing: '0.15em',
        marginBottom: '6px',
      }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min} max={max} step={step}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(30,30,53,0.6)',
          border: '1px solid rgba(67,97,238,0.2)',
          borderRadius: '8px',
          color: '#e2e8f0',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          outline: 'none',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(67,97,238,0.6)' }}
        onBlur={e => { e.target.style.borderColor = 'rgba(67,97,238,0.2)' }}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontFamily: 'Space Mono, monospace',
        fontSize: '10px',
        color: '#4361ee',
        letterSpacing: '0.15em',
        marginBottom: '6px',
      }}>{label}</label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(30,30,53,0.6)',
          border: '1px solid rgba(67,97,238,0.2)',
          borderRadius: '8px',
          color: value ? '#e2e8f0' : '#64748b',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          boxSizing: 'border-box',
        }}
      >
        <option value="" disabled>Select...</option>
        {options.map(o => <option key={o} value={o} style={{ background: '#0f0f1a' }}>{o}</option>)}
      </select>
    </div>
  )
}

function SectionLabel({ label }) {
  return (
    <div style={{
      fontFamily: 'Space Mono, monospace',
      fontSize: '9px',
      color: '#64748b',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      marginBottom: '12px',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(67,97,238,0.15)' }} />
    </div>
  )
}

function ErrorMsg({ msg }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '8px',
      padding: '10px 14px',
      marginBottom: '16px',
      fontFamily: 'Space Mono, monospace',
      fontSize: '11px',
      color: '#ef4444',
    }}>
      {msg}
    </div>
  )
}

function SubmitBtn({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%',
        padding: '12px',
        background: loading ? 'rgba(67,97,238,0.3)' : 'rgba(67,97,238,0.9)',
        border: '1px solid rgba(67,97,238,0.5)',
        borderRadius: '8px',
        color: '#fff',
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '13px',
        letterSpacing: '0.08em',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: loading ? 'none' : '0 0 20px rgba(67,97,238,0.3)',
      }}
      onMouseEnter={e => { if (!loading) e.target.style.background = '#4361ee' }}
      onMouseLeave={e => { if (!loading) e.target.style.background = 'rgba(67,97,238,0.9)' }}
    >
      {loading ? 'PROCESSING...' : label}
    </button>
  )
}
