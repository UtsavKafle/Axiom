import React, { useState, useEffect, useRef } from 'react'

const CATEGORIES = ['All', 'AI', 'Security', 'Web', 'Open Source', 'Jobs']

const CATEGORY_QUERIES = {
  All: '(software OR programming OR developer OR devops OR "open source" OR javascript OR python OR cybersecurity OR "machine learning") AND (tech OR code OR engineer OR software)',
  AI: '(("artificial intelligence" OR "machine learning" OR LLM OR "large language model" OR "neural network" OR "deep learning") AND (model OR training OR benchmark OR research OR software OR developer OR deployment OR inference))',
  Security: '((cybersecurity OR "security vulnerability" OR CVE OR "data breach" OR malware OR ransomware OR exploit OR "zero day") AND (software OR system OR network OR patch OR developer))',
  Web: '((javascript OR typescript OR react OR "web development" OR frontend OR "node.js" OR CSS OR WebAssembly OR Svelte OR "Next.js") AND (developer OR framework OR update OR release OR library))',
  'Open Source': '(("open source" OR github OR linux OR "open-source") AND (software OR project OR release OR contributor OR repository OR developer))',
  Jobs: '(("software engineer" OR "software developer" OR programmer OR "tech worker") AND (hiring OR layoffs OR salary OR career OR "job market" OR workforce))',
}

const CS_PATTERN = new RegExp(
  '\\b(' + [
    'javascript','typescript','python','java(?:script)?','rust','golang','go\\b','ruby','php',
    'swift','kotlin','scala','haskell','dart','julia','c\\+\\+','cpp','c#','perl','lua','r\\b',
    'react','vue','angular','svelte','next\\.?js','nuxt','remix','astro','htmx',
    'frontend','back.?end','full.?stack','web.?dev(?:elop)?','node\\.?js','deno','bun\\.sh',
    'graphql','rest.?api','webhook','websocket','html5?','css3?','webpack','vite','esbuild',
    'devops','kubernetes','k8s','docker','container(?:ized)?','microservice','serverless',
    'terraform','ansible','helm','ci\\/cd','github.?actions','jenkins','gitlab.?ci',
    'aws','azure','gcp','cloud.?comput','cloud.?service','cloud.?provider','cloud.?native',
    'machine.?learning','deep.?learning','neural.?net','llm','large.?language.?model',
    'gpt','chatgpt','openai','anthropic','gemini','copilot','claude','mistral','llama',
    'transformer','diffusion.?model','fine.?tun','embedding','vector.?db','rag\\b',
    'ai.?model','ai.?agent','ai.?tool','ai.?system','generative.?ai',
    'cybersecurity','cyber.?attack','vulnerability','cve\\b','exploit','malware','ransomware',
    'phishing','zero.?day','ddos','data.?breach','patch(?:ing)?','pen.?test','infosec',
    'encryption','cryptograph','firewall','intrusion','botnet','supply.?chain.?attack',
    'database','sql\\b','nosql','postgresql','mysql','mongodb','redis','elasticsearch',
    'data.?science','big.?data','data.?engineer','data.?pipeline','etl\\b','spark\\b','hadoop',
    'data.?warehouse','snowflake','dbt\\b','analytics.?platform',
    'operating.?system','linux','kernel','processor','cpu\\b','gpu\\b','semiconductor','chip(?:maker)?',
    'nvidia','intel\\b','amd\\b','qualcomm','arm.?chip','silicon\\b','fpga',
    'open.?source','github','gitlab','git\\b','repository','npm\\b','pip\\b','cargo\\b',
    'package.?manager','cli\\b','ide\\b','vscode','intellij','compiler','runtime','debugg',
    'android','ios(?:\\s|$)','mobile.?app','app.?develop','flutter','react.?native','swift.?ui',
    'tcp\\/ip','http[s2]?\\b','dns\\b','cdn\\b','bandwidth','latency','network.?protocol',
    'internet.?protocol','api.?gateway','load.?balanc',
    'software(?:.?engineer|.?develop|.?architect|.?design|.?test)?',
    'programmer','coding','source.?code','algorithm','design.?pattern','refactor',
    'unit.?test','integration.?test','deployment','infrastructure','dev(?:eloper)?s?\\b',
    'sdk\\b','api\\b','saas\\b','paas\\b','iaas\\b','open.?api','microarch',
    'blockchain','quantum.?comput','iot\\b','edge.?comput','ar\\b|vr\\b|xr\\b',
    'robotics','automation.?software','wasm\\b','webassembly',
    'microsoft','google.?(?:cloud|ai|deepmind|chrome)','meta.?(?:ai|platform|llama)',
    'amazon.?(?:aws|web.?service)','apple.?(?:silicon|developer|swift|xcode)',
    'github','cloudflare','hashicorp','jetbrains','vercel','netlify',
    'software.?engineer','software.?developer','tech.?layoff','engineering.?team','cto\\b',
  ].join('|') + ')\\b',
  'i'
)

