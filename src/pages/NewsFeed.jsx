import React, { useState, useEffect, useRef } from 'react'

const API_KEY = import.meta.env.VITE_NEWSAPIKEY

const CATEGORIES = ['All', 'AI', 'Security', 'Web', 'Open Source', 'Jobs']

const CATEGORY_QUERIES = {
  All: '(software OR programming OR developer OR devops OR "open source" OR javascript OR python OR cybersecurity OR "machine learning") AND (tech OR code OR engineer OR software)',
  AI: '(("artificial intelligence" OR "machine learning" OR LLM OR "large language model" OR "neural network" OR "deep learning") AND (model OR training OR benchmark OR research OR software OR developer OR deployment OR inference))',
  Security: '((cybersecurity OR "security vulnerability" OR CVE OR "data breach" OR malware OR ransomware OR exploit OR "zero day") AND (software OR system OR network OR patch OR developer))',
  Web: '((javascript OR typescript OR react OR "web development" OR frontend OR "node.js" OR CSS OR WebAssembly OR Svelte OR "Next.js") AND (developer OR framework OR update OR release OR library))',
  'Open Source': '(("open source" OR github OR linux OR "open-source") AND (software OR project OR release OR contributor OR repository OR developer))',
  Jobs: '(("software engineer" OR "software developer" OR programmer OR "tech worker") AND (hiring OR layoffs OR salary OR career OR "job market" OR workforce))',
}

// Comprehensive CS relevance filter — applied after fetch to strip non-tech articles
const CS_PATTERN = new RegExp(
  '\\b(' + [
    // Languages
    'javascript','typescript','python','java(?:script)?','rust','golang','go\\b','ruby','php',
    'swift','kotlin','scala','haskell','dart','julia','c\\+\\+','cpp','c#','perl','lua','r\\b',
    // Web / Frameworks
    'react','vue','angular','svelte','next\\.?js','nuxt','remix','astro','htmx',
    'frontend','back.?end','full.?stack','web.?dev(?:elop)?','node\\.?js','deno','bun\\.sh',
    'graphql','rest.?api','webhook','websocket','html5?','css3?','webpack','vite','esbuild',
    // Cloud & DevOps
    'devops','kubernetes','k8s','docker','container(?:ized)?','microservice','serverless',
    'terraform','ansible','helm','ci\\/cd','github.?actions','jenkins','gitlab.?ci',
    'aws','azure','gcp','cloud.?comput','cloud.?service','cloud.?provider','cloud.?native',
    // AI / ML
    'machine.?learning','deep.?learning','neural.?net','llm','large.?language.?model',
    'gpt','chatgpt','openai','anthropic','gemini','copilot','claude','mistral','llama',
    'transformer','diffusion.?model','fine.?tun','embedding','vector.?db','rag\\b',
    'ai.?model','ai.?agent','ai.?tool','ai.?system','generative.?ai',
    // Security
    'cybersecurity','cyber.?attack','vulnerability','cve\\b','exploit','malware','ransomware',
    'phishing','zero.?day','ddos','data.?breach','patch(?:ing)?','pen.?test','infosec',
    'encryption','cryptograph','firewall','intrusion','botnet','supply.?chain.?attack',
    // Data & Databases
    'database','sql\\b','nosql','postgresql','mysql','mongodb','redis','elasticsearch',
    'data.?science','big.?data','data.?engineer','data.?pipeline','etl\\b','spark\\b','hadoop',
    'data.?warehouse','snowflake','dbt\\b','analytics.?platform',
    // Systems & Hardware
    'operating.?system','linux','kernel','processor','cpu\\b','gpu\\b','semiconductor','chip(?:maker)?',
    'nvidia','intel\\b','amd\\b','qualcomm','arm.?chip','silicon\\b','fpga',
    // Open Source & Tools
    'open.?source','github','gitlab','git\\b','repository','npm\\b','pip\\b','cargo\\b',
    'package.?manager','cli\\b','ide\\b','vscode','intellij','compiler','runtime','debugg',
    // Mobile
    'android','ios(?:\\s|$)','mobile.?app','app.?develop','flutter','react.?native','swift.?ui',
    // Networking
    'tcp\\/ip','http[s2]?\\b','dns\\b','cdn\\b','bandwidth','latency','network.?protocol',
    'internet.?protocol','api.?gateway','load.?balanc',
    // Software / Eng concepts
    'software(?:.?engineer|.?develop|.?architect|.?design|.?test)?',
    'programmer','coding','source.?code','algorithm','design.?pattern','refactor',
    'unit.?test','integration.?test','deployment','infrastructure','dev(?:eloper)?s?\\b',
    'sdk\\b','api\\b','saas\\b','paas\\b','iaas\\b','open.?api','microarch',
    // Emerging tech
    'blockchain','quantum.?comput','iot\\b','edge.?comput','ar\\b|vr\\b|xr\\b',
    'robotics','automation.?software','wasm\\b','webassembly',
    // Companies (tech context)
    'microsoft','google.?(?:cloud|ai|deepmind|chrome)','meta.?(?:ai|platform|llama)',
    'amazon.?(?:aws|web.?service)','apple.?(?:silicon|developer|swift|xcode)',
    'github','cloudflare','hashicorp','jetbrains','vercel','netlify',
    // Jobs (tech-specific)
    'software.?engineer','software.?developer','tech.?layoff','engineering.?team','cto\\b',
  ].join('|') + ')\\b',
  'i'
)

