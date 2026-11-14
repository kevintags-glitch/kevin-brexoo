"""Every connector, against saved responses written to each API's published schema."""

import datetime as dt
import json

from brexoo_collector.cli import collect_source
from brexoo_collector.sources import get_source

TODAY = dt.date(2026, 11, 14)


def run(key, fixtures):
    return collect_source(get_source(key), since=TODAY, until=TODAY, http=None, fixtures=fixtures)


def by_id(result):
    return {r.external_id: r for r in result["records"]}


def test_nsw_planning(fixtures):
    r = run("nsw-planning-da", fixtures)
    recs = by_id(r)
    assert r["fetched"] == 6 and r["skipped"] == 1 and len(recs) == 5
    d = recs["PAN-482101"]
    assert (d.title, d.category_code, d.suburb, d.postcode, d.city, d.region, d.country) == (
        "Dwelling house in Merewether", "home_builder", "Merewether", "2291", "Newcastle", "NSW", "AU")
    assert d.estimated_value_minor == 86_500_000 and d.currency == "AUD" and d.observed_at == dt.date(2026, 11, 10)
    assert d.address == "12 Example Street" and d.stage == "Under Assessment"
    assert recs["PAN-482102"].category_code == "property_developer" and recs["PAN-482102"].estimated_value_minor == 240_000_000
    assert recs["PAN-482103"].category_code == "renovation"
    assert recs["PAN-482104"].category_code == "electrician"
    assert recs["PAN-490010"].category_code == "fencing_decking" and recs["PAN-490010"].description.startswith("Complying Development Certificate")
    assert r["cursor"] == "2026-11-12"


def test_austender_keeps_construction_only(fixtures):
    recs = by_id(run("austender-construction", fixtures))
    assert set(recs) == {"CN4100001", "CN4100002"}  # the ICT contract (UNSPSC 81) is skipped
    a = recs["CN4100001"]
    assert a.scope == "regional" and a.region == "NSW" and a.stage == "Contract awarded"
    assert a.title == "Awarded: Base amenities refurbishment works" and a.category_code is None
    assert "Example Constructions Pty Ltd" in a.description and a.estimated_value_minor == 125_000_000
    assert a.description.startswith("Base amenities refurbishment works. Agency: Department of Defence.")
    assert "Runs 08 Nov 2026 to 30 Jun 2027." in a.description and "removed" not in a.description
    assert recs["CN4100002"].category_code == "electrician" and recs["CN4100002"].region == "ACT"


def test_us_city_permits(fixtures):
    austin = by_id(run("austin-permits", fixtures))
    assert set(austin) == {"2026-112233 BP", "2026-112234 EP"}
    house = austin["2026-112233 BP"]
    assert (house.category_code, house.city, house.region, house.postcode, house.currency) == ("home_builder", "Austin", "TX", "78704", "USD")
    assert house.source_url.startswith("https://abc.austintexas.gov/")
    assert austin["2026-112234 EP"].category_code == "electrician"

    chicago = by_id(run("chicago-permits", fixtures))
    assert chicago["101234567"].category_code == "renovation" and chicago["101234567"].address == "1234 N Sample"
    assert chicago["101234568"].category_code is None  # a sign permit: kept, but only reaches businesses by category

    nyc = by_id(run("nyc-permits", fixtures))
    assert nyc["B00123456-I1-PL"].category_code == "plumber" and nyc["B00123456-I1-PL"].postcode == "11201"


def test_rss_tenders_construction_only(fixtures):
    recs = by_id(run("nz-gets-tenders", fixtures))
    assert set(recs) == {"GETS-29871"}
    t = recs["GETS-29871"]
    assert t.region == "Canterbury" and t.closes_at == dt.date(2026, 12, 12) and t.observed_at == dt.date(2026, 11, 10)
    assert t.currency == "NZD" and t.scope == "regional"


def test_no_personal_details_leave_the_collector(fixtures):
    """Applicant, owner, contractor and contact details must never appear in what's sent."""
    banned = ["Jordan Smith", "jordan@example.com", "J Smith", "Alex Example", "5125550100", "SAM EXAMPLE", "3125550100",
              "Pat", "Procurement Officer", "procure@example.gov.au", "02 6200 0000", "jane@example.govt.nz", "Jane Example", "0400 123 456"]
    for key in ["nsw-planning-da", "austender-construction", "austin-permits", "chicago-permits", "nyc-permits", "nz-gets-tenders"]:
        sent = json.dumps([r.to_payload() for r in run(key, fixtures)["records"]])
        for b in banned:
            if b == "Pat":
                assert '"Pat"' not in sent
                continue
            assert b not in sent, f"{b!r} leaked from {key}"