function isCSRelated(title = '', description = '') {
  return CS_PATTERN.test(`${title} ${description}`)
}

const CATEGORY_COLORS = {
  AI:            { bg: 'rgba(67,97,238,0.12)',  color: '#6b83f0', border: 'rgba(67,97,238,0.3)' },
  Security:      { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  Web:           { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  'Open Source': { bg: 'rgba(6,182,212,0.12)',  color: '#22d3ee', border: 'rgba(6,182,212,0.3)' },
  Jobs:          { bg: 'rgba(244,164,0,0.12)',  color: '#f4a400', border: 'rgba(244,164,0,0.3)' },
  General:       { bg: 'rgba(67,97,238,0.08)',  color: '#6b83f0', border: 'rgba(67,97,238,0.2)' },
}

function guessCategories(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase()
  const cats = []
  if (/\b(ai|artificial intelligence|machine learning|llm|gpt|neural|deep learning|chatgpt|openai|anthropic|gemini|copilot|claude)\b/.test(text)) cats.push('AI')
  if (/\b(security|vulnerability|cve|hack|breach|malware|ransomware|exploit|zero.?day|phishing|ddos)\b/.test(text)) cats.push('Security')
  if (/\b(javascript|typescript|react|vue|angular|frontend|web dev|node\.?js|css|html|svelte|nextjs|next\.js)\b/.test(text)) cats.push('Web')
  if (/\b(open.?source|github|linux|oss|foss|git|kernel|repository)\b/.test(text)) cats.push('Open Source')
  if (/\b(hiring|layoff|laid off|jobs|salary|career|internship|employment|workforce|engineers)\b/.test(text)) cats.push('Jobs')
  return cats.length > 0 ? cats : ['General']
}

function getRelativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function estimateReadTime(content = '', description = '') {
  const words = (content + ' ' + description).split(/\s+/).length
  const mins = Math.max(2, Math.round(words / 200))
  return `${mins}m read`
}

async function fetchNews(category) {
  const res = await fetch(`/api/news/?category=${encodeURIComponent(category)}`)
  if (!res.ok) throw new Error(`News fetch error: ${res.status}`)
  const articles = await res.json()
  return articles.filter(a => isCSRelated(a.title, a.description))
}

function SkeletonCard() {
  return (
    <div style={{ padding: '14px 16px', background: '#111113', border: '1px solid #1e1e22', borderBottom: 'none' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div className="skeleton" style={{ width: '48px', height: '16px' }} />
        <div className="skeleton" style={{ width: '64px', height: '16px' }} />
        <div className="skeleton" style={{ width: '56px', height: '16px', marginLeft: 'auto' }} />
      </div>
      <div className="skeleton" style={{ height: '18px', width: '88%', marginBottom: '6px' }} />
      <div className="skeleton" style={{ height: '14px', width: '100%', marginBottom: '3px' }} />
      <div className="skeleton" style={{ height: '14px', width: '65%' }} />
    </div>
  )
}

function NewsCard({ card, index, isLast }) {
  return (
    <a href={card.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className={`animate-in stagger-${Math.min(index + 1, 8)}`}
        style={{
          padding: '14px 16px',
          background: '#111113',
          border: '1px solid #1e1e22',
          borderBottom: isLast ? '1px solid #1e1e22' : 'none',
          cursor: 'pointer',
          transition: 'background 0.12s, border-color 0.12s',
          borderLeft: card.breaking ? '2px solid #f4a400' : '1px solid #1e1e22',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#161618' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111113' }}
      >
        {/* Row 1: timestamp + source + categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', whiteSpace: 'nowrap' }}>
            {card.time}
          </span>
          <span style={{ color: '#2a2a32', fontSize: '10px' }}>—</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#71717a', fontWeight: '700', letterSpacing: '0.05em' }}>
            {card.source.toUpperCase()}
          </span>
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {card.categories.slice(0, 2).map(cat => {
              const cs = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General
              return (
                <span key={cat} style={{
                  padding: '1px 6px',
                  fontSize: '10px', fontWeight: '600',
                  fontFamily: "'Space Mono', monospace",
                  background: cs.bg, color: cs.color,
                  border: `1px solid ${cs.border}`,
                }}>{cat}</span>
              )
            })}
          </div>
        </div>
        {/* Row 2: headline */}
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '500', fontSize: '13.5px', color: '#f4f4f5', lineHeight: '1.45', marginBottom: '6px' }}>
          {card.headline}
        </div>
        {/* Row 3: summary */}
        <div style={{ fontSize: '12px', color: '#71717a', lineHeight: '1.55', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {card.summary}
        </div>
        {/* Row 4: meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', color: '#3f3f46', fontFamily: "'Space Mono', monospace" }}>
          <span>{card.readTime}</span>
          {card.breaking && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f4a400', marginLeft: 'auto' }}>
              <span className="pulse-dot" style={{ width: '5px', height: '5px', background: '#ef4444', display: 'inline-block' }} />
              BREAKING
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

function mapArticles(articles, activeCategory = 'All') {
  return articles.map((a, i) => {
    const cats = guessCategories(a.title, a.description)
    if (activeCategory !== 'All' && !cats.includes(activeCategory)) {
      cats.unshift(activeCategory)
    }
    return {
      id: i,
      categories: cats,
      breaking: i === 0,
      headline: a.title,
      summary: a.description,
      source: a.source?.name || 'Unknown',
      time: getRelativeTime(a.publishedAt),
      readTime: estimateReadTime(a.content, a.description),
      url: a.url,
      publishedAt: a.publishedAt,
    }
  })
}

export default function NewsFeed() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hero, setHero] = useState(null)
  const [headlines, setHeadlines] = useState([])
  const [newsCards, setNewsCards] = useState([])
  const [streak] = useState(7)
  const cache = useRef({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let articles
        if (cache.current[activeCategory]) {
          articles = cache.current[activeCategory]
        } else {
          const raw = await fetchNews(activeCategory)
          articles = mapArticles(raw, activeCategory)
          cache.current[activeCategory] = articles
        }

        if (articles.length === 0) {
          setError('No articles found for this category.')
          setNewsCards([])
          setHeadlines([])
          setHero(null)
          return
        }

        setHero(articles[0])
        setHeadlines(articles.slice(1, 10).map(a => a.headline))
        setNewsCards(articles.slice(1))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCategory])

  const circumference = 2 * Math.PI * 28

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* Center feed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid #1e1e22' }}>

        {/* Hero */}
        {loading ? (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e1e22' }}>
            <div className="skeleton" style={{ width: '72px', height: '16px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ height: '28px', width: '80%', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '16px', width: '100%', marginBottom: '5px' }} />
            <div className="skeleton" style={{ height: '16px', width: '60%' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e1e22', color: '#f87171', fontFamily: "'Space Mono', monospace", fontSize: '12px' }}>
            // Error: {error}
          </div>
        ) : hero ? (
          <a href={hero.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div
              className="animate-in stagger-1"
              style={{
                padding: '24px',
                borderBottom: '1px solid #1e1e22',
                background: '#111113',
                borderLeft: '3px solid #4361ee',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#161618' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#111113' }}
            >
              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#4361ee', letterSpacing: '0.08em' }}>
                  <span className="pulse-dot" style={{ width: '5px', height: '5px', background: '#4361ee', display: 'inline-block' }} />
                  FEATURED
                </span>
                <span style={{ color: '#2a2a32' }}>—</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', fontWeight: '700' }}>{hero.source.toUpperCase()}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#3f3f46' }}>{hero.time}</span>
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                  {hero.categories.slice(0, 2).map(cat => {
                    const cs = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General
                    return (
                      <span key={cat} style={{ padding: '1px 6px', fontSize: '10px', fontFamily: "'Space Mono', monospace", background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>
                        {cat}
                      </span>
                    )
                  })}
                </div>
              </div>
              {/* Headline — serif display */}
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: '24px', color: '#f4f4f5', lineHeight: '1.25', marginBottom: '10px', maxWidth: '640px' }}>
                {hero.headline}
              </h2>
              <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '13px', color: '#a1a1aa', lineHeight: '1.65', marginBottom: '16px', maxWidth: '560px' }}>
                {hero.summary}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b' }}>{hero.readTime}</span>
                <button style={{
                  marginLeft: 'auto',
                  padding: '7px 16px',
                  background: '#4361ee',
                  border: 'none',
                  borderRadius: '2px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  transition: 'opacity 0.12s',
                }}>Read Story →</button>
              </div>
            </div>
          </a>
        ) : null}

        {/* Headlines ticker */}
        {headlines.length > 0 && (
          <div className="animate-in stagger-2" style={{
            background: '#09090b',
            borderBottom: '1px solid #1e1e22',
            padding: '8px 0',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #09090b, transparent)', zIndex: 2 }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to left, #09090b, transparent)', zIndex: 2 }} />
            <div style={{ paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', position: 'relative', zIndex: 3 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#f4a400', letterSpacing: '0.1em' }}>// LIVE</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div className="ticker-inner" style={{ paddingLeft: '16px' }}>
                {[...headlines, ...headlines].map((h, i) => (
                  <span key={i} style={{
                    fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#71717a',
                    display: 'inline-flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
                    transition: 'color 0.12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
                  >
                    <span style={{ color: '#4361ee' }}>▸</span> {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className="animate-in stagger-3" style={{
          display: 'flex', gap: '0', padding: '0',
          borderBottom: '1px solid #1e1e22',
          background: '#09090b',
          flexShrink: 0,
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '9px 16px',
                border: 'none',
                borderBottom: activeCategory === cat ? '2px solid #4361ee' : '2px solid transparent',
                background: 'transparent',
                color: activeCategory === cat ? '#f4f4f5' : '#71717a',
                fontSize: '12px',
                fontWeight: activeCategory === cat ? '500' : '400',
                cursor: 'pointer',
                fontFamily: "'IBM Plex Sans', sans-serif",
                transition: 'all 0.12s',
                whiteSpace: 'nowrap',
              }}
            >{cat}</button>
          ))}
        </div>

        {/* News list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : newsCards.map((card, i) => (
                <NewsCard key={card.id} card={card} index={i} isLast={i === newsCards.length - 1} />
              ))
          }
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0d0d0f' }}>

        {/* Daily streak */}
        <div className="animate-in stagger-2" style={{ padding: '16px', borderBottom: '1px solid #1e1e22' }}>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '11px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '12px', textTransform: 'uppercase' }}>
            Daily Streak
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="64" height="64" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="28" fill="none" stroke="#1e1e22" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="28"
                fill="none"
                stroke="#4361ee"
                strokeWidth="6"
                strokeLinecap="square"
                strokeDasharray={`${(streak / 30) * circumference} ${circumference}`}
                className="ring-gauge"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
              <text x="40" y="37" textAnchor="middle" fill="#f4f4f5" fontFamily="IBM Plex Sans" fontSize="17" fontWeight="600">{streak}</text>
              <text x="40" y="51" textAnchor="middle" fill="#71717a" fontFamily="Space Mono" fontSize="8">DAYS</text>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#f4a400', marginBottom: '8px' }}>Best: 14 days</div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} style={{
                    width: '22px', height: '22px',
                    background: i < 5 ? 'rgba(67,97,238,0.2)' : '#111113',
                    border: i < 5 ? '1px solid rgba(67,97,238,0.35)' : '1px solid #1e1e22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontFamily: "'Space Mono', monospace",
                    color: i < 5 ? '#6b83f0' : '#3f3f46',
                  }}>{d}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trending topics */}
        <div className="animate-in stagger-3" style={{ padding: '16px', borderBottom: '1px solid #1e1e22', flex: 1 }}>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '11px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            Top Sources
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#4361ee' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {loading
              ? Array(5).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '14px', marginBottom: '10px', width: `${75 + i * 3}%` }} />
                ))
              : Array.from(new Set(newsCards.map(c => c.source))).slice(0, 7).map((src, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 0',
                    borderBottom: i < 6 ? '1px solid #1e1e22' : 'none',
                  }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', fontWeight: '700', color: i < 3 ? '#4361ee' : '#3f3f46', minWidth: '16px' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: i < 3 ? '#a1a1aa' : '#52525b', fontWeight: '400' }}>{src}</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Category breakdown */}
        <div className="animate-in stagger-4" style={{ padding: '16px' }}>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: '600', fontSize: '11px', color: '#71717a', letterSpacing: '0.08em', marginBottom: '4px', textTransform: 'uppercase' }}>
            In This Feed
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: '#52525b', marginBottom: '10px' }}>
            {loading ? 'Loading...' : `${newsCards.length} articles`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {CATEGORIES.filter(c => c !== 'All').map((cat, i, arr) => {
              const count = newsCards.filter(c => c.categories.includes(cat)).length
              const cs = CATEGORY_COLORS[cat]
              return (
                <div key={cat} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid #1e1e22' : 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.12s',
                }}
                  onClick={() => setActiveCategory(cat)}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', background: cs.bg, color: cs.color, padding: '1px 6px', border: `1px solid ${cs.border}` }}>{cat}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#52525b', marginLeft: 'auto' }}>{loading ? '–' : count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
