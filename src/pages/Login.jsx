import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#4361ee', letterSpacing: '0.12em' }}>
        LOADING...
      </div>
    )
  }

  if (user) return <Navigate to="/news" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    const { data } = await supabase.auth.signUp({ email, password })
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        name: name.trim(),
        created_at: new Date().toISOString(),
      })
      navigate('/setup')
    }
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
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', color: '#f4f4f5', marginBottom: '20px' }}>
            Create your account
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <Field label="Full Name">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required />
            </Field>

            <Field label="Email">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required />
            </Field>

            <Field label="Password">
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>

            <button
              type="submit"
              style={{
                padding: '11px',
                background: '#4361ee',
                border: 'none',
                color: '#fff',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'opacity 0.12s',
                marginTop: '4px',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Create Account →
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
