import os
import re
import json
import time
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from utils.token_tracker import track_token_usage

logger = logging.getLogger(__name__)

WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
_IAM_TOKEN_URL     = "https://iam.cloud.ibm.com/identity/token"
_IAM_TTL_SECONDS   = 50 * 60
_iam_cache: dict   = {}

# ── Feedback-only prompt (scores are computed in Python, not by the AI) ────────

FEEDBACK_PROMPT = """You are an internal resume feedback agent for Axiom, a CS student career platform.
You will receive a resume and a scoring summary showing what was found and what was missing.
Your job is to write the three feedback arrays only. Return ONLY a valid JSON object — no preamble, no markdown.

Return exactly this structure:
{
  "strengths": [
    {"issue": "<title under 8 words>", "fix": "<1-2 sentences: what this signals to recruiters>"}
  ],
  "improvements": [
    {"issue": "<title under 8 words>", "fix": "<1-2 sentences: specific actionable fix with example rewrite>"}
  ],
  "critical": [
    {"issue": "<title under 8 words>", "fix": "<1-2 sentences: what to fix immediately>"}
  ]
}

RULES:
- strengths: 2–4 items. Each must reference something specific found in the resume. No invented praise.
- improvements: 2–4 items. Each must include an example rewrite or concrete action step.
- critical: 0–3 items. Only include issues that would cause immediate rejection:
    missing contact info, no experience/projects section, no skills section, zero quantified bullets on an experienced candidate.
    Leave as [] if none apply.
- issue fields must be under 8 words.
- fix fields must be 1–2 sentences.
- Do not output anything outside the JSON object."""


# ── IAM token ─────────────────────────────────────────────────────────────────

async def _get_iam_token(client: httpx.AsyncClient) -> str:
    now = time.monotonic()
    if _iam_cache.get("token") and _iam_cache.get("expires_at", 0) > now:
        return _iam_cache["token"]
    resp = await client.post(
        _IAM_TOKEN_URL,
        content=f"grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={WATSONX_API_KEY}",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30.0,
    )
    resp.raise_for_status()
    token = resp.json().get("access_token")
    if not token:
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
    _iam_cache["token"]      = token
    _iam_cache["expires_at"] = now + _IAM_TTL_SECONDS
    return token


async def _call_watsonx(client: httpx.AsyncClient, token: str, user_msg: str) -> tuple[str, dict]:
    url = f"{WATSONX_URL}/ml/v1/text/chat?version=2023-05-29"
    payload = {
        "model_id": "ibm/granite-4-h-small",
        "project_id": WATSONX_PROJECT_ID,
        "messages": [
            {"role": "system", "content": FEEDBACK_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        "parameters": {
            "max_new_tokens": 1200,
            "temperature": 0,
            "repetition_penalty": 1.1,
        },
    }
    resp = await client.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        timeout=60.0,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"], data


# ── PDF extraction ─────────────────────────────────────────────────────────────

def _extract_pdf_text(data: bytes) -> str:
    try:
        import io
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n".join(pages).strip()
        if not text:
            raise ValueError("PDF appears to have no extractable text (may be image-based)")
        return text
    except ImportError:
        raise HTTPException(status_code=500, detail="PDF parsing library not installed")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {e}")


# ── Resume validity check ──────────────────────────────────────────────────────

_RESUME_SIGNALS = re.compile(
    r'\b(education|experience|skills|work history|employment|projects?|internship|university|college|degree|'
    r'bachelor|master|phd|gpa|objective|summary|certifications?|technologies|achievements?|awards?|references?)\b',
    re.IGNORECASE,
)

def _is_resume(text: str) -> bool:
    return len(set(m.lower() for m in _RESUME_SIGNALS.findall(text))) >= 3


# ── Deterministic scoring ──────────────────────────────────────────────────────

def _clamp(val: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, val))


def _score_ats(text: str) -> tuple[int, dict]:
    t = text.lower()
    findings = {}

    # Section headers
    sections = {
        "education":  bool(re.search(r'\beducation\b',           t)),
        "experience": bool(re.search(r'\bexperience\b|\bwork\b', t)),
        "skills":     bool(re.search(r'\bskills\b|\btechnolog',  t)),
        "projects":   bool(re.search(r'\bprojects?\b',           t)),
    }
    found_sections = sum(sections.values())
    section_bonus = 8 if found_sections == 4 else (4 if found_sections == 3 else 0)
    findings["sections_found"] = [k for k, v in sections.items() if v]

    # ATS keywords
    ats_keywords = [
        "rest api", "ci/cd", "agile", "microservices", "unit test", "aws", "gcp", "azure",
        "docker", "kubernetes", "git", "version control", "data structures", "algorithms",
        "machine learning", "cloud", "distributed", "sql", "nosql", "api",
    ]
    kw_hits = [kw for kw in ats_keywords if kw in t][:6]
    kw_bonus = len(kw_hits) * 5
    findings["ats_keywords"] = kw_hits

    # Contact signals
    has_github   = bool(re.search(r'github\.com/', t))
    has_linkedin = bool(re.search(r'linkedin\.com/', t))
    has_email    = bool(re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text))
    findings["has_github"]   = has_github
    findings["has_linkedin"] = has_linkedin
    findings["has_email"]    = has_email

    # Deductions
    has_skills     = sections["skills"]
    has_contact    = has_email
    generic_obj    = bool(re.search(
        r'\b(seeking a position|looking for an opportunity|passionate about|aspiring to|'
        r'eager to contribute|seeking employment|to obtain a position)\b', t))
    findings["generic_objective"] = generic_obj

    score = (
        60
        + section_bonus
        + kw_bonus
        + (7 if has_github   else 0)
        + (5 if has_linkedin else 0)
        + (5 if has_email    else 0)
        - (8  if not has_skills  else 0)
        - (10 if not has_contact else 0)
        - (5  if generic_obj     else 0)
    )
    return _clamp(score), findings