function isCSRelated(title = '', description = '') {
  const text = `${title} ${description}`
  return CS_PATTERN.test(text)
}

const CATEGORY_COLORS = {
  AI: { bg: 'rgba(67,97,238,0.15)', color: '#7b8ff7' },
  Security: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  Web: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  'Open Source': { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
  Jobs: { bg: 'rgba(244,164,0,0.15)', color: '#f4a400' },
  General: { bg: 'rgba(67,97,238,0.15)', color: '#7b8ff7' },
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
  return `${mins} min read`
}

async function fetchNews(query) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NewsAPI error: ${res.status}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message || 'NewsAPI error')
  return data.articles.filter(
    a => a.title && a.title !== '[Removed]' && a.description && isCSRelated(a.title, a.description)
  )
}

function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div className="skeleton" style={{ width: '60px', height: '20px' }} />
        <div className="skeleton" style={{ width: '80px', height: '20px' }} />
      </div>
      <div className="skeleton" style={{ height: '22px', marginBottom: '8px', width: '90%' }} />
      <div className="skeleton" style={{ height: '16px', marginBottom: '4px', width: '100%' }} />
      <div className="skeleton" style={{ height: '16px', width: '70%' }} />
    </div>
  )
}

function NewsCard({ card, index }) {
  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div
        className={`glass-card animate-in stagger-${Math.min(index + 1, 8)}`}
        style={{
          padding: '18px 20px',
          borderLeft: card.breaking ? '3px solid #f4a400' : undefined,
          cursor: 'pointer',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {card.categories.map(cat => {
            const catStyle = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General
            return (
              <span key={cat} style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                fontFamily: 'Space Mono, monospace', letterSpacing: '0.06em',
                background: catStyle.bg, color: catStyle.color,
              }}>{cat}</span>
            )
          })}
          {card.breaking && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f4a400', fontFamily: 'Space Mono, monospace' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              BREAKING
            </span>
          )}
        </div>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: '600', fontSize: '14.5px', color: '#e2e8f0', lineHeight: '1.4', marginBottom: '8px' }}>
          {card.headline}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {card.summary}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>
          <span>{card.source}</span>
          <span style={{ color: '#1e1e35' }}>•</span>
          <span>{card.time}</span>
          <span style={{ color: '#1e1e35' }}>•</span>
          <span>{card.readTime}</span>
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
          const raw = await fetchNews(CATEGORY_QUERIES[activeCategory])
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
    <div style={{ padding: '28px', display: 'flex', gap: '28px', minHeight: '100%' }}>
      {/* Left feed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

        {/* Hero */}
        {loading ? (
          <div className="glass-card" style={{ padding: '28px', minHeight: '160px' }}>
            <div className="skeleton" style={{ width: '80px', height: '22px', marginBottom: '14px' }} />
            <div className="skeleton" style={{ height: '28px', width: '85%', marginBottom: '10px' }} />
            <div className="skeleton" style={{ height: '18px', width: '100%', marginBottom: '6px' }} />
            <div className="skeleton" style={{ height: '18px', width: '70%' }} />
          </div>
        ) : error ? (
          <div className="glass-card bracket-corner" style={{ padding: '28px', color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>
            // Error: {error}
          </div>
        ) : hero ? (
          <a href={hero.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="bracket-corner animate-in stagger-1" style={{
              background: 'linear-gradient(135deg, rgba(67,97,238,0.12) 0%, rgba(18,18,31,0.9) 60%)',
              border: '1px solid rgba(67,97,238,0.3)',
              borderRadius: '14px',
              padding: '28px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(67,97,238,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(ellipse at top right, rgba(67,97,238,0.1), transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {hero.categories.map(cat => {
                  const catStyle = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General
                  return (
                    <span key={cat} style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', background: catStyle.bg, color: catStyle.color, padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.08em' }}>
                      {cat}
                    </span>
                  )
                })}
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#f4a400' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  FEATURED STORY
                </span>
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '22px', color: '#fff', lineHeight: '1.3', marginBottom: '14px', maxWidth: '700px' }}>
                {hero.headline}
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '18px', maxWidth: '620px' }}>
                {hero.summary}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#475569', fontFamily: 'Space Mono, monospace' }}>
                  <span>{hero.source}</span>
                  <span>•</span>
                  <span>{hero.time}</span>
                  <span>•</span>
                  <span>{hero.readTime}</span>
                </div>
                <button style={{
                  marginLeft: 'auto',
                  padding: '8px 18px',
                  background: '#4361ee',
                  border: 'none',
                  borderRadius: '7px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 0 20px rgba(67,97,238,0.4)',
                  transition: 'all 0.18s',
                }}>Read Story →</button>
              </div>
            </div>
          </a>
        ) : null}

        {/* Headlines ticker */}
        {headlines.length > 0 && (
          <div className="animate-in stagger-2" style={{
            background: 'rgba(12,12,20,0.8)',
            border: '1px solid rgba(67,97,238,0.12)',
            borderRadius: '8px',
            padding: '10px 0',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to right, rgba(12,12,20,1), transparent)', zIndex: 2 }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to left, rgba(12,12,20,1), transparent)', zIndex: 2 }} />
            <div style={{ paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', position: 'relative', zIndex: 3 }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#f4a400', letterSpacing: '0.1em', fontWeight: '700' }}>// LIVE</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div className="ticker-inner" style={{ paddingLeft: '20px' }}>
                {[...headlines, ...headlines].map((h, i) => (
                  <span key={i} style={{
                    fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#94a3b8',
                    display: 'inline-flex', alignItems: 'center', gap: '16px',
                    cursor: 'pointer',
                    transition: 'color 0.18s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                  >
                    <span style={{ color: '#4361ee' }}>▸</span> {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className="animate-in stagger-3" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: activeCategory === cat ? '1px solid #4361ee' : '1px solid rgba(30,30,53,0.8)',
                background: activeCategory === cat ? 'rgba(67,97,238,0.15)' : 'rgba(15,15,26,0.6)',
                color: activeCategory === cat ? '#7b8ff7' : '#64748b',
                fontSize: '13px',
                fontWeight: activeCategory === cat ? '600' : '400',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: activeCategory === cat ? '0 0 12px rgba(67,97,238,0.2)' : 'none',
                transition: 'all 0.18s',
              }}
            >{cat}</button>
          ))}
        </div>

        {/* News grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : newsCards.map((card, i) => <NewsCard key={card.id} card={card} index={i} />)
          }
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Daily streak */}
        <div className="glass-card bracket-corner animate-in stagger-2" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '16px', textAlign: 'left' }}>
            Daily Streak
          </div>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: '0 auto', display: 'block' }}>
            <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(30,30,53,0.8)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="28"
              fill="none"
              stroke="url(#streakGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(streak / 30) * circumference} ${circumference}`}
              className="ring-gauge"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <defs>
              <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4361ee" />
                <stop offset="100%" stopColor="#f4a400" />
              </linearGradient>
            </defs>
            <text x="40" y="37" textAnchor="middle" fill="#fff" fontFamily="Syne" fontSize="18" fontWeight="800">{streak}</text>
            <text x="40" y="52" textAnchor="middle" fill="#64748b" fontFamily="Space Mono" fontSize="9">DAYS</text>
          </svg>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#f4a400', marginTop: '10px' }}>
            Keep it up! Best: 14 days
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{
                width: '28px', height: '28px',
                borderRadius: '6px',
                background: i < 5 ? 'rgba(67,97,238,0.25)' : 'rgba(30,30,53,0.4)',
                border: i < 5 ? '1px solid rgba(67,97,238,0.4)' : '1px solid rgba(30,30,53,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontFamily: 'Space Mono, monospace',
                color: i < 5 ? '#7b8ff7' : '#374151',
              }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Live Sources */}
        <div className="glass-card animate-in stagger-3" style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Top Sources
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#4361ee' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '16px', width: `${70 + i * 5}%` }} />
                ))
              : Array.from(new Set(newsCards.map(c => c.source))).slice(0, 6).map((src, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', fontWeight: '700', color: i < 3 ? '#4361ee' : '#1e1e35', minWidth: '20px' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>{src}</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Category breakdown */}
        <div className="glass-card animate-in stagger-4" style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px', color: '#e2e8f0', marginBottom: '4px' }}>
            In This Feed
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#64748b', marginBottom: '14px' }}>
            {loading ? 'Loading...' : `${newsCards.length} articles fetched`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CATEGORIES.filter(c => c !== 'All').map(cat => {
              const count = newsCards.filter(c => c.categories.includes(cat)).length
              const catStyle = CATEGORY_COLORS[cat]
              return (
                <div key={cat} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px',
                  background: 'rgba(15,15,26,0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(30,30,53,0.8)',
                  cursor: 'pointer',
                  transition: 'border-color 0.18s',
                }}
                  onClick={() => setActiveCategory(cat)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(67,97,238,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,30,53,0.8)'}
                >
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', background: catStyle.bg, color: catStyle.color, padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>{cat}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>{loading ? '–' : count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
