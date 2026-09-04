# BRIEF — ServerFiles v8 (Metin2) — citește asta prima dată

> **Pentru sesiunea Claude Code care rulează pe PC-ul utilizatorului.**
> Documentul ăsta a fost scris de o sesiune Claude Code separată, care rulează
> într-un container în cloud și **nu are acces la PC sau la VPS**. Tot ce
> înseamnă atins de fișiere locale, SSH, upload și compilare **tu faci**.

---

## 1. Contextul

Utilizatorul are un **server privat de Metin2** pe un VPS luat de la
**Clever-Host.ro**. Firma de hosting i-a instalat pachetul lor **ServerFiles v8**
(3 regate, 4 clase, level max 99 / status max 90, Bonus Board, Kill Status).

Pe PC-ul lui există un folder care conține:
- **`svfiles`** — fișierele de server (binare, `share/`, canale, config-uri, locale, quest-uri)
- **`sursa`** — codul sursă C++ al serverului (și posibil al clientului)

Are instalate: **PuTTY**, **WinSCP**, **VS Code**, browser. Are datele de acces
la host și la site.

**Ce vrea:** modificări în serverfiles și în sursă după preferințele lui, apoi
sursa urcată pe host, compilată și pusă în funcțiune.

Lista concretă de modificări e în **`docs/wishlist.md`**. Dacă e goală, **prima
ta treabă e s-o completezi împreună cu el** (vezi Faza 2).

---

## 2. Împărțirea rolurilor

| | Sesiunea de pe PC (tu) | Repo-ul ăsta |
|---|---|---|
| Citit/scris fișiere locale | ✅ | — |
| Terminal, SSH, upload pe VPS | ✅ | ❌ |
| Compilat pe FreeBSD | ✅ (prin SSH) | ❌ |
| Istoric, diff, rollback pe cod | prin git | ✅ |

Repo-ul: `https://github.com/dinica600-bot/Test`, branch
**`claude/svfiles-v8-setup-72w2sb`**. Folosește-l ca sursă de adevăr pentru
partea editabilă. Nu e obligatoriu, dar fără el nu există „revino la cum era".

---

## 3. Reguli obligatorii

Astea nu se negociază. Un server de Metin2 stricat înseamnă jucători pierduți.

1. **Backup înainte de ORICE modificare pe server.**
   - Fișiere: `tar czf /root/backup_$(date +%F_%H%M).tar.gz /usr/home/game` (ajustează calea)
   - Bază de date: `mysqldump --all-databases | gzip > /root/db_$(date +%F_%H%M).sql.gz`
   - Verifică că arhiva chiar s-a creat și are dimensiune plauzibilă, înainte să continui.
2. **Binarul vechi se păstrează.** Înainte să pui `game`/`db` noi:
   `cp game game.bak_$(date +%F)`. Ăsta e rollback-ul tău în 10 secunde.
3. **Nu pune parole în git.** Nici `conf.txt`, nici `CONFIG` cu date reale de
   MySQL, nici date de la host sau de la site. Dacă un fișier trebuie versionat,
   urcă-l cu valorile înlocuite (`__DB_PASSWORD__`) și ține originalul doar pe server.
4. **O modificare pe rând, verificată.** Nu aduna 15 schimbări și apoi restart.
   Când crapă, nu mai știi care a fost.
5. **Testează pe un canal, nu pe toate.** Dacă pachetul are canal de test, acolo.
   Altfel pe `channel1` întâi, restul după ce e curat.
6. **După fiecare restart, citește `syserr`.** Un server care pornește nu
   înseamnă un server care merge.
7. **Nu rula comenzi distructive fără confirmare de la utilizator** — `rm -rf`,
   `DROP`, `TRUNCATE`, `mysql < ceva.sql` pe baza de producție. Întreabă întâi.
8. **Nu atinge nimic ce nu ține de task.** Serverfiles-urile au o grămadă de
   sisteme legate între ele; o „curățenie" nesolicitată strică lucruri.

---

## 4. Planul de lucru

### Faza 0 — Inventar (fă asta înainte de orice altceva)

Nu presupune structura. Pachetele de serverfiles diferă mult între ele.
Explorează folderul real și scrie ce ai găsit în **`docs/inventar.md`**
(template-ul e deja acolo).

Ce trebuie să afli:

**Pe PC — în `svfiles`:**
- Unde e rădăcina serverului și cum sunt organizate canalele
  (tipic: `channel1/ch1/`, `channel1/game1/`, `auth/`, `db/`, `share/`)
- Unde stau binarele `game`, `db`, `auth`
- Unde e `share/locale/<limba>/` — acolo sunt `item_proto`, `mob_proto`,
  `quest/`, `etc/` (drop-uri, `item_attr`, `special_item_group`)
