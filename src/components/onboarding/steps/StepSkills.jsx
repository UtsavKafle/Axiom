import React, { useState } from 'react'

const PRESET_SKILLS = [
  'Python', 'Java', 'JavaScript', 'C++', 'React', 'SQL',
  'Git', 'Data Structures', 'Algorithms', 'System Design',
  'TypeScript', 'Node.js',
]

export default function StepSkills({ value, onChange }) {
  const [input, setInput] = useState('')

  function togglePreset(skill) {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill))
    } else {
      onChange([...value, skill])
    }
  }

  function addCustom() {
    const trimmed = input.trim()
    if (!trimmed || value.includes(trimmed)) { setInput(''); return }
    onChange([...value, trimmed])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addCustom() }
    if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function removeSkill(skill) {
    onChange(value.filter((s) => s !== skill))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Preset chips */}
      <div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '10px' }}>
          SELECT ALL THAT APPLY
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {PRESET_SKILLS.map((skill) => {
            const sel = value.includes(skill)
            return (
              <button
                key={skill}
                type="button"
                onClick={() => togglePreset(skill)}
                style={{
                  padding: '5px 10px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: sel ? 500 : 400,
                  color: sel ? '#4361ee' : '#71717a',
                  background: sel ? 'rgba(67,97,238,0.1)' : '#111113',
                  border: `1px solid ${sel ? '#4361ee' : '#1e1e22'}`,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = '#2a2a32' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = '#1e1e22' }}
              >
                {skill}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected custom skills */}
      {value.filter((s) => !PRESET_SKILLS.includes(s)).length > 0 && (
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '8px' }}>
            CUSTOM SKILLS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {value.filter((s) => !PRESET_SKILLS.includes(s)).map((skill) => (
              <span
                key={skill}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 8px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '12px',
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
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Rust, GraphQL, Docker..."
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#111113',
              border: '1px solid #1e1e22',
              color: '#f4f4f5',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '12px',
              outline: 'none',
              transition: 'border-color 0.12s',
            }}
            onFocus={e => { e.target.style.borderColor = '#4361ee' }}
            onBlur={e => { e.target.style.borderColor = '#1e1e22' }}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!input.trim()}
            style={{
              padding: '8px 14px',
              background: input.trim() ? '#4361ee' : '#111113',
              border: `1px solid ${input.trim() ? '#4361ee' : '#1e1e22'}`,
              color: input.trim() ? '#fff' : '#52525b',
              fontFamily: "'Space Mono', monospace",
              fontSize: '11px',
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.12s',
              letterSpacing: '0.04em',
            }}
          >
            ADD
          </button>
        </div>
      </div>

      {/* Count badge */}
      {value.length > 0 && (
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>
          {value.length} skill{value.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
