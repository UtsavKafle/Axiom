import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const BACKEND = '/api'

const PHASE_COLORS = ['#4361ee', '#4361ee', '#f4a400', '#22c55e']

const STATUS_CONFIG = {
  'completed':   { fill: '#4361ee', border: '#4361ee', glow: 'rgba(67,97,238,0.6)'         },
  'in-progress': { fill: 'rgba(244,164,0,0.08)', border: '#f4a400', glow: 'rgba(244,164,0,0.6)' },
  'locked':      { fill: '#111113', border: '#1e1e22', glow: 'none'                          },
}

const AHEAD_THRESHOLD = 20   // % ahead of expected pace
const BEHIND_THRESHOLD = 15  // % behind expected pace
const RECAL_COOLDOWN_DAYS = 7

function buildPhases(roadmapJson, progressMap) {
  return (roadmapJson.phases || []).map((phase, idx) => ({
    id:    phase.id,
    label: phase.title,
    color: PHASE_COLORS[idx] ?? '#4361ee',
    nodes: (phase.nodes || []).map((node) => {
      const row = progressMap[node.id]
      let status = 'locked'
      if (row?.status === 'completed')    status = 'completed'
      else if (row?.status === 'in_progress') status = 'in-progress'
      return {
        id:          node.id,
        label:       node.title,
        status,
        time:        `${node.estimated_hours} hrs`,
        desc:        node.description,
        resources:   (node.resources || []).map(r => r.label),
        substitutes: node.substitutes || [],
      }
    }),
  }))
}

function isPaceOffTrack(meta, completedCount, totalCount) {
  if (!meta?.generated_at || !totalCount) return false
  const daysElapsed   = (Date.now() - new Date(meta.generated_at)) / 86400000
  const timelineWeeks = meta.timeline_weeks || 12
  const expectedPct   = Math.min(100, (daysElapsed / (timelineWeeks * 7)) * 100)
  const actualPct     = (completedCount / totalCount) * 100
  return actualPct > expectedPct + AHEAD_THRESHOLD || actualPct < expectedPct - BEHIND_THRESHOLD
}

