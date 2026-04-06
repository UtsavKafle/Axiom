import os
import re
import json
import time
import logging
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

load_dotenv()

logger = logging.getLogger(__name__)

WATSONX_API_KEY    = os.environ.get("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.environ.get("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

ALLOWED_LANGUAGES = {"Python", "JavaScript", "Java", "C++", "Go"}

# Prompt injection patterns to reject before passing to watsonx.ai
_INJECTION_PATTERNS = re.compile(
    r"(ignore previous instructions|you are now|forget your instructions|disregard|override)",
    re.IGNORECASE,
)

# Fields that must be present in a valid feedback response
_REQUIRED_FIELDS = {
    "overall_score",
    "verdict",
    "correctness",
    "time_complexity",
    "space_complexity",
    "code_quality",
    "edge_cases",
    "improvement",
    "encouragement",
}

# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an internal code review agent for Axiom, a CS student career platform. Analyze the submitted code and return ONLY a valid JSON object with no preamble, no explanation, and no markdown backticks.

Return exactly this JSON structure:
{
  "overall_score": integer between 0 and 100,
  "verdict": "Optimal" or "Acceptable" or "Needs Work" or "Incorrect",
  "correctness": {
    "score": integer 0-100,
    "feedback": "2-3 sentence assessment"
  },
  "time_complexity": {
    "score": integer 0-100,
    "given": "O(...)",
    "optimal": "O(...)",
    "feedback": "1-2 sentence explanation"
  },
  "space_complexity": {
    "score": integer 0-100,
    "given": "O(...)",
    "optimal": "O(...)",
    "feedback": "1-2 sentence explanation"
  },
  "code_quality": {
    "score": integer 0-100,
    "feedback": "assessment of naming readability and structure"
  },
  "edge_cases": {
    "missed": ["list of edge cases not handled"],
    "feedback": "1-2 sentences on edge case coverage"
  },
  "improvement": {
    "approach": "name of better approach if one exists",
    "explanation": "2-3 sentences guiding toward optimal without giving away the full solution"
  },
  "encouragement": "one short genuine motivational line"
}

STRICT RULES:
- Return valid JSON only with no text before or after it
- All score fields must be integers not words
- Never give away the full solution
- If user_code is empty return overall_score 0 verdict Incorrect
- Calibrate scoring to the difficulty level
- Keep tone constructive and encouraging"""

# ── Knowledge base ────────────────────────────────────────────────────────────

def load_knowledge_base() -> dict:
    knowledge = {}
    try:
        with open("axiom_knowledge_base.txt", "r") as f:
            content = f.read()
        blocks = content.split("---")
        for block in blocks:
            block = block.strip()
            if not block:
                continue
            for line in block.split("\n"):
                if line.startswith("QUESTION:"):
                    key = line.replace("QUESTION:", "").strip().lower()
                    knowledge[key] = block
                    break
    except Exception as e:
        print(f"Warning: Could not load knowledge base: {e}")
    return knowledge


KNOWLEDGE_BASE = load_knowledge_base()
print(f"Knowledge base loaded: {len(KNOWLEDGE_BASE)} questions")


def get_question_context(question_title: str) -> str:
    title_lower = question_title.lower().strip()
    if title_lower in KNOWLEDGE_BASE:
        return KNOWLEDGE_BASE[title_lower]
    for key in KNOWLEDGE_BASE:
        if title_lower in key or key in title_lower:
            return KNOWLEDGE_BASE[key]
    return None


# ── IAM token cache ───────────────────────────────────────────────────────────

_IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token"
_IAM_TTL_SECONDS = 50 * 60  # 50 minutes

_iam_cache: dict = {}


async def _get_iam_token(client: httpx.AsyncClient) -> str:
    """Exchange the IBM Cloud API key for an IAM bearer token, cached for 50 minutes."""
    now = time.monotonic()
    if _iam_cache.get("token") and _iam_cache.get("expires_at", 0) > now:
        return _iam_cache["token"]

    try:
        resp = await client.post(
            _IAM_TOKEN_URL,
            content=f"grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={WATSONX_API_KEY}",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30.0,
        )
        resp.raise_for_status()
        token = resp.json().get("access_token")
        if not token:
            raise ValueError("No access_token in IAM authentication response")
        _iam_cache["token"]      = token
        _iam_cache["expires_at"] = now + _IAM_TTL_SECONDS
        return token
    except httpx.TimeoutException:
        logger.error("IAM token request timed out")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
    except httpx.HTTPStatusError as exc:
        logger.error("IAM token HTTP error: %s %s", exc.response.status_code, exc.response.text)
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
    except Exception as exc:
        logger.error("IAM token request failed: %s", exc)
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")


# ── watsonx.ai generation ─────────────────────────────────────────────────────

async def _call_watsonx(client: httpx.AsyncClient, access_token: str, messages: list, max_new_tokens: int = 1500) -> str:
    """Call the watsonx.ai chat endpoint and return the assistant message content."""
    url = f"{WATSONX_URL}/ml/v1/text/chat?version=2023-05-29"
    payload = {
        "model_id": "ibm/granite-4-h-small",
        "project_id": WATSONX_PROJECT_ID,
        "messages": messages,
        "parameters": {
            "max_new_tokens": max_new_tokens,
            "temperature": 0,
            "repetition_penalty": 1.1,
        },
    }
    try:
        resp = await client.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except httpx.TimeoutException:
        logger.error("watsonx.ai generation request timed out")
        raise HTTPException(status_code=504, detail="AI service timed out")
    except httpx.HTTPStatusError as exc:
        logger.error("watsonx.ai HTTP error: %s %s", exc.response.status_code, exc.response.text)
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
    except (KeyError, IndexError) as exc:
        logger.error("Unexpected watsonx.ai response shape: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to process AI feedback")
    except Exception as exc:
        logger.error("watsonx.ai generation failed: %s", exc)
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")


# ── Response parsing & validation ─────────────────────────────────────────────

def _parse_generated_text(text: str) -> dict:
    """Parse generated text as JSON, with regex fallback for embedded JSON."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from generated text: {text[:200]}")


