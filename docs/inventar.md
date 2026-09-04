# Inventar — ce avem efectiv

> **Faza 0** din `docs/brief.md`. Se completeaza inainte de orice modificare.
>
> **Nu ghici. Nu completa din memorie sau dupa tutoriale.** Deschide fisierele,
> ruleaza comenzile, si scrie ce ai vazut. Daca ceva nu se aplica, scrie
> „nu exista in pachetul asta" — nu sterge randul, informatia aia conteaza.
> Daca nu ai putut verifica ceva, scrie „NEVERIFICAT" — nu lasa gol si nu ghici.

---

## 1. VPS si versiuni

Comenzi:
```sh
uname -a                     # sistem, versiune, arhitectura
freebsd-version -kru
sysctl hw.ncpu hw.physmem    # CPU, RAM
df -h                        # spatiu
cc --version                 # clang sau gcc?
gcc --version 2>/dev/null    # exista si gcc separat?
gmake --version
mysql --version
python --version 2>&1; python2 --version 2>&1; python3 --version 2>&1
pkg info | wc -l; pkg info | grep -iE 'mysql|boost|openssl|devil|cryptopp'
```

| | Valoare |
|---|---|
| Sistem + versiune | |
| **Arhitectura** (i386 / amd64) | |
| CPU / RAM / disc | |
| **Compilator implicit** (clang/gcc + versiune) | |
| gcc disponibil separat? | |
| MySQL / MariaDB + versiune | |
| Python pe server (pentru `qc`) | |
| Biblioteci relevante (mysqlclient, openssl, boost...) | |
| Radacina serverului pe disc | |

> Arhitectura si compilatorul sunt critice. Un binar de amd64 nu porneste pe
> i386. Sursele vechi de Metin2 sunt scrise pentru gcc 4.x si adesea nu compileaza
> curat cu clang-ul din FreeBSD modern fara ajustari. **Afla ce e, inainte sa
> incerci sa compilezi.**

---

## 2. Structura `svfiles`

Pune aici arborele real (primele 2–3 niveluri):
```
<output de la `find . -maxdepth 3 -type d | sort` sau `tree -L 3`>
```

| | Unde / ce |
|---|---|
| Radacina serverului | |
| Cate canale, cum sunt numite | |
| Core-uri per canal | |
| Unde stau binarele `game` / `db` / `auth` | |
| Directorul `share` (sau echivalent) | |
| Limba folosita in `locale` | |
| `CONFIG`-uri — cai | |
| Fisier cu conexiunea MySQL — **doar calea, nu continutul** | |
| Scripturi start / stop / restart | |
| Unde se scriu `syserr` / `syslog` | |

---

## 3. Unde se editeaza fiecare lucru

Coloana „Verificat cum" nu e optionala — scrie cum ai confirmat (ai deschis
fisierul? ai vazut efectul in joc?).

| Ce | Fisier / tabela | Format | Verificat cum |
|---|---|---|---|
| Rate exp | | | |
| Rate yang | | | |
| Rate drop | | | |
| Drop-uri per mob | | | |
| Drop-uri comune | | | |
| Grupuri de item-e speciale | | | |
| `item_proto` (server) | | txt / binar / DB | |
| `item_proto` (client) | | | |
| `mob_proto` (server) | | txt / binar / DB | |
| `mob_proto` (client) | | | |
| Nume item-e / mobi | | | |
| Bonusuri / `item_attr` | | | |
| Spawn / regen mobi | | | |
| Quest-uri `.quest` | | | |
| `quest_list` / lista de compilat | | | |
| Compilator de quest-uri (`qc`) | | | |
| Sanse de imbunatatire (upgrade) | | | |
| Texte de joc | | | |
| Interfata client (`uiscript`) | | | |
| Logica client (`root`) | | | |
| Setari de canal (port, nr. jucatori) | | | |
| Mesaje de sistem / MOTD | | | |
| Event-uri | | | |

---

## 4. Baza de date

```sql
SHOW DATABASES;
SHOW TABLES FROM player; SHOW TABLES FROM common;
SELECT COUNT(*) FROM player.player;
SHOW CREATE TABLE player.item\G      -- ce indecsi exista
```

| | |
|---|---|
| Baze existente | |
| Proto-urile se citesc din fisiere sau din DB? | |
| Tabele mari (si dimensiunea lor) | |
| Indecsi existenti pe `player`, `item` | |
| Unde e lista de GM-i | |
| Motor (InnoDB / MyISAM) | |

---

## 5. `sursa`

```
<arbore, primele 2-3 niveluri>
```

| | |
|---|---|
| Sursa de server — cale | |
| Librarii incluse (thecore, poly, sql, game, lua, ...) | |
| Sursa de client — exista? cale | |
| Sistem de build (Makefile per director / script / CMake) | |
| Flag-uri de compilare folosite | |
| Pentru ce compilator e scrisa | |
| **Compileaza curat nemodificata?** | da / nu — ce erori |
| Binarele livrate corespund sursei? | cum ai verificat |
| Revizie / origine a sursei (daca se poate afla) | |

---

## 6. Sisteme prezente in pachet

Enumera ce **ai gasit efectiv** in cod si config, nu ce zice descrierea
pachetului. Pentru fiecare: unde traieste si daca se poate opri.

| Sistem | Unde in cod / config | Se poate dezactiva? | Il pastram? |
|---|---|---|---|
| Bonus Board | | | |
| Kill Status | | | |
| | | | |

> Coloana „Il pastram?" se completeaza in Faza 4, impreuna cu utilizatorul.
> Viziunea e **cat mai putine sisteme** — ce nu se justifica, iese.

---

## 7. Client

| | |
|---|---|
| Versiune client | |
| Versiune Python in client | |
| `root` / `uiscript` / `locale` — despachetate sau in pack-uri? | |
| Unealta de pack folosita | |
| Cum se distribuie patch-urile catre jucatori | |

---

## 8. Site / CMS

| | |
|---|---|
| Ce CMS / cod | |
| Unde e gazduit (acelasi VPS?) | |
| Versiune PHP | |
| Are acces la baza de date a jocului? | |

---

## 9. Observatii

Orice ai gasit ciudat, rupt, nedocumentat, sau care nu se potriveste cu
descrierea pachetului. Include si lucrurile pe care nu le-ai inteles — sunt
punctul de plecare pentru Faza 1.

---

## 10. Concluzia fazei

- [ ] Sursa nemodificata compileaza curat
- [ ] Stiu arhitectura si compilatorul
- [ ] Stiu unde se editeaza fiecare lucru din tabelul 3
- [ ] Am enumerat sistemele existente
- [ ] Inventarul a fost aratat utilizatorului si confirmat
