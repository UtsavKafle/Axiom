import os
import re
import json
import time
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

logger = logging.getLogger(__name__)

WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
_IAM_TOKEN_URL     = "https://iam.cloud.ibm.com/identity/token"
_IAM_TTL_SECONDS   = 50 * 60

_iam_cache: dict = {}

PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "agents", "resume_reviewer.txt")

def _load_system_prompt() -> str:
    try:
        with open(PROMPT_PATH, "r") as f:
            return f.read()
    except Exception:
        logger.warning("Could not load resume_reviewer.txt — using inline fallback")
        return (
            "You are a resume review agent. Analyze the resume and return ONLY valid JSON with fields: "
            "overall_score, ats_score, impact_score, tech_score, format_score, strengths, improvements, critical."
        )

SYSTEM_PROMPT = _load_system_prompt()

REQUIRED_FIELDS = {"overall_score", "ats_score", "impact_score", "tech_score", "format_score", "strengths", "improvements", "critical"}


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


async def _call_watsonx(client: httpx.AsyncClient, token: str, resume_text: str) -> str:
    url = f"{WATSONX_URL}/ml/v1/text/chat?version=2023-05-29"
    payload = {
        "model_id": "ibm/granite-4-h-small",
        "project_id": WATSONX_PROJECT_ID,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this resume:\n\n{resume_text}"},
        ],
        "parameters": {
            "max_new_tokens": 1500,
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
    return resp.json()["choices"][0]["message"]["content"]


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


_RESUME_SIGNALS = re.compile(
    r'\b(education|experience|skills|work history|employment|projects?|internship|university|college|degree|'
    r'bachelor|master|phd|gpa|resume|curriculum vitae|cv|objective|summary|certifications?|'
    r'languages?|frameworks?|technologies|achievements?|awards?|publications?|volunteering|references?)\b',
    re.IGNORECASE,
)

_ZERO_RESPONSE = {
    "overall_score": 0,
    "ats_score": 0,
    "impact_score": 0,
    "tech_score": 0,
    "format_score": 0,
    "strengths": [],
    "improvements": [],
    "critical": [{"issue": "Not a resume", "fix": "The uploaded document does not appear to be a resume. Please upload a resume with standard sections such as Education, Experience, and Skills."}],
}

def _is_resume(text: str) -> bool:
    matches = _RESUME_SIGNALS.findall(text)
    return len(set(m.lower() for m in matches)) >= 3


def _parse_and_validate(raw: str) -> dict:
    raw = raw.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise HTTPException(status_code=500, detail="Failed to parse AI response")

    missing = REQUIRED_FIELDS - data.keys()
    if missing:
        raise HTTPException(status_code=500, detail=f"Incomplete AI response: missing {missing}")

    for field in ("overall_score", "ats_score", "impact_score", "tech_score", "format_score"):
        data[field] = int(data[field])

    return data


router = APIRouter()


@router.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    if not WATSONX_API_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    # Extract resume text
    if file and file.filename:
        raw_bytes = await file.read()
        name = file.filename.lower()
        if name.endswith(".pdf"):
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

    if not _is_resume(resume_text):
        return _ZERO_RESPONSE
    if len(resume_text) > 15_000:
        resume_text = resume_text[:15_000]

    async with httpx.AsyncClient() as client:
        token = await _get_iam_token(client)
        raw = await _call_watsonx(client, token, resume_text)

    return _parse_and_validate(raw)
