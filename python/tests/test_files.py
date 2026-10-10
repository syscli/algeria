"""The package ships a copy of data/*.csv; it must stay identical."""

from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
PACKAGED = Path(__file__).resolve().parents[1] / "src" / "syscli_algeria" / "data"


@pytest.mark.parametrize("name", ["communes.csv", "wilayas.csv"])
def test_packaged_csv_matches_repo(name):
    source = ROOT / "data" / name
    if not source.exists():
        pytest.skip("not in the repository checkout")
    assert (PACKAGED / name).read_bytes() == source.read_bytes()
