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

# ── Phase definitions ─────────────────────────────────────────────────────────

_PHASES = [
    {"id": "phase_1", "title": "Foundation",   "order": 1},
    {"id": "phase_2", "title": "Intermediate", "order": 2},
    {"id": "phase_3", "title": "Advanced",     "order": 3},
    {"id": "phase_4", "title": "Job Ready",    "order": 4},
]

# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are the Axiom Roadmap Intelligence Agent — an expert CS \
curriculum designer and career coach with deep knowledge of what it takes to \
land roles at top tech companies.

You understand the complete dependency graph of CS knowledge:
- Graphs require Trees which require Recursion
- System Design requires networking fundamentals
- React requires JavaScript proficiency
- ML requires Linear Algebra and Statistics
- DevOps requires Linux and networking basics

You understand industry reality:
- What FAANG actually tests in interviews vs what bootcamps teach
- Which skills are trending vs declining in job postings
- How long a dedicated student realistically needs per topic
- What the minimum viable skillset is for each role level

YOUR INPUT will always be a JSON object containing:
- target_role, current_level, current_skills, timeline_weeks, \
hours_per_week, action: "generate" | "recalibrate" | "substitute"

For "substitute" also receive: topic_to_replace, reason (optional)

YOUR OUTPUT must always be valid JSON only. Never output plain text.
Return ONLY valid JSON with no preamble, explanation, or markdown backticks.

CURRICULUM KNOWLEDGE BASE:

ROLE: Frontend Engineer
REQUIRED: HTML/CSS, JavaScript, React or Vue, TypeScript, REST APIs, Git, \
Basic DSA, System Design basics, Accessibility, Performance optimization
INTERVIEW FOCUS: DSA Medium, System Design basics, JavaScript deep dive, React patterns

ROLE: Backend Engineer
REQUIRED: Python or Java or Go, Data Structures, Algorithms (Medium-Hard), \
System Design, Databases SQL+NoSQL, REST API design, Auth, Caching, Git
INTERVIEW FOCUS: DSA Hard, System Design, OOP, DB design

ROLE: Full Stack Engineer
REQUIRED: JavaScript/TypeScript, React, Node.js or Python, SQL, REST APIs, \
Git, DSA Medium, System Design basics
INTERVIEW FOCUS: DSA Medium, System Design, Full stack architecture

ROLE: ML Engineer
REQUIRED: Python, Linear Algea, Statistics, ML fundamentals, PyTorch or \
TensorFlow, Data preprocessing, SQL, Git
INTERVIEW FOCUS: ML theory, Coding Medium, Stats, ML system design

ROLE: DevOps/Cloud
REQUIRED: Linux, Networking, Docker, Kubernetes, CI/CD, Cloud AWS/GCP/Azure, \
Scripting Python or Bash, Monitoring, Git
INTERVIEW FOCUS: System design, Linux internals, Networking

DSA DEPENDENCY GRAPH (must respect this order):
Arrays → Hashing → Two Pointers → Sliding Window → Stack → Queue \
→ Linked List → Binary Search → Trees → BST → Heap → Graphs → DP \
→ Greedy → Backtracking → Advanced Graphs → Hard DP

SYSTEM DESIGN DEPENDENCY GRAPH:
Networking basics → HTTP/REST → Databases → Caching → Load Balancing \
→ Message Queues → Distributed Systems → Real world system design

REALISTIC TIME ESTIMATES (hours):
Arrays: 6-10, Hashing: 4-6, Two Pointers: 4-6, Sliding Window: 4-6,
Stack/Queue: 4-8, Linked List: 6-8, Binary Search: 4-6, Trees: 8-12,
Graphs: 10-15, Dynamic Programming: 15-25, System 30, Node.js: 15-20, SQL: 10-15

SUBSTITUTION RULES:
- Never substitute a prerequisite without checking dependents
- Always suggest 3 substitute options ranked by similarity
- A substitute must serve the same learning goal
- Warn if substitution creates a knowledge gap

RECALIBRATION RULES:
- If ahead: compress remaining timeline, add harder topics
- If behind: extend timeline or reduce scope, never drop critical path
- If timeline changes: rebuild weekly plan from current position
- Never recalibrate more than once per week
- Always preserve completed topics

