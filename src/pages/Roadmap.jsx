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
    color: '#7b8ff7',
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
  'completed': { fill: '#4361ee', border: '#4361ee', glow: 'rgba(67,97,238,0.6)', icon: '✓' },
  'in-progress': { fill: '#f4a400', border: '#f4a400', glow: 'rgba(244,164,0,0.6)', icon: '◉' },
  'locked': { fill: '#12121f', border: '#1e1e35', glow: 'none', icon: '○' },
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
      {/* Left user panel */}
      <div style={{
        width: '240px',
        flexShrink: 0,
        borderRight: '1px solid rgba(67,97,238,0.12)',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'rgba(10,10,15,0.6)',
      }}>
        <div className="glass-card bracket-corner animate-in stagger-1" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4361ee, #f4a400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: '700', color: '#fff',
              border: '2px solid rgba(67,97,238,0.4)',
            }}>{initial}</div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '14px', color: '#e2e8f0' }}>{shortName}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee' }}>{yearLabel}</div>
            </div>
          </div>
          {[
            { label: 'Year', value: yearLabel },
            { label: 'Target', value: goalLabel },
            { label: 'Interests', value: interestsLabel },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
              <span style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
              <span style={{ color: '#94a3b8', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="glass-card animate-in stagger-2" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0' }}>Progress</span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#4361ee', fontWeight: '700' }}>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(30,30,53,0.8)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #4361ee, #7b8ff7)',
              borderRadius: '3px',
              boxShadow: '0 0 8px rgba(67,97,238,0.5)',
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748b' }}>
            {completedCount}/{totalCount} topics completed
          </div>
        </div>

        {/* Phase legend */}
        <div className="glass-card animate-in stagger-3" style={{ padding: '18px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '12px' }}>Node States</div>
          {[
            { label: 'Completed', color: '#4361ee', glow: 'rgba(67,97,238,0.7)' },
            { label: 'In Progress', color: '#f4a400', glow: 'rgba(244,164,0,0.7)' },
            { label: 'Locked', color: '#374151', glow: null },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '14px', height: '14px',
                clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                background: s.color,
                filter: s.glow ? `drop-shadow(0 0 4px ${s.glow})` : 'none',
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#94a3b8' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main roadmap */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', position: 'relative' }}>
        <div className="animate-in stagger-1" style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '48px', height: '1px', background: 'linear-gradient(to right, transparent, rgba(67,97,238,0.6))' }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee', letterSpacing: '0.2em', fontWeight: '700' }}>// SYS.ROADMAP</span>
            <div style={{ width: '48px', height: '1px', background: 'linear-gradient(to left, transparent, rgba(67,97,238,0.6))' }} />
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '40px', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.05', marginBottom: '10px' }}>
            YOUR CS{' '}
            <span style={{
              background: 'linear-gradient(135deg, #4361ee 0%, #7b8ff7 50%, #f4a400 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>LEARNING_PATH</span>
          </h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#475569', letterSpacing: '0.1em' }}>
            PERSONALIZED_FOR → SWE_ROLE @ TOP_TIER_TECH
          </p>
        </div>

        {/* Progress bar */}
        <div className="animate-in stagger-2" style={{
          background: 'rgba(12,12,20,0.8)',
          border: '1px solid rgba(67,97,238,0.15)',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>OVERALL PROGRESS</span>
          <div style={{ flex: 1, height: '8px', background: 'rgba(30,30,53,0.8)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #4361ee 0%, #7b8ff7 50%, #f4a400 100%)',
              borderRadius: '4px',
              boxShadow: '0 0 12px rgba(67,97,238,0.5)',
            }} />
          </div>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', color: '#4361ee', fontWeight: '700', whiteSpace: 'nowrap' }}>{progress}% Complete</span>
        </div>

        {/* Phases */}
        {PHASES.map((phase, pi) => (
          <div key={phase.id} className={`animate-in stagger-${pi + 2}`} style={{ marginBottom: '60px', position: 'relative' }}>
            {/* Phase header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{
                padding: '4px 16px',
                background: `${phase.color}18`,
                border: `1px solid ${phase.color}40`,
                borderRadius: '20px',
                fontFamily: 'Space Mono, monospace',
                fontSize: '11px',
                color: phase.color,
                letterSpacing: '0.1em',
                fontWeight: '700',
              }}>PHASE {pi + 1}</div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '18px', color: '#fff' }}>{phase.label}</span>
              <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, ${phase.color}40, transparent)` }} />
            </div>

            {/* Nodes */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', position: 'relative' }}>
              {/* Connecting line */}
              <div style={{
                position: 'absolute',
                top: '32px',
                left: '32px',
                right: '32px',
                height: '2px',
                background: `linear-gradient(to right, ${phase.color}60, ${phase.color}20)`,
                backgroundImage: `repeating-linear-gradient(to right, ${phase.color}60 0px, ${phase.color}60 6px, transparent 6px, transparent 12px)`,
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
                      gap: '12px',
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
                          width: '64px', height: '64px',
                          background: node.status === 'completed'
                            ? `linear-gradient(135deg, ${phase.color}, ${phase.color}99)`
                            : node.status === 'in-progress'
                              ? 'linear-gradient(135deg, #f4a400, #f4a40080)'
                              : 'linear-gradient(135deg, #1a1a2e, #12121f)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: node.status === 'completed' ? '22px' : '16px',
                          color: node.status === 'locked' ? '#374151' : '#fff',
                          fontWeight: '700',
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
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: node.status === 'locked' ? '#374151' : '#e2e8f0',
                        marginBottom: '4px',
                      }}>{node.label}</div>
                      <div style={{
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '10px',
                        color: node.status === 'in-progress' ? '#f4a400' : '#475569',
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
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }} onClick={() => setDrawerOpen(false)} />
          <div style={{
            width: '400px',
            background: '#0f0f1a',
            borderLeft: '1px solid rgba(67,97,238,0.25)',
            height: '100vh',
            padding: '32px 28px',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 1,
            animation: 'slideIn 0.25s ease',
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>

            <button onClick={() => setDrawerOpen(false)} style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(30,30,53,0.8)', border: '1px solid rgba(67,97,238,0.2)',
              color: '#64748b', borderRadius: '6px', width: '32px', height: '32px',
              cursor: 'pointer', fontSize: '16px',
            }}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                filter: `drop-shadow(0 0 10px ${selectedNode.status === 'in-progress' ? 'rgba(244,164,0,0.7)' : 'rgba(67,97,238,0.7)'})`,
              }}>
                <div style={{
                  width: '48px', height: '48px',
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                  background: selectedNode.status === 'in-progress'
                    ? 'linear-gradient(135deg, #f4a400, #f4a40080)'
                    : 'linear-gradient(135deg, #4361ee, #4361ee99)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', color: '#fff',
                }}>
                  {selectedNode.status === 'completed' ? '✓' : '◉'}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '18px', color: '#fff' }}>{selectedNode.label}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: selectedNode.status === 'in-progress' ? '#f4a400' : '#4361ee' }}>
                  {selectedNode.status.toUpperCase().replace('-', ' ')} · {selectedNode.time}
                </div>
              </div>
            </div>

            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '24px', padding: '16px', background: 'rgba(12,12,20,0.6)', borderRadius: '8px', border: '1px solid rgba(30,30,53,0.8)' }}>
              {selectedNode.desc}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '12px' }}>Recommended Resources</div>
              {selectedNode.resources.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', marginBottom: '8px',
                  background: 'rgba(12,12,20,0.6)',
                  border: '1px solid rgba(67,97,238,0.15)',
                  borderRadius: '8px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#cbd5e1',
                  transition: 'border-color 0.18s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(67,97,238,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(67,97,238,0.15)'}
                >
                  <span style={{ color: '#4361ee', fontSize: '12px' }}>▸</span>
                  {r}
                </div>
              ))}
            </div>

            <button style={{
              width: '100%', padding: '12px',
              background: selectedNode.status === 'completed'
                ? 'rgba(34,197,94,0.15)'
                : 'linear-gradient(135deg, #4361ee, #6b7ff7)',
              border: selectedNode.status === 'completed' ? '1px solid rgba(34,197,94,0.4)' : 'none',
              borderRadius: '10px',
              color: selectedNode.status === 'completed' ? '#22c55e' : '#fff',
              fontFamily: 'Syne, sans-serif',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: selectedNode.status !== 'completed' ? '0 0 24px rgba(67,97,238,0.4)' : 'none',
            }}>
              {selectedNode.status === 'completed' ? '✓ Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
