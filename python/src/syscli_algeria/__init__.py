"""Algeria's 69 wilayas and 1541 communes, from the Journal officiel.

The same data and search as the npm package @syscli/algeria.

    >>> from syscli_algeria import wilaya, commune, search
    >>> wilaya(16).name_fr
    'Alger'
    >>> search("bou saada")[0].wilaya.code
    '68'
"""

from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass
from importlib import resources
from typing import Literal, Optional, Union

from ._normalize import distance, normalize

__all__ = [
    "Commune",
    "SearchResult",
    "Wilaya",
    "WilayaChange",
    "changes",
    "commune",
    "communes",
    "normalize",
    "search",
    "wilaya",
    "wilayas",
]

__version__ = "0.1.0"


@dataclass(frozen=True)
class Wilaya:
    code: str
    """Two-digit code, "01" to "69". Also the vehicle plate number."""
    name_fr: str
    name_ar: str
    created_by: str
    """The law that created the wilaya: "loi 84-09", "loi 19-12" or "loi 26-06"."""


@dataclass(frozen=True)
class Commune:
    code: str
    """Four-digit ONS code, e.g. "1601"."""
    wilaya_code: str
    name_fr: str
    name_ar: str
    daira_1991: Optional[str]
    """Seat of the daira the commune belonged to in decret 91-306 (1991)."""
    wilaya_code_58: str
    """Wilaya under the 58-wilaya map (2019 to 2026)."""
    wilaya_code_48: str
    """Wilaya under the 48-wilaya map (1984 to 2019)."""
    aliases: tuple[str, ...]
    """Older official names and other common spellings."""


@dataclass(frozen=True)
class SearchResult:
    commune: Commune
    wilaya: Wilaya
    score: float
    """0 is an exact match; higher is a weaker match."""


@dataclass(frozen=True)
class WilayaChange:
    commune: Commune
    from_: str
    to: str


def _rows(name: str) -> list[dict[str, str]]:
    text = resources.files(__package__).joinpath("data", name).read_text(encoding="utf-8-sig")
    return list(csv.DictReader(io.StringIO(text)))


_WILAYAS: tuple[Wilaya, ...] = tuple(
    Wilaya(r["code"], r["name_fr"], r["name_ar"], r["created_by"]) for r in _rows("wilayas.csv")
)
_COMMUNES: tuple[Commune, ...] = tuple(
    Commune(
        code=r["code"],
        wilaya_code=r["wilaya_code"],
        name_fr=r["name_fr"],
        name_ar=r["name_ar"],
        daira_1991=r["daira_1991"] or None,
        wilaya_code_58=r["wilaya_code_58"],
        wilaya_code_48=r["wilaya_code_48"],
        aliases=tuple(r["aliases"].split("|")) if r["aliases"] else (),
    )
    for r in _rows("communes.csv")
)

_BY_WILAYA = {w.code: w for w in _WILAYAS}
_BY_COMMUNE = {c.code: c for c in _COMMUNES}


def _keys(c: Commune) -> list[str]:
    seen: dict[str, None] = {}
    for name in (c.name_fr, c.name_ar, *c.aliases):
        k = normalize(name)
        if k:
            seen[k] = None
    return list(seen)


_INDEX = [(c, _keys(c)) for c in _COMMUNES]


_TWO_DIGITS = re.compile("[0-9]{1,2}")


def _code(value: Union[str, int], width: int) -> str:
    return str(value).strip().zfill(width)


def wilayas() -> tuple[Wilaya, ...]:
    """All 69 wilayas, ordered by code."""
    return _WILAYAS


def wilaya(query: Union[str, int]) -> Optional[Wilaya]:
    """A wilaya by code (5, "05") or by name in French or Arabic."""
    if isinstance(query, int) or _TWO_DIGITS.fullmatch(query.strip()):
        return _BY_WILAYA.get(_code(query, 2))
    q = normalize(query)
    for w in _WILAYAS:
        if normalize(w.name_fr) == q or normalize(w.name_ar) == q:
            return w
    return None


def communes(wilaya_code: Union[str, int, None] = None) -> tuple[Commune, ...]:
    """All communes, or the communes of one wilaya."""
    if wilaya_code is None:
        return _COMMUNES
    w = _code(wilaya_code, 2)
    return tuple(c for c in _COMMUNES if c.wilaya_code == w)


def commune(ons_code: Union[str, int]) -> Optional[Commune]:
    """A commune by its four-digit ONS code."""
    return _BY_COMMUNE.get(_code(ons_code, 4))


def search(query: str, limit: int = 10, wilaya: Union[str, int, None] = None) -> list[SearchResult]:
    """Finds communes by name.

    Accepts French, Arabic, old official names and loose spellings ("setif"
    finds Setif with or without the accent), and tolerates small typos.
    """
    q = normalize(query)
    if not q:
        return []
    only = None if wilaya is None else _code(wilaya, 2)
    results: list[SearchResult] = []
    for c, keys in _INDEX:
        if only and c.wilaya_code != only:
            continue
        best = float("inf")
        for k in keys:
            if k == q:
                s: float = 0
            elif k.startswith(q):
                s = 1 + (len(k) - len(q)) / 100
            elif q in k:
                s = 2 + (len(k) - len(q)) / 100
            else:
                d = distance(q, k)
                s = 3 + d if len(q) >= 4 and d <= max(1, len(q) // 4) else float("inf")
            if s < best:
                best = s
        if best != float("inf"):
            results.append(SearchResult(c, _BY_WILAYA[c.wilaya_code], best))
    results.sort(key=lambda r: (r.score, r.commune.code))
    return results[:limit]


def changes(reform: Literal[2019, 2026] = 2026) -> list[WilayaChange]:
    """Communes whose wilaya changed with a reform.

    2026: 58 to 69 wilayas (loi 26-06). 2019: 48 to 58 wilayas (loi 19-12).
    """
    out = []
    for c in _COMMUNES:
        before, after = (c.wilaya_code_58, c.wilaya_code) if reform == 2026 else (c.wilaya_code_48, c.wilaya_code_58)
        if before != after:
            out.append(WilayaChange(c, before, after))
    return out