- `CONFIG`-urile per core și `conf.txt` al core-ului `db` (conexiunea MySQL)
- Scripturile de pornire/oprire (`start.sh`, `stop.sh`, `restart.sh`)

**Pe PC — în `sursa`:**
- Structura (tipic `Srcs/Server/` cu `common/`, `libthecore/`, `libpoly/`,
  `libsql/`, `libgame/`, `liblua/`, `game/src/`, `db/src/`)
- Există și sursă de client? (`Srcs/Client/`, `UserInterface/`, `EterLib/`)
- Ce Makefile-uri / scripturi de build există

**Pe VPS (prin SSH):**
```sh
uname -a                 # versiune FreeBSD + arhitectura (i386 / amd64)
freebsd-version          # daca exista
mysql --version
ls -la /usr/home/game    # sau unde e instalat
```
Arhitectura e critică: un binar compilat pe amd64 nu pornește pe i386.

**Confirmă că sursa corespunde binarelor.** Dacă pachetul a fost livrat cu
binare precompilate dintr-o altă revizie decât sursa din folder, orice
recompilare schimbă comportamentul serverului în feluri neașteptate. Compilează
sursa **nemodificată** o dată și compară — vezi Faza 4.

Când ai terminat inventarul, **arată-i-l utilizatorului** și confirmă că e corect
înainte să treci mai departe.

---

### Faza 1 — Baseline în git

Înainte de prima modificare, pune în repo starea **originală** a părții
editabile. Fără baseline nu există diff și nu există „cum era înainte".

Ce intră: sursa, quest-urile `.quest`, `CONFIG`-urile (fără parole), fișierele
`.txt` din `locale`/`etc`, scripturile client `.py`, `uiscript`, SQL de structură.

Ce **nu** intră: binare, `.o`, pack-uri `.eix`/`.epk`, loguri, arhive, dump-uri
complete de bază de date. `.gitignore`-ul din repo acoperă deja astea — verifică
cu `git status` înainte de commit și cu `git count-objects -vH` după.

GitHub refuză fișiere peste 100 MB. Dacă ceva mare trebuie păstrat, rămâne pe
server, iar în repo pui doar o notă în `docs/inventar.md` despre unde e.

Commit: `Baseline ServerFiles v8 - stare initiala, nemodificata`

---

### Faza 2 — Wishlist

Deschide `docs/wishlist.md`. Dacă e goală, întreabă utilizatorul concret. Nu
accepta cereri vagi — „vreau să fie mai bun" nu se poate implementa.

Pentru fiecare cerere stabilește:
- **Ce anume** se schimbă (valoare, comportament, sistem)
- **Unde** trăiește lucrul ăla (config? quest? proto? sursă C++? client?)
- **Necesită recompilare?** (sursa da; quest/proto/config nu)
- **Necesită modificări de client?** (dacă da, jucătorii trebuie să descarce patch)
- **Se poate da înapoi?** (modificările de bază de date adesea nu)

Grupează-le și propune-i o ordine: întâi cele care nu cer recompilare (rapid,
verificabil), apoi cele din sursă, la final clientul.

**Arată-i planul și cere-i acordul înainte să implementezi.**

---

### Faza 3 — Implementare

Unde trăiește fiecare tip de modificare (verifică pe pachetul real — pot diferi):

| Ce vrea | Unde se face | Recompilare | Restart |
|---|---|---|---|
| Rate exp/yang/drop | `CONFIG`, `mob_drop_item.txt`, `common_drop_item.txt`, uneori quest sau sursă | uneori | da |
| Drop-uri de la mobi | `mob_drop_item.txt`, `special_item_group.txt` | nu | da (sau `/reload`) |
| Item-uri (stats, bonusuri) | `item_proto` (txt sau tabelă în DB) + client `item_proto` | nu | da |
| Mobi (viață, damage, spawn) | `mob_proto`, `regen`/spawn din `share/data/` | nu | da |
| Quest nou/modificat | `share/locale/<limba>/quest/*.quest` + `quest_list` | nu (dar recompilare quest) | `/reload q` sau restart |
| Sisteme on/off | `CONFIG`, uneori `#define` în sursă | depinde | da |
| Level max, limite hardcodate | sursă C++ (`constants.cpp`, `length.h`, `char.cpp`) | **da** | da |
| Interfață, texte | client: `uiscript/*.py`, `locale/<limba>/locale_interface.txt` | nu | patch de client |
| Logica de client | client: `root/*.py` (Python 2.7!) | nu | patch de client |

