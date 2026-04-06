import React from 'react'

const TIMELINE_OPTIONS = [
  { value: 4,  label: '4 weeks',  sub: 'Intense sprint' },
  { value: 8,  label: '8 weeks',  sub: 'Focused effort' },
  { value: 12, label: '12 weeks', sub: 'Balanced pace' },
  { value: 16, label: '16 weeks', sub: 'Steady progress' },
  { value: 24, label: '24 weeks', sub: 'Long-term build' },
]

export default function StepTimeline({ timelineWeeks, hoursPerWeek, onChange }) {
  const sliderPct = ((hoursPerWeek - 5) / (40 - 5)) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Timeline dropdown */}
      <div>
        <label style={{
          display: 'block',
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px',
          color: '#71717a',
          letterSpacing: '0.08em',
          marginBottom: '8px',
        }}>
          WHEN DO YOU WANT TO BE JOB-READY?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {TIMELINE_OPTIONS.map((opt) => {
            const sel = timelineWeeks === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ timelineWeeks: opt.value, hoursPerWeek })}
                style={{
                  padding: '10px 6px',
                  background: sel ? 'rgba(67,97,238,0.08)' : '#111113',
                  border: `1px solid ${sel ? '#4361ee' : '#1e1e22'}`,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = '#2a2a32' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = '#1e1e22' }}
              >
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '13px', color: sel ? '#f4f4f5' : '#a1a1aa', marginBottom: '2px' }}>
                  {opt.label}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: sel ? '#4361ee' : '#52525b', letterSpacing: '0.04em' }}>
                  {opt.sub}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Hours slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <label style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            color: '#71717a',
            letterSpacing: '0.08em',
          }}>
            HOURS PER WEEK YOU CAN COMMIT
          </label>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '20px',
            color: '#4361ee',
            lineHeight: 1,
          }}>
            {hoursPerWeek}
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', fontWeight: 400, marginLeft: '3px' }}>hrs</span>
          </span>
        </div>
        <input
          type="range"
          className="axiom-slider"
          min={5}
          max={40}
          step={1}
          value={hoursPerWeek}
          style={{ '--slider-pct': `${sliderPct}%` }}
          onChange={(e) => onChange({ timelineWeeks, hoursPerWeek: Number(e.target.value) })}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#3f3f46' }}>5 hrs</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#3f3f46' }}>40 hrs</span>
        </div>
      </div>
    </div>
  )
}