STRICT RULES:
- Always generate exactly 4 phases: Foundation, Intermediate, Advanced, Job Ready
- All node ids must be snake_case prefixed with topic_ e.g. topic_arrays
- dependencies must only reference node ids appearing earlier in the roadmap
- All nodes start with status locked
- Skip topics already covered by current_skills
- Calibrate total nodes to timeline_weeks and hours_per_week
- Keep node descriptions under 15 words
- Do not add any text after the closing brace of the JSON object
- question_topics must match: Arrays, Strings, Hashing, Two Pointers, Stack, \
Binary Search, Sliding Window, Linked List, Trees, Tries, Backtracking, \
Heap, Graphs, Dynamic Programming, Greedy, Intervals, Math, \
Bit Manipulation, System Design, Behavioral

OUTPUT SCHEMA (for each phase call, return a single phase object):
{
  "id": "phase_N",
  "title": "Phase Title",
  "description": "string under 15 words",
  "order": N,
  "nodes": [
    {
      "id": "topic_arrays",
      "title": "Arrays & Hashing",
      "description": "string under 15 words",
      "estimated_hours": integer,
      "difficulty": "beginner" or "intermediate" or "advanced",
      "dependencies": ["topic_id_1"],
      "question_topics": ["Arrays"],
      "substitutes": ["topic title 1", "topic title 2", "topic title 3"],
      "status": "locked"
    }
  ]
}"""

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


def _inject_resources(phases: list[dict]) -> list[dict]:
    """
    Add hardcoded LeetCode resources to every node based on its question_topics.
    Called after all 4 phases are generated, so the model never has to emit resources.
    """
    for phase in phases:
        for node in phase.get("nodes", []):
            resources = []
            for topic in node.get("question_topics", []):
                slug = topic.lower().replace(" ", "-")
                resources.append({
                    "type":  "leetcode",
                    "label": f"Practice {topic}",
                    "url":   f"https://leetcode.com/tag/{slug}",
                })
            node["resources"] = resources
    return phases


def _validate_phase(phase: dict, expected_order: int) -> dict:
    """Ensure a single phase object has the required structure."""
    if "nodes" not in phase or not isinstance(phase["nodes"], list):
        raise HTTPException(
            status_code=500,
            detail=f"AI returned invalid phase {expected_order}: missing nodes list",
        )
    if not phase.get("id"):
        phase["id"] = f"phase_{expected_order}"
    if not phase.get("order"):
        phase["order"] = expected_order
    return phase


def _build_phase_user_message(
    phase_title: str,
    phase_id: str,
    phase_order: int,
    level: str,
    target_role: str,
    timeline_weeks: int,
    hours_per_week: int,
    skills_str: str,
    prior_node_ids: list[str],
) -> str:
    """Build the per-phase user message, injecting prior node IDs for dependency context."""
    prior_section = (
        f"\nPrior phase node IDs (the only valid values for dependencies):\n"
        f"{', '.join(prior_node_ids)}"
        if prior_node_ids
        else "\nThis is phase 1 — no prior nodes exist, so dependencies must be an empty list []."
    )
    return (
        f"Generate ONLY the {phase_title} phase (phase {phase_order} of 4) for this student:\n"
        f"- Level: {level}\n"
        f"- Target Role: {target_role}\n"
        f"- Timeline: {timeline_weeks} weeks\n"
        f"- Hours per week: {hours_per_week}\n"
        f"- Current skills: {skills_str}"
        f"{prior_section}\n\n"
        f'Return a single JSON object with "id": "{phase_id}" and "order": {phase_order}.'
    )


def _build_recalibrate_phase_message(
    phase_title: str,
    phase_id: str,
    phase_order: int,
    level: str,
    target_role: str,
    timeline_weeks: int,
    hours_per_week: int,
    skills_str: str,
    prior_node_ids: list[str],
    existing_nodes: list[dict],
    completed_topic_ids: list[str],
    days_elapsed: int,
) -> str:
    """Build the per-phase recalibration message with progress context."""
    prior_section = (
        f"\nPrior phase node IDs (valid dependency values):\n{', '.join(prior_node_ids)}"
        if prior_node_ids
        else "\nThis is phase 1 — dependencies must be []."
    )
    existing_summary = json.dumps(
        [{"id": n.get("id"), "title": n.get("title")} for n in existing_nodes]
    )
    completed_set  = set(completed_topic_ids)
    completed_here = [n.get("id") for n in existing_nodes if n.get("id") in completed_set]
    return (
        f"Recalibrate ONLY the {phase_title} phase (phase {phase_order} of 4) for this student:\n"
        f"- Level: {level}\n"
        f"- Target Role: {target_role}\n"
        f"- Timeline: {timeline_weeks} weeks, {hours_per_week} hrs/week\n"
        f"- Current skills: {skills_str}\n"
        f"- Days elapsed since roadmap creation: {days_elapsed}\n"
        f"- All completed topic IDs: {', '.join(completed_topic_ids) or 'None'}\n"
        f"- Existing nodes in this phase: {existing_summary}\n"
        f"- Completed in this phase: {', '.join(completed_here) or 'None'}"
        f"{prior_section}\n\n"
        f'Return a single JSON object with "id": "{phase_id}" and "order": {phase_order}. '
        f"Preserve all completed topics exactly as they are. Adjust the rest to fit current pace."
    )


def _build_substitute_message(
    topic_to_replace_id: str,
    topic_to_replace_title: str,
    chosen_title: str,
    phase_title: str,
    phase_order: int,
    neighbor_node_ids: list[str],
    level: str,
    target_role: str,
) -> str:
    """Build the single-node substitute generation message."""
    return (
        f"Generate a substitute node for this student:\n"
        f"- Student level: {level}\n"
        f"- Target role: {target_role}\n"
        f"- Phase: {phase_title} (phase {phase_order} of 4)\n"
        f"- Topic being replaced: {topic_to_replace_id} ({topic_to_replace_title})\n"
        f"- Chosen substitute title: {chosen_title}\n"
        f"- Neighbor node IDs for dependency context: {', '.join(neighbor_node_ids) or 'None'}\n\n"
        f"Return a single complete node JSON object for '{chosen_title}'. "
        f"Use a unique snake_case id prefixed with topic_. "
        f"Include all fields: id, title, description, estimated_hours, difficulty, "
        f"dependencies (only reference neighbor IDs listed above), "
        f"question_topics, substitutes (3 alternative titles), status (locked)."
    )


def _inject_resources_single(node: dict) -> dict:
    """Inject LeetCode resource links into a single node based on its question_topics."""
    resources = []
    for topic in node.get("question_topics", []):
        slug = topic.lower().replace(" ", "-")
        resources.append({
            "type":  "leetcode",
            "label": f"Practice {topic}",
            "url":   f"https://leetcode.com/tag/{slug}",
        })
    node["resources"] = resources
    return node


# ── Request schemas ───────────────────────────────────────────────────────────

router = APIRouter()


class GenerateRequest(BaseModel):
    user_id: str


class RecalibrateRequest(BaseModel):
    user_id: str
    completed_topic_ids: list[str]
    days_elapsed: int


class SubstituteRequest(BaseModel):
    user_id: str
    topic_to_replace: str
    chosen_title: str


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

    # Steps 2–4 — Phase-by-phase watsonx.ai generation
    phases: list[dict] = []
    prior_node_ids: list[str] = []

    async with httpx.AsyncClient() as client:
        access_token = await _get_iam_token(client)

        for phase_def in _PHASES:
            phase_title = phase_def["title"]
            phase_id    = phase_def["id"]
            phase_order = phase_def["order"]

            user_message = _build_phase_user_message(
                phase_title=phase_title,
                phase_id=phase_id,
                phase_order=phase_order,
                level=level,
                target_role=target_role,
                timeline_weeks=timeline_weeks,
                hours_per_week=hours_per_week,
                skills_str=skills_str,
                prior_node_ids=prior_node_ids,
            )
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_message},
            ]

            generated_text = await _call_watsonx(
                client, access_token, messages, max_new_tokens=2500
            )

            try:
                phase_data = _parse_generated_text(generated_text)
            except ValueError as exc:
                logger.error(
                    "Failed to parse phase %d JSON: %s | raw: %s",
                    phase_order, exc, generated_text[:500],
                )
                raise HTTPException(status_code=500, detail=f"Failed to process phase {phase_order}")

            phase_data = _validate_phase(phase_data, phase_order)
            phases.append(phase_data)

            # Accumulate node IDs so the next phase can reference them as dependencies
            for node in phase_data.get("nodes", []):
                node_id = node.get("id")
                if node_id:
                    prior_node_ids.append(node_id)

    # Inject resources now that all phases are assembled
    phases = _inject_resources(phases)

    # Assemble final roadmap
    total_hours = sum(
        node.get("estimated_hours", 0)
        for phase in phases
        for node in phase.get("nodes", [])
    )
    now_iso = datetime.now(timezone.utc).isoformat()

    roadmap: dict = {
        "phases": phases,
        "meta": {
            "target_role":           target_role,
            "level":                 level,
            "timeline_weeks":        timeline_weeks,
            "hours_per_week":        hours_per_week,
            "total_estimated_hours": total_hours,
            "generated_at":          now_iso,
        },
    }

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
        .execute()
    )
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return resp.data[0]


@router.post("/recalibrate")
async def recalibrate_roadmap(body: RecalibrateRequest):
    """
    Recalibrate an existing roadmap based on current progress and pace.
    Rebuilds all 4 phases, preserving completed topics. Upserts to user_roadmaps.
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
    skills_str     = ", ".join(current_skills) if isinstance(current_skills, list) else str(current_skills) or "None"

    # Step 2 — Fetch existing roadmap for phase/node context
    roadmap_resp = (
        supabase.table("user_roadmaps")
        .select("roadmap")
        .eq("user_id", body.user_id)
        .single()
        .execute()
    )
    if not roadmap_resp.data:
        raise HTTPException(status_code=404, detail="No existing roadmap to recalibrate")
    existing_roadmap = roadmap_resp.data["roadmap"]
    existing_phases  = existing_roadmap.get("phases", [])

    # Step 3 — Phase-by-phase recalibration
    phases: list[dict] = []
    prior_node_ids: list[str] = []

    async with httpx.AsyncClient() as client:
        access_token = await _get_iam_token(client)

        for phase_def in _PHASES:
            phase_title = phase_def["title"]
            phase_id    = phase_def["id"]
            phase_order = phase_def["order"]

            existing_phase = next(
                (p for p in existing_phases if p.get("id") == phase_id), {}
            )
            existing_nodes = existing_phase.get("nodes", [])

            user_message = _build_recalibrate_phase_message(
                phase_title=phase_title,
                phase_id=phase_id,
                phase_order=phase_order,
                level=level,
                target_role=target_role,
                timeline_weeks=timeline_weeks,
                hours_per_week=hours_per_week,
                skills_str=skills_str,
                prior_node_ids=prior_node_ids,
                existing_nodes=existing_nodes,
                completed_topic_ids=body.completed_topic_ids,
                days_elapsed=body.days_elapsed,
            )
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_message},
            ]

            generated_text = await _call_watsonx(
                client, access_token, messages, max_new_tokens=2500
            )

            try:
                phase_data = _parse_generated_text(generated_text)
            except ValueError as exc:
                logger.error(
                    "Recalibrate: failed to parse phase %d JSON: %s | raw: %s",
                    phase_order, exc, generated_text[:500],
                )
                raise HTTPException(status_code=500, detail=f"Failed to process phase {phase_order}")

            phase_data = _validate_phase(phase_data, phase_order)
            phases.append(phase_data)

            for node in phase_data.get("nodes", []):
                node_id = node.get("id")
                if node_id:
                    prior_node_ids.append(node_id)

    phases = _inject_resources(phases)

    total_hours = sum(
        node.get("estimated_hours", 0)
        for phase in phases
        for node in phase.get("nodes", [])
    )
    now_iso          = datetime.now(timezone.utc).isoformat()
    original_gen_at  = existing_roadmap.get("meta", {}).get("generated_at", now_iso)

    roadmap: dict = {
        "phases": phases,
        "meta": {
            "target_role":           target_role,
            "level":                 level,
            "timeline_weeks":        timeline_weeks,
            "hours_per_week":        hours_per_week,
            "total_estimated_hours": total_hours,
            "generated_at":          original_gen_at,
            "last_recalibrated_at":  now_iso,
        },
    }

    upsert_resp = (
        supabase.table("user_roadmaps")
        .upsert(
            {
                "user_id":              body.user_id,
                "roadmap":              roadmap,
                "generated_at":         original_gen_at,
                "last_recalibrated_at": now_iso,
            },
            on_conflict="user_id",
        )
        .execute()
    )
    if not upsert_resp.data:
        logger.error("user_roadmaps upsert returned no data for user %s (recalibrate)", body.user_id)
        raise HTTPException(status_code=500, detail="Failed to save recalibrated roadmap")

    return roadmap


