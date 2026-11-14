"""AusTender: Australian Government contract notices for construction (UNSPSC family 72).

Source:  AusTender OCDS API, https://api.tenders.gov.au/ocds/findByDates/contractPublished/{from}/{to}
Licence: Creative Commons Attribution 3.0 Australia.
Use:     These are awarded contracts. They are listed as subcontracting opportunities: the awarded
         supplier (a business) is named; no personal details are collected.
Note:    Open approaches to market (live tenders) are not in the OCDS API; they need a separate
         official feed before they can be added.
"""

from __future__ import annotations

import datetime as dt
from collections.abc import Iterator
from typing import Any

from ..classify import classify_unspsc, is_construction_unspsc
from ..geo import au_state, money_minor, title_case_place, to_date
from ..http import PoliteClient
from ..models import CollectedProject
from .base import Source

BASE = "https://api.tenders.gov.au/ocds/findByDates/contractPublished"


class AusTender(Source):
    key = "austender-construction"
    max_pages = 50
    default_lookback_days = 7

    def fetch_pages(self, http: PoliteClient, since: dt.date, until: dt.date) -> Iterator[Any]:
        url: str | None = f"{BASE}/{since.isoformat()}T00:00:00Z/{until.isoformat()}T23:59:59Z"
        for _ in range(self.max_pages):
            if not url:
                break
            body = http.get(url).json()
            yield body
            url = (body.get("links") or {}).get("next")

    def items_from_page(self, page: Any) -> list[dict]:
        return list(page.get("releases") or [])

    def normalise(self, item: dict) -> CollectedProject | None:
        items = [i for c in (item.get("contracts") or []) for i in (c.get("items") or [])] + list(item.get("tender", {}).get("items") or [])
        unspsc = next((str(i.get("classification", {}).get("id")) for i in items if i.get("classification")), None)
        if not is_construction_unspsc(unspsc):
            return None
        contract = (item.get("contracts") or [{}])[0]
        parties = item.get("parties") or []
        buyer = next((p for p in parties if "procuringEntity" in (p.get("roles") or [])), {})
        supplier = next((p for p in parties if "supplier" in (p.get("roles") or [])), {})
        region = au_state((buyer.get("address") or {}).get("region"))
        description = contract.get("description") or item.get("tender", {}).get("description") or "Construction services"
        value = (contract.get("value") or {}).get("amount")
        period = contract.get("period") or {}
        extra = []
        if buyer.get("name"):
            extra.append(f"Agency: {buyer['name']}.")
        if supplier.get("name"):
            extra.append(f"Awarded to {supplier['name']}: a subcontracting opportunity.")
        start, end = to_date(period.get("startDate")), to_date(period.get("endDate"))
        if start:
            extra.append(f"Runs {start:%d %b %Y}" + (f" to {end:%d %b %Y}." if end else "."))
        return CollectedProject(
            external_id=str(contract.get("id") or item.get("ocid") or item.get("id")),
            title=f"Awarded: {description}"[:200],
            description=" ".join([description.rstrip(".") + "."] + extra),
            category_code=classify_unspsc(unspsc, description),
            scope="regional",
            country="AU",
            region=region,
            city=title_case_place((buyer.get("address") or {}).get("locality")),
            postcode=(buyer.get("address") or {}).get("postalCode"),
            stage="Contract awarded",
            estimated_value_minor=money_minor(value),
            currency=((contract.get("value") or {}).get("currency") or "AUD").upper(),
            observed_at=to_date(contract.get("dateSigned") or item.get("date")),
            source_url=f"https://www.tenders.gov.au/Search/CnAdvancedSearch?keywordtypesearch=AllWord&KeywordString={contract.get('id')}" if contract.get("id") else "https://www.tenders.gov.au/",
        )
