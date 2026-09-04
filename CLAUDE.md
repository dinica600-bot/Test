# ServerFiles v8 (Metin2) — context de proiect

**Citeste `docs/brief.md` inainte de a face orice.** Documentul asta e doar
rezumatul care sta mereu in context.

## Ce e proiectul

Server privat de Metin2 pe VPS de la Clever-Host.ro, cu pachetul lor
**ServerFiles v8**. Utilizatorul are pe PC un folder cu `svfiles` (fisiere de
server) si `sursa` (cod C++). Vrea modificari dupa preferintele lui, apoi sursa
urcata pe host, compilata si pusa in functiune.

## Ce vrea sa iasa

Server **curat, optimizat, modern, dar cu cat mai putine sisteme** — „old school
new school". Fara lag, fara erori, cod curat. **Fara backdoor-uri, fara
exploit-uri, cu anticheat real.** Scopul final: un server popular.

Cand ai de ales intre „adaug inca un sistem" si „fac ce exista sa mearga
impecabil" — **al doilea**. A cerut-o explicit.

## REGULA #1 — zero presupuneri

**Fiecare pachet de serverfiles e diferit.** Structura, caile, formatele,
sistemele incluse, compilatorul cerut — toate difera de la pachet la pachet si
fata de orice tutorial.

- Nu presupune nicio cale. Deschide folderul si uita-te.
- Nu presupune ca un fisier face ce sugereaza numele. Citeste-l.
- Nu presupune ca un tutorial descrie pachetul asta. Verifica in codul tau.
- Nu presupune ca ceva merge pentru ca ar trebui. Testeaza.
- **Caile si numele din documentatia asta sunt ipoteze de verificat**, scrise de
  cineva care nu a vazut pachetul — nu adevaruri.
- Cand nu stii, **spune ca nu stii** si verifica. Nu inventa raspunsul plauzibil.

## Ordinea de lucru

| Faza | Ce | Document |
|---|---|---|
| 0 | Inventar total — structura, cai, formate, **toate versiunile** | `docs/inventar.md` |
| 1 | Documentare pe pachetul asta | `docs/resurse.md` |
| 2 | Baseline in git (starea originala) | — |
| 3 | **Audit de securitate / backdoor-uri** | `docs/securitate.md` A |
| 4 | Wishlist si plan, aprobat de utilizator | `docs/wishlist.md` |
| 5 | Implementare | `docs/brief.md` |
| 6 | Compilare pe FreeBSD | `docs/brief.md` |
| 7 | Deploy si verificare | `docs/brief.md` |
| 8 | Hardening, anticheat, optimizare | `docs/securitate.md` B–D, `docs/optimizare.md` |
| 9 | Jurnal si intretinere | `docs/schimbari.md` |

**Faza 0 nu se sare si nu se face superficial.** Tot restul depinde de ea.

## Reguli care nu se negociaza

1. **Backup inainte de orice modificare pe server** — fisiere (`tar czf`) si DB
   (`mysqldump`). Verifica arhiva inainte sa continui.
2. **Pastreaza binarul vechi** (`cp game game.bak_$(date +%F)`).
3. **Fara parole in git** — versioneaza cu placeholder.
4. **O modificare pe rand, verificata.** Commit separat, cu ce si de ce.
5. **Dupa fiecare restart, citeste `syserr`.**
6. **Confirmare inainte de comenzi distructive** (`rm -rf`, `DROP`, `TRUNCATE`,
   import SQL pe productie).
7. **Nu declara nimic gata** pana n-ai vazut serverul pornit, `syserr` curat si
   modificarea functionand in joc.
8. **Codul de pe forumuri e cod nesigur.** Asa intra backdoor-urile. Se citeste
   linie cu linie inainte sa atinga serverul, sau nu se foloseste.

## Detalii tehnice de retinut

- Serverul e **FreeBSD** — se compileaza acolo, cu `gmake`. Arhitectura
  (i386/amd64) trebuie sa se potriveasca.
- **Compilator**: FreeBSD modern are clang implicit; sursele vechi de Metin2 sunt
  scrise pentru gcc 4.x. Verifica in Faza 0 ce e instalat si ce cere sursa.
- Ordine de build (verific-o pe pachetul tau):
  `libthecore → libpoly → libsql → libgame → liblua → game, db`
- `-O2` e sigur. **Nu `-O3`, nu `-march=native`** — codul are undefined behavior.
- Scripturile de client sunt **Python 2.7**, nu 3.
- `item_proto` de server si cel de client sunt **fisiere diferite** si trebuie
  tinute sincronizate.
- Quest-urile se compileaza cu `qc` (cere Python 2). **Citeste output-ul** —
  serverul porneste linistit cu un quest rupt.

## C++

Cod vechi, stil C++98/03. **Scrie in stilul existent** — nu moderniza pe capul
tau. Repara probleme reale: verificari de lungime lipsa, indici nevalidati,
variabile neinitializate, overflow. Atentie la structurile de pachete (aliniere,
dimensiuni) — o schimbare acolo rupe compatibilitatea cu clientul.

## Repo

`https://github.com/dinica600-bot/Test` — branch `claude/svfiles-v8-setup-72w2sb`.
Binarele, pack-urile `.eix`/`.epk`, logurile si dump-urile mari **nu** intra in
git (`.gitignore` le acopera; verifica `git status` inainte de commit).
GitHub refuza fisiere peste 100 MB.
