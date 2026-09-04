# ServerFiles v8 (Metin2) — context de proiect

**Citeste `docs/brief.md` inainte de a face orice.** Acolo e contextul complet,
planul pe faze si detaliile tehnice. Documentul asta e doar rezumatul care sta
mereu in context.

## Ce e proiectul

Server privat de Metin2 pe VPS de la Clever-Host.ro, cu pachetul lor
**ServerFiles v8**. Utilizatorul are pe PC un folder cu `svfiles` (fisierele de
server) si `sursa` (cod C++). Vrea modificari dupa preferintele lui, apoi sursa
urcata pe host, compilata si pusa in functiune.

Lista de modificari cerute: **`docs/wishlist.md`**. Daca e goala, completeaz-o
impreuna cu el inainte sa implementezi ceva.

## Ordinea de lucru

`docs/brief.md` → Faza 0 (inventar) → Faza 1 (baseline in git) → Faza 2 (wishlist)
→ Faza 3 (implementare) → Faza 4 (compilare pe FreeBSD) → Faza 5 (deploy) → Faza 6 (jurnal)

**Nu sari peste Faza 0.** Structura pachetelor de serverfiles difera; verifica
folderul real inainte sa presupui unde sta ceva.

## Reguli care nu se negociaza

1. **Backup inainte de orice modificare pe server** — fisiere (`tar czf`) si
   baza de date (`mysqldump`). Verifica arhiva inainte sa continui.
2. **Pastreaza binarul vechi** (`cp game game.bak_$(date +%F)`) inainte sa-l
   inlocuiesti. E rollback-ul in 10 secunde.
3. **Fara parole in git** — `conf.txt`, `CONFIG` cu date reale de MySQL, date de
   la host sau site. Versioneaza cu placeholder, originalul ramane pe server.
4. **O modificare pe rand, verificata.** Nu aduna schimbari si apoi restart.
5. **Dupa fiecare restart, citeste `syserr`.** Un server care porneste nu
   inseamna un server care merge.
6. **Confirmare inainte de comenzi distructive** — `rm -rf`, `DROP`, `TRUNCATE`,
   import SQL pe baza de productie.
7. **Nu declara ceva gata** pana nu ai vazut serverul pornit, `syserr` curat si
   modificarea functionand in joc.

## Detalii tehnice de retinut

- Serverul e **FreeBSD** — se compileaza acolo, cu `gmake`, nu pe Windows.
  Arhitectura (i386 vs amd64) trebuie sa se potriveasca, altfel binarul nu porneste.
- Ordinea de build: `libthecore → libpoly → libsql → libgame → liblua → game, db`
- Scripturile de client sunt **Python 2.7**, nu 3.
- `item_proto` de server si cel de client sunt fisiere diferite si trebuie
  tinute sincronizate.
- Quest-urile se compileaza cu `qc` (are nevoie de Python 2 pe server); citeste
  output-ul compilatorului — serverul porneste linistit cu un quest rupt.

## Repo

`https://github.com/dinica600-bot/Test` — branch `claude/svfiles-v8-setup-72w2sb`.
Binarele, pack-urile `.eix`/`.epk`, logurile si dump-urile mari **nu** intra in
git (`.gitignore` le acopera; verifica cu `git status` inainte de commit).
GitHub refuza fisiere peste 100 MB.
