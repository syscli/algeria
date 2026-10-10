# Sources

Every wilaya and commune in `data/` comes from the texts below, as published
in the Journal officiel de la Republique algerienne (JORADP). The PDFs are not
stored in this repository; download them from joradp.dz and compare the
SHA-256 hashes if you want to check that you have the same files.

| Text | Subject | Journal officiel |
|---|---|---|
| Loi 84-09 of 4 February 1984 | The 48 wilayas and the communes of each | 1984 n 6 |
| Decret 84-79 of 3 April 1984 | Names and seats of wilayas 01 to 48 | 1984 n 14 |
| Decret executif 91-306 of 24 August 1991 | Communes of each daira | 1991 n 41 |
| Ordonnance 97-14 of 31 May 1997 | 24 communes moved to Algiers | 1997 n 38 |
| Loi 19-12 of 11 December 2019 | Wilayas 49 to 58, new lists for 8 wilayas | 2019 n 78 |
| Decret presidentiel 21-117 of 22 March 2021 | Names and seats of wilayas 49 to 58 | 2021 n 22 |
| Loi 26-06 of 4 April 2026 | 69 wilayas, new lists for 10 wilayas, wilayas 59 to 69 | 2026 n 25 |
| Decret presidentiel 26-206 of 25 May 2026 | Names, numbers and seats of wilayas 59 to 69 | 2026 n 40 |

Download URLs follow this pattern (F for the French edition, A for Arabic,
three-digit issue number):

```
https://www.joradp.dz/FTP/jo-francais/<year>/F<year><issue>.pdf
https://www.joradp.dz/FTP/jo-arabe/<year>/A<year><issue>.pdf
```

SHA-256 of the files used:

```
d14ebe0fc3c6c806f9431c96f2bff463f58db78b572378c72d277671e28ab3ff  F1984006.pdf
ddf0c02fc6a7377c7e66c080257a60b86e58527d1b20b7d5d517371be127f052  A1984006.pdf
8b65e929f0ad7fce3fcdb802f9e2d7f8274dce1221deead87cf8f965604a9358  F1984014.pdf
a47ecd6615829666850e6f20708802fd97de12c3d36084c587c22048ec710027  A1984014.pdf
5bfe8861f54dea0ada45b6db7c71bd406c9503328171aff7ee2f8a03bf993edf  F1991041.pdf
a0b640a0eeedcc8961db7aece4639c5fea675cd92dbf0bf568cd707101e92c20  A1991041.pdf
2c48b0e27ad4ff305fdef188fec29350e84407a7392c036a6c39922ce47f5224  F1997038.pdf
aba39a0f09aa87461d9ec34929e16c803085553c566af1386acc90ac74ea2d07  A1997038.pdf
5a31159713aa60e49a56e2fb1a22cd33c00432ddc0f3082200f84218cb22669d  F2019078.pdf
4a135bc50d460f9079ddfc361940592cbefc6406a562c81f745e1cd885464054  A2019078.pdf
e3e22deedf5dbddcd8fd58dd258fdf1566d879cb67ff4ed0f7d1e3b238d025dc  F2021022.pdf
5962b627390d44f2df8eed9ff1e1b8fd30f16e9dcfac734d4369df7675b9b666  A2021022.pdf
f6d7f5261e997e490d54a1a061648a5635d3263e1f19aed50e5cd1e5ad01e46f  F2026025.pdf
e21760367ac5ccf4bacc155873560460fddf5502c32af685aad459507ae48e87  A2026025.pdf
7cc0cf26f944d20138b24f7894332f2cc4c5cba260dc2303d4ba75d8c8b8f9b0  F2026040.pdf
a4552b3ad93f79321093aef76ae3ca9733c0c63f6783a715afcd8ce13c943f6d  A2026040.pdf
```

## How the lists combine

The 1984 law lists the communes of each wilaya, one article per wilaya
(article 5 is wilaya 01, article 52 is wilaya 48). Ordonnance 97-14 moves
communes into Algiers. The 2019 and 2026 laws rewrite some of the 1984
articles and add new ones (52 bis to 52 bis 20). The current list of a wilaya
is the most recent version of its article.

Names follow the most recent official text that lists the commune: the 2019
or 2026 law, then ordonnance 97-14, then decret 91-306, then the 1984 law.
Where 1984 and 1991 only spell a name differently, the spelling used by the
ONS breaks the tie. Every other spelling is kept in the `aliases` column.

The 1984, 1991 and 1997 issues are scans. Their lists were transcribed by hand
and checked against the number of communes each article declares.

## Open points

- Commune 2938 (El Gueithna, Mascara) is listed in 1991 but not in 1984,
  where a single commune "Guettena El Mamounia" stands for it and Mamounia.
  The text that split them has not been found.
- Some communes carry a new name in 1991 without a renaming text that we
  found (for example Bains Romains, now Hammamet). Renamings confirmed in the
  Journal officiel: Hamma Anassers to Mohamed Belouizdad (decret executif
  92-378, 1992 n 75) and three Bouira communes (arretes of 6 February 1988,
  1988 n 10).
- Decret 91-306 does not list Rouissat (Ouargla); loi 19-12 does.