def _score_impact(text: str) -> tuple[int, dict]:
    findings = {}

    # Count bullet lines — broad pattern to handle PDF-extracted text
    bullet_lines = re.findall(
        r'(?m)^[\s]*[-•*·▪▸►▶◆◇○●■□✓✔\u2022\u2023\u25e6\u2043>]\s*.{8,}', text
    )
    # Fallback: PDFs sometimes strip bullet chars — detect lines that start with an action verb
    if not bullet_lines:
        bullet_lines = re.findall(
            r'(?m)^\s*(?:Built|Designed|Developed|Implemented|Created|Led|Deployed|Reduced|'
            r'Improved|Increased|Optimized|Automated|Integrated|Launched|Scaled|Refactored|'
            r'Migrated|Maintained|Delivered|Engineered|Established|Streamlined|Coordinated|'
            r'Managed|Directed|Produced|Generated|Achieved|Accelerated|Enhanced|Architected|'
            r'Shipped|Configured|Wrote|Built|Analyzed|Monitored|Tested|Reviewed)[^\n]{8,}',
            text,
        )
    total = len(bullet_lines)
    findings["total_bullets"] = total

    # Quantified bullets: contain a number with a unit or % or scale indicator
    quant_pattern = re.compile(
        r'\b\d+[\.,]?\d*\s*(%|percent|x\b|users?|customers?|engineers?|requests?|'
        r'ms\b|seconds?|minutes?|hours?|days?|weeks?|months?|k\b|m\b|billion|million|'
        r'thousand|features?|services?|endpoints?|prs?\b|commits?|lines?|repos?|'
        r'teams?|members?|clients?|sites?|apps?|\$|€|£)\b',
        re.IGNORECASE,
    )
    quantified = [b for b in bullet_lines if quant_pattern.search(b)]
    findings["quantified_bullets"] = len(quantified)

    if total == 0:
        raw = 0
    elif len(quantified) == 0:
        raw = 40
    else:
        # Scale from 40 (no quantified) to 100 (all quantified)
        ratio = len(quantified) / total
        raw = round(40 + ratio * 60)

    # Strong / weak verb adjustment
    strong_verbs = re.findall(
        r'\b(built|designed|architected|led|shipped|deployed|reduced|improved|increased|'
        r'optimized|automated|integrated|implemented|developed|created|launched|scaled|'
        r'refactored|migrated|maintained|delivered|engineered|established|streamlined|'
        r'coordinated|managed|directed|produced|generated|achieved|accelerated|enhanced)\b',
        text, re.IGNORECASE,
    )
    weak_verbs = re.findall(
        r'\b(helped|assisted|worked on|participated in|involved in|'
        r'responsible for|supported|aided)\b',
        text, re.IGNORECASE,
    )
    findings["strong_verb_count"] = len(strong_verbs)
    findings["weak_verb_count"]   = len(weak_verbs)

    adjustment = 0
    if len(strong_verbs) >= 2:
        adjustment += 15
    if len(weak_verbs) >= 4:
        adjustment -= 10

    return _clamp(raw + adjustment), findings


