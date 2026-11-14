"""Government tender notices published as an RSS or Atom feed (NZ GETS first).

Source:  The buyer's official notice feed only; websites are never scraped. The GETS source is
         registered but switched off in Brexoo until its official feed URL and terms are confirmed
         (set GETS_FEED_URL, then enable `nz-gets-tenders`).
Use:     Open tenders in construction categories. Buyer contact names, emails and phone numbers
         are removed from the notice text.
"""

from __future__ import annotations

import datetime as dt
import email.utils
import os
import re
import xml.etree.ElementTree as ET
from collections.abc import Iterator
from typing import Any

from ..classify import classify
from ..geo import to_date
from ..http import PoliteClient
from ..models import CollectedProject
from ..privacy import scrub_text
from .base import Source

_ATOM = "{http://www.w3.org/2005/Atom}"
_CONSTRUCTION = re.compile(r"\b(construct|building|build|renovat|refurbish|fit[- ]?out|civil|roof|plumb|electrical|hvac|mechanical|painting|demolition|maintenance works?)\b", re.I)
_NZ_REGIONS = ("Northland", "Auckland", "Waikato", "Bay of Plenty", "Gisborne", "Hawke's Bay", "Taranaki", "Manawatū-Whanganui", "Manawatu-Whanganui",
               "Wellington", "Tasman", "Nelson", "Marlborough", "West Coast", "Canterbury", "Otago", "Southland")


def _text(el: ET.Element | None) -> str:
    return re.sub(r"<[^>]+>", " ", el.text or "").strip() if el is not None else ""


class RssTenders(Source):
    key = "nz-gets-tenders"
    country = "NZ"
    currency = "NZD"

    def __init__(self, feed_url: str | None = None):
        self.feed_url = feed_url or os.environ.get("GETS_FEED_URL")

    def fetch_pages(self, http: PoliteClient, since: dt.date, until: dt.date) -> Iterator[Any]:
        if not self.feed_url:
            raise RuntimeError("No official feed URL configured for this source (set GETS_FEED_URL).")
        yield http.get(self.feed_url).text

    def items_from_page(self, page: Any) -> list[dict]:
        root = ET.fromstring(page)
        out: list[dict] = []
        for it in root.iter("item"):
            out.append({"id": _text(it.find("guid")) or _text(it.find("link")), "title": _text(it.find("title")), "summary": _text(it.find("description")),
                        "link": _text(it.find("link")), "published": _text(it.find("pubDate")), "category": " ".join(_text(c) for c in it.findall("category"))})
        for it in root.iter(f"{_ATOM}entry"):
            link = it.find(f"{_ATOM}link")
            out.append({"id": _text(it.find(f"{_ATOM}id")), "title": _text(it.find(f"{_ATOM}title")), "summary": _text(it.find(f"{_ATOM}summary")),
                        "link": link.get("href") if link is not None else "", "published": _text(it.find(f"{_ATOM}updated")),
                        "category": " ".join(c.get("term", "") for c in it.findall(f"{_ATOM}category"))})
        return out

    def normalise(self, item: dict) -> CollectedProject | None:
        blob = f"{item.get('title')} {item.get('summary')} {item.get('category')}"
        if not item.get("id") or not _CONSTRUCTION.search(blob):
            return None
        closes = re.search(r"clos\w*[^0-9]{0,20}(\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2})", item.get("summary") or "", re.I)
        region = next((r for r in _NZ_REGIONS if r.lower() in blob.lower()), None)
        published = item.get("published") or ""
        try:
            observed = email.utils.parsedate_to_datetime(published).date() if "," in published else to_date(published)
        except (TypeError, ValueError):
            observed = to_date(published)
        return CollectedProject(
            external_id=item["id"][:200],
            title=f"Tender: {item.get('title')}"[:200],
            description=scrub_text(item.get("summary")),
            category_code=classify(item.get("title"), item.get("summary")),
            scope="regional",
            country="NZ",
            region=region,
            stage="Open tender",
            currency=self.currency,
            observed_at=observed,
            closes_at=to_date(closes.group(1)) if closes else None,
            source_url=item.get("link") or None,
        )