def _validate_and_clean(feedback: dict) -> dict:
    """Ensure all required fields are present and normalise overall_score to int."""
    missing = _REQUIRED_FIELDS - feedback.keys()
    if missing:
        logger.error("Feedback missing required fields: %s", missing)
        raise HTTPException(status_code=500, detail="Incomplete feedback received")

    try:
        feedback["overall_score"] = int(feedback["overall_score"])
    except (TypeError, ValueError):
        logger.error("overall_score could not be coerced to int: %r", feedback.get("overall_score"))
        raise HTTPException(status_code=500, detail="Incomplete feedback received")

    return feedback


# ── Request schema ────────────────────────────────────────────────────────────

router = APIRouter()


class ReviewRequest(BaseModel):
    question_title: str
    question_topic: str
    question_difficulty: str
    user_code: str
    language: str

    @field_validator("question_title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("question_title must not be empty")
        return v

    @field_validator("language")
    @classmethod
    def language_allowed(cls, v: str) -> str:
        if v not in ALLOWED_LANGUAGES:
            raise ValueError(
                f"language must be one of: {', '.join(sorted(ALLOWED_LANGUAGES))}"
            )
        return v

    @field_validator("user_code")
    @classmethod
    def code_not_empty_and_under_limit(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("user_code must not be empty")
        if len(v) > 10_000:
            raise ValueError("user_code must be under 10000 characters")
        return v


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("")
async def review_code(body: ReviewRequest):
    """
    Submit code for AI review via watsonx.ai Granite.
    Returns structured feedback JSON.
    """
    # Prompt injection guard
    if _INJECTION_PATTERNS.search(body.user_code):
        logger.warning("Prompt injection pattern detected in submission for: %s", body.question_title)
        raise HTTPException(status_code=400, detail="Invalid code submission")

    # Step 1 — Knowledge base lookup
    context = get_question_context(body.question_title)
    if context:
        knowledge_block = f"""
KNOWLEDGE BASE CONTEXT FOR THIS QUESTION:
{context}

Use the OPTIMAL APPROACH, TIME COMPLEXITY, SPACE COMPLEXITY and EDGE CASES above as your source of truth when evaluating this submission. Use the optimal values when filling in time_complexity.optimal and space_complexity.optimal fields.
"""
    else:
        knowledge_block = ""

    # Step 2 — Build user message
    user_message = f"""Review this code submission:
question_title: {body.question_title}
question_topic: {body.question_topic}
question_difficulty: {body.question_difficulty}
language: {body.language}
user_code:
{body.user_code}"""

    # Step 3 — Build messages
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"{knowledge_block}\n{user_message}"},
    ]

    # Step 4 — Call watsonx.ai
    async with httpx.AsyncClient() as client:
        access_token = await _get_iam_token(client)
        generated_text = await _call_watsonx(client, access_token, messages)

    # Step 5 — Parse response
    try:
        feedback = _parse_generated_text(generated_text)
    except ValueError as exc:
        logger.error("Failed to parse JSON from watsonx.ai response: %s | raw: %s", exc, generated_text[:500])
        raise HTTPException(status_code=500, detail="Failed to process AI feedback")

    # Step 6 — Validate and return
    return _validate_and_clean(feedback)


