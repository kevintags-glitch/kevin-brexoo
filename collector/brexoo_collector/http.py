"""One polite HTTP client for every source: timeouts, retries with backoff, a clear User-Agent
and a small delay between requests so public APIs aren't hammered."""

from __future__ import annotations

import time
from typing import Any

import httpx

USER_AGENT = "BrexooCollector/0.1 (+https://kevin-brexoo-z2ya.vercel.app)"


class PoliteClient:
    def __init__(self, transport: httpx.BaseTransport | None = None, delay: float = 0.5, retries: int = 3, timeout: float = 30.0):
        self._client = httpx.Client(transport=transport, timeout=timeout, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}, follow_redirects=True)
        self._delay = delay
        self._retries = retries
        self._last = 0.0

    def get(self, url: str, *, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> httpx.Response:
        for attempt in range(self._retries + 1):
            wait = self._delay - (time.monotonic() - self._last)
            if wait > 0:
                time.sleep(wait)
            self._last = time.monotonic()
            try:
                r = self._client.get(url, params=params, headers=headers)
            except httpx.TransportError:
                if attempt == self._retries:
                    raise
                time.sleep(2**attempt)
                continue
            if r.status_code in (429, 500, 502, 503, 504) and attempt < self._retries:
                time.sleep(float(r.headers.get("retry-after", 2**attempt)))
                continue
            r.raise_for_status()
            return r
        raise RuntimeError("unreachable")

    def close(self) -> None:
        self._client.close()
