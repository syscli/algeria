"""Checks that the Python port gives the same answers as the npm package.

tests/parity.json is written by scripts/parity.mjs from the built npm package;
CI writes it before running these tests. Without it, these tests are skipped.
"""

import json
from pathlib import Path

import pytest

from syscli_algeria import normalize, search

FIXTURE = Path(__file__).with_name("parity.json")
DATA = json.loads(FIXTURE.read_text(encoding="utf-8")) if FIXTURE.exists() else None
needs = pytest.mark.skipif(DATA is None, reason="run scripts/parity.mjs first")


@needs
def test_normalize_matches_every_name():
    wrong = [(name, key, normalize(name)) for name, key in DATA["normalize"] if normalize(name) != key]
    assert wrong == []


@needs
def test_search_matches():
    for query, expected in DATA["search"]:
        got = [[r.commune.code, round(r.score, 6)] for r in search(query, limit=5)]
        assert got == expected, query
