import datetime as dt

from brexoo_collector.classify import classify, classify_unspsc, is_construction_unspsc
from brexoo_collector.geo import au_state, money_minor, title_case_place, to_date
from brexoo_collector.models import CollectedProject
from brexoo_collector.privacy import scrub_text, strip_personal


def test_money_and_dates():
    assert money_minor("$1,250,000.00") == 125_000_000
    assert money_minor(865000) == 86_500_000
    assert money_minor(0) is None and money_minor("n/a") is None and money_minor(None) is None
    assert to_date("2026-11-10T00:00:00.000") == dt.date(2026, 11, 10)
    assert to_date("10/11/2026") == dt.date(2026, 11, 10)
    assert to_date("soon") is None


def test_places():
    assert title_case_place("NEW LAMBTON HEIGHTS") == "New Lambton Heights"
    assert title_case_place("McMahons Point") == "McMahons Point"
    assert au_state("New South Wales") == "NSW" and au_state("act") == "ACT" and au_state("Ontario") is None


def test_classification():
    assert classify("Mechanical permit", permit_type="Mechanical") == "hvac"
    assert classify("Re-roof with Colorbond") == "roofing"
    assert classify("Signage") is None
    assert is_construction_unspsc("72121400") and not is_construction_unspsc("81112200") and not is_construction_unspsc(None)
    assert classify_unspsc("72111000", "Construction of housing") == "home_builder"
    assert classify_unspsc("72141000", "Road works") is None


def test_privacy():
    raw = {"ApplicantName": "A", "Location": [{"Suburb": "X", "OwnerName": "B"}], "contact_1_phone": "1", "description": "ok"}
    assert strip_personal(raw) == {"Location": [{"Suburb": "X"}], "description": "ok"}
    assert scrub_text("Call 0400 123 456 or email a@b.com") == "Call [phone removed] or email [email removed]"
    assert scrub_text("Refurbish a block. Closing 12/12/2026. Contact Jane Example jane@example.govt.nz 03 555 0100") == (
        "Refurbish a block. Closing 12/12/2026. [contact details removed]")
    # Values and years in text are not mistaken for phone numbers.
    assert scrub_text("Cost $865,000, lodged 2026") == "Cost $865,000, lodged 2026"
    assert scrub_text("Runs 2026-11-08 to 2027-06-30, closing 12/12/2026") == "Runs 2026-11-08 to 2027-06-30, closing 12/12/2026"


def test_model_limits_and_payload():
    r = CollectedProject(external_id="A", title="  New   dwelling  ", country="AU", source_url="ftp://nope", observed_at=dt.date(2026, 11, 10))
    p = r.to_payload()
    assert p["title"] == "New dwelling" and "source_url" not in p and p["observed_at"] == "2026-11-10"
    long = CollectedProject(external_id="B", title="x" * 300, country="US")
    assert len(long.title) == 200
