"""Check new dead-code findings in changed files without deleting baseline debt."""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from collections import Counter
from dataclasses import asdict, dataclass
from enum import StrEnum
from pathlib import Path

import vulture


class KnipKind(StrEnum):
    FILES = "files"
    EXPORTS = "exports"
    TYPES = "types"
    NAMESPACE_EXPORTS = "nsExports"
    NAMESPACE_TYPES = "nsTypes"
    ENUM_MEMBERS = "enumMembers"
    NAMESPACE_MEMBERS = "namespaceMembers"
    DEPENDENCIES = "dependencies"
    DEV_DEPENDENCIES = "devDependencies"


class Tool(StrEnum):
    VULTURE = "vulture"
    KNIP = "knip"


@dataclass(frozen=True, order=True)
class Finding:
    tool: Tool
    path: str
    kind: str
    name: str


@dataclass(frozen=True)
class Configuration:
    paths: list[str]
    ignore_names: list[str]
    ignore_decorators: list[str]
    knip_json: str


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Compare changed paths against this Git ref")
    parser.add_argument(
        "--write-baseline",
        action="store_true",
        help="Record current findings explicitly",
    )
    args = parser.parse_args()
    root = Path.cwd()
    config = load_configuration(root / "dead-code.json")
    baseline_path = root / "dead-code-baseline.json"
    baseline = Counter() if args.write_baseline else load_baseline(baseline_path)
    explicit_base = args.base
    if explicit_base is None:
        explicit_base = os.environ.get("DEAD_CODE_BASE") or None
    changed = changed_paths(root, explicit_base) if not args.write_baseline else None
    findings = Counter(analyze_python(root, config) + analyze_knip(root, config))
    if args.write_baseline:
        records = [asdict(item) for item in sorted(findings.elements())]
        baseline_path.write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")
        print(f"Recorded {findings.total()} dead-code findings in {baseline_path.name}")
        return
    new = Counter(
        {
            item: count
            for item, count in (findings - baseline).items()
            if changed is None or item.path in changed
        }
    )
    for item, count in sorted(new.items()):
        print(f"{item.path}: {item.tool} {item.kind} {item.name!r} ({count} new)")
    print(
        f"Dead code: {findings.total()} findings, {new.total()} new in selected files"
    )
    raise SystemExit(bool(new))


def load_configuration(path: Path) -> Configuration:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or set(raw) != {"vulture", "knip"}:
        raise ValueError("dead-code.json requires vulture and knip objects")
    python = raw["vulture"]
    if not isinstance(python, dict) or not isinstance(raw["knip"], dict):
        raise ValueError("Analyzer configurations must be objects")
    if set(python) - {"paths", "ignore_names", "ignore_decorators"}:
        raise ValueError("Unsupported Vulture configuration option")
    paths = strings(python["paths"])
    if not paths:
        raise ValueError("Vulture requires at least one scan path")
    return Configuration(
        paths,
        strings(python.get("ignore_names", [])),
        strings(python.get("ignore_decorators", [])),
        json.dumps(raw["knip"]),
    )


def strings(value: object) -> list[str]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ValueError("Expected a list of strings")
    return value


def load_baseline(path: Path) -> Counter[Finding]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("Baseline must be an array of finding records")
    findings = []
    for record in raw:
        if not isinstance(record, dict) or set(record) != {
            "tool",
            "path",
            "kind",
            "name",
        }:
            raise ValueError("Invalid baseline finding record")
        if any(not isinstance(value, str) for value in record.values()):
            raise ValueError("Baseline finding fields must be strings")
        finding = Finding(
            Tool(record["tool"]), record["path"], record["kind"], record["name"]
        )
        relative = Path(finding.path)
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError("Baseline paths must be repository-relative")
        findings.append(finding)
    return Counter(findings)


def changed_paths(root: Path, explicit_base: str | None) -> set[str] | None:
    base = explicit_base if explicit_base is not None else "origin/main"
    merge = subprocess.run(
        ["git", "merge-base", base, "HEAD"],
        cwd=root,
        capture_output=True,
        text=True,
    )
    if merge.returncode:
        if explicit_base is not None:
            merge.check_returncode()
        print("Dead code: default comparison history unavailable; checking all files")
        return None
    changed = subprocess.check_output(
        ["git", "diff", "--no-renames", "--name-only", "-z", merge.stdout.strip()],
        cwd=root,
    )
    untracked = subprocess.check_output(
        ["git", "ls-files", "--others", "--exclude-standard", "-z"],
        cwd=root,
    )
    return {os.fsdecode(path) for path in (changed + untracked).split(b"\0") if path}


def analyze_python(root: Path, config: Configuration) -> list[Finding]:
    analyzer = vulture.Vulture(
        ignore_names=config.ignore_names,
        ignore_decorators=config.ignore_decorators,
    )
    analyzer.scavenge([str(root / path) for path in config.paths])
    if analyzer.exit_code:
        raise RuntimeError(f"Vulture failed with exit code {analyzer.exit_code}")
    return [
        Finding(
            Tool.VULTURE,
            item.filename.relative_to(root).as_posix(),
            item.typ,
            item.name,
        )
        for item in analyzer.get_unused_code()
    ]


def analyze_knip(root: Path, config: Configuration) -> list[Finding]:
    scratch = root / ".scratch"
    scratch.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="knip-", dir=scratch) as temporary:
        path = Path(temporary) / "knip.json"
        path.write_text(config.knip_json, encoding="utf-8")
        result = subprocess.run(
            [
                str(root / "node_modules" / ".bin" / "knip"),
                "--config",
                str(path),
                "--include",
                ",".join(KnipKind),
                "--exclude",
                "optionalPeerDependencies",
                "--reporter",
                "json",
                "--no-progress",
                "--no-config-hints",
            ],
            cwd=root,
            capture_output=True,
            text=True,
        )
    if result.stderr:
        print(result.stderr, file=sys.stderr, end="")
    if result.returncode not in (0, 1):
        raise subprocess.CalledProcessError(
            result.returncode,
            result.args,
            output=result.stdout,
            stderr=result.stderr,
        )
    raw = json.loads(result.stdout)
    if not isinstance(raw, dict) or set(raw) != {"issues"}:
        raise ValueError("Invalid Knip JSON report")
    if not isinstance(raw["issues"], list):
        raise ValueError("Knip issues must be an array")
    findings = []
    for row in raw["issues"]:
        if not isinstance(row, dict) or not isinstance(row["file"], str):
            raise ValueError("Invalid Knip issue file")
        for kind in KnipKind:
            items = row[kind]
            if not isinstance(items, list):
                raise ValueError("Invalid Knip finding list")
            for item in items:
                if not isinstance(item, dict) or not isinstance(item["name"], str):
                    raise ValueError("Invalid Knip finding name")
                name = "" if kind is KnipKind.FILES else item["name"]
                findings.append(Finding(Tool.KNIP, row["file"], kind.value, name))
    return findings


if __name__ == "__main__":
    main()
