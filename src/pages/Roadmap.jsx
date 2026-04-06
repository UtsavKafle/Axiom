import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const PHASES = [
  {
    id: 'foundation',
    label: 'Foundation',
    color: '#4361ee',
    nodes: [
      { id: 'ds', label: 'Data Structures', status: 'completed', time: '3 weeks', desc: 'Arrays, linked lists, stacks, queues, trees, graphs, hash maps.', resources: ['MIT 6.006', 'NeetCode 150', 'Cracking the Coding Interview'] },
      { id: 'algo', label: 'Algorithms', status: 'completed', time: '4 weeks', desc: 'Sorting, searching, divide & conquer, dynamic programming basics.', resources: ['CLRS Book', 'Algo Expert', 'LeetCode Top 100'] },
      { id: 'cs-fundamentals', label: 'CS Fundamentals', status: 'completed', time: '2 weeks', desc: 'Big-O notation, memory model, bitwise operations, recursion.', resources: ['CS50', 'Khan Academy CS'] },
    ],
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    color: '#4361ee',
    nodes: [
      { id: 'oop', label: 'OOP & Design Patterns', status: 'completed', time: '2 weeks', desc: 'SOLID principles, common design patterns, software architecture basics.', resources: ['Head First Design Patterns', 'Refactoring Guru'] },
      { id: 'os', label: 'Operating Systems', status: 'in-progress', time: '3 weeks', desc: 'Processes, threads, memory management, file systems, concurrency.', resources: ['OSTEP (free online)', 'MIT 6.004', 'Operating Systems: Three Easy Pieces'] },
      { id: 'net', label: 'Computer Networks', status: 'locked', time: '2 weeks', desc: 'TCP/IP, HTTP, DNS, load balancing, CDNs, network security basics.', resources: ['Computer Networking: A Top-Down Approach', 'Cloudflare Learning Center'] },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    color: '#f4a400',
    nodes: [
      { id: 'sys', label: 'System Design', status: 'locked', time: '5 weeks', desc: 'Scalability, distributed systems, CAP theorem, databases at scale.', resources: ['Designing Data-Intensive Apps', 'System Design Interview Vol 1 & 2', 'ByteByteGo'] },
      { id: 'db', label: 'Databases', status: 'locked', time: '2 weeks', desc: 'SQL, indexing, transactions, NoSQL, sharding, replication.', resources: ['Use The Index Luke', 'PostgreSQL docs', 'MongoDB University'] },
      { id: 'ml', label: 'ML Fundamentals', status: 'locked', time: '4 weeks', desc: 'Linear algebra, statistics, supervised/unsupervised learning, neural networks.', resources: ['fast.ai', 'Stanford CS229', 'Hands-On ML with Scikit-Learn'] },
    ],
  },
  {
    id: 'job-ready',
    label: 'Job Ready',
    color: '#22c55e',
    nodes: [
      { id: 'lc', label: 'LeetCode Grind (150)', status: 'locked', time: '6 weeks', desc: 'Pattern-based problem solving for technical interviews.', resources: ['NeetCode Roadmap', 'Blind 75', 'LeetCode Premium'] },
      { id: 'mock', label: 'Mock Interviews', status: 'locked', time: '2 weeks', desc: 'Simulated FAANG-style behavioral and technical interviews.', resources: ['Pramp', 'Interviewing.io', 'Exponent'] },
      { id: 'offer', label: 'Offer Negotiation', status: 'locked', time: '1 week', desc: 'Compensation negotiation, equity understanding, offer comparison.', resources: ['Levels.fyi', 'Patrick McKenzie article', 'Fearless Salary Negotiation'] },
    ],
  },
]

const STATUS_CONFIG = {
  'completed':   { fill: '#4361ee', border: '#4361ee', glow: 'rgba(67,97,238,0.6)',   icon: '✓' },
  'in-progress': { fill: 'rgba(244,164,0,0.08)', border: '#f4a400', glow: 'rgba(244,164,0,0.6)', icon: '◉' },
  'locked':      { fill: '#111113', border: '#1e1e22', glow: 'none',                  icon: '○' },
}

const completedCount = PHASES.flatMap(p => p.nodes).filter(n => n.status === 'completed').length
const totalCount = PHASES.flatMap(p => p.nodes).length

export default function Roadmap() {
  const { user, profile } = useAuth()
  const [selectedNode, setSelectedNode] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const nameParts = displayName.trim().split(' ')
  const shortName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : nameParts[0]
  const initial = displayName[0]?.toUpperCase() || 'U'
  const yearLabel = profile?.year || 'CS Student'
  const goalLabel = profile?.goal || '—'
  const interestsLabel = profile?.interests || '—'

  function openNode(node) {
    setSelectedNode(node)
    setDrawerOpen(true)
  }

  const progress = Math.round((completedCount / totalCount) * 100)

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>

      {/* Left panel */}
      <div style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '1px solid #1e1e22',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0d0f',
        overflowY: 'auto',
      }}>
        {/* User card */}
        <div className="animate-in stagger-1" style={{ padding: '16px', borderBottom: '1px solid #1e1e22' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: '#4361ee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: '#fff',
              fontFamily: "'IBM Plex Sans', sans-serif",
              flexShrink: 0,
            }}>{initial}</div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '13px', color: '#f4f4f5' }}>{shortName}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee' }}>{yearLabel}</div>
            </div>
          </div>
          {[
            { label: 'Year', value: yearLabel },
            { label: 'Target', value: goalLabel },
            { label: 'Interests', value: interestsLabel },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px', gap: '8px' }}>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#52525b', flexShrink: 0 }}>{item.label}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#a1a1aa', textAlign: 'right', lineHeight: '1.4' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="animate-in stagger-2" style={{ padding: '16px', borderBottom: '1px solid #1e1e22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '12px', color: '#f4f4f5' }}>Progress</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#4361ee', fontWeight: '700' }}>{progress}%</span>
          </div>
          <div style={{ height: '4px', background: '#1e1e22', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: '#4361ee',
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>
            {completedCount}/{totalCount} topics complete
          </div>
        </div>

        {/* Phase progress */}
        <div className="animate-in stagger-3" style={{ padding: '16px', borderBottom: '1px solid #1e1e22' }}>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '11px', color: '#71717a', letterSpacing: '0.06em', marginBottom: '10px', textTransform: 'uppercase' }}>Phases</div>
          {PHASES.map((phase, pi) => {
            const done = phase.nodes.filter(n => n.status === 'completed').length
            const pct = Math.round((done / phase.nodes.length) * 100)
            return (
              <div key={phase.id} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#a1a1aa' }}>{phase.label}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>{done}/{phase.nodes.length}</span>
                </div>
                <div style={{ height: '3px', background: '#1e1e22', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: phase.color, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Node legend */}
        <div className="animate-in stagger-4" style={{ padding: '16px' }}>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '11px', color: '#71717a', letterSpacing: '0.06em', marginBottom: '10px', textTransform: 'uppercase' }}>Node States</div>
          {[
            { label: 'Completed', color: '#4361ee', glow: 'rgba(67,97,238,0.6)' },
            { label: 'In Progress', color: '#f4a400', glow: 'rgba(244,164,0,0.6)' },
            { label: 'Locked', color: '#3f3f46', glow: null },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
              <div style={{
                width: '12px', height: '12px',
                clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                background: s.color,
                filter: s.glow ? `drop-shadow(0 0 3px ${s.glow})` : 'none',
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#71717a' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main roadmap */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', position: 'relative' }}>

        {/* Header */}
        <div className="animate-in stagger-1" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee', letterSpacing: '0.18em' }}>// SYS.ROADMAP</span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: '36px', color: '#f4f4f5', letterSpacing: '-0.02em', lineHeight: '1.1', marginBottom: '8px' }}>
            Your CS Learning Path
          </h1>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', letterSpacing: '0.08em' }}>
            PERSONALIZED_FOR → SWE_ROLE @ TOP_TIER_TECH
          </p>
        </div>

        {/* Overall progress bar */}
        <div className="animate-in stagger-2" style={{
          background: '#111113',
          border: '1px solid #1e1e22',
          padding: '12px 16px',
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>OVERALL</span>
          <div style={{ flex: 1, height: '6px', background: '#1e1e22', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: '#4361ee',
              transition: 'width 1s ease',
            }} />
          </div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#4361ee', fontWeight: '700', whiteSpace: 'nowrap' }}>{progress}%</span>
        </div>

        {/* Phases */}
        {PHASES.map((phase, pi) => (
          <div key={phase.id} className={`animate-in stagger-${pi + 2}`} style={{ marginBottom: '52px', position: 'relative' }}>
            {/* Phase header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <span style={{
                padding: '3px 10px',
                background: 'transparent',
                border: `1px solid ${phase.color}`,
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: phase.color,
                letterSpacing: '0.08em',
              }}>PHASE {pi + 1}</span>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '15px', color: '#f4f4f5' }}>{phase.label}</span>
              <div style={{ flex: 1, height: '1px', background: '#1e1e22' }} />
            </div>

            {/* Nodes row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', position: 'relative' }}>
              {/* Connecting line */}
              <div style={{
                position: 'absolute',
                top: '31px',
                left: '32px',
                right: '32px',
                height: '1px',
                background: '#2a2a32',
                zIndex: 0,
              }} />

              {phase.nodes.map((node, ni) => {
                const cfg = STATUS_CONFIG[node.status]
                return (
                  <div
                    key={node.id}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      position: 'relative',
                      zIndex: 1,
                      cursor: node.status !== 'locked' ? 'pointer' : 'default',
                    }}
                    onClick={() => node.status !== 'locked' && openNode(node)}
                  >
                    {/* Node hex */}
                    <div
                      className={node.status === 'completed' ? 'node-glow-blue' : node.status === 'in-progress' ? 'node-glow-amber' : ''}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <div
                        className="node-hex"
                        style={{
                          width: '62px', height: '62px',
                          background: node.status === 'completed'
                            ? '#4361ee'
                            : node.status === 'in-progress'
                              ? cfg.fill
                              : '#111113',
                          border: node.status === 'in-progress' ? `2px solid #f4a400` : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: node.status === 'completed' ? '20px' : '14px',
                          color: node.status === 'locked' ? '#3f3f46' : node.status === 'in-progress' ? '#f4a400' : '#fff',
                          fontWeight: '600',
                        }}
                        onMouseEnter={e => { if (node.status !== 'locked') e.currentTarget.classList.add('node-hex-jiggle') }}
                        onMouseLeave={e => e.currentTarget.classList.remove('node-hex-jiggle')}
                      >
                        {node.status === 'completed' ? '✓' : node.status === 'in-progress' ? '◉' : '○'}
                      </div>
                    </div>

                    {/* Label */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontWeight: '500',
                        fontSize: '12px',
                        color: node.status === 'locked' ? '#3f3f46' : '#f4f4f5',
                        marginBottom: '3px',
                      }}>{node.label}</div>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '9px',
                        color: node.status === 'in-progress' ? '#f4a400' : '#52525b',
                      }}>
                        {node.status === 'in-progress' ? '▶ IN PROGRESS' : node.time}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Drawer */}
      {drawerOpen && selectedNode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.6)',
          }} onClick={() => setDrawerOpen(false)} />
          <div style={{
            width: '380px',
            background: '#0d0d0f',
            borderLeft: '1px solid #1e1e22',
            height: '100vh',
            padding: '28px 24px',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 1,
            animation: 'slideIn 0.2s ease',
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(32px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>

            <button onClick={() => setDrawerOpen(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: '#111113', border: '1px solid #1e1e22',
              color: '#71717a', width: '28px', height: '28px',
              cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                filter: `drop-shadow(0 0 8px ${selectedNode.status === 'in-progress' ? 'rgba(244,164,0,0.7)' : 'rgba(67,97,238,0.7)'})`,
              }}>
                <div style={{
                  width: '44px', height: '44px',
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                  background: selectedNode.status === 'in-progress' ? 'rgba(244,164,0,0.1)' : '#4361ee',
                  border: selectedNode.status === 'in-progress' ? '2px solid #f4a400' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', color: selectedNode.status === 'in-progress' ? '#f4a400' : '#fff',
                }}>
                  {selectedNode.status === 'completed' ? '✓' : '◉'}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: '18px', color: '#f4f4f5' }}>{selectedNode.label}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: selectedNode.status === 'in-progress' ? '#f4a400' : '#4361ee' }}>
                  {selectedNode.status.toUpperCase().replace('-', ' ')} · {selectedNode.time}
                </div>
              </div>
            </div>

            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: '#a1a1aa', lineHeight: '1.65', marginBottom: '20px', padding: '14px', background: '#111113', border: '1px solid #1e1e22' }}>
              {selectedNode.desc}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '12px', color: '#f4f4f5', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resources</div>
              {selectedNode.resources.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '9px 12px', marginBottom: '1px',
                  background: '#111113',
                  border: '1px solid #1e1e22',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#a1a1aa',
                  transition: 'border-color 0.12s, color 0.12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(67,97,238,0.4)'; e.currentTarget.style.color = '#f4f4f5' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#a1a1aa' }}
                >
                  <span style={{ color: '#4361ee', fontSize: '10px', flexShrink: 0 }}>▸</span>
                  {r}
                </div>
              ))}
            </div>

            <button style={{
              width: '100%', padding: '11px',
              background: selectedNode.status === 'completed' ? 'rgba(34,197,94,0.08)' : '#4361ee',
              border: selectedNode.status === 'completed' ? '1px solid rgba(34,197,94,0.3)' : 'none',
              color: selectedNode.status === 'completed' ? '#22c55e' : '#fff',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'opacity 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {selectedNode.status === 'completed' ? '✓ Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
