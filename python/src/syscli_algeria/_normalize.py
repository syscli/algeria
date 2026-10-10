"""Folds the many ways a place name gets written into one comparable key.

A port of src/normalize.ts; tests/test_parity.py checks that both give the
same keys for every commune name.
"""

import re
import unicodedata

_LATIN = [
    (re.compile(r"\b(el|al|les?|la)\b"), " "),
    (re.compile(r"\bbeni\b|\bbni\b"), "bn"),
    (re.compile(r"\bain\b"), "an"),
    (re.compile(r"dj"), "j"),
    (re.compile(r"ou"), "u"),
    (re.compile(r"ch|sh"), "c"),
    (re.compile(r"kh"), "k"),
    (re.compile(r"gh"), "g"),
    (re.compile(r"th"), "t"),
    (re.compile(r"dh"), "d"),
    (re.compile(r"q"), "k"),
    (re.compile(r"y"), "i"),
    (re.compile(r"e"), "a"),
    (re.compile(r"([a-z])\1+"), r"\1"),
]

_ARABIC = [
    (re.compile("[\u064b-\u065f\u0670\u0640]"), ""),
    (re.compile("[\u0622\u0623\u0625\u0671]"), "\u0627"),
    (re.compile("\u0649"), "\u064a"),
    (re.compile("\u0629"), "\u0647"),
    (re.compile("\u0624"), "\u0648"),
    (re.compile("\u0626"), "\u064a"),
    (re.compile("(^|\\s)\u0627\u0644"), "\\1"),
]

_HAS_ARABIC = re.compile("[\u0600-\u06ff]")
_NOT_ARABIC = re.compile("[^\u0600-\u06ff]")
_MARKS = re.compile("[\u0300-\u036f]")
_NOT_LATIN = re.compile("[^a-z]+")
_SPACES = re.compile(r"\s+")


def normalize(text: str) -> str:
    """Returns the comparison key of a place name, in French or Arabic."""
    s = unicodedata.normalize("NFKD", text).lower()
    if _HAS_ARABIC.search(s):
        for pattern, repl in _ARABIC:
            s = pattern.sub(repl, s)
        return _NOT_ARABIC.sub("", s)
    s = _NOT_LATIN.sub(" ", _MARKS.sub("", s)).strip()
    for pattern, repl in _LATIN:
        s = pattern.sub(repl, s)
    return _SPACES.sub("", s)


def distance(a: str, b: str) -> int:
    """Levenshtein distance, or 99 when the lengths differ by more than 3."""
    if abs(len(a) - len(b)) > 3:
        return 99
    row = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev = row[0]
        row[0] = i
        for j in range(1, len(b) + 1):
            tmp = row[j]
            row[j] = min(row[j] + 1, row[j - 1] + 1, prev + (0 if a[i - 1] == b[j - 1] else 1))
            prev = tmp
    return row[len(b)]
