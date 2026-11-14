"""Approved data providers: a licensed JSON or CSV feed plus a field mapping.

Used once Brexoo signs an agreement with a provider (for example a construction-leads data
company). The provider's terms decide `default_contact_permission` on its platform source. Map
the provider's columns to Brexoo fields in a small JSON config:

    {"key": "acme-projects", "url": "https://…/projects.json", "format": "json", "items_path": "data",
     "country": "AU", "currency": "AUD", "auth_env": "ACME_API_KEY",
     "fields": {"external_id": "id", "title": "name", "description": "summary", "suburb": "suburb",
                "postcode": "postcode", "region": "state", "estimated_value": "value", "observed_at": "date"}}
"""

from __future__ import annotations

import csv
import datetime as dt
import io
import json
import os
from collections.abc import Iterator
from pathlib import Path
from typing import Any

from ..classify import classify
from ..geo import money_minor, title_case_place, to_date
from ..http import PoliteClient
from ..models import CollectedProject
from .base import Source


class ProviderFeed(Source):
    def __init__(self, config: dict):
        self.cfg = config
        self.key = config["key"]

    @classmethod
    def from_file(cls, path: str | Path) -> "ProviderFeed":
        return cls(json.loads(Path(path).read_text()))

    def fetch_pages(self, http: PoliteClient, since: dt.date, until: dt.date) -> Iterator[Any]:
        headers = {}
        if self.cfg.get("auth_env") and os.environ.get(self.cfg["auth_env"]):
            headers["Authorization"] = f"Bearer {os.environ[self.cfg['auth_env']]}"
        r = http.get(self.cfg["url"], params={"since": since.isoformat()}, headers=headers or None)
        yield r.text if self.cfg.get("format") == "csv" else r.json()

    def items_from_page(self, page: Any) -> list[dict]:
        if self.cfg.get("format") == "csv":
            return list(csv.DictReader(io.StringIO(page)))
        for part in (self.cfg.get("items_path") or "").split(".") if self.cfg.get("items_path") else []:
            page = page[part]
        return list(page)

    def normalise(self, item: dict) -> CollectedProject | None:
        f = self.cfg["fields"]
        get = lambda k: item.get(f[k]) if k in f else None  # noqa: E731
        if not get("external_id") or not get("title"):
            return None
        return CollectedProject(
            external_id=str(get("external_id")),
            title=str(get("title")),
            description=get("description"),
            category_code=get("category_code") or classify(get("title"), get("description")),
            country=self.cfg.get("country", "AU"),
            region=get("region"),
            city=title_case_place(get("city")),
            suburb=title_case_place(get("suburb")),
            postcode=str(get("postcode")) if get("postcode") else None,
            address=get("address"),
            stage=get("stage"),
            estimated_value_minor=money_minor(get("estimated_value")),
            currency=self.cfg.get("currency"),
            observed_at=to_date(get("observed_at")),
            closes_at=to_date(get("closes_at")),
            source_url=get("source_url"),
        )