@router.get("/health")
async def review_health():
    """
    Verify watsonx.ai connectivity by authenticating and sending a minimal generation request.
    Returns {"status": "ok"} or {"status": "unavailable"}.
    """
    if not WATSONX_API_KEY:
        logger.warning("WATSONX_API_KEY is not set — health check will fail")
        return {"status": "unavailable"}

    try:
        async with httpx.AsyncClient() as client:
            # Step 1 — IAM token fetch
            try:
                iam_resp = await client.post(
                    _IAM_TOKEN_URL,
                    content=f"grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={WATSONX_API_KEY}",
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=30.0,
                )
                iam_resp.raise_for_status()
                access_token = iam_resp.json().get("access_token")
                if not access_token:
                    raise ValueError("No access_token in IAM response")
            except httpx.TimeoutException as exc:
                print(f"[health] FAILED at step: IAM token fetch")
                print(f"[health] Exception: {type(exc).__name__}: {exc}")
                return {"status": "unavailable"}
            except httpx.HTTPStatusError as exc:
                print(f"[health] FAILED at step: IAM token fetch")
                print(f"[health] Exception: {type(exc).__name__}: {exc}")
                print(f"[health] HTTP status: {exc.response.status_code}")
                print(f"[health] Response body: {exc.response.text}")
                return {"status": "unavailable"}
            except Exception as exc:
                print(f"[health] FAILED at step: IAM token fetch")
                print(f"[health] Exception: {type(exc).__name__}: {exc}")
                return {"status": "unavailable"}

            # Step 2 — watsonx.ai chat call
            try:
                wx_resp = await client.post(
                    f"{WATSONX_URL}/ml/v1/text/chat?version=2023-05-29",
                    json={
                        "model_id": "ibm/granite-4-h-small",
                        "project_id": WATSONX_PROJECT_ID,
                        "messages": [{"role": "user", "content": 'Return this exact JSON: {"status": "ok"}'}],
                        "parameters": {"max_new_tokens": 20, "temperature": 0, "repetition_penalty": 1.1},
                    },
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    timeout=30.0,
                )
                wx_resp.raise_for_status()
                result = wx_resp.json()["choices"][0]["message"]["content"]
            except httpx.TimeoutException as exc:
                print(f"[health] FAILED at step: watsonx.ai chat call")
                print(f"[health] Exception: {type(exc).__name__}: {exc}")
                return {"status": "unavailable"}
            except httpx.HTTPStatusError as exc:
                print(f"[health] FAILED at step: watsonx.ai chat call")
                print(f"[health] Exception: {type(exc).__name__}: {exc}")
                print(f"[health] HTTP status: {exc.response.status_code}")
                print(f"[health] Response body: {exc.response.text}")
                return {"status": "unavailable"}
            except (KeyError, IndexError) as exc:
                print(f"[health] FAILED at step: watsonx.ai chat call")
                print(f"[health] Exception: unexpected response shape — {type(exc).__name__}: {exc}")
                print(f"[health] Response body: {wx_resp.text}")
                return {"status": "unavailable"}
            except Exception as exc:
                print(f"[health] FAILED at step: watsonx.ai chat call")
                print(f"[health] Exception: {type(exc).__name__}: {exc}")
                return {"status": "unavailable"}

        print(f"[health] watsonx.ai response: {result}")
        return {
            "status": "ok",
            "model": "granite-4-h-small",
            "knowledge_base": len(KNOWLEDGE_BASE),
        }
    except Exception as exc:
        print(f"[health] Unexpected error: {type(exc).__name__}: {exc}")
        return {"status": "unavailable"}
