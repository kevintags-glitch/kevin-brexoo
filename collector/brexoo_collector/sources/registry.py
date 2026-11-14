"""Every built-in source, by the key Brexoo knows it as."""

from __future__ import annotations

from .austender import AusTender
from .base import Source
from .nsw_planning import NswPlanning
from .rss_tenders import RssTenders
from .socrata_permits import AUSTIN, CHICAGO, NYC, SocrataPermits

SOURCES: dict[str, Source] = {
    s.key: s
    for s in (NswPlanning(), AusTender(), SocrataPermits(AUSTIN), SocrataPermits(CHICAGO), SocrataPermits(NYC), RssTenders())
}


def get_source(key: str) -> Source:
    if key not in SOURCES:
        raise KeyError(f"Unknown source '{key}'. Known: {', '.join(sorted(SOURCES))}")
    return SOURCES[key]
