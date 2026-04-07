import os
import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")

CATEGORY_QUERIES = {
    "All": '(software OR programming OR developer OR devops OR "open source" OR javascript OR python OR cybersecurity OR "machine learning") AND (tech OR code OR engineer OR software)',
    "AI": '(("artificial intelligence" OR "machine learning" OR LLM OR "large language model" OR "neural network" OR "deep learning") AND (model OR training OR benchmark OR research OR software OR developer OR deployment OR inference))',
    "Security": '((cybersecurity OR "security vulnerability" OR CVE OR "data breach" OR malware OR ransomware OR exploit OR "zero day") AND (software OR system OR network OR patch OR developer))',
    "Web": '((javascript OR typescript OR react OR "web development" OR frontend OR "node.js" OR CSS OR WebAssembly OR Svelte OR "Next.js") AND (developer OR framework OR update OR release OR library))',
    "Open Source": '(("open source" OR github OR linux OR "open-source") AND (software OR project OR release OR contributor OR repository OR developer))',
    "Jobs": '(("software engineer" OR "software developer" OR programmer OR "tech worker") AND (hiring OR layoffs OR salary OR career OR "job market" OR workforce))',
}


@router.get("/")
async def get_news(category: str = Query(default="All")):
    if not NEWSAPI_KEY:
        raise HTTPException(status_code=500, detail="NEWSAPI_KEY not configured")

    query = CATEGORY_QUERIES.get(category, CATEGORY_QUERIES["All"])
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 50,
        "apiKey": NEWSAPI_KEY,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get("https://newsapi.org/v2/everything", params=params)

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=f"NewsAPI error: {resp.status_code}")

    data = resp.json()
    if data.get("status") != "ok":
        raise HTTPException(status_code=502, detail=data.get("message", "NewsAPI error"))

    return [
        a for a in data.get("articles", [])
        if a.get("title") and a["title"] != "[Removed]" and a.get("description")
    ]
