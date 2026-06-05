#!/usr/bin/env python3
"""Bulk-fix common @typescript-eslint/no-explicit-any patterns in frontend/src."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"

CATCH_ANY = re.compile(
    r"catch\s*\(\s*(\w+)\s*:\s*any\s*\)",
    re.MULTILINE,
)

# err.response?.data?.message patterns (variable name captured)
API_MSG = re.compile(
    r"(\w+)\.response\?\.data\?\.message(?:\s*\|\|\s*([^;\n]+))?",
)

INDEX_ANY = re.compile(r"\[key:\s*string\]:\s*any\b")
RECORD_ANY = re.compile(r"Record<string,\s*any>")
AS_ANY = re.compile(r"\bas\s+any\b")


def ensure_get_error_message_import(text: str) -> str:
    if "getErrorMessage" not in text:
        return text
    if re.search(r"from\s+['\"]@/lib/error-message['\"]", text):
        return text
    # Insert after last import
    lines = text.splitlines(keepends=True)
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import = i + 1
    insert = "import { getErrorMessage } from '@/lib/error-message';\n"
    lines.insert(last_import, insert)
    return "".join(lines)


def fix_catch_blocks(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        return f"catch ({match.group(1)}: unknown)"

    return CATCH_ANY.sub(repl, text)


def fix_api_messages(text: str) -> str:
    """Replace err.response?.data?.message || fallback with getErrorMessage."""

    def repl(match: re.Match[str]) -> str:
        var = match.group(1)
        fallback = (match.group(2) or "").strip()
        if fallback:
            return f"getErrorMessage({var}, {fallback})"
        return f"getErrorMessage({var})"

    new = API_MSG.sub(repl, text)
    if "getErrorMessage" in new and "from '@/lib/error-message'" not in new:
        new = ensure_get_error_message_import(new)
    return new


def fix_misc_any(text: str) -> str:
    text = INDEX_ANY.sub("[key: string]: unknown", text)
    text = RECORD_ANY.sub("Record<string, unknown>", text)
    return text


def process_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original
    updated = fix_catch_blocks(updated)
    updated = fix_api_messages(updated)
    updated = fix_misc_any(updated)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = 0
    for path in sorted(ROOT.rglob("*")):
        if path.suffix not in {".ts", ".tsx"}:
            continue
        if process_file(path):
            changed += 1
            print(path.relative_to(ROOT.parent))
    print(f"Updated {changed} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
