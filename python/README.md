# syscli-algeria

The 69 wilayas and 1541 communes of Algeria, taken from the Journal officiel,
with French and Arabic names, ONS codes, and search that understands the many
ways a place name gets spelled. The Python twin of the npm package
[@syscli/algeria](https://github.com/syscli/algeria), with the same data and
the same search.

```sh
pip install syscli-algeria
```

```python
from syscli_algeria import wilaya, communes, commune, search, changes

wilaya(16).name_fr                 # "Alger"
len(communes(68))                  # 23
commune("1601").wilaya_code        # "16"

search("bou saada")[0].wilaya.code       # "68"
search("Bains Romains")[0].commune.name_fr  # "Hammamet", by its old official name
search("tamanghaset")[0].commune.name_fr    # "Tamenghasset", despite the typo

len(changes(2026))                 # 108 communes moved to another wilaya in 2026
```

Up to date with loi 26-06 of 4 April 2026 (58 to 69 wilayas) and decret
presidentiel 26-206. Every wilaya and commune traces back to a text published
in the Journal officiel; see https://github.com/syscli/algeria.

No dependencies. Python 3.9 or later.

## License

MIT
