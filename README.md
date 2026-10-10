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

## Which commune is this point in

```ts
import { communeAt, wilayaAt, bounds } from "@syscli/algeria/geo";

communeAt(35.2083, 4.1736)?.nameFr;  // "Bou Saada"
wilayaAt(35.2083, 4.1736)?.code;     // "68"
bounds(16);                          // [2.7999, 36.5794, 3.3826, 36.8209], west south east north
```

Arguments are latitude then longitude, as GPS and map apps show them. The
boundaries are a separate import so that the main package stays small: they
add about 1.1 MB (430 KB gzipped) and answer a lookup in a few microseconds.
They are accurate to about 100 m, so a point right on a boundary can land in
the neighbouring commune. Menaa (0506) has no shape in the source data.

## Site, API and downloads

AlgerieGeo, the site at https://syscli.github.io/algeria/, lets anyone look up
a commune, its wilaya, and whether it moved in 2026. It is in French and
Arabic and links every answer to the Journal officiel text behind it.

The same build publishes a static JSON API, free to use without a key:

| endpoint | |
|---|---|
| /api/v1/wilayas.json | the 69 wilayas |
| /api/v1/wilayas/{code}.json | one wilaya with its communes |
| /api/v1/communes.json | all 1541 communes |
| /api/v1/communes/{code}.json | one commune by ONS code |
| /api/v1/changes/2026.json, /api/v1/changes/2019.json | communes moved by each reform |

Downloads: CSV, JSON, SQL (MySQL, PostgreSQL, SQLite) and GeoJSON boundaries
for the 69, 58 and 48 wilaya maps and for the communes, under /downloads/.

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

## Building

```sh
npm ci
npm test
npm run build        # package in dist/
npm run build:site   # site, API and downloads in public/
npm run serve        # preview public/ on http://localhost:4173
npm run build:geo    # rebuild geo/ from the open boundary sources
```

## Releases and security

Versions are listed in [CHANGELOG.md](CHANGELOG.md). Releases are published
from GitHub Actions with npm provenance; `npm audit signatures` checks them.
To report a security problem, see [SECURITY.md](SECURITY.md).

## License

Code and data: MIT. Boundaries in geo/ and the @syscli/algeria/geo entry:
CC BY-SA 2.0, derived from OpenStreetMap; see geo/README.md. If you ship
`communeAt` or `wilayaAt` in a product, credit "(c) OpenStreetMap
contributors".
