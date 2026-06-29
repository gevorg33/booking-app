#!/usr/bin/env python3
"""Merge top-20 customer/public guide HY/RU copy into corpus snapshot (ai-guide-1.5.5)."""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "src/modules/ai/guide"
SNAPSHOT = GUIDE / "dashboard-guide-corpus-i18n.snapshot.json"
HY_JSON = GUIDE / "guide-flow-customer-public-i18n.hy.json"
RU_JSON = GUIDE / "guide-flow-customer-public-i18n.ru.json"


def deep_merge(base: dict, override: dict) -> dict:
    result = deepcopy(base)
    for key, value in override.items():
        if (
            key in result
            and isinstance(result[key], dict)
            and isinstance(value, dict)
        ):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def main() -> None:
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    hy_flows = json.loads(HY_JSON.read_text(encoding="utf-8"))
    ru_flows = json.loads(RU_JSON.read_text(encoding="utf-8"))

    snapshot["hy"]["guide"]["flows"] = deep_merge(
        snapshot["hy"]["guide"].get("flows", {}),
        hy_flows,
    )
    snapshot["ru"]["guide"]["flows"] = deep_merge(
        snapshot["ru"]["guide"].get("flows", {}),
        ru_flows,
    )

    SNAPSHOT.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Updated {SNAPSHOT}")


if __name__ == "__main__":
    main()
