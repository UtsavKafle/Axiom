import React, { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

// ── Constants ────────────────────────────────────────────────────────────────

const STARTER_CODE = {
  python:     'def solution(self):\n    pass\n',
  javascript: 'const solution = () => {\n    \n}\n',
  java:       'class Solution {\n    \n}\n',
  cpp:        'class Solution {\npublic:\n    \n};\n',
  go:         'func solution() {\n    \n}\n',
}

const LANG_LABELS = {
  python: 'Python', javascript: 'JavaScript', java: 'Java', cpp: 'C++', go: 'Go',
}

const MONACO_LANG = {
  python: 'python', javascript: 'javascript', java: 'java', cpp: 'cpp', go: 'go',
}

const DIFF_CONFIG = {
  Easy:   { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  Medium: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  Hard:   { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
}

const VERDICT_CONFIG = {
  Optimal:      { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)' },
  Acceptable:   { color: '#4361ee', bg: 'rgba(67,97,238,0.1)',  border: 'rgba(67,97,238,0.25)' },
  'Needs Work': { color: '#f4a400', bg: 'rgba(244,164,0,0.1)', border: 'rgba(244,164,0,0.25)' },
  Incorrect:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
}

const MOCK_FEEDBACK = {
  overall_score: 72,
  verdict: 'Acceptable',
  correctness: {
    score: 85,
    feedback: 'Your logic handles the main case correctly but may fail on empty input arrays.',
  },
  time_complexity: {
    score: 60,
    given: 'O(n²)',
    optimal: 'O(n)',
    feedback: 'A hash map would reduce this to linear time.',
  },
  space_complexity: {
    score: 70,
    given: 'O(1)',
    optimal: 'O(n)',
    feedback: 'Your space usage is good but the optimal solution trades space for time.',
  },
  code_quality: {
    score: 80,
    feedback: 'Clean variable naming and good structure. Consider adding a comment explaining your approach.',
  },
  edge_cases: {
    missed: ['empty array', 'single element', 'all duplicates'],
    feedback: 'Make sure to handle empty and single element inputs before your main logic.',
  },
  improvement: {
    approach: 'Hash Map',
    explanation: 'Using a hash map to store seen values allows you to check for the target in O(1) time instead of a nested loop.',
  },
  encouragement: 'Solid first attempt — you have the right instincts, just optimize the inner loop.',
}

const HINTS = [
  'Think about what data structure would let you look up values in O(1) time.',
  "Consider iterating through the array once and storing what you've seen.",
  'For each element, check if its complement (target − current) already exists in your lookup structure.',
]

const SIMILAR = [
  { title: 'Three Sum',             difficulty: 'Medium' },
  { title: 'Two Sum II – Input Sorted', difficulty: 'Easy' },
  { title: 'Four Sum',              difficulty: 'Hard' },
]

// ── Score gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f4a400' : '#ef4444'

  return (
    <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 10px' }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e1e22" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="square"
          strokeDasharray={`${fill} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.55s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '20px', color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b' }}>/100</div>
      </div>
    </div>
  )
}

// ── Collapsible feedback card ─────────────────────────────────────────────────

function FeedbackCard({ title, score, children, defaultOpen = false, delay = 0 }) {
  const [open, setOpen] = useState(defaultOpen)
  const scoreColor = score != null ? (score >= 80 ? '#22c55e' : score >= 60 ? '#f4a400' : '#ef4444') : null

  return (
    <div
      className="feedback-card-in"
      style={{
        border: '1px solid #1e1e22',
        marginBottom: '6px',
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#111113', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', fontWeight: '500', color: '#f4f4f5' }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {scoreColor && (
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: scoreColor, fontWeight: '700' }}>
              {score}
            </span>
          )}
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#3f3f46' }}>
            {open ? '−' : '+'}
          </span>
        </div>
      </button>
      {open && (
        <div style={{ padding: '8px 10px', background: '#09090b', borderTop: '1px solid #1e1e22' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main PracticePanel ────────────────────────────────────────────────────────

export default function PracticePanel({ question, progressRow, onClose, onMarkComplete, onSaveScore, onOpenQuestion }) {
  const [lang, setLang]                     = useState('python')
  const [code, setCode]                     = useState(STARTER_CODE.python)
  const [consoleLines, setConsoleLines]     = useState(['[ Axiom ] Ready to run your solution...'])
  const [submitting, setSubmitting]         = useState(false)
  const [feedback, setFeedback]             = useState(null)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [hintsRevealed, setHintsRevealed]   = useState(0)
  const consoleRef                          = useRef(null)

  const isComplete   = progressRow?.status === 'completed'
  const canComplete  = feedback !== null && !isComplete && (feedback?.overall_score ?? 0) >= 65
  const diff         = DIFF_CONFIG[question?.difficulty] || DIFF_CONFIG.Medium

  // Escape to close
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [consoleLines])

  function switchLanguage(newLang) {
    const isDefault = code.trim() === STARTER_CODE[lang].trim()
    if (!isDefault && !confirm(`Switch to ${LANG_LABELS[newLang]}? Your current code will be cleared.`)) return
    setLang(newLang)
    setCode(STARTER_CODE[newLang])
  }

  function handleEditorMount(editor, monaco) {
    monaco.editor.defineTheme('axiom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',  foreground: '52525b', fontStyle: 'italic' },
        { token: 'keyword',  foreground: '6b83f0' },
        { token: 'string',   foreground: '4ade80' },
        { token: 'number',   foreground: 'f4a400' },
        { token: 'type',     foreground: '22d3ee' },
        { token: 'function', foreground: 'f4f4f5' },
      ],
      colors: {
        'editor.background':                '#09090b',
        'editor.foreground':                '#f4f4f5',
        'editor.lineHighlightBackground':   '#111113',
        'editor.selectionBackground':       '#4361ee28',
        'editor.inactiveSelectionBackground':'#4361ee14',
        'editorLineNumber.foreground':       '#3f3f46',
        'editorLineNumber.activeForeground': '#71717a',
        'editorCursor.foreground':           '#4361ee',
        'editorIndentGuide.background1':     '#1e1e22',
        'editorIndentGuide.activeBackground1':'#2a2a32',
        'scrollbarSlider.background':        '#2a2a3280',
        'scrollbarSlider.hoverBackground':   '#3f3f46',
        'scrollbarSlider.activeBackground':  '#52525b',
      },
    })
    monaco.editor.setTheme('axiom-dark')
  }

  async function handleSubmit() {
    if (submitting) return

    if (!code.trim()) {
      setConsoleLines(prev => [...prev, '[ Axiom ] Please write some code before submitting.'])
      return
    }

    setSubmitting(true)
    setFeedback(null)
    setFeedbackVisible(false)
    setConsoleLines(prev => [...prev, '[ Axiom ] Analyzing your solution...'])

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_title:      question?.title      ?? '',
          question_topic:      question?.topic      ?? '',
          question_difficulty: question?.difficulty ?? '',
          user_code:           code,
          language:            LANG_LABELS[lang],
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      setFeedback(data)
      onSaveScore?.(question?.id, data.overall_score)
      setConsoleLines(prev => [
        ...prev,
        `[ Axiom ] Review complete.`,
      ])
      setSubmitting(false)
      setTimeout(() => setFeedbackVisible(true), 80)
    } catch (err) {
      setSubmitting(false)
      setConsoleLines(prev => [
        ...prev,
        '[ Axiom ] Error: Could not get feedback. Please try again.',
      ])
    }
  }

  function handleRunCode() {
    setConsoleLines(prev => [...prev, '[ Axiom ] Running test cases...'])
    setTimeout(() => {
      setConsoleLines(prev => [...prev, '[ Axiom ] Test run complete. Click Submit for full analysis.'])
    }, 800)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    // Backdrop — click outside to close
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        overflow: 'hidden',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sliding panel */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          background: '#09090b',
          animation: 'practiceSlideIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: '48px',
          borderBottom: '1px solid #1e1e22',
          background: '#0d0d0f',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: '1px solid #1e1e22',
                color: '#71717a', padding: '4px 10px',
                cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: '11px',
                flexShrink: 0, transition: 'border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.color = '#f4f4f5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#71717a' }}
            >
              ← Back
            </button>
            <span style={{
              fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500',
              fontSize: '13px', color: '#f4f4f5',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {question?.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isComplete && (
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: '10px',
                color: '#22c55e', background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)', padding: '3px 8px',
              }}>
                ✓ Completed
              </span>
            )}
            <button
              onClick={() => canComplete && onMarkComplete(question.id)}
              disabled={!canComplete}
              title={feedback !== null && !isComplete && (feedback?.overall_score ?? 0) < 65 ? 'Score 65 or higher to mark as complete' : undefined}
              style={{
                padding: '6px 14px',
                background: canComplete ? '#22c55e' : 'rgba(34,197,94,0.06)',
                border: canComplete ? 'none' : '1px solid rgba(34,197,94,0.15)',
                color: canComplete ? '#fff' : '#3f3f46',
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '12px',
                cursor: canComplete ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.12s',
              }}
              onMouseEnter={e => { if (canComplete) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Mark as Complete
            </button>
          </div>
        </div>

        {/* ── Three-column body ────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT — Question details (30%) */}
          <div style={{
            width: '30%', flexShrink: 0,
            borderRight: '1px solid #1e1e22',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
            background: '#111113',
          }}>
            <div style={{ padding: '18px 20px' }}>

              {/* Corner bracket header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#2a2a32' }}>[</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#2a2a32' }}>]</span>
              </div>

              {/* Title */}
              <h2 style={{
                fontFamily: "'DM Serif Display', serif", fontWeight: '400',
                fontSize: '18px', color: '#f4f4f5', lineHeight: '1.3',
                marginBottom: '12px',
              }}>
                {question?.title}
              </h2>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {question?.difficulty && (
                  <span style={{
                    padding: '2px 8px',
                    background: diff.bg, color: diff.color,
                    border: `1px solid ${diff.border}`,
                    fontSize: '10px', fontFamily: "'Space Mono', monospace", fontWeight: '700',
                  }}>
                    {question.difficulty}
                  </span>
                )}
                {question?.topic && (
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(67,97,238,0.08)', color: '#6b83f0',
                    border: '1px solid rgba(67,97,238,0.2)',
                    fontSize: '10px', fontFamily: "'Space Mono', monospace",
                  }}>
                    {question.topic}
                  </span>
                )}
                {question?.category && (
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(34,211,238,0.06)', color: '#22d3ee',
                    border: '1px solid rgba(34,211,238,0.15)',
                    fontSize: '10px', fontFamily: "'Space Mono', monospace",
                  }}>
                    {question.category}
                  </span>
                )}
              </div>

              {/* Description */}
              <div style={{
                fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px',
                color: '#a1a1aa', lineHeight: '1.65', marginBottom: '20px',
              }}>
                {question?.description ?? (
                  <span style={{ color: '#52525b', fontStyle: 'italic' }}>
                    Given an array of integers nums and an integer target, return indices of
                    the two numbers such that they add up to target. Each input has exactly
                    one solution, and you may not use the same element twice.
                  </span>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#1e1e22', marginBottom: '18px' }} />

              {/* Hints */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontFamily: "'Space Mono', monospace", fontSize: '10px',
                  color: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: '10px',
                }}>
                  Hints
                  <span style={{
                    background: 'rgba(244,164,0,0.08)', color: '#f4a400',
                    border: '1px solid rgba(244,164,0,0.2)',
                    padding: '1px 6px', fontSize: '9px',
                  }}>
                    {hintsRevealed}/{HINTS.length}
                  </span>
                </div>

                {HINTS.slice(0, hintsRevealed).map((hint, i) => (
                  <div key={i} style={{
                    padding: '8px 10px', marginBottom: '6px',
                    background: 'rgba(244,164,0,0.04)',
                    border: '1px solid rgba(244,164,0,0.15)',
                    borderLeft: '2px solid #f4a400',
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px',
                    color: '#a1a1aa', lineHeight: '1.55',
                  }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace", fontSize: '9px',
                      color: '#f4a400', marginRight: '6px',
                    }}>#{i + 1}</span>
                    {hint}
                  </div>
                ))}

                {hintsRevealed < HINTS.length ? (
                  <button
                    onClick={() => setHintsRevealed(h => h + 1)}
                    style={{
                      width: '100%', padding: '7px',
                      background: 'transparent',
                      border: '1px solid rgba(244,164,0,0.2)',
                      color: '#f4a400',
                      fontFamily: "'Space Mono', monospace", fontSize: '10px',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,164,0,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    Reveal Hint {hintsRevealed + 1} →
                  </button>
                ) : (
                  <div style={{
                    fontFamily: "'Space Mono', monospace", fontSize: '9px',
                    color: '#3f3f46', textAlign: 'center', padding: '4px',
                  }}>
                    // No more hints
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#1e1e22', marginBottom: '18px' }} />

              {/* Similar Questions */}
              <div>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '10px',
                  color: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: '10px',
                }}>
                  Similar Questions
                </div>
                {SIMILAR.map((sq, i) => {
                  const sd = DIFF_CONFIG[sq.difficulty] || DIFF_CONFIG.Medium
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: i < SIMILAR.length - 1 ? '1px solid #1e1e22' : 'none',
                      cursor: 'pointer', transition: 'opacity 0.1s',
                    }}
                      onClick={() => onOpenQuestion?.(sq.title)}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa' }}>
                        {sq.title}
                      </span>
                      <span style={{
                        padding: '1px 6px',
                        background: sd.bg, color: sd.color,
                        border: `1px solid ${sd.border}`,
                        fontSize: '9px', fontFamily: "'Space Mono', monospace",
                        flexShrink: 0, marginLeft: '8px',
                      }}>
                        {sq.difficulty}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* CENTER — Code editor (45%) */}
          <div style={{
            width: '45%', flexShrink: 0,
            borderRight: '1px solid #1e1e22',
            display: 'flex', flexDirection: 'column',
            background: '#09090b', overflow: 'hidden', minHeight: 0,
          }}>
            {/* Editor top bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid #1e1e22',
              background: '#0d0d0f',
              flexShrink: 0,
            }}>
              <select
                value={lang}
                onChange={e => switchLanguage(e.target.value)}
                style={{
                  background: '#111113', border: '1px solid #2a2a32',
                  color: '#a1a1aa', padding: '4px 8px',
                  fontFamily: "'Space Mono', monospace", fontSize: '11px',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                {Object.entries(LANG_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleRunCode}
                  style={{
                    padding: '5px 12px',
                    background: 'transparent',
                    border: '1px solid #4361ee',
                    color: '#6b83f0',
                    fontFamily: "'Space Mono', monospace", fontSize: '10px',
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(67,97,238,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  Run Code
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    padding: '5px 14px',
                    background: submitting ? 'rgba(67,97,238,0.3)' : '#4361ee',
                    border: 'none',
                    color: submitting ? '#71717a' : '#fff',
                    fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.12s',
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  {submitting ? 'Analyzing...' : 'Submit →'}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <Editor
                height="100%"
                language={MONACO_LANG[lang]}
                value={code}
                onChange={val => setCode(val ?? '')}
                onMount={handleEditorMount}
                options={{
                  fontSize: 14,
                  fontFamily: "'Space Mono', monospace",
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 14, bottom: 14 },
                  renderLineHighlight: 'line',
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  folding: false,
                  wordWrap: 'on',
                  tabSize: 4,
                  insertSpaces: true,
                  bracketPairColorization: { enabled: false },
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                }}
              />
            </div>

            {/* Console */}
            <div
              ref={consoleRef}
              style={{
                height: '108px', flexShrink: 0,
                borderTop: '1px solid #1e1e22',
                background: '#09090b',
                overflowY: 'auto',
                padding: '8px 12px',
              }}
            >
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: '9px',
                color: '#2a2a32', marginBottom: '4px', letterSpacing: '0.06em',
              }}>
                // CONSOLE
              </div>
              {consoleLines.map((line, i) => {
                const isError    = line.includes('Error')
                const isSuccess  = line.includes('complete') || line.includes('Score')
                const isAnalyze  = line.includes('Analyzing')
                return (
                  <div key={i} style={{
                    fontFamily: "'Space Mono', monospace", fontSize: '11px',
                    color: isError ? '#f87171' : isSuccess ? '#22c55e' : isAnalyze ? '#f4a400' : '#52525b',
                    lineHeight: '1.7',
                  }}>
                    {line}
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT — Feedback panel (25%) */}
          <div style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            background: '#0d0d0f',
            overflowY: 'auto', minHeight: 0,
          }}>
            {!feedback ? (
              /* Empty / loading state */
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '32px 20px', gap: '14px',
              }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '38px',
                  color: '#2a2a32', letterSpacing: '0.25em', userSelect: 'none',
                  lineHeight: 1,
                }}>
                  [&nbsp;&nbsp;]
                </div>
                <div style={{
                  fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px',
                  color: '#52525b', textAlign: 'center', lineHeight: '1.65',
                  maxWidth: '160px',
                }}>
                  Submit your solution to receive AI feedback
                </div>
                {submitting && (
                  <div style={{
                    fontFamily: "'Space Mono', monospace", fontSize: '10px',
                    color: '#4361ee', marginTop: '4px',
                  }}>
                    Analyzing...
                  </div>
                )}
              </div>
            ) : (
              /* Feedback content */
              <div style={{
                padding: '16px',
                opacity: feedbackVisible ? 1 : 0,
                transform: feedbackVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}>

                {/* Bracket header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#2a2a32' }}>[</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#2a2a32' }}>feedback ]</span>
                </div>

                {/* Score card */}
                <div style={{
                  border: '1px solid #1e1e22', background: '#111113',
                  padding: '20px 16px 16px', marginBottom: '12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <ScoreGauge score={feedback.overall_score} />
                  {(() => {
                    const vc = VERDICT_CONFIG[feedback.verdict] || VERDICT_CONFIG.Acceptable
                    return (
                      <span style={{
                        padding: '3px 14px',
                        background: vc.bg, color: vc.color,
                        border: `1px solid ${vc.border}`,
                        fontFamily: "'Space Mono', monospace", fontSize: '10px', fontWeight: '700',
                        letterSpacing: '0.06em',
                      }}>
                        {feedback.verdict.toUpperCase()}
                      </span>
                    )
                  })()}
                </div>

                {/* Correctness */}
                <FeedbackCard title="Correctness" score={feedback.correctness.score} defaultOpen delay={0}>
                  <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                    {feedback.correctness.feedback}
                  </p>
                </FeedbackCard>

                {/* Time complexity */}
                <FeedbackCard title="Time Complexity" score={feedback.time_complexity.score} delay={60}>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>Your solution</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#f87171' }}>{feedback.time_complexity.given}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>Optimal</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#22c55e' }}>{feedback.time_complexity.optimal}</span>
                    </div>
                  </div>
                  <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                    {feedback.time_complexity.feedback}
                  </p>
                </FeedbackCard>

                {/* Space complexity */}
                <FeedbackCard title="Space Complexity" score={feedback.space_complexity.score} delay={120}>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>Your solution</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#22c55e' }}>{feedback.space_complexity.given}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>Optimal</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#a1a1aa' }}>{feedback.space_complexity.optimal}</span>
                    </div>
                  </div>
                  <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                    {feedback.space_complexity.feedback}
                  </p>
                </FeedbackCard>

                {/* Code quality */}
                <FeedbackCard title="Code Quality" score={feedback.code_quality.score} delay={180}>
                  <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                    {feedback.code_quality.feedback}
                  </p>
                </FeedbackCard>

                {/* Edge cases */}
                <FeedbackCard title="Edge Cases" delay={240}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                    {feedback.edge_cases.missed.map((ec, i) => (
                      <span key={i} style={{
                        padding: '2px 6px',
                        background: 'rgba(239,68,68,0.08)', color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)',
                        fontFamily: "'Space Mono', monospace", fontSize: '9px',
                      }}>
                        {ec}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                    {feedback.edge_cases.feedback}
                  </p>
                </FeedbackCard>

                {/* Improvement */}
                <div
                  className="feedback-card-in"
                  style={{
                    border: '1px solid #1e1e22', background: '#111113',
                    padding: '10px 12px', marginBottom: '8px',
                    animationDelay: '300ms', opacity: 0,
                  }}
                >
                  <div style={{
                    fontFamily: "'Space Mono', monospace", fontSize: '9px',
                    color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: '6px',
                  }}>
                    Suggested Improvement
                  </div>
                  <div style={{
                    fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600',
                    fontSize: '13px', color: '#4361ee', marginBottom: '6px',
                  }}>
                    {feedback.improvement.approach}
                  </div>
                  <p style={{
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px',
                    color: '#a1a1aa', lineHeight: '1.6', margin: 0,
                  }}>
                    {feedback.improvement.explanation}
                  </p>
                </div>

                {/* Encouragement */}
                <div
                  className="feedback-card-in"
                  style={{
                    padding: '8px 12px',
                    borderLeft: '2px solid rgba(244,164,0,0.4)',
                    background: 'rgba(244,164,0,0.03)',
                    animationDelay: '360ms', opacity: 0,
                  }}
                >
                  <p style={{
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px',
                    color: '#71717a', lineHeight: '1.6', margin: 0, fontStyle: 'italic',
                  }}>
                    "{feedback.encouragement}"
                  </p>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
