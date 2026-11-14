"""NSW Planning Portal: online development applications (DA) and complying development
certificates (CDC).

Source:  NSW ePlanning public data API, https://api.apps1.nsw.gov.au/eplanning/data/v0/
         (OnlineDA and OnlineCDC). Filters, page size and page number are sent as headers.
Licence: NSW Government open data, Creative Commons Attribution 4.0.
Use:     Spot proposed building work early. Applicant and owner details are never collected, and
         people found in the register must not be contacted for marketing.
Verify:  Field names follow the published v0 schema; confirm against a live response on the first
         scheduled run (`--dry-run`) before relying on new fields.
"""

from __future__ import annotations

import datetime as dt
import json
from collections.abc import Iterator
from typing import Any

from ..classify import classify
from ..geo import money_minor, title_case_place, to_date
from ..http import PoliteClient
from ..models import CollectedProject
from .base import Source

BASE = "https://api.apps1.nsw.gov.au/eplanning/data/v0"
PORTAL = "https://www.planningportal.nsw.gov.au/da/public"


class NswPlanning(Source):
    key = "nsw-planning-da"
    endpoints = ("OnlineDA", "OnlineCDC")
    page_size = 500
    max_pages = 40

    def fetch_pages(self, http: PoliteClient, since: dt.date, until: dt.date) -> Iterator[Any]:
        for endpoint in self.endpoints:
            prefix = "Application" if endpoint == "OnlineDA" else "CDC"
            filters = {"filters": {f"{prefix}LodgedDateFrom": since.isoformat(), f"{prefix}LodgedDateTo": until.isoformat()}}
            for page in range(1, self.max_pages + 1):
                r = http.get(f"{BASE}/{endpoint}", headers={"PageSize": str(self.page_size), "PageNumber": str(page), "filters": json.dumps(filters)})
                body = r.json()
                yield body
                if page >= int(body.get("TotalPages") or 1):
                    break

    def items_from_page(self, page: Any) -> list[dict]:
        return list(page.get("Application") or page.get("CDC") or [])

    def normalise(self, item: dict) -> CollectedProject | None:
        number = item.get("PlanningPortalApplicationNumber") or item.get("ApplicationNumber") or item.get("CDCNumber")
        if not number:
            return None
        locations = item.get("Location") or []
        loc = locations[0] if locations else {}
        dev_types = [d.get("DevelopmentType", "") for d in (item.get("DevelopmentType") or []) if isinstance(d, dict)]
        kind = item.get("ApplicationType") or ("Complying development certificate" if item.get("CDCNumber") else "Development application")
        description = item.get("DevelopmentDescription") or ", ".join(t for t in dev_types if t)
        category = classify(description, *dev_types)
        suburb = title_case_place(loc.get("Suburb"))
        # The register's full address ends with the suburb and postcode; keep just the street part.
        address = loc.get("FullAddress") or ""
        if loc.get("Suburb") and str(loc["Suburb"]).upper() in address.upper():
            address = address[: address.upper().rindex(str(loc["Suburb"]).upper())]
        address = address.strip(" ,") or None
        title = (dev_types[0] if dev_types else description or kind) or kind
        if suburb:
            title = f"{title} in {suburb}"
        return CollectedProject(
            external_id=str(number),
            title=title,
            description=f"{kind}: {description}" if description else kind,
            category_code=category,
            country="AU",
            region="NSW",
            city=title_case_place(loc.get("LGA") or loc.get("CouncilName")),
            suburb=suburb,
            postcode=(str(loc.get("Postcode")) if loc.get("Postcode") else None),
            address=title_case_place(address),
            stage=item.get("ApplicationStatus") or item.get("Status"),
            estimated_value_minor=money_minor(item.get("CostOfDevelopment")),
            currency="AUD",
            observed_at=to_date(item.get("LodgementDate") or item.get("DateLodged")),
            source_url=PORTAL,
        )
