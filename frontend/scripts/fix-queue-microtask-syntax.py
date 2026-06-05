#!/usr/bin/env python3
"""Fix broken queueMicrotask wraps that split object literals across lines."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"

# queueMicrotask(() => setFoo({);  -> merge following lines into one call
BROKEN_OPEN = re.compile(
    r"^(\s*)queueMicrotask\(\(\) => (set\w+\([^;]*\(\{);\s*$"
)
BROKEN_OPEN_FUNC = re.compile(
    r"^(\s*)queueMicrotask\(\(\) => (set\w+\([^)]*\) => \{);\s*$"
)
BROKEN_SETLINES = re.compile(r"^(\s*)queueMicrotask\(\(\) => (setLines\(\));\s*$")


def fix_file(path: Path) -> bool:
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    out: list[str] = []
    i = 0
    changed = False
    while i < len(lines):
        line = lines[i]
        m = BROKEN_OPEN.match(line) or BROKEN_OPEN_FUNC.match(line)
        if m:
            indent, prefix = m.group(1), m.group(2)
            body_lines: list[str] = []
            i += 1
            while i < len(lines):
                body_lines.append(lines[i])
                if lines[i].strip() == "});":
                    break
                i += 1
            if i >= len(lines):
                out.append(line)
                continue
            # body_lines[0..-1] are object properties; last is "});"
            inner = "".join(l.strip() for l in body_lines[:-1])
            if inner.startswith("..."):
                merged = f"{indent}queueMicrotask(() => {prefix} {inner} }}));\n"
            else:
                merged = f"{indent}queueMicrotask(() => {prefix} {inner} }}));\n"
            # Fix double }} if prefix already ends with ({
            merged = merged.replace("({ {", "({ ").replace("({{", "({")
            merged = re.sub(r"\(\{;\s*", "({ ", merged)
            out.append(merged)
            changed = True
            i += 1
            continue

        m2 = BROKEN_SETLINES.match(line)
        if m2:
            # setLines(); was wrongly wrapped — unwrap next lines into setLines(...)
            indent = m2.group(1)
            i += 1
            args: list[str] = []
            while i < len(lines) and not lines[i].strip().startswith(");"):
                if lines[i].strip() and not lines[i].strip().startswith("//"):
                    args.append(lines[i].strip().rstrip(","))
                i += 1
            if args:
                out.append(f"{indent}queueMicrotask(() => setLines({', '.join(args)}));\n")
                changed = True
                i += 1
                continue

        out.append(line)
        i += 1

    if changed:
        path.write_text("".join(out), encoding="utf-8")
    return changed


def main() -> None:
    changed = 0
    for path in sorted(ROOT.rglob("*")):
        if path.suffix not in {".ts", ".tsx"}:
            continue
        if fix_file(path):
            changed += 1
            print(path.relative_to(ROOT.parent))
    print(f"Fixed {changed} files")


if __name__ == "__main__":
    main()