def _score_tech(text: str) -> tuple[int, dict]:
    t = text.lower()
    findings = {}

    tier1 = ["python","javascript","typescript","java"," c++","golang"," go ","rust",
             "swift","kotlin","c#","scala","ruby","php","dart"]
    tier2 = ["react","angular","vue","next.js","node.js","express","django","fastapi",
             "flask","spring","docker","kubernetes","aws","gcp","azure","tensorflow",
             "pytorch","spark","kafka","redis","postgresql","mysql","mongodb","graphql","grpc"]
    tier3 = ["git","linux","ci/cd","terraform","ansible","nginx","jest","pytest",
             "selenium","pandas","numpy","scikit","tailwind","webpack","vite",
             "firebase","supabase","rest","flutter","react native"]

    t1_hits = list({kw.strip() for kw in tier1 if kw in t})[:4]
    t2_hits = list({kw.strip() for kw in tier2 if kw in t})[:8]
    t3_hits = list({kw.strip() for kw in tier3 if kw in t})[:10]
    findings["tier1"] = t1_hits
    findings["tier2"] = t2_hits
    findings["tier3"] = t3_hits

    deployed_urls = re.findall(
        r'https?://(?!github\.com)(?!linkedin\.com)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}[^\s]*', text
    )
    has_github      = bool(re.search(r'github\.com/', t))
    has_open_source = bool(re.search(r'\bopen.?source\b|\bcontributed? to\b', t, re.IGNORECASE))
    findings["deployed_urls"]   = len(deployed_urls)
    findings["has_github"]      = has_github
    findings["has_open_source"] = has_open_source

    score = (
        len(t1_hits) * 8
        + len(t2_hits) * 5
        + len(t3_hits) * 3
        + (10 if len(deployed_urls) >= 2 else 0)
        + (8  if has_github      else 0)
        + (5  if has_open_source else 0)
    )
    if not t1_hits and not t2_hits:
        score = 0
    return _clamp(score), findings


