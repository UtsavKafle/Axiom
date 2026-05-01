from datetime import datetime, timezone

from fastapi import APIRouter
from db.supabase_client import supabase

router = APIRouter()

_TOKEN_LIMIT = 300_000


@router.get("/summary")
def token_usage_summary():
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    month_resp = (
        supabase.table("token_usage")
        .select("router, input_tokens, output_tokens, total_tokens")
        .gte("called_at", start_of_month.isoformat())
        .execute()
    )
    month_rows = month_resp.data or []

    all_resp = (
        supabase.table("token_usage")
        .select("total_tokens")
        .execute()
    )
    all_rows = all_resp.data or []

    total_tokens  = sum(r["total_tokens"]  for r in month_rows)
    input_tokens  = sum(r["input_tokens"]  for r in month_rows)
    output_tokens = sum(r["output_tokens"] for r in month_rows)
    calls_count   = len(month_rows)

    by_router: dict[str, int] = {}
    for r in month_rows:
        rt = r["router"]
        by_router[rt] = by_router.get(rt, 0) + r["total_tokens"]

    all_time_total = sum(r["total_tokens"] for r in all_rows)
    percent_used   = round((total_tokens / _TOKEN_LIMIT) * 100, 1)

    return {
        "current_month": {
            "total_tokens":  total_tokens,
            "input_tokens":  input_tokens,
            "output_tokens": output_tokens,
            "by_router":     by_router,
            "limit":         _TOKEN_LIMIT,
            "percent_used":  percent_used,
            "calls_count":   calls_count,
        },
        "all_time_total": all_time_total,
    }
