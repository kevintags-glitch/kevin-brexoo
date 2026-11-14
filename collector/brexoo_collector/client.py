"""Talks to Brexoo: which sources are enabled (and where each left off), and batched ingest."""

from __future__ import annotations

import time
from typing import Any

import httpx

from .models import CollectedProject

BATCH = 500


class BrexooError(RuntimeError):
    pass


class BrexooClient:
    def __init__(self, base_url: str, token: str, transport: httpx.BaseTransport | None = None, retries: int = 3):
        if not base_url or not token:
            raise BrexooError("BREXOO_API_URL and COLLECTOR_TOKEN must be set")
        self._http = httpx.Client(base_url=base_url.rstrip("/"), transport=transport, timeout=60.0,
                                  headers={"Authorization": f"Bearer {token}", "User-Agent": "BrexooCollector/0.1"})
        self._retries = retries

    def _request(self, method: str, path: str, **kw: Any) -> Any:
        for attempt in range(self._retries + 1):
            try:
                r = self._http.request(method, path, **kw)
            except httpx.TransportError as exc:
                if attempt == self._retries:
                    raise BrexooError(f"Brexoo unreachable: {exc}") from exc
                time.sleep(2**attempt)
                continue
            if r.status_code >= 500 and attempt < self._retries:
                time.sleep(2**attempt)
                continue
            if r.status_code == 401:
                raise BrexooError("Brexoo refused the collector token (401). Check COLLECTOR_TOKEN.")
            if r.status_code >= 400:
                raise BrexooError(f"Brexoo returned {r.status_code}: {r.text[:300]}")
            return r.json()
        raise BrexooError("unreachable")

    def sources(self) -> dict[str, dict]:
        """Enabled state and cursor of every source, keyed by source key."""
        return {s["key"]: s for s in self._request("GET", "/api/collector/sources")["sources"]}

    def ingest(self, source: str, records: list[CollectedProject], *, started_at: str, fetched: int, cursor: str | None) -> dict:
        """Send records in batches of 500. Re-sending is safe: Brexoo upserts by (source, external_id)."""
        totals = {"inserted": 0, "updated": 0, "unchanged": 0, "rejected": 0, "distributed": 0, "errors": []}
        batches = [records[i : i + BATCH] for i in range(0, len(records), BATCH)] or [[]]
        for i, batch in enumerate(batches):
            last = i == len(batches) - 1
            run = {"started_at": started_at, "fetched": fetched if last else len(batch)}
            if last and cursor:
                run["cursor"] = cursor
            res = self._request("POST", "/api/collector/ingest", json={"source": source, "records": [r.to_payload() for r in batch], "run": run})
            for k in ("inserted", "updated", "unchanged", "rejected", "distributed"):
                totals[k] += int(res.get(k, 0))
            totals["errors"] += res.get("errors") or []
        return totals

    def close(self) -> None:
        self._http.close()
