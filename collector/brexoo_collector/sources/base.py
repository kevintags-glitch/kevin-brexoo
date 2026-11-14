"""What every source connector provides.

A connector fetches raw pages from an official API (`fetch_pages`), turns a page into raw items
(`items_from_page`) and each item into a `CollectedProject` (`normalise`). Fixture runs reuse the
last two steps on saved responses, so parsing is tested without the network.
"""

from __future__ import annotations

import datetime as dt
from abc import ABC, abstractmethod
from collections.abc import Iterator
from typing import Any

from ..http import PoliteClient
from ..models import CollectedProject
from ..privacy import scrub_text, strip_personal


class Source(ABC):
    #: Matches `platform_sources.key` in Brexoo.
    key: str
    #: Days to look back when Brexoo has no cursor yet for this source.
    default_lookback_days = 14

    @abstractmethod
    def fetch_pages(self, http: PoliteClient, since: dt.date, until: dt.date) -> Iterator[Any]:
        """Yield raw API responses (parsed JSON or text), page by page."""

    @abstractmethod
    def items_from_page(self, page: Any) -> list[dict]:
        """Raw items in one response."""

    @abstractmethod
    def normalise(self, item: dict) -> CollectedProject | None:
        """One raw item → a Brexoo record, or None to skip it (not construction, no location…)."""

    def collect(self, pages: Iterator[Any]) -> Iterator[tuple[CollectedProject | None, dict]]:
        """Parse pages into records, stripping personal details before anything else sees them."""
        for page in pages:
            for raw in self.items_from_page(page):
                item = strip_personal(raw)
                try:
                    record = self.normalise(item)
                    if record is not None and record.description:
                        # Free text can still carry a phone number or email; remove them too.
                        record.description = scrub_text(record.description)
                    yield record, item
                except (KeyError, TypeError, ValueError) as exc:  # a malformed row never stops the run
                    yield None, {"_error": f"{type(exc).__name__}: {exc}", "_raw_keys": sorted(item)[:12]}

    def cursor_for(self, record: CollectedProject) -> str | None:
        """The value saved as this source's cursor (latest observed date by default)."""
        return record.observed_at.isoformat() if record.observed_at else None
