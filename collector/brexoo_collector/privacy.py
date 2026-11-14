"""Personal details from public registers are never collected.

Planning, permit and tender records often name applicants, owners, contractors' staff and
contact people. Brexoo keeps the project (what, where, when, how big) and drops the people.
"""

from __future__ import annotations

import re
from typing import Any

# Field names that carry people or their contact details in the sources we use.
_PERSONAL = re.compile(
    r"(applicant|owner|contact|email|e_mail|phone|mobile|fax|first_?name|last_?name|full_?name|"
    r"person|filing_?rep|filing_?representative|signatory|agent_?name|licensee)",
    re.IGNORECASE,
)

# "Contact Jane Example on …", "Enquiries to: …", "Attention: …" up to the end of the sentence.
_CONTACT_CLAUSE = re.compile(r"\b(contact(?: person| officer)?|enquiries(?: to)?|attention|attn)\b\s*:?\s+[^.\n]*", re.IGNORECASE)
_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE = re.compile(r"(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)")


def strip_personal(raw: Any) -> Any:
    """Recursively remove personal fields from a raw source record."""
    if isinstance(raw, dict):
        return {k: strip_personal(v) for k, v in raw.items() if not _PERSONAL.search(str(k))}
    if isinstance(raw, list):
        return [strip_personal(v) for v in raw]
    return raw


_NOT_PHONE = re.compile(r"^\s*(\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{4}|\d{4}\s*(?:-|to)\s*\d{4})\s*$")


def _phone_or_keep(m: re.Match[str]) -> str:
    # Dates and year ranges look like digit runs too; leave them alone.
    return m.group(0) if _NOT_PHONE.match(m.group(0)) else "[phone removed]"


def scrub_text(text: str | None) -> str | None:
    """Remove email addresses and phone numbers that appear inside free text."""
    if not text:
        return text
    text = _EMAIL.sub("[email removed]", text)
    text = _PHONE.sub(_phone_or_keep, text)
    return _CONTACT_CLAUSE.sub("[contact details removed]", text)
