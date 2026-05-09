import os
import re
import json
import time
import logging
import asyncio
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.supabase_client import supabase
from utils.token_tracker import track_token_usage

load_dotenv()

logger = logging.getLogger(__name__)

WATSONX_API_KEY    = os.environ.get("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.environ.get("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
YOUTUBE_API_KEY    = os.environ.get("YOUTUBE_API_KEY", "")

# ── IAM token cache (router-local — never share across routers) ───────────────

_IAM_TOKEN_URL   = "https://iam.cloud.ibm.com/identity/token"
_IAM_TTL_SECONDS = 50 * 60

_iam_cache: dict = {}


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
        raise ValueError("No access_token in IAM authentication response")
    _iam_cache["token"]      = token
    _iam_cache["expires_at"] = now + _IAM_TTL_SECONDS
    return token


async def _call_watsonx(
    client: httpx.AsyncClient,
    access_token: str,
    messages: list,
    max_new_tokens: int = 800,
) -> tuple:
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
    return data["choices"][0]["message"]["content"], data


# ── Resource fetch helpers ────────────────────────────────────────────────────

async def _fetch_youtube(client: httpx.AsyncClient, topic_title: str) -> list:
    if not YOUTUBE_API_KEY:
        return []
    try:
        resp = await client.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part":              "snippet",
                "q":                 f"{topic_title} tutorial for beginners programming",
                "type":              "video",
                "maxResults":        3,
                "key":               YOUTUBE_API_KEY,
                "relevanceLanguage": "en",
                "videoDuration":     "medium",
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        results = []
        for item in resp.json().get("items", []):
            video_id = item.get("id", {}).get("videoId", "")
            if not video_id:
                continue
            snippet = item.get("snippet", {})
            results.append({
                "video_id":  video_id,
                "title":     snippet.get("title", ""),
                "channel":   snippet.get("channelTitle", ""),
                "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                "url":       f"https://youtube.com/watch?v={video_id}",
            })
        return results
    except Exception as exc:
        logger.warning("YouTube fetch failed for %r: %s", topic_title, exc)
        return []


async def _fetch_github(client: httpx.AsyncClient, topic_title: str) -> list:
    try:
        resp = await client.get(
            "https://api.github.com/search/repositories",
            params={
                "q":        f"{topic_title} algorithm data-structure",
                "sort":     "stars",
                "order":    "desc",
                "per_page": 3,
            },
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=15.0,
        )
        resp.raise_for_status()
        results = []
        for item in resp.json().get("items", []):
            description = item.get("description") or ""
            results.append({
                "name":        item.get("full_name", ""),
                "description": description[:120],
                "stars":       item.get("stargazers_count", 0),
                "url":         item.get("html_url", ""),
                "language":    item.get("language"),
            })
        return results
    except Exception as exc:
        logger.warning("GitHub fetch failed for %r: %s", topic_title, exc)
        return []


_CURATION_SYSTEM = (
    "You are a CS education expert. Given a programming topic, return "
    "a JSON object with exactly these fields:\n"
    "{\n"
    '  "docs": [{"label": str, "url": str, "type": "official_docs"}],\n'
    '  "guides": [{"label": str, "url": str, "type": "article"}],\n'
    '  "suggested_nodes": [\n'
    "    {\n"
    '      "title": str,\n'
    '      "description": str (under 15 words),\n'
    '      "difficulty": "beginner|intermediate|advanced",\n'
    '      "estimated_hours": integer,\n'
    '      "reason": str (why this pairs well with the current topic, under 10 words)\n'
    "    }\n"
    "  ]\n"
    "}\n"
    "Rules:\n"
    "- docs: 1-2 entries, must be real official documentation URLs "
    "(MDN, docs.python.org, cppreference, official framework docs)\n"
    "- guides: 1-2 entries, well-known guides "
    "(GeeksforGeeks, NeetCode, roadmap.sh, Visualgo for visualizations)\n"
    "- suggested_nodes: exactly 2-3 topics that naturally follow or "
    "complement this topic for a CS student\n"
    "- Return ONLY valid JSON, no markdown, no explanation"
)


async def _fetch_watsonx_curation(
    client: httpx.AsyncClient,
    access_token,
    topic_title: str,
    topic_description: str,
) -> tuple:
    """Returns (docs, guides, suggested_nodes, raw_response). Returns empty lists on any failure."""
    empty = ([], [], [], None)
    if not access_token:
        return empty
    try:
        messages = [
            {"role": "system", "content": _CURATION_SYSTEM},
            {
                "role": "user",
                "content": (
                    f"Topic: {topic_title}. Description: {topic_description}. "
                    "Return the JSON resource object."
                ),
            },
        ]
        content, raw = await _call_watsonx(client, access_token, messages, max_new_tokens=800)
        content = content.strip()
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group())
                except json.JSONDecodeError:
                    return empty
            else:
                return empty
        return (
            parsed.get("docs", []),
            parsed.get("guides", []),
            parsed.get("suggested_nodes", []),
            raw,
        )
    except Exception as exc:
        logger.warning("watsonx curation failed for %r: %s", topic_title, exc)
        return empty


# ── Request schema ────────────────────────────────────────────────────────────

router = APIRouter()


class NodeResourcesRequest(BaseModel):
    user_id: str
    node_id: str
    topic_title: str
    topic_description: str


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/node-resources")
async def get_node_resources(body: NodeResourcesRequest):
    # Step 1 — Check cache
    roadmap_resp = (
        supabase.table("user_roadmaps")
        .select("roadmap")
        .eq("user_id", body.user_id)
        .single()
        .execute()
    )
    if not roadmap_resp.data:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    roadmap = roadmap_resp.data["roadmap"]
    phases  = roadmap.get("phases", [])

    target_node = None
    for phase in phases:
        for node in phase.get("nodes", []):
            if node.get("id") == body.node_id:
                target_node = node
                break
        if target_node is not None:
            break

    if target_node is None:
        raise HTTPException(status_code=404, detail="Node not found in roadmap")

    existing = target_node.get("fetched_resources")
    if existing:
        return existing

    # Step 2 — Fetch in parallel
    async with httpx.AsyncClient() as client:
        access_token = None
        try:
            access_token = await _get_iam_token(client)
        except Exception as exc:
            logger.warning("IAM token fetch failed; skipping watsonx curation: %s", exc)

        results = await asyncio.gather(
            _fetch_youtube(client, body.topic_title),
            _fetch_github(client, body.topic_title),
            _fetch_watsonx_curation(
                client, access_token, body.topic_title, body.topic_description
            ),
        )

    youtube_results = results[0]
    github_results  = results[1]
    docs, guides, suggested_nodes, raw_wx = results[2]

    if raw_wx is not None:
        track_token_usage("resources", "node_resources", raw_wx)

    # Step 3 — Assemble
    fetched_resources = {
        "youtube":         youtube_results,
        "github":          github_results,
        "docs":            docs,
        "guides":          guides,
        "suggested_nodes": suggested_nodes,
        "fetched_at":      datetime.now(timezone.utc).isoformat(),
    }

    # Step 4 — Write back into the roadmap JSONB
    target_node["fetched_resources"] = fetched_resources
    try:
        supabase.table("user_roadmaps").upsert(
            {"user_id": body.user_id, "roadmap": roadmap},
            on_conflict="user_id",
        ).execute()
    except Exception as exc:
        logger.warning("Failed to cache fetched_resources for user %s node %s: %s",
                       body.user_id, body.node_id, exc)

    return fetched_resources
