#!/usr/bin/env python3
"""Wrap synchronous setState calls flagged by react-hooks/set-state-in-effect."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

SETSTATE_LINE = re.compile(r"^\s*set[A-Z]\w*\(")


def get_violations() -> list[tuple[Path, int]]:
    result = subprocess.run(
        ["npx", "eslint", "src", "--format", "json"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    data = json.loads(result.stdout)
    out: list[tuple[Path, int]] = []
    for file_result in data:
        path = Path(file_result["filePath"])
        for msg in file_result["messages"]:
            if msg.get("ruleId") == "react-hooks/set-state-in-effect":
                out.append((path, msg["line"]))
    return out


def wrap_line(line: str) -> str:
    if "queueMicrotask" in line:
        return line
    stripped = line.lstrip()
    if not SETSTATE_LINE.match(line):
        return line
    indent = line[: len(line) - len(stripped)]
    body = stripped.rstrip()
    if body.endswith(";"):
        body = body[:-1]
    return f"{indent}queueMicrotask(() => {body});\n"


def fix_file(path: Path, lines_to_fix: set[int]) -> bool:
    content = path.read_text(encoding="utf-8")
    file_lines = content.splitlines(keepends=True)
    changed = False
    for line_no in sorted(lines_to_fix):
        idx = line_no - 1
        if idx < 0 or idx >= len(file_lines):
            continue
        new_line = wrap_line(file_lines[idx])
        if new_line != file_lines[idx]:
            file_lines[idx] = new_line
            changed = True
    if changed:
        path.write_text("".join(file_lines), encoding="utf-8")
    return changed


def main() -> None:
    violations = get_violations()
    by_file: dict[Path, set[int]] = {}
    for path, line in violations:
        by_file.setdefault(path, set()).add(line)

    changed = 0
    for path, lines in sorted(by_file.items()):
        if fix_file(path, lines):
            changed += 1
            print(path.relative_to(ROOT))

    print(f"Updated {changed} files ({len(violations)} violations targeted)")


if __name__ == "__main__":
    main()
