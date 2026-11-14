"""Command line: `python -m brexoo_collector run --all` (what the schedule runs).

    run [--source KEY ... | --all] [--since YYYY-MM-DD] [--dry-run] [--fixtures DIR] [--provider CONFIG.json]
    list-sources

--fixtures reads saved API responses from DIR/<source-key>/*.json|*.xml instead of the network.
--dry-run fetches and normalises but sends nothing to Brexoo.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
from collections.abc import Iterator
from pathlib import Path
from typing import Any

from .client import BrexooClient, BrexooError
from .http import PoliteClient
from .models import CollectedProject
from .sources import SOURCES, Source, get_source
from .sources.provider_feed import ProviderFeed


def _fixture_pages(directory: Path, key: str) -> Iterator[Any]:
    folder = directory / key
    if not folder.is_dir():
        return
    for f in sorted(folder.iterdir()):
        if f.suffix == ".json":
            yield json.loads(f.read_text())
        elif f.suffix in (".xml", ".rss", ".atom", ".csv"):
            yield f.read_text()


def collect_source(source: Source, *, since: dt.date, until: dt.date, http: PoliteClient | None, fixtures: Path | None) -> dict:
    """Fetch and normalise one source. Returns records, counts, skipped/invalid samples and the new cursor."""
    pages = _fixture_pages(fixtures, source.key) if fixtures else source.fetch_pages(http, since, until)  # type: ignore[arg-type]
    records: dict[str, CollectedProject] = {}
    fetched = skipped = invalid = 0
    problems: list[dict] = []
    cursor: str | None = None
    for record, raw in source.collect(pages):
        fetched += 1
        if record is None:
            if "_error" in raw:
                invalid += 1
                if len(problems) < 5:
                    problems.append(raw)
            else:
                skipped += 1
            continue
        records[record.external_id] = record  # the latest version of a record wins within a run
        c = source.cursor_for(record)
        if c and (cursor is None or c > cursor):
            cursor = c
    return {"records": list(records.values()), "fetched": fetched, "skipped": skipped, "invalid": invalid, "problems": problems, "cursor": cursor}


def _since_for(source: Source, args: argparse.Namespace, remote: dict | None) -> dt.date:
    if args.since:
        return dt.date.fromisoformat(args.since)
    cur = (remote or {}).get("cursor")
    if cur:
        try:
            # Re-read the last day so late-published records on the cursor date aren't missed.
            return dt.date.fromisoformat(cur[:10])
        except ValueError:
            pass
    return dt.date.today() - dt.timedelta(days=source.default_lookback_days)


def _summary_line(key: str, r: dict) -> str:
    sent = r.get("sent") or {}
    return (f"| {key} | {r['status']} | {r.get('fetched', 0)} | {len(r.get('records', []))} | {r.get('skipped', 0)} | "
            f"{sent.get('inserted', '–')} | {sent.get('updated', '–')} | {sent.get('unchanged', '–')} | {sent.get('distributed', '–')} | "
            f"{(sent.get('rejected', 0) or 0) + r.get('invalid', 0)} |")


def run(args: argparse.Namespace) -> int:
    fixtures = Path(args.fixtures) if args.fixtures else None
    client: BrexooClient | None = None
    remote: dict[str, dict] = {}
    if not args.dry_run:
        client = BrexooClient(os.environ.get("BREXOO_API_URL", ""), os.environ.get("COLLECTOR_TOKEN", ""))
        remote = client.sources()

    sources: list[Source] = [ProviderFeed.from_file(p) for p in args.provider or []]
    if args.all:
        sources += list(SOURCES.values())
    sources += [get_source(k) for k in args.source or []]
    if not sources:
        print("Choose --all, --source KEY or --provider CONFIG", file=sys.stderr)
        return 2

    http = None if fixtures else PoliteClient()
    until = dt.date.today()
    results: dict[str, dict] = {}
    failed = False
    for source in sources:
        info = remote.get(source.key)
        if client and info is None:
            results[source.key] = {"status": "not registered in Brexoo"}
            continue
        if info and not info.get("enabled") and not args.source:
            results[source.key] = {"status": f"off: {info.get('disabled_reason') or 'disabled in Brexoo'}"}
            continue
        started = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
        try:
            r = collect_source(source, since=_since_for(source, args, info), until=until, http=http, fixtures=fixtures)
            r["status"] = "dry run" if args.dry_run else "ok"
            if client:
                r["sent"] = client.ingest(source.key, r["records"], started_at=started, fetched=r["fetched"], cursor=r["cursor"])
            results[source.key] = r
        except (BrexooError, RuntimeError, OSError, ValueError) as exc:
            failed = True
            results[source.key] = {"status": f"failed: {exc}"[:200]}

    lines = ["| Source | Status | Fetched | Records | Skipped | New | Updated | Unchanged | Copies to businesses | Rejected |",
             "|---|---|---|---|---|---|---|---|---|---|"]
    lines += [_summary_line(k, r) for k, r in results.items()]
    report = "\n".join(lines)
    print(report)
    for k, r in results.items():
        for p in r.get("problems", []):
            print(f"  {k}: could not read a row: {p['_error']}")
        if args.dry_run and r.get("records"):
            print(f"\n{k}, first record:\n{json.dumps(r['records'][0].to_payload(), indent=2)}")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as fh:
            fh.write("## Brexoo Project Data Collector\n\n" + report + "\n")
    if client:
        client.close()
    if http:
        http.close()
    return 1 if failed else 0


def list_sources(_: argparse.Namespace) -> int:
    for key, s in SOURCES.items():
        doc = (sys.modules[s.__class__.__module__].__doc__ or "").strip().splitlines()[0]
        print(f"{key:26} {doc}")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="brexoo-collector", description="Brexoo Project Data Collector")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="Collect and send to Brexoo")
    r.add_argument("--source", action="append", help="Source key (repeatable)")
    r.add_argument("--all", action="store_true", help="Every built-in source that Brexoo has enabled")
    r.add_argument("--provider", action="append", help="Approved provider config JSON (repeatable)")
    r.add_argument("--since", help="Collect from this date (YYYY-MM-DD) instead of the saved cursor")
    r.add_argument("--dry-run", action="store_true", help="Fetch and normalise only; send nothing")
    r.add_argument("--fixtures", help="Read saved responses from this folder instead of the network")
    r.set_defaults(fn=run)
    sub.add_parser("list-sources", help="List built-in sources").set_defaults(fn=list_sources)
    args = p.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
