# Changelog

This project follows semantic versioning. Before 1.0, a minor version may
change the API; a patch version never does. Data corrections ship as patch
versions.

## 0.2.0 - 2026-10-10

- `@syscli/algeria/geo`: `communeAt` and `wilayaAt` find the commune and
  wilaya of a GPS point, and `bounds` gives the bounding box of a commune or a
  wilaya. A separate entry, so the main package does not grow; its data is
  CC BY-SA 2.0, from OpenStreetMap via geoBoundaries.

## 0.1.0 - 2026-10-10

First release.

- The 69 wilayas and 1541 communes, with French and Arabic names and ONS
  codes, from the Journal officiel up to loi 26-06 and decret presidentiel
  26-206.
- `wilayas`, `wilaya`, `communes`, `commune`: lookups by code or name.
- `search`: French or Arabic, with accents, articles, transliteration
  variants, typos and old official names.
- `changes`: communes that changed wilaya in 2019 and 2026, with the 58 and 48
  wilaya maps.
