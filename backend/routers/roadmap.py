import os
import re
import json
import time
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.supabase_client import supabase

load_dotenv()

logger = logging.getLogger(__name__)

WATSONX_API_KEY    = os.environ.get("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.environ.get("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a CS career roadmap generator for Axiom, a platform for CS students.
Given a student's profile, generate a personalized learning roadmap as a JSON object.
Return ONLY valid JSON with no preamble, explanation, or markdown backticks.

The roadmap JSON must follow this exact schema:
{
  "phases": [
    {
      "id": "phase_1",
      "title": "Foundation",
      "description": "string",
      "order": 1,
      "nodes": [
        {
          "id": "topic_arrays",
          "title": "Arrays & Hashing",
          "description": "string",
          "estimated_hours": integer,
          "difficulty": "beginner" or "intermediate" or "advanced",
          "dependencies": ["topic_id_1", "topic_id_2"],
          "resources": [
            {"type": "leetcode", "label": "string", "url": "string"},
            {"type": "article", "label": "string", "url": "string"}
          ],
          "question_topics": ["Arrays", "Hashing"],
          "status": "locked"
        }
      ]
    }
  ],
  "meta": {
    "target_role": "string",
    "level": "string",
    "timeline_weeks": integer,
    "hours_per_week": integer,
    "total_estimated_hours": integer,
    "generated_at": "ISO datetime string"
  }
}

RULES:
- Always generate exactly 4 phases: Foundation, Intermediate, Advanced, Job Ready
- phase order must be 1, 2, 3, 4
- All node ids must be snake_case prefixed with "topic_" e.g. topic_arrays
- dependencies must only reference node ids that appear earlier in the roadmap
- All nodes start with status "locked"
- Tailor node selection to the target_role:
  SWE and Backend → heavy DSA, system design
  Frontend → DSA + React + CSS + browser fundamentals
  ML Engineer → DSA + Python + linear algebra + ML fundamentals
  DevOps/Cloud → DSA + Linux + Docker + Kubernetes + CI/CD
  Mobile → DSA + platform-specific (iOS/Android)
  Security → DSA + networking + cryptography + OS fundamentals
- Skip topics already covered by current_skills
- Calibrate total nodes to timeline_weeks and hours_per_week
- question_topics must match the topic column values in the questions table:
  Arrays, Strings, Hashing, Two Pointers, Stack, Binary Search, Sliding Window,
  Linked List, Trees, Tries, Backtracking, Heap, Graphs, Dynamic Programming,
  Greedy, IntervalsManipulation, System Design, Behavioral"""

# ── IAM token cache ───────────────────────────────────────────────────────────

_IAM_TOKEN_URL  = "https://iam.cloud.ibm.com/identity/token"
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

async def _call_watsonx(
    client: httpx.AsyncClient,
    access_token: str,
    messages: list,
    max_new_tokens: int = 1500,
) -> str:
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
            timeout=90.0,  # roadmap generation is large — allow extra time
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except httpx.TimeoutException:
        logger.error("watsonx.ai roadmap generation request timed out")
        raise HTTPException(status_code=504, detail="AI service timed out")
    except httpx.HTTPStatusError as exc:
        logger.error("watsonx.ai HTTP error: %s %s", exc.response.status_code, exc.response.text)
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
    except (KeyError, IndexError) as exc:
        logger.error("Unexpected watsonx.ai response shape: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to process AI roadmap")
    except Exception as exc:
        logger.error("watsonx.ai roadmap generation failed: %s", exc)
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


def _validate_roadmap(roadmap: dict) -> dict:
    """Ensure the roadmap has the required top-level structure."""
    if "phases" not in roadmap or not isinstance(roadmap["phases"], list):
        raise HTTPException(status_code=500, detail="AI returned invalid roadmap: missing phases")
    if "meta" not in roadmap or not isinstance(roadmap["meta"], dict):
        raise HTTPException(status_code=500, detail="AI returned invalid roadmap: missing meta")
    if len(roadmap["phases"]) == 0:
        raise HTTPException(status_code=500, detail="AI returned invalid roadmap: empty phases")
    for phase in roadmap["phases"]:
        if "nodes" not in phase or not isinstance(phase["nodes"], list):
            raise HTTPException(
                status_code=500,
                detail=f"AI returned invalid roadmap: phase '{phase.get('id', '?')}' missing nodes",
            )
    return roadmap


# ── Request schema ────────────────────────────────────────────────────────────

router = APIRouter()


class GenerateRequest(BaseModel):
    user_id: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_roadmap(body: GenerateRequest):
    """
    Generate a personalized learning roadmap for a user via watsonx.ai Granite.
    Persists the result to user_roadmaps and seeds user_topic_progress.
    """
    # Step 1 — Fetch user profile
    profile_resp = (
        supabase.table("user_profiles")
        .select("*")
        .eq("user_id", body.user_id)
        .single()
        .execute()
    )
    profile = profile_resp.data
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    level          = profile.get("level", "")
    target_role    = profile.get("target_role", "")
    timeline_weeks = profile.get("timeline_weeks", 12)
    hours_per_week = profile.get("hours_per_week", 10)
    current_skills = profile.get("current_skills") or []

    if isinstance(current_skills, list):
        skills_str = ", ".join(current_skills) if current_skills else "None"
    else:
        skills_str = str(current_skills) or "None"

    # Step 2 — Build messages
    user_message = (
        f"Generate a roadmap for this student:\n"
        f"- Level: {level}\n"
        f"- Target Role: {target_role}\n"
        f"- Timeline: {timeline_weeks} weeks\n"
        f"- Hours per week: {hours_per_week}\n"
        f"- Current skills: {skills_str}"
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_message},
    ]

    # Step 3 — Call watsonx.ai
    async with httpx.AsyncClient() as client:
        access_token   = await _get_iam_token(client)
        generated_text = await _call_watsonx(client, access_token, messages, max_new_tokens=3000)

    # Step 4 — Parse and validate
    try:
        roadmap = _parse_generated_text(generated_text)
    except ValueError as exc:
        logger.error("Failed to parse roadmap JSON: %s | raw: %s", exc, generated_text[:500])
        raise HTTPException(status_code=500, detail="Failed to process AI roadmap")

    roadmap = _validate_roadmap(roadmap)

    now_iso = datetime.now(timezone.utc).isoformat()

    # Step 5 — Upsert into user_roadmaps
    upsert_resp = (
        supabase.table("user_roadmaps")
        .upsert(
            {
                "user_id":              body.user_id,
                "roadmap":              roadmap,
                "generated_at":         now_iso,
                "last_recalibrated_at": now_iso,
            },
            on_conflict="user_id",
        )
        .execute()
    )
    if not upsert_resp.data:
        logger.error("user_roadmaps upsert returned no data for user %s", body.user_id)
        raise HTTPException(status_code=500, detail="Failed to save roadmap")

    # Step 6 — Seed user_topic_progress (upsert, ignore existing rows)
    progress_rows: list[dict[str, Any]] = []
    for phase in roadmap["phases"]:
        for node in phase.get("nodes", []):
            topic_id = node.get("id")
            if topic_id:
                progress_rows.append(
                    {
                        "user_id":  body.user_id,
                        "topic_id": topic_id,
                        "status":   "locked",
                    }
                )

    if progress_rows:
        supabase.table("user_topic_progress").upsert(
            progress_rows,
            on_conflict="user_id,topic_id",
            ignore_duplicates=True,
        ).execute()

    # Step 7 — Return roadmap
    return roadmap


@router.get("/{user_id}")
def get_roadmap(user_id: str):
    """
    Return the stored roadmap for a user, or 404 if none exists.
    """
    resp = (
        supabase.table("user_roadmaps")
        .select("roadmap, generated_at, last_recalibrated_at")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return resp.data
