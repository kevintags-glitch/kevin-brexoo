import json

import httpx
import pytest

from brexoo_collector import cli
from brexoo_collector.client import BrexooClient, BrexooError
from brexoo_collector.models import CollectedProject


def rec(i):
    return CollectedProject(external_id=f"R{i}", title=f"Job {i}", country="AU")


def test_client_batches_and_retries():
    calls = []

    def handler(request: httpx.Request):
        if request.headers["authorization"] != "Bearer t0k":
            return httpx.Response(401)
        body = json.loads(request.content)
        calls.append(body)
        if len(calls) == 1:
            return httpx.Response(503)  # first attempt fails, the retry succeeds
        return httpx.Response(200, json={"inserted": len(body["records"]), "updated": 0, "unchanged": 0, "rejected": 0, "distributed": 1, "errors": []})

    c = BrexooClient("https://brexoo.test", "t0k", transport=httpx.MockTransport(handler))
    c._retries = 3
    import brexoo_collector.client as mod
    mod.time.sleep = lambda s: None  # no waiting in tests
    out = c.ingest("nsw-planning-da", [rec(i) for i in range(1201)], started_at="2026-11-14T00:00:00Z", fetched=1300, cursor="2026-11-13")
    sent = calls[1:]
    assert [len(b["records"]) for b in sent] == [500, 500, 201]
    assert out["inserted"] == 1201 and out["distributed"] == 3
    assert "cursor" not in sent[0]["run"] and sent[-1]["run"] == {"started_at": "2026-11-14T00:00:00Z", "fetched": 1300, "cursor": "2026-11-13"}


def test_client_reports_bad_token():
    c = BrexooClient("https://brexoo.test", "wrong", transport=httpx.MockTransport(lambda r: httpx.Response(401)))
    with pytest.raises(BrexooError, match="COLLECTOR_TOKEN"):
        c.sources()


def test_client_needs_configuration():
    with pytest.raises(BrexooError):
        BrexooClient("", "")


def test_cli_dry_run_with_fixtures(fixtures, capsys, tmp_path, monkeypatch):
    summary = tmp_path / "summary.md"
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary))
    code = cli.main(["run", "--all", "--dry-run", "--fixtures", str(fixtures)])
    out = capsys.readouterr().out
    assert code == 0
    assert "| nsw-planning-da | dry run | 6 | 5 | 1 |" in out
    assert "Brexoo Project Data Collector" in summary.read_text()


def test_cli_respects_sources_switched_off_in_brexoo(fixtures, monkeypatch, capsys):
    def handler(request: httpx.Request):
        if request.url.path == "/api/collector/sources":
            return httpx.Response(200, json={"sources": [
                {"key": "nsw-planning-da", "enabled": True, "cursor": None},
                {"key": "nz-gets-tenders", "enabled": False, "disabled_reason": "Waiting for confirmation", "cursor": None},
            ]})
        body = json.loads(request.content)
        return httpx.Response(200, json={"inserted": len(body["records"]), "updated": 0, "unchanged": 0, "rejected": 0, "distributed": 2, "errors": []})

    real = cli.BrexooClient
    monkeypatch.setattr(cli, "BrexooClient", lambda url, tok: real("https://brexoo.test", "t", transport=httpx.MockTransport(handler)))
    code = cli.main(["run", "--source", "nsw-planning-da", "--fixtures", str(fixtures)])
    assert code == 0
    assert "| nsw-planning-da | ok | 6 | 5 | 1 | 5 |" in capsys.readouterr().out
    code = cli.main(["run", "--all", "--fixtures", str(fixtures)])
    out = capsys.readouterr().out
    assert "| nz-gets-tenders | off: Waiting for confirmation |" in out
    assert "| austin-permits | not registered in Brexoo |" in out
