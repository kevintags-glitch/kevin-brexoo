"""Map a source's description of the work to a Brexoo service category.

Keyword rules over the development type / permit type / work description, checked in order so
the most specific trade wins. Unknown work returns None (Brexoo then treats it as general
building work for regional tenders, and only businesses offering that category see local ones).
"""

from __future__ import annotations

import re

# (category_code, pattern). Order matters: specific trades before general building.
_RULES: list[tuple[str, re.Pattern[str]]] = [
    # Whole-of-building descriptions first, so a renovation that mentions a deck stays a renovation.
    ("renovation", re.compile(r"\b(alterations? (and|&) additions?|renovat\w*|remodel\w*)", re.I)),
    ("property_developer", re.compile(
        r"\b(multi[- ]?dwelling|residential flat building|apartments?|townhouses?|terraces|dual occupancy|duplex|"
        r"subdivision|mixed use|boarding house|seniors housing|multi[- ]?family|\d+\s*units?)\b", re.I)),
    # Then specific trades.
    ("electrician", re.compile(r"\b(electrical|electric|switchboard|solar|photovoltaic|pv system|ev charg\w*|battery storage|wiring)\b", re.I)),
    ("plumber", re.compile(r"\b(plumbing|drainage|sewer|hot water|backflow|stormwater|gas fitting)\b", re.I)),
    ("hvac", re.compile(r"\b(hvac|mechanical|air[ -]?condition\w*|heat pump|ventilation|ductwork|furnace|boiler)\b", re.I)),
    ("roofing", re.compile(r"\b(re-?roof\w*|roofing|roof replacement|new roof)\b", re.I)),
    ("fencing_decking", re.compile(r"\b(swimming pool|pool fence|fence|fencing|deck|pergola|carport|retaining wall)\b", re.I)),
    ("landscaping", re.compile(r"\b(landscap\w*|tree removal|garden)\b", re.I)),
    ("painting", re.compile(r"\b(painting|repaint)\b", re.I)),
    # Then general building.
    ("renovation", re.compile(r"\b(alteration|addition|kitchen|bathroom|interior fit[- ]?out|extension)\b", re.I)),
    ("home_builder", re.compile(
        r"\b(new dwelling|dwelling|dwelling house|single[- ]family|new residence|residence|house|secondary dwelling|granny flat|"
        r"new construction|new building|knock ?down|rebuild)\b", re.I)),
]

# Permit types used by US city portals that name the trade directly.
_PERMIT_TYPES: dict[str, str] = {"electrical": "electrician", "plumbing": "plumber", "mechanical": "hvac"}

# UNSPSC families for construction services (AusTender). 72 = building & facility construction.
_UNSPSC: list[tuple[str, str | None]] = [
    ("721511", "plumber"),       # plumbing and heating services (approximate family)
    ("721515", "electrician"),   # electrical system services
    ("721517", "hvac"),          # heating/ventilation/air-conditioning services (approximate family)
    ("721513", "painting"),      # painting and paper hanging
    ("7211", "home_builder"),    # residential building construction
    ("72", None),                # other building & facility construction: general building work
]


def classify(*texts: str | None, permit_type: str | None = None) -> str | None:
    if permit_type:
        for key, code in _PERMIT_TYPES.items():
            if key in permit_type.lower():
                return code
    blob = " ".join(t for t in texts if t)
    for code, rx in _RULES:
        if rx.search(blob):
            return code
    return None


def is_construction_unspsc(code: str | None) -> bool:
    return bool(code) and str(code).startswith("72")


def classify_unspsc(code: str | None, *texts: str | None) -> str | None:
    by_text = classify(*texts)
    if by_text:
        return by_text
    code = str(code or "")
    for prefix, cat in _UNSPSC:
        if code.startswith(prefix):
            return cat
    return None