def _score_format(text: str) -> tuple[int, dict]:
    findings = {}

    has_email   = bool(re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text))
    has_headers = bool(re.search(
        r'\b(education|experience|skills|projects?|work)\b', text, re.IGNORECASE))

    # Name heuristic: first non-empty line is short and title-cased / all-caps
    first_lines = [l.strip() for l in text.splitlines() if l.strip()][:3]
    has_name = any(
        re.match(r'^[A-Z][a-z]+([ \-][A-Z][a-z]+)+$', l) or
        re.match(r'^[A-Z]{2,}([ ][A-Z]{2,})+$', l)
        for l in first_lines
    )

    # Generic objective
    generic_obj = bool(re.search(
        r'\b(seeking a position|looking for an opportunity|passionate about|aspiring to|'
        r'eager to contribute|seeking employment|to obtain a position)\b',
        text, re.IGNORECASE,
    ))

    # Multi-page heuristic
    bullet_count = len(re.findall(r'(?m)^[\s]*[-•*·▪▸>]\s+', text))
    over_one_page = len(text) > 5000 and bullet_count > 40

    # Date consistency: check for mixed format presence
    date_formats = {
        "mon_year": bool(re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b', text)),
        "mm_yyyy":  bool(re.search(r'\b(0?[1-9]|1[0-2])/\d{4}\b', text)),
        "yyyy_mm":  bool(re.search(r'\b\d{4}[-/](0[1-9]|1[0-2])\b', text)),
    }
    mixed_dates = sum(date_formats.values()) > 1
    findings.update({
        "has_email": has_email, "has_headers": has_headers,
        "has_name": has_name, "generic_obj": generic_obj,
        "over_one_page": over_one_page, "mixed_dates": mixed_dates,
    })

    score = (
        100
        - (20 if over_one_page  else 0)
        - (15 if not has_headers else 0)
        - (10 if not has_email   else 0)
        - (8  if generic_obj     else 0)
        - (5  if not has_name    else 0)
        - (5  if mixed_dates     else 0)
        + (5  if has_name and has_email else 0)
        + (5  if date_formats["mon_year"] and not mixed_dates else 0)
    )
    return _clamp(score), findings


def _compute_scores(text: str) -> tuple[dict, dict]:
    ats,    ats_f    = _score_ats(text)
    impact, impact_f = _score_impact(text)
    tech,   tech_f   = _score_tech(text)
    fmt,    fmt_f    = _score_format(text)
    overall = _clamp(round(ats * 0.30 + impact * 0.20 + tech * 0.30 + fmt * 0.20))

    scores = {
        "overall_score": overall,
        "ats_score":     ats,
        "impact_score":  impact,
        "tech_score":    tech,
        "format_score":  fmt,
    }
    findings = {
        "ats":    ats_f,
        "impact": impact_f,
        "tech":   tech_f,
        "format": fmt_f,
    }
    return scores, findings


def _build_feedback_prompt(resume_text: str, scores: dict, findings: dict) -> str:
    f = findings
    summary = f"""
COMPUTED SCORES (do not change these — they are final):
  Overall: {scores['overall_score']}  ATS: {scores['ats_score']}  Impact: {scores['impact_score']}  Tech: {scores['tech_score']}  Format: {scores['format_score']}

WHAT WAS FOUND:
  Sections detected: {', '.join(f['ats']['sections_found']) or 'none'}
  ATS keywords matched: {', '.join(f['ats']['ats_keywords']) or 'none'}
  GitHub present: {f['ats']['has_github']}  |  LinkedIn: {f['ats']['has_linkedin']}  |  Email: {f['ats']['has_email']}
  Generic objective statement: {f['ats']['generic_objective']}

  Total bullet points: {f['impact']['total_bullets']}
  Quantified bullets: {f['impact']['quantified_bullets']}
  Strong action verbs found: {f['impact']['strong_verb_count']}
  Weak action verbs found: {f['impact']['weak_verb_count']}

  Tier-1 languages: {', '.join(f['tech']['tier1']) or 'none'}
  Tier-2 frameworks/tools: {', '.join(f['tech']['tier2']) or 'none'}
  Tier-3 tools: {', '.join(f['tech']['tier3']) or 'none'}
  Deployed project URLs: {f['tech']['deployed_urls']}
  Open source contributions mentioned: {f['tech']['has_open_source']}

  Name detected: {f['format']['has_name']}
  Section headers detected: {f['format']['has_headers']}
  Over one page: {f['format']['over_one_page']}
  Mixed date formats: {f['format']['mixed_dates']}

RESUME TEXT:
{resume_text[:4000]}
"""
    return summary


def _parse_feedback(raw: str) -> dict:
    raw = raw.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise HTTPException(status_code=500, detail="Failed to parse AI feedback")
    for key in ("strengths", "improvements", "critical"):
        if key not in data:
            data[key] = []
    return data


# ── Router ─────────────────────────────────────────────────────────────────────

router = APIRouter()

_ZERO_RESPONSE = {
    "overall_score": 0, "ats_score": 0, "impact_score": 0,
    "tech_score": 0, "format_score": 0,
    "strengths": [],
    "improvements": [],
    "critical": [{"issue": "Not a resume", "fix": "The uploaded document does not appear to be a resume. Please upload a resume with standard sections such as Education, Experience, and Skills."}],
}


@router.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    if not WATSONX_API_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    # 1 — Extract text
    if file and file.filename:
        raw_bytes = await file.read()
        if file.filename.lower().endswith(".pdf"):
            resume_text = _extract_pdf_text(raw_bytes)
        else:
            try:
                resume_text = raw_bytes.decode("utf-8", errors="replace").strip()
            except Exception:
                raise HTTPException(status_code=422, detail="Could not read file")
    elif text and text.strip():
        resume_text = text.strip()
    else:
        raise HTTPException(status_code=422, detail="Provide a file or paste resume text")

    if len(resume_text) < 100:
        raise HTTPException(status_code=422, detail="Resume text is too short to analyze")

    # 2 — Validity check
    if not _is_resume(resume_text):
        return _ZERO_RESPONSE

    if len(resume_text) > 15_000:
        resume_text = resume_text[:15_000]

    # 3 — Compute scores deterministically
    scores, findings = _compute_scores(resume_text)

    # 4 — Ask AI for feedback text only
    feedback_prompt = _build_feedback_prompt(resume_text, scores, findings)
    async with httpx.AsyncClient() as client:
        token = await _get_iam_token(client)
        raw, _wx_data = await _call_watsonx(client, token, feedback_prompt)

    feedback = _parse_feedback(raw)
    track_token_usage("resume", "analyze_resume", _wx_data)

    # 5 — Merge and return
    return {**scores, **feedback}