@router.post("/substitute")
async def substitute_topic(body: SubstituteRequest):
    """
    Generate a single substitute node for a given topic_id and chosen title.
    Does NOT persist — the frontend owns the save after confirming the swap.
    """
    # Step 1 — Fetch user profile
    profile_resp = (
        supabase.table("user_profiles")
        .select("level, target_role")
        .eq("user_id", body.user_id)
        .single()
        .execute()
    )
    profile = profile_resp.data
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    level       = profile.get("level", "")
    target_role = profile.get("target_role", "")

    # Step 2 — Fetch existing roadmap to find phase context and neighbors
    roadmap_resp = (
        supabase.table("user_roadmaps")
        .select("roadmap")
        .eq("user_id", body.user_id)
        .single()
        .execute()
    )
    if not roadmap_resp.data:
        raise HTTPException(status_code=404, detail="No existing roadmap found")
    existing_phases = roadmap_resp.data["roadmap"].get("phases", [])

    topic_title   = body.topic_to_replace
    phase_title   = "Unknown"
    phase_order   = 1
    neighbor_ids: list[str] = []

    for phase in existing_phases:
        nodes = phase.get("nodes", [])
        for i, node in enumerate(nodes):
            if node.get("id") == body.topic_to_replace:
                topic_title = node.get("title", body.topic_to_replace)
                phase_title = phase.get("title", "Unknown")
                phase_order = phase.get("order", 1)
                if i > 0:
                    neighbor_ids.append(nodes[i - 1].get("id", ""))
                if i < len(nodes) - 1:
                    neighbor_ids.append(nodes[i + 1].get("id", ""))
                break

    # Step 3 — Single watsonx.ai call for one node
    user_message = _build_substitute_message(
        topic_to_replace_id=body.topic_to_replace,
        topic_to_replace_title=topic_title,
        chosen_title=body.chosen_title,
        phase_title=phase_title,
        phase_order=phase_order,
        neighbor_node_ids=[nid for nid in neighbor_ids if nid],
        level=level,
        target_role=target_role,
    )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_message},
    ]

    async with httpx.AsyncClient() as client:
        access_token = await _get_iam_token(client)
        generated_text = await _call_watsonx(
            client, access_token, messages, max_new_tokens=600
        )

    try:
        node_data = _parse_generated_text(generated_text)
    except ValueError as exc:
        logger.error("Substitute: failed to parse node JSON: %s | raw: %s", exc, generated_text[:500])
        raise HTTPException(status_code=500, detail="Failed to process substitute node")

    # Unwrap if the model returned a phase or nodes array instead of a bare node
    if isinstance(node_data, dict):
        if "nodes" in node_data and isinstance(node_data["nodes"], list) and node_data["nodes"]:
            node_data = node_data["nodes"][0]
        elif "phases" in node_data:
            for phase in node_data["phases"]:
                nodes = phase.get("nodes", [])
                if nodes:
                    node_data = nodes[0]
                    break

    if not isinstance(node_data, dict) or "id" not in node_data:
        raise HTTPException(status_code=500, detail="AI returned invalid node structure")

    node_data = _inject_resources_single(node_data)
    return node_data
