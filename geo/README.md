# Boundaries

| file | |
|---|---|
| communes.geojson | 1540 commune shapes with ONS code, current wilaya, wilaya under the 58 and 48 maps, names |
| wilayas-69.geojson | the 69 wilayas (2026) |
| wilayas-58.geojson | the 58 wilayas (2019 to 2026) |
| wilayas-48.geojson | the 48 wilayas (1984 to 2019) |

Wilaya shapes are made by merging commune shapes according to
`data/communes.csv`, so they follow the official commune lists rather than any
drawn map.

Run `node scripts/geo.mjs` after `npm run build` to rebuild these files.

## Known gaps

The commune of Menaa (Batna, 0506) has no shape in the source data. Its area
is covered by the wilaya shapes, which close any gap between communes.

## License and attribution

These files are derived from OpenStreetMap data published by geoBoundaries
(DZA ADM3 and ADM1, release 9469f09) and are shared under the same license:
Creative Commons Attribution-ShareAlike 2.0 (CC BY-SA 2.0).

- Commune shapes: (c) OpenStreetMap contributors, via geoBoundaries
  (https://www.geoboundaries.org)
- Names of a few unnamed shapes: GeoNames (https://www.geonames.org), CC BY 4.0

The rest of this repository is MIT licensed; this folder is the exception.
