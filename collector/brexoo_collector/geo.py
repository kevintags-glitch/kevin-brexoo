"""Small helpers for places and money."""

from __future__ import annotations

import datetime as dt
import re
from decimal import Decimal, InvalidOperation

AU_STATES = {
    "new south wales": "NSW", "nsw": "NSW", "victoria": "VIC", "vic": "VIC", "queensland": "QLD", "qld": "QLD",
    "south australia": "SA", "sa": "SA", "western australia": "WA", "wa": "WA", "tasmania": "TAS", "tas": "TAS",
    "australian capital territory": "ACT", "act": "ACT", "northern territory": "NT", "nt": "NT",
}


def au_state(value: str | None) -> str | None:
    if not value:
        return None
    return AU_STATES.get(value.strip().lower())


def title_case_place(value: str | None) -> str | None:
    """'MEREWETHER' → 'Merewether', 'NEW LAMBTON HEIGHTS' → 'New Lambton Heights'."""
    if not value:
        return None
    value = re.sub(r"\s+", " ", str(value)).strip()
    return value.title() if value.isupper() or value.islower() else value


def money_minor(value: object) -> int | None:
    """Dollars (number or string like '$1,250,000.00') → cents. Zero or junk → None."""
    if value is None or value == "":
        return None
    try:
        amount = Decimal(re.sub(r"[^0-9.\-]", "", str(value)))
    except InvalidOperation:
        return None
    if amount <= 0:
        return None
    return int((amount * 100).to_integral_value())


def to_date(value: object) -> dt.date | None:
    """Accepts ISO dates and datetimes ('2026-11-10', '2026-11-10T00:00:00.000', '2026-11-10T03:00:00Z')
    and day-first dates ('10/11/2026')."""
    if not value:
        return None
    s = str(value).strip()
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return dt.date(int(m[1]), int(m[2]), int(m[3]))
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if m:
        return dt.date(int(m[3]), int(m[2]), int(m[1]))
    return None
