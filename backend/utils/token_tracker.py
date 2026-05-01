"""
Watsonx token usage tracker.

Required Supabase table — run once in the SQL editor:

  CREATE TABLE IF NOT EXISTS token_usage (
    id           bigserial    PRIMARY KEY,
    router       text         NOT NULL,
    endpoint     text         NOT NULL,
    input_tokens  integer      NOT NULL DEFAULT 0,
    output_tokens integer      NOT NULL DEFAULT 0,
    total_tokens  integer      NOT NULL DEFAULT 0,
    called_at    timestamptz  DEFAULT now()
  );
  ALTER TABLE token_usage DISABLE ROW LEVEL SECURITY;
"""

import logging
from db.supabase_client import supabase

logger = logging.getLogger(__name__)


def track_token_usage(router: str, endpoint: str, response: dict) -> None:
    try:
        usage = response.get("usage", {})
        input_tokens = (
            usage.get("prompt_tokens")
            or usage.get("input_token_count")
            or usage.get("input_tokens")
            or 0
        )
        output_tokens = (
            usage.get("completion_tokens")
            or usage.get("output_token_count")
            or usage.get("output_tokens")
            or 0
        )
        total_tokens = usage.get("total_tokens") or (input_tokens + output_tokens)

        supabase.table("token_usage").insert({
            "router":        router,
            "endpoint":      endpoint,
            "input_tokens":  input_tokens,
            "output_tokens": output_tokens,
            "total_tokens":  total_tokens,
        }).execute()
    except Exception as exc:
        logger.warning("token_tracker: failed to log usage for %s/%s: %s", router, endpoint, exc)