**Quest-uri:** se compilează cu `qc` din `share/locale/<limba>/quest/`, de regulă
prin `./make.sh`. Rulează pe server (are nevoie de Python 2). Output-ul ajunge în
`object/`. Verifică ieșirea compilatorului — `qc` raportează erorile, dar serverul
pornește liniștit cu un quest nefuncțional.

**Sursa C++:** modifică minimal. Serverfiles-urile de Metin2 sunt cod vechi, cu
dependențe implicite între fișiere. O schimbare într-un `#define` din header
poate cere recompilare completă (`gmake clean` întâi).

**Client Python:** e **Python 2.7**, nu 3. `print "x"`, nu `print("x")`.

După fiecare modificare: commit separat, cu mesaj care spune **ce** și **de ce**.

---

### Faza 4 — Compilare (pe VPS, prin SSH)

Se compilează **pe server**, pe FreeBSD, nu pe Windows. Ordinea contează —
librăriile înainte de binare:

```
libthecore -> libpoly -> libsql -> libgame -> liblua -> game, db
```

Tipic, în fiecare director de librărie:
```sh
cd /usr/src/Srcs/Server/libthecore/src && gmake clean && gmake -j2
```
(pe FreeBSD e `gmake`, nu `make`; unele pachete au un `build.sh` la rădăcină —
folosește-l pe ăla dacă există)

**Înainte de prima modificare de sursă: compilează sursa nemodificată.** Dacă nu
compilează curat, problema e a pachetului, nu a schimbărilor tale — află asta
acum, nu peste trei ore. Dacă compilează, păstrează binarele rezultate ca
referință.

Erori frecvente și ce înseamnă:
- lipsă `libmysqlclient` / `libcrypto` → dependențe neinstalate (`pkg install`)
- `cannot find -lgame` → n-ai compilat librăriile în ordine
- crapă la link cu simboluri lipsă → amestec de arhitecturi sau obiecte vechi (`gmake clean`)

Binarele rezultate (`game`, `db`) se copiază unde sunt cele curente — **după**
ce le-ai salvat pe cele vechi.

---

### Faza 5 — Deploy

1. **Backup complet** (fișiere + DB). Fără excepție.
2. Oprește serverul curat: `./stop.sh` sau scriptul pachetului. Verifică cu
   `ps aux | grep game` că într-adevăr s-a oprit — altfel corupi date.
3. Urcă fișierele (WinSCP, sau `pscp`/`scp` din linia de comandă).
   Atenție la **permisiuni și owner** după upload; binarele au nevoie de `+x`
   (`chmod +x game db`).
4. Aplică modificările de bază de date, dacă sunt — pe rând, verificând fiecare.
5. Pornește: `./start.sh`.
6. **Citește logurile.** În fiecare director de core: `syserr`, `syslog`.
   `tail -f syserr` în timp ce pornește. Un `SYSERR` la boot înseamnă ceva rupt.
7. Verifică din joc: conectare, intrare pe hartă, și concret lucrul pe care l-ai
   modificat.

**Dacă ceva e rupt:** oprește, pune binarul vechi înapoi (`cp game.bak_... game`),
pornește, confirmă că merge. Abia apoi analizează ce a fost greșit. Întâi
serverul în picioare, pe urmă depanarea.

---

### Faza 6 — Închidere

- Commit + push cu tot ce s-a schimbat.
- Notează în `docs/schimbari.md`: ce s-a modificat, în ce fișiere, ce efect are,
  cum se dă înapoi.
- Spune-i utilizatorului clar ce e gata, ce a rămas, și ce trebuie să facă el
  (ex. patch de client pentru jucători).

---

## 5. Ce să NU faci

- Să nu modifici direct pe server prin WinSCP fără să treacă și prin repo — se
  pierde istoricul și nu mai știi ce ai schimbat.
- Să nu compilezi pe Windows și să urci binarul. Serverul e FreeBSD.
- Să nu confunzi `item_proto` de server cu cel de client — sunt fișiere diferite
  și **trebuie ținute sincronizate**, altfel item-urile arată aiurea sau clientul crapă.
- Să nu urci parole, `conf.txt` cu date reale, sau datele de la host în git.
- Să nu ștergi backup-uri „ca să faci loc" fără să întrebi.
- Să nu spui că e gata până n-ai văzut serverul pornit, `syserr` curat, și lucrul
  modificat funcționând în joc.

---

## 6. Prima ta replică, când deschizi sesiunea pe PC

Ceva de genul:

> Am citit brief-ul. Încep cu inventarul: mă uit prin `svfiles` și `sursa`, și am
> nevoie de acces SSH la VPS ca să verific versiunea de FreeBSD și arhitectura.
> Între timp, spune-mi ce vrei modificat — le trec în `docs/wishlist.md`.

Apoi Faza 0. Nu sări peste ea.