export default function Roadmap() {
  const { user, profile } = useAuth()

  // ── Core state ───────────────────────────────────────────────────────────────
  const [phases,      setPhases]      = useState([])
  const [rawRoadmap,  setRawRoadmap]  = useState(null)
  const [roadmapMeta, setRoadmapMeta] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [error,       setError]       = useState(null)

  // ── Node drawer ──────────────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState(null)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [marking,      setMarking]      = useState(false)

  // ── Recalibration ────────────────────────────────────────────────────────────
  const isRecalibratingRef = useRef(false)
  // Refs so the Supabase realtime callback always reads fresh state
  const phasesRef      = useRef([])
  const roadmapMetaRef = useRef(null)
  useEffect(() => { phasesRef.current = phases },        [phases])
  useEffect(() => { roadmapMetaRef.current = roadmapMeta }, [roadmapMeta])

  // ── Edit mode / swap ─────────────────────────────────────────────────────────
  const [editMode,    setEditMode]    = useState(false)
  const [swapTarget,  setSwapTarget]  = useState(null)
  const [swapOptions, setSwapOptions] = useState([])
  const [swapLoading, setSwapLoading] = useState(false)

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)

  // ── Profile display ──────────────────────────────────────────────────────────
  const displayName    = profile?.name || user?.email?.split('@')[0] || 'User'
  const nameParts      = displayName.trim().split(' ')
  const shortName      = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : nameParts[0]
  const initial        = displayName[0]?.toUpperCase() || 'U'
  const yearLabel      = profile?.year || 'CS Student'
  const goalLabel      = profile?.goal || '—'
  const interestsLabel = profile?.interests || '—'

  // ── Data fetching ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return
    loadRoadmap()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRoadmap() {
    setLoading(true)
    setError(null)
    try {
      const getResp = await fetch(`${BACKEND}/roadmap/${user.id}`)
      let roadmapJson
      let lastRecalibratedAt = null

      if (getResp.ok) {
        const data         = await getResp.json()
        roadmapJson        = data.roadmap
        lastRecalibratedAt = data.last_recalibrated_at
      } else if (getResp.status === 404) {
        setGenerating(true)
        const genResp = await fetch(`${BACKEND}/roadmap/generate`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ user_id: user.id }),
        })
        if (!genResp.ok) {
          const detail = await genResp.text().catch(() => genResp.status)
          throw new Error(`Generation failed (${genResp.status}): ${detail}`)
        }
        roadmapJson = await genResp.json()
      } else {
        throw new Error(`Unexpected response from backend: ${getResp.status}`)
      }

      const { data: progressRows, error: pgErr } = await supabase
        .from('user_topic_progress')
        .select('topic_id, status')
        .eq('user_id', user.id)

      if (pgErr) console.warn('[Roadmap] Could not load progress:', pgErr.message)

      const progressMap = {}
      for (const row of progressRows || []) {
        progressMap[row.topic_id] = row
      }

      const meta = {
        ...roadmapJson.meta,
        last_recalibrated_at: lastRecalibratedAt ?? roadmapJson.meta?.generated_at,
      }

      const builtPhases = buildPhases(roadmapJson, progressMap)
      setRawRoadmap(roadmapJson)
      setRoadmapMeta(meta)
      setPhases(builtPhases)

      // Trigger B — check pace on load (behind schedule)
      const allNodes       = builtPhases.flatMap(p => p.nodes)
      const completedCount = allNodes.filter(n => n.status === 'completed').length
      if (!isRecalibratingRef.current && isPaceOffTrack(meta, completedCount, allNodes.length)) {
        const completedIds = allNodes.filter(n => n.status === 'completed').map(n => n.id)
        const daysElapsed  = Math.floor((Date.now() - new Date(meta.generated_at)) / 86400000)
        triggerRecalibrate(completedIds, daysElapsed, meta)
      }
    } catch (err) {
      console.error('[Roadmap] loadRoadmap failed:', err)
      setError(err.message || 'Failed to load roadmap')
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  // ── Recalibration ─────────────────────────────────────────────────────────────

  async function triggerRecalibrate(completedIds, daysElapsed, meta, force = false) {
    if (isRecalibratingRef.current) return

    if (!force && meta?.last_recalibrated_at) {
      const daysSince = (Date.now() - new Date(meta.last_recalibrated_at)) / 86400000
      if (daysSince < RECAL_COOLDOWN_DAYS) return
    }

    isRecalibratingRef.current = true
    showToast('RECALIBRATING ROADMAP...', 0)

    try {
      const resp = await fetch(`${BACKEND}/roadmap/recalibrate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_id:             user.id,
          completed_topic_ids: completedIds,
          days_elapsed:        daysElapsed,
        }),
      })
      if (!resp.ok) throw new Error(`Recalibrate failed: ${resp.status}`)
      const newRoadmap = await resp.json()

      const { data: progressRows } = await supabase
        .from('user_topic_progress')
        .select('topic_id, status')
        .eq('user_id', user.id)

      const progressMap = {}
      for (const row of progressRows || []) progressMap[row.topic_id] = row

      const newMeta = {
        ...newRoadmap.meta,
        last_recalibrated_at: newRoadmap.meta?.last_recalibrated_at ?? new Date().toISOString(),
      }
      setRawRoadmap(newRoadmap)
      setRoadmapMeta(newMeta)
      setPhases(buildPhases(newRoadmap, progressMap))
      showToast('ROADMAP UPDATED')
    } catch (err) {
      console.error('[Roadmap] recalibrate failed:', err)
      setToast(null)
    } finally {
      isRecalibratingRef.current = false
    }
  }

  // Trigger C — Supabase realtime: profile role/timeline changes → force recalibrate
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${user.id}` },
        () => {
          const currentPhases = phasesRef.current
          const meta          = roadmapMetaRef.current
          const completedIds  = currentPhases.flatMap(p => p.nodes)
            .filter(n => n.status === 'completed')
            .map(n => n.id)
          const daysElapsed = meta?.generated_at
            ? Math.floor((Date.now() - new Date(meta.generated_at)) / 86400000)
            : 0
          triggerRecalibrate(completedIds, daysElapsed, meta, true)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Node drawer actions ───────────────────────────────────────────────────────

  function openNode(node) {
    if (editMode) return
    setSelectedNode(node)
    setDrawerOpen(true)
  }

  async function startTopic() {
    if (!user || !selectedNode || selectedNode.status !== 'locked' || marking) return
    setMarking(true)

    const { error: upsertErr } = await supabase
      .from('user_topic_progress')
      .upsert(
        { user_id: user.id, topic_id: selectedNode.id, status: 'in_progress' },
        { onConflict: 'user_id,topic_id' }
      )

    if (upsertErr) {
      console.error('[Roadmap] startTopic upsert failed:', upsertErr.message)
      setMarking(false)
      return
    }

    setPhases(prev => prev.map(phase => ({
      ...phase,
      nodes: phase.nodes.map(n =>
        n.id === selectedNode.id ? { ...n, status: 'in-progress' } : n
      ),
    })))
    setSelectedNode(prev => ({ ...prev, status: 'in-progress' }))
    setMarking(false)
  }

  async function markComplete() {
    if (!user || !selectedNode || selectedNode.status === 'completed' || marking) return
    setMarking(true)

    const now = new Date().toISOString()
    const { error: upsertErr } = await supabase
      .from('user_topic_progress')
      .upsert(
        { user_id: user.id, topic_id: selectedNode.id, status: 'completed', completed_at: now },
        { onConflict: 'user_id,topic_id' }
      )

    if (upsertErr) {
      console.error('[Roadmap] markComplete upsert failed:', upsertErr.message)
      setMarking(false)
      return
    }

    const nextPhases = phases.map(phase => ({
      ...phase,
      nodes: phase.nodes.map(n =>
        n.id === selectedNode.id ? { ...n, status: 'completed' } : n
      ),
    }))

    // Phase complete toast
    for (const nextPhase of nextPhases) {
      if (!nextPhase.nodes.some(n => n.id === selectedNode.id)) continue
      const prevPhase = phases.find(p => p.id === nextPhase.id)
      const wasAlreadyComplete = prevPhase?.nodes.every(n => n.status === 'completed')
      if (!wasAlreadyComplete && nextPhase.nodes.every(n => n.status === 'completed')) {
        showToast(`${nextPhase.label} phase complete!`)
      }
    }

    setPhases(nextPhases)
    setSelectedNode(prev => ({ ...prev, status: 'completed' }))
    setMarking(false)

    // Trigger A — check pace after marking complete
    const allNext        = nextPhases.flatMap(p => p.nodes)
    const completedCount = allNext.filter(n => n.status === 'completed').length
    if (!isRecalibratingRef.current && isPaceOffTrack(roadmapMeta, completedCount, allNext.length)) {
      const completedIds = allNext.filter(n => n.status === 'completed').map(n => n.id)
      const daysElapsed  = roadmapMeta?.generated_at
        ? Math.floor((Date.now() - new Date(roadmapMeta.generated_at)) / 86400000)
        : 0
      triggerRecalibrate(completedIds, daysElapsed, roadmapMeta)
    }
  }

  // ── Edit mode / swap ──────────────────────────────────────────────────────────

  function openSwapModal(node, e) {
    e.stopPropagation()
    setSwapTarget(node)
    setSwapOptions(node.substitutes?.length ? node.substitutes : [])
  }

  async function confirmSwap(chosenTitle) {
    if (!swapTarget || swapLoading || !rawRoadmap) return
    setSwapLoading(true)

    try {
      const resp = await fetch(`${BACKEND}/roadmap/substitute`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_id:          user.id,
          topic_to_replace: swapTarget.id,
          chosen_title:     chosenTitle,
        }),
      })
      if (!resp.ok) throw new Error(`Substitute failed: ${resp.status}`)
      const newNode = await resp.json()

      // UI-shaped replacement node
      const uiNode = {
        id:          newNode.id,
        label:       newNode.title,
        status:      'locked',
        time:        `${newNode.estimated_hours} hrs`,
        desc:        newNode.description,
        resources:   (newNode.resources || []).map(r => r.label),
        substitutes: newNode.substitutes || [],
      }

      // Update UI phases
      setPhases(prev => prev.map(phase => ({
        ...phase,
        nodes: phase.nodes.map(n => n.id === swapTarget.id ? uiNode : n),
      })))

      // Update raw roadmap and persist to Supabase
      const nextRaw = {
        ...rawRoadmap,
        phases: rawRoadmap.phases.map(phase => ({
          ...phase,
          nodes: phase.nodes.map(n => n.id === swapTarget.id ? newNode : n),
        })),
      }
      setRawRoadmap(nextRaw)

      const now = new Date().toISOString()
      await supabase.from('user_roadmaps').upsert(
        {
          user_id:              user.id,
          roadmap:              nextRaw,
          generated_at:         rawRoadmap.meta?.generated_at || now,
          last_recalibrated_at: roadmapMeta?.last_recalibrated_at || now,
        },
        { onConflict: 'user_id' }
      )

      setSwapTarget(null)
      setSwapOptions([])
      showToast('TOPIC SWAPPED')
    } catch (err) {
      console.error('[Roadmap] swap failed:', err)
    } finally {
      setSwapLoading(false)
    }
  }

  // ── Toast helper ──────────────────────────────────────────────────────────────

  function showToast(msg, duration = 2500) {
    setToast(msg)
    if (duration > 0) setTimeout(() => setToast(null), duration)
  }

  // ── Derived counts ────────────────────────────────────────────────────────────

  const allNodes       = phases.flatMap(p => p.nodes)
  const completedCount = allNodes.filter(n => n.status === 'completed').length
  const totalCount     = allNodes.length
  const progress       = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '20px', background: '#09090b',
      }}>
        <div
          className="node-hex blue-glow-anim"
          style={{
            width: '62px', height: '62px', background: 'rgba(67,97,238,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', color: '#4361ee',
          }}
        >◈</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#71717a', letterSpacing: '0.12em' }}>
          {generating ? 'GENERATING YOUR ROADMAP...' : 'LOADING ROADMAP...'}
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#ef4444', letterSpacing: '0.1em' }}>ROADMAP_ERROR</div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: '#71717a', maxWidth: '360px', textAlign: 'center' }}>{error}</div>
        <button
          onClick={loadRoadmap}
          style={{ padding: '8px 20px', background: '#4361ee', border: 'none', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.04em' }}
        >RETRY</button>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  const isRecalibratingToast = toast?.includes('RECALIBRAT')

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>

      {/* ── Left panel ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: '220px', flexShrink: 0, borderRight: '1px solid #1e1e22',
        display: 'flex', flexDirection: 'column', background: '#0d0d0f', overflowY: 'auto',
      }}>
        {/* User card */}
        <div className="animate-in stagger-1 glass-card" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', background: '#4361ee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: '#fff',
              fontFamily: "'IBM Plex Sans', sans-serif", flexShrink: 0,
            }}>{initial}</div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '13px', color: '#f4f4f5' }}>{shortName}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee' }}>{yearLabel}</div>
            </div>
          </div>
          {[
            { label: 'Year',      value: yearLabel },
            { label: 'Target',    value: goalLabel },
            { label: 'Interests', value: interestsLabel },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px', gap: '8px' }}>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px', color: '#52525b', flexShrink: 0 }}>{item.label}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#a1a1aa', textAlign: 'right', lineHeight: '1.4' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="animate-in stagger-2 glass-card" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: '500', fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Progress</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#4361ee', fontWeight: '700' }}>{progress}%</span>
          </div>
          <div style={{ height: '4px', background: '#1e1e22', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#4361ee', transition: 'width 1s ease' }} />
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>
            {completedCount}/{totalCount} topics complete
          </div>
        </div>

        {/* Phase progress */}
        <div className="animate-in stagger-3 glass-card" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: '500', fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', marginBottom: '10px', textTransform: 'uppercase' }}>Phases</div>
          {phases.map((phase) => {
            const done = phase.nodes.filter(n => n.status === 'completed').length
            const pct  = phase.nodes.length > 0 ? Math.round((done / phase.nodes.length) * 100) : 0
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
        <div className="animate-in stagger-4 glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: '500', fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', marginBottom: '10px', textTransform: 'uppercase' }}>Node States</div>
          {[
            { label: 'Completed',   color: '#4361ee', glow: 'rgba(67,97,238,0.6)' },
            { label: 'In Progress', color: '#f4a400', glow: 'rgba(244,164,0,0.6)' },
            { label: 'Locked',      color: '#3f3f46', glow: null },
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

      {/* ── Main roadmap ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', position: 'relative' }}>

        {/* Header */}
        <div className="animate-in stagger-1" style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#4361ee', letterSpacing: '0.15em' }}>// SYS.ROADMAP</span>
            </div>
            <h1 style={{ fontFamily: "'Syne', 'DM Serif Display', serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', color: '#f4f4f5', lineHeight: '1.1', marginBottom: '8px' }}>
              Your CS Learning Path
            </h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
              PERSONALIZED_FOR → SWE_ROLE @ TOP_TIER_TECH
            </p>
          </div>

          {/* Edit mode toggle */}
          <button
            className={editMode ? '' : 'gradient-border'}
            onClick={() => setEditMode(prev => !prev)}
            style={{
              padding: '7px 14px', flexShrink: 0,
              background: editMode ? 'rgba(244,164,0,0.08)' : 'transparent',
              border: editMode ? '1px solid rgba(244,164,0,0.4)' : undefined,
              color: '#4361ee',
              fontFamily: "'Space Mono', monospace", fontSize: '10px',
              cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 200ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(67,97,238,0.25), 0 0 48px rgba(67,97,238,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
          >
            {editMode ? '◈ EDITING' : '⊘ EDIT MODE'}
          </button>
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div style={{
            background: 'rgba(244,164,0,0.04)', border: '1px solid rgba(244,164,0,0.2)',
            padding: '10px 16px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#f4a400', letterSpacing: '0.06em' }}>EDIT MODE ACTIVE</span>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#71717a' }}>
              Click ⇄ on any node to swap it with an alternative topic.
            </span>
          </div>
        )}

        {/* Overall progress bar */}
        <div className="animate-in stagger-2" style={{
          background: '#111113', border: '1px solid #1e1e22',
          padding: '12px 16px', marginBottom: '40px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>OVERALL</span>
          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', borderRadius: '999px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #4361ee, #7b8ff7)', boxShadow: '0 0 12px rgba(67,97,238,0.5)', borderRadius: '999px', transition: 'width 1s ease' }} />
          </div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#4361ee', fontWeight: '700', whiteSpace: 'nowrap' }}>{progress}%</span>
        </div>

        {/* Phases */}
        {phases.map((phase, pi) => (
          <div key={phase.id} className={`animate-in stagger-${pi + 2}`} style={{ marginBottom: '52px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <span style={{
                padding: '3px 10px', background: 'rgba(67,97,238,0.15)',
                border: '1px solid #4361ee', borderRadius: '4px',
                fontFamily: "'Space Mono', monospace", fontSize: '10px',
                color: '#4361ee', letterSpacing: '0.08em',
              }}>PHASE {pi + 1}</span>
              <span style={{ fontFamily: "'Syne', 'IBM Plex Sans', sans-serif", fontWeight: '700', fontSize: '15px', color: '#f4f4f5' }}>{phase.label}</span>
              <div style={{ flex: 1, height: '1px', background: '#1e1e22' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '31px', left: '32px', right: '32px', height: '1px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />

              {phase.nodes.map((node) => {
                const cfg = STATUS_CONFIG[node.status]
                return (
                  <div
                    key={node.id}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1, cursor: 'pointer' }}
                    onClick={() => openNode(node)}
                  >
                    {/* Hex + swap button wrapper */}
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div
                        className={node.status === 'completed' ? 'node-glow-blue' : node.status === 'in-progress' ? 'node-glow-amber' : ''}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <div
                          className="node-hex"
                          style={{
                            width: '62px', height: '62px',
                            background: node.status === 'completed'
                              ? 'rgba(67,97,238,0.2)'
                              : node.status === 'in-progress'
                              ? 'rgba(244,164,0,0.15)'
                              : 'rgba(255,255,255,0.04)',
                            border: node.status === 'completed'
                              ? '2px solid #4361ee'
                              : node.status === 'in-progress'
                              ? '2px solid #f4a400'
                              : editMode ? '1px dashed #3f3f46' : '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: node.status === 'completed' ? '20px' : '14px',
                            color: node.status === 'locked' ? 'rgba(255,255,255,0.3)' : node.status === 'in-progress' ? '#f4a400' : '#fff',
                            fontWeight: '600',
                            transition: 'transform 200ms ease',
                            animation: node.status === 'in-progress' ? 'pulse-amber 2s ease-in-out infinite' : undefined,
                            boxShadow: node.status === 'completed' ? '0 0 12px rgba(67,97,238,0.4)' : undefined,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          {node.status === 'completed' ? '✓' : node.status === 'in-progress' ? '◉' : '○'}
                        </div>
                      </div>

                      {/* Swap button — edit mode only */}
                      {editMode && (
                        <button
                          onClick={(e) => openSwapModal(node, e)}
                          title="Swap topic"
                          style={{
                            position: 'absolute', top: '-8px', right: '-8px',
                            width: '20px', height: '20px', padding: 0,
                            background: '#111113', border: '1px solid rgba(244,164,0,0.4)',
                            color: '#f4a400', fontSize: '11px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', borderRadius: '2px',
                          }}
                        >⇄</button>
                      )}
                    </div>

                    {/* Label */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '12px',
                        color: node.status === 'locked' ? '#3f3f46' : '#f4f4f5', marginBottom: '3px',
                      }}>{node.label}</div>
                      <div style={{
                        fontFamily: "'Space Mono', monospace", fontSize: '9px',
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

      {/* ── Node drawer ───────────────────────────────────────────────────────── */}
      {drawerOpen && selectedNode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setDrawerOpen(false)} />
          <div style={{
            width: '380px', background: '#0d0d0f', borderLeft: '1px solid #1e1e22',
            height: '100vh', padding: '28px 24px', overflowY: 'auto',
            position: 'relative', zIndex: 1, animation: 'slideIn 0.2s ease',
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(32px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>

            <button onClick={() => setDrawerOpen(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: '#111113', border: '1px solid #1e1e22', color: '#71717a',
              width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ filter: `drop-shadow(0 0 8px ${selectedNode.status === 'in-progress' ? 'rgba(244,164,0,0.7)' : 'rgba(67,97,238,0.7)'})` }}>
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
                  background: '#111113', border: '1px solid #1e1e22',
                  cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '12px', color: '#a1a1aa', transition: 'border-color 0.12s, color 0.12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(67,97,238,0.4)'; e.currentTarget.style.color = '#f4f4f5' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#a1a1aa' }}
                >
                  <span style={{ color: '#4361ee', fontSize: '10px', flexShrink: 0 }}>▸</span>
                  {r}
                </div>
              ))}
            </div>

            {selectedNode.status === 'locked' && (
              <button onClick={startTopic} disabled={marking} style={{
                width: '100%', padding: '11px', background: '#4361ee', border: 'none',
                color: '#fff', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600',
                fontSize: '13px', cursor: 'pointer', transition: 'opacity 0.12s', opacity: marking ? 0.6 : 1,
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { if (!marking) e.currentTarget.style.opacity = '1' }}
              >{marking ? 'Saving...' : 'Start Topic'}</button>
            )}
            {selectedNode.status === 'in-progress' && (
              <button onClick={markComplete} disabled={marking} style={{
                width: '100%', padding: '11px',
                background: 'rgba(244,164,0,0.08)', border: '1px solid rgba(244,164,0,0.35)',
                color: '#f4a400', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600',
                fontSize: '13px', cursor: 'pointer', transition: 'opacity 0.12s', opacity: marking ? 0.6 : 1,
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { if (!marking) e.currentTarget.style.opacity = '1' }}
              >{marking ? 'Saving...' : 'Mark as Complete'}</button>
            )}
            {selectedNode.status === 'completed' && (
              <button disabled style={{
                width: '100%', padding: '11px',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#22c55e', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600',
                fontSize: '13px', cursor: 'default',
              }}>✓ Completed</button>
            )}
          </div>
        </div>
      )}

      {/* ── Swap modal ────────────────────────────────────────────────────────── */}
      {swapTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
            onClick={() => { if (!swapLoading) { setSwapTarget(null); setSwapOptions([]) } }}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            background: '#0d0d0f', border: '1px solid #1e1e22',
            width: '360px', padding: '24px',
            animation: 'slideIn 0.18s ease',
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#f4a400', letterSpacing: '0.14em', marginBottom: '6px' }}>SWAP TOPIC</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '15px', color: '#f4f4f5' }}>
                Replace "{swapTarget.label}"
              </div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#52525b', marginTop: '4px' }}>
                Choose a substitute — the selected topic will be fetched and swapped in.
              </div>
            </div>

            {swapOptions.length === 0 ? (
              <div style={{
                fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: '#52525b',
                padding: '14px', background: '#111113', border: '1px solid #1e1e22', textAlign: 'center', marginBottom: '16px',
              }}>
                No substitutes available for this topic.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                {swapOptions.map((title, i) => (
                  <button
                    key={i}
                    onClick={() => confirmSwap(title)}
                    disabled={swapLoading}
                    style={{
                      padding: '12px 14px', background: '#111113',
                      border: '1px solid #1e1e22',
                      color: swapLoading ? '#3f3f46' : '#a1a1aa',
                      fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px',
                      textAlign: 'left', cursor: swapLoading ? 'not-allowed' : 'pointer',
                      transition: 'border-color 0.12s, color 0.12s',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}
                    onMouseEnter={e => { if (!swapLoading) { e.currentTarget.style.borderColor = 'rgba(244,164,0,0.4)'; e.currentTarget.style.color = '#f4f4f5' } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = swapLoading ? '#3f3f46' : '#a1a1aa' }}
                  >
                    <span style={{ color: swapLoading ? '#3f3f46' : '#f4a400', fontSize: '11px', flexShrink: 0 }}>
                      {swapLoading ? '···' : '⇄'}
                    </span>
                    {title}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { if (!swapLoading) { setSwapTarget(null); setSwapOptions([]) } }}
              disabled={swapLoading}
              style={{
                width: '100%', padding: '9px',
                background: 'transparent', border: '1px solid #1e1e22',
                color: '#52525b', fontFamily: "'Space Mono', monospace", fontSize: '10px',
                cursor: swapLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
              }}
            >CANCEL</button>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="animate-in" style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          background: isRecalibratingToast ? 'rgba(67,97,238,0.08)' : 'rgba(34,197,94,0.08)',
          border: isRecalibratingToast ? '1px solid rgba(67,97,238,0.3)' : '1px solid rgba(34,197,94,0.3)',
          padding: '10px 22px', zIndex: 500,
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: "'Space Mono', monospace", fontSize: '11px',
          color: isRecalibratingToast ? '#4361ee' : '#22c55e',
          letterSpacing: '0.06em', whiteSpace: 'nowrap',
        }}>
          <span>{isRecalibratingToast ? '◈' : '✓'}</span>
          {toast.toUpperCase()}
        </div>
      )}
    </div>
  )
}
