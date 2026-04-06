import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import StepExperience from './steps/StepExperience'
import StepTargetRole from './steps/StepTargetRole'
import StepTimeline from './steps/StepTimeline'
import StepSkills from './steps/StepSkills'

// Placeholder hooks — wire up real implementations when ready
function generateRoadmap(userId, careerProfile) {
  console.log('[Axiom] generateRoadmap called', { userId, careerProfile })
}

function recalibrateRoadmap(userId, careerProfile) {
  console.log('[Axiom] recalibrateRoadmap called', { userId, careerProfile })
}

const STEPS = [
  { id: 'experience',  label: 'Experience' },
  { id: 'role',        label: 'Target Role' },
  { id: 'timeline',    label: 'Timeline' },
  { id: 'skills',      label: 'Skills' },
]

const DEFAULT_FORM = {
  level: '',
  target_role: '',
  timeline_weeks: 12,
  hours_per_week: 15,
  current_skills: [],
}

function buildInitialForm(initialData) {
  if (!initialData) return { ...DEFAULT_FORM }
  return {
    level: initialData.level || '',
    target_role: initialData.target_role || '',
    timeline_weeks: initialData.timeline_weeks || 12,
    hours_per_week: initialData.hours_per_week || 15,
    current_skills: initialData.current_skills || [],
  }
}

export default function OnboardingModal({ isEditMode = false, initialData = null, onClose, onSuccess }) {
  const { user, refreshCareerProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(() => buildInitialForm(initialData))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Re-sync form when initialData changes (e.g. opening edit mode again)
  useEffect(() => {
    setForm(buildInitialForm(initialData))
    setStep(0)
    setError('')
  }, [initialData])

  // Dismiss on Escape in edit mode
  const handleKeyDown = useCallback((e) => {
    if (isEditMode && e.key === 'Escape') onClose?.()
  }, [isEditMode, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function canProceed() {
    if (step === 0) return !!form.level
    if (step === 1) return !!form.target_role
    if (step === 2) return form.timeline_weeks > 0 && form.hours_per_week >= 5
    if (step === 3) return form.current_skills.length > 0
    return false
  }

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    setError('')

    const payload = {
      user_id: user.id,
      level: form.level,
      target_role: form.target_role,
      timeline_weeks: form.timeline_weeks,
      hours_per_week: form.hours_per_week,
      current_skills: form.current_skills,
    }

    const { error: dbErr } = isEditMode
      ? await supabase.from('user_profiles').upsert(payload, { onConflict: 'user_id' })
      : await supabase.from('user_profiles').insert(payload)

    if (dbErr) {
      setError(dbErr.message)
      setSubmitting(false)
      return
    }

    await refreshCareerProfile()

    if (isEditMode) {
      recalibrateRoadmap(user.id, payload)
    } else {
      generateRoadmap(user.id, payload)
    }

    setSubmitting(false)
    onSuccess?.()
    onClose?.()
  }

  // Backdrop click: dismiss only in edit mode
  function handleBackdropClick(e) {
    if (isEditMode && e.target === e.currentTarget) onClose?.()
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9,9,11,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="modal-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#09090b',
          border: '1px solid #1e1e22',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: '3px', background: '#1e1e22', flexShrink: 0 }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: '#4361ee',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee', letterSpacing: '0.12em', marginBottom: '6px' }}>
                STEP {step + 1} OF {STEPS.length} — {STEPS[step].label.toUpperCase()}
              </div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f4f4f5', margin: 0, lineHeight: 1.2 }}>
                {step === 0 && 'What\'s your experience level?'}
                {step === 1 && 'What role are you targeting?'}
                {step === 2 && 'Set your timeline & availability'}
                {step === 3 && 'What skills do you already have?'}
              </h2>
              <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a', marginTop: '6px', marginBottom: 0 }}>
                {step === 0 && 'Be honest — this shapes your entire study plan.'}
                {step === 1 && 'Axiom will tailor content to your career path.'}
                {step === 2 && 'Realistic goals produce better outcomes.'}
                {step === 3 && 'We\'ll skip what you know and focus on the gaps.'}
              </p>
            </div>
            {isEditMode && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  flexShrink: 0,
                  marginLeft: '16px',
                  width: '28px', height: '28px',
                  background: 'transparent',
                  border: '1px solid #1e1e22',
                  cursor: 'pointer',
                  color: '#52525b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#52525b' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '16px', marginBottom: '4px' }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{
                height: '2px',
                flex: 1,
                background: i <= step ? '#4361ee' : '#1e1e22',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        </div>

        {/* Step content — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {step === 0 && (
            <StepExperience
              value={form.level}
              onChange={(v) => setForm((f) => ({ ...f, level: v }))}
            />
          )}
          {step === 1 && (
            <StepTargetRole
              value={form.target_role}
              onChange={(v) => setForm((f) => ({ ...f, target_role: v }))}
            />
          )}
          {step === 2 && (
            <StepTimeline
              timelineWeeks={form.timeline_weeks}
              hoursPerWeek={form.hours_per_week}
              onChange={({ timelineWeeks, hoursPerWeek }) =>
                setForm((f) => ({ ...f, timeline_weeks: timelineWeeks, hours_per_week: hoursPerWeek }))
              }
            />
          )}
          {step === 3 && (
            <StepSkills
              value={form.current_skills}
              onChange={(v) => setForm((f) => ({ ...f, current_skills: v }))}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #1e1e22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: '#09090b',
        }}>
          <div style={{ flex: 1 }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #1e1e22',
                  color: '#71717a',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '11px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#71717a' }}
              >
                ← BACK
              </button>
            )}
          </div>

          {error && (
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#ef4444', marginRight: '12px' }}>
              {error}
            </span>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
              style={{
                padding: '8px 20px',
                background: canProceed() ? '#4361ee' : '#111113',
                border: `1px solid ${canProceed() ? '#4361ee' : '#1e1e22'}`,
                color: canProceed() ? '#fff' : '#52525b',
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                cursor: canProceed() ? 'pointer' : 'default',
                letterSpacing: '0.04em',
                transition: 'all 0.12s',
              }}
            >
              NEXT →
            </button>
          ) : (
            <button
              type="button"
              disabled={!canProceed() || submitting}
              onClick={handleSubmit}
              style={{
                padding: '8px 20px',
                background: canProceed() && !submitting ? '#4361ee' : '#111113',
                border: `1px solid ${canProceed() && !submitting ? '#4361ee' : '#1e1e22'}`,
                color: canProceed() && !submitting ? '#fff' : '#52525b',
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                cursor: canProceed() && !submitting ? 'pointer' : 'default',
                letterSpacing: '0.04em',
                transition: 'all 0.12s',
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
              }}
            >
              {submitting ? (
                <>
                  <Spinner />
                  SAVING...
                </>
              ) : (
                isEditMode ? 'SAVE CHANGES' : 'BUILD ROADMAP →'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      width="12" height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}
