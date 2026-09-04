# ServerFiles v8 — Metin2

Repo de lucru pentru serverfiles-urile v8 (pachet Clever-Host) instalate pe VPS-ul
de la firma de hosting. Aici tinem **doar** partea editabila: sursa, quest-uri,
config-uri, script-uri client si SQL de structura. Binarele si pack-urile mari
raman pe server.

## Structura propusa

```
src/            sursa server (game, db, common, libgame, libthecore, libsql, ...)
quest/          quest-urile .quest (lua) + questlib
share/          locale, data, mob_proto / item_proto, motd, etc.
conf/           CONFIG-uri per canal/core, conf.txt, my.cnf
sql/            structura DB + modificarile noastre (nu dump-uri complete)
client/         root (.py), uiscript, locale_ro — partea de client
tools/          audit.py (inventar + scanare backdoor-uri), si alte script-uri
docs/           cerinte.md, brief.md, inventar.md, resurse.md, dezvoltare.md, migrare.md,
                securitate.md, optimizare.md, wishlist.md, schimbari.md
```

Structura se ajusteaza dupa cum arata efectiv arhiva ta — nu invers.

## Start rapid

Daca deschizi proiectul prima data (mai ales Claude Code pe PC-ul
utilizatorului): `CLAUDE.md` se incarca automat, apoi **citeste `docs/brief.md`**
— context, viziune, principii si planul pe 10 faze.

| Document | Ce contine |
|---|---|
| `docs/cerinte.md` | tot ce a cerut utilizatorul, ca lista de verificare |
| `docs/brief.md` | planul complet, viziunea, principiile de lucru |
| `docs/inventar.md` | checklist Faza 0 — ce avem efectiv, verificat nu presupus |
| `docs/resurse.md` | unde se documenteaza lumea, si de ce codul de pe forumuri e nesigur |
| `docs/dezvoltare.md` | sisteme noi, arme, proto-uri (inclusiv trecerea pe SQL), traduceri |
| `docs/migrare.md` | update de FreeBSD, portare gcc → clang |
| `docs/securitate.md` | vanatoare de backdoor-uri, hardening, anticheat |
| `docs/optimizare.md` | cum se masoara si ce merita optimizat |
| `docs/wishlist.md` | ce vrea utilizatorul modificat |
| `docs/schimbari.md` | jurnal de modificari cu pasi de rollback |

**Regula #1: zero presupuneri.** Caile si numele de fisiere din documentatia asta
sunt ipoteze de verificat pe pachetul real, nu adevaruri.

**Regula #2: pentru orice task, inspectezi fisierele relevante inainte sa
modifici ceva.**

## Cum lucram

1. Tu urci in acest repo (branch `claude/svfiles-v8-setup-72w2sb`) partea
   editabila din svfiles + sursa.
2. Eu fac modificarile aici, commit + push, cu explicatie in `docs/`.
3. Tu dai `git pull` pe VPS (sau copiezi fisierele), compilezi si repornesti
   canalele.

## Limitari ale mediului in care rulez (important)

- **Nu ma pot conecta la VPS-ul tau.** Sesiunea ruleaza intr-un container izolat,
  fara SSH si cu iesire doar pe HTTPS catre domenii permise. Comenzile pe server
  le dai tu; eu iti scriu exact ce sa rulezi.
- **Nu pot compila binare FreeBSD aici.** Containerul e Ubuntu 24.04 (gcc 13,
  clang 18). Pot verifica/edita sursa si pot scrie Makefile-uri si script-uri de
  build, dar `game` / `db` se compileaza pe server.
- Nu am `python2`, `lua`/`luac` si `mysql` client instalate — le pot instala daca
  e nevoie pentru verificari offline (quest compiler, proto-uri).
- GitHub refuza fisiere peste 100 MB. Arhivele si pack-urile nu se urca aici.

## Ce imi trebuie de la tine

- Arhiva/folderul `svfiles` + `sursa` (partea editabila — vezi structura de mai sus).
- Versiunea de FreeBSD de pe VPS si daca e i386 sau amd64.
- Versiunea de client si ce revizie de sursa e (daca stii).
- Datele de MySQL **doar daca chiar e nevoie** — si atunci schimbate dupa aceea.
  Nu urca parole in repo.
- Lista cu ce vrei modificat. Adaug-o in `docs/wishlist.md`.

## Wishlist

Ce vrei schimbat se scrie in `docs/wishlist.md`, pe puncte. Le iau la rand.
