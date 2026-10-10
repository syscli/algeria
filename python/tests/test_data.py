from syscli_algeria import changes, commune, communes, normalize, search, wilaya, wilayas

SETIF_AR = "\u0633\u0637\u064a\u0641"
BOU_SAADA_AR = "\u0628\u0648\u0633\u0639\u0627\u062f\u0629"


def test_counts():
    assert len(wilayas()) == 69
    assert len(communes()) == 1541
    assert len({c.code for c in communes()}) == 1541
    assert len(communes(16)) == 57


def test_new_wilayas():
    assert wilaya(59).name_fr == "Aflou"
    assert wilaya(69).name_fr == "El Abiodh Sidi Cheikh"
    assert wilaya("68").created_by == "loi 26-06"


def test_wilaya_by_code_or_name():
    assert wilaya("5").name_fr == "Batna"
    assert wilaya("Setif").code == "19"
    assert wilaya(SETIF_AR).code == "19"
    assert wilaya(70) is None
    assert wilaya("\u0661\u0666") is None


def test_commune_by_code():
    assert commune("1601").wilaya_code == "16"
    assert commune(1601).code == "1601"
    assert commune("9999") is None


def test_search():
    assert search("Bou Saada")[0].commune.code == search("bousaada")[0].commune.code
    assert search(BOU_SAADA_AR)[0].wilaya.code == "68"
    assert search("Ghardaia")[0].commune.name_fr == "Gharda\u00efa"
    assert search("Bains Romains")[0].commune.name_fr == "Hammamet"
    assert search("Tamanghaset")[0].commune.code == "1101"
    assert search("  ") == []


def test_search_in_one_wilaya():
    one = search("sidi", wilaya="22", limit=50)
    assert one
    assert all(r.wilaya.code == "22" for r in one)
    assert len(search("sidi")) <= 10


def test_changes():
    moved = changes(2026)
    assert len(moved) == 108
    bou_saada = next(m for m in moved if m.commune.name_fr == "Bou Saada")
    assert (bou_saada.from_, bou_saada.to) == ("28", "68")
    old = changes(2019)
    assert len(old) == 60
    assert all(49 <= int(m.to) <= 58 for m in old)


def test_normalize():
    assert normalize("A\u00efn T\u00e9mouchent") == normalize("ain temouchent")
    assert normalize("Djelfa") == normalize("Jelfa")
    assert normalize("El Oued") == normalize("Oued")
