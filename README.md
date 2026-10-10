# algeria

The 69 wilayas and 1541 communes of Algeria, taken from the Journal officiel,
with French and Arabic names, ONS codes, and search that understands the many
ways a place name gets spelled.

Up to date with loi 26-06 of 4 April 2026, which took the country from 58 to
69 wilayas, and decret presidentiel 26-206, which numbered the new ones 59 to 69.

```sh
npm install @syscli/algeria
```

```ts
import { wilaya, communes, commune, search, changes } from "@syscli/algeria";

wilaya(16);                 // { code: "16", nameFr: "Alger", nameAr: ..., createdBy: "loi 84-09" }
communes(68).length;        // 23
commune("1601")?.wilayaCode; // "16"

search("bou saada")[0].wilaya.code;  // "68"
search("Bains Romains")[0].commune;  // Hammamet, found by its old official name
search("tamanghaset")[0].commune;    // Tamenghasset, despite the typo

changes(2026).length;       // 108 communes moved to another wilaya in 2026
```

Search accepts French or Arabic, with or without accents, articles or the
usual transliteration variants (Djelfa / Jelfa, Beni / Bni, Ouled / Oulad), and
older official names of renamed communes.

## Why another list

Most lists in circulation still have 48 or 58 wilayas, carry no license, and
do not say where their data comes from. Here every wilaya and every commune
traces back to a text published in the Journal officiel, and the files in
`sources/` tell you which one.

## Data

Plain CSV, one row per entry, in `data/`. Use the files directly if you do
not need the npm package.

`data/wilayas.csv`

| column | |
|---|---|
| code | 01 to 69, also the vehicle plate number |
| name_fr, name_ar | name fixed by decree 84-79, 21-117 or 26-206 |
| created_by | the law that created the wilaya |
| communes | number of communes |

`data/communes.csv`

| column | |
|---|---|
| code | four-digit ONS code |
| wilaya_code | current wilaya (69-wilaya map) |
| name_fr, name_ar | name from the most recent official text that lists the commune |
| daira_1991 | daira seat in decret executif 91-306 |
| wilaya_code_58 | wilaya under the 58-wilaya map (2019 to 2026) |
| wilaya_code_48 | wilaya under the 48-wilaya map (1984 to 2019) |
| name_fr_source, name_ar_source | the text the name was taken from |
| aliases | older official names and other spellings, separated by `|` |

## How the data was built

- Loi 84-09 (1984) gives the communes of each of the first 48 wilayas.
- Ordonnance 97-14 (1997) moves 24 communes from Boumerdes, Tipaza and Blida
  to Algiers.
- Loi 19-12 (2019) and loi 26-06 (2026) rewrite the lists of the wilayas they
  split and add the new ones.
- Decret executif 91-306 (1991) lists every commune by daira; it is the source
  for dairas and for communes renamed between 1984 and 1991.
- Wilaya names come from decret 84-79, decret presidentiel 21-117 and decret
  presidentiel 26-206.

The 1984, 1991 and 1997 issues are scans. Their lists were transcribed by hand
and checked against the number of communes each article declares. ONS codes
were matched by name.

## Known gaps

- Dairas are given as of 1991. Some have changed since.
- A few communes appear under a new name in 1991 without a renaming text that
  we could find. The 1991 name is used and the old one kept in `aliases`.
- The ONS code of Larbaa (Batna) is taken as 0561 from its position in the
  1984 list.

Corrections are welcome. Please cite the Journal officiel issue and page.

## License

MIT
