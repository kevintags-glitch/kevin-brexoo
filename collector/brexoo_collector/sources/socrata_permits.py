"""US city building permits from Socrata open-data portals (Austin, Chicago, New York City).

Source:  Socrata Open Data API (SODA) on each city's official portal; one client, configured per city.
Licence: Each city's open-data terms (public records). An optional app token raises rate limits
         (env SOCRATA_APP_TOKEN).
Use:     Issued and approved permits show work that's starting. Owner, applicant, contractor and
         filing-representative fields are dropped before anything is stored.
Verify:  Column names follow each dataset's published schema; confirm with `--dry-run` on the first
         scheduled run.
"""

from __future__ import annotations

import datetime as dt
import os
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

from ..classify import classify
from ..geo import money_minor, title_case_place, to_date
from ..http import PoliteClient
from ..models import CollectedProject
from .base import Source


@dataclass(frozen=True)
class City:
    key: str
    domain: str
    dataset: str
    city: str
    state: str
    date_field: str
    id_fields: tuple[str, ...]
    type_fields: tuple[str, ...]
    description_fields: tuple[str, ...]
    address_fields: tuple[str, ...]
    zip_field: str | None
    value_fields: tuple[str, ...]
    status_field: str | None
    url_field: str | None = None


AUSTIN = City(
    key="austin-permits", domain="data.austintexas.gov", dataset="3syk-w9eu", city="Austin", state="TX",
    date_field="issue_date", id_fields=("permit_number",), type_fields=("permit_type_desc", "work_class", "permit_class_mapped"),
    description_fields=("description",), address_fields=("original_address1",), zip_field="original_zip",
    value_fields=("total_job_valuation", "total_valuation_remodel"), status_field="status_current", url_field="link",
)
CHICAGO = City(
    key="chicago-permits", domain="data.cityofchicago.org", dataset="ydr8-5enu", city="Chicago", state="IL",
    date_field="issue_date", id_fields=("permit_", "id"), type_fields=("permit_type",), description_fields=("work_description",),
    address_fields=("street_number", "street_direction", "street_name"), zip_field=None, value_fields=("reported_cost",),
    status_field="permit_status",
)
NYC = City(
    key="nyc-permits", domain="data.cityofnewyork.us", dataset="rbx6-tga4", city="New York", state="NY",
    date_field="issued_date", id_fields=("work_permit", "job_filing_number"), type_fields=("work_type", "filing_reason"),
    description_fields=("job_description",), address_fields=("house_no", "street_name"), zip_field="zip_code",
    value_fields=("estimated_job_costs",), status_field="permit_status",
)


class SocrataPermits(Source):
    page_size = 1000
    max_pages = 20

    def __init__(self, city: City):
        self.city = city
        self.key = city.key

    def fetch_pages(self, http: PoliteClient, since: dt.date, until: dt.date) -> Iterator[Any]:
        c = self.city
        headers = {"X-App-Token": os.environ["SOCRATA_APP_TOKEN"]} if os.environ.get("SOCRATA_APP_TOKEN") else None
        for page in range(self.max_pages):
            params = {
                "$where": f"{c.date_field} >= '{since.isoformat()}T00:00:00' AND {c.date_field} <= '{until.isoformat()}T23:59:59'",
                "$order": f"{c.date_field} ASC",
                "$limit": self.page_size,
                "$offset": page * self.page_size,
            }
            rows = http.get(f"https://{c.domain}/resource/{c.dataset}.json", params=params, headers=headers).json()
            yield rows
            if len(rows) < self.page_size:
                break

    def items_from_page(self, page: Any) -> list[dict]:
        return list(page or [])

    def normalise(self, item: dict) -> CollectedProject | None:
        c = self.city
        pid = next((str(item[f]) for f in c.id_fields if item.get(f)), None)
        if not pid:
            return None
        types = [str(item[f]) for f in c.type_fields if item.get(f)]
        description = next((str(item[f]) for f in c.description_fields if item.get(f)), None)
        address = " ".join(str(item[f]) for f in c.address_fields if item.get(f)) or None
        value = next((money_minor(item.get(f)) for f in c.value_fields if money_minor(item.get(f))), None)
        url = item.get(c.url_field) if c.url_field else None
        if isinstance(url, dict):
            url = url.get("url")
        category = classify(description, *types, permit_type=types[0] if types else None)
        heading = (types[0] if types else "Building permit").strip()
        return CollectedProject(
            external_id=pid,
            title=f"{heading}: {description}"[:200] if description else f"{heading} at {title_case_place(address) or c.city}",
            description=description,
            category_code=category,
            country="US",
            region=c.state,
            city=c.city,
            postcode=(str(item.get(c.zip_field))[:5] if c.zip_field and item.get(c.zip_field) else None),
            address=title_case_place(address),
            stage=(str(item.get(c.status_field)) if c.status_field and item.get(c.status_field) else "Permit issued"),
            estimated_value_minor=value,
            currency="USD",
            observed_at=to_date(item.get(c.date_field)),
            source_url=url or f"https://{c.domain}/d/{c.dataset}",
        )
