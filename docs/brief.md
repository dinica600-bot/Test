# BRIEF — ServerFiles v8 (Metin2) — citeste asta prima data

> **Pentru sesiunea Claude Code care ruleaza pe PC-ul utilizatorului.**
> Documentul a fost scris de o sesiune Claude Code separata, care ruleaza intr-un
> container in cloud si **nu are acces la PC sau la VPS**. Tot ce inseamna atins
> de fisiere locale, SSH, upload si compilare **tu faci**.

---

## 1. Contextul

Utilizatorul are un **server privat de Metin2** pe un VPS de la
**Clever-Host.ro**, cu pachetul lor **ServerFiles v8** (3 regate, 4 clase, level
max 99 / status max 90, Bonus Board, Kill Status).

Pe PC are un folder cu:
- **`svfiles`** — fisierele de server
- **`sursa`** — cod sursa C++

Are instalate PuTTY, WinSCP, VS Code. Are datele de acces la host si la site.

---

## 2. Viziunea — ce vrea sa iasa

Astea sunt criteriile dupa care se judeca fiecare decizie tehnica:

- **Curat.** Cod si fisiere in ordine, fara resturi de la cine a impachetat.
- **Optimizat.** Fara lag. Merge bine si cand sunt jucatori multi.
- **Modern, dar cu putine sisteme.** "Old school new school": senzatia de joc
  clasic, cu calitatea tehnica de azi. **Nu** un server incarcat cu zeci de
  sisteme adaugate. Fiecare sistem nou trebuie sa isi justifice existenta.
- **Fara erori.** `syserr` curat. Bug-urile se repara, nu se ignora.
- **Sigur.** Fara backdoor-uri, fara exploit-uri deschise, fara dupe.
- **Cu anticheat.** Validare server-side reala, nu decor.
- **Sa devina popular.**

Ultimul punct merita spus direct: partea tehnica nu face un server popular
singura — dar **lipsa ei il omoara sigur**. Ce alunga jucatorii, in ordine, e:
lag, dupe-uri si economie distrusa, wipe-uri din cauza crash-urilor, caractere
pierdute. Toate sunt probleme tehnice. Munca din documentele astea e conditia
necesara. Restul (comunitate, staff, echilibru) e treaba utilizatorului si nu se
rezolva din cod.

**Corolar important:** cand ai de ales intre "adaug inca un sistem" si "fac ce
exista deja sa mearga impecabil", alegi al doilea. Asta a cerut utilizatorul
explicit.

---

## 3. Principii de lucru — obligatorii

### 3.1. Zero presupuneri

Asta e regula cea mai importanta din tot documentul.

**Fiecare pachet de serverfiles e diferit.** Structura, numele fisierelor, unde
stau proto-urile, daca sunt in fisiere sau in baza de date, cum se porneste, ce
sisteme sunt incluse, ce compilator vrea sursa — toate difera de la pachet la
pachet, si difera si fata de ce scrie in orice tutorial.

Deci:

- **Nu presupune nicio cale.** Deschide folderul si uita-te.
- **Nu presupune ca un fisier face ce sugereaza numele lui.** Citeste-l.
- **Nu presupune ca un tutorial de pe internet descrie pachetul tau.** Verifica
  in codul tau.
- **Nu presupune ca ceva merge pentru ca ar trebui sa mearga.** Testeaza.
- **Caile si numele de fisiere din documentele astea sunt orientative**, scrise
  de cineva care nu a vazut pachetul. Trateaza-le ca ipoteze de verificat, nu ca
  adevar.
- **Cand nu stii, spune ca nu stii** si du-te sa verifici. Nu inventa un raspuns
  plauzibil — intr-un cod vechi de 15 ani, raspunsul plauzibil e de obicei gresit.

### 3.2. Pentru ORICE task: inspecteaza intai, modifica dupa

Nu incepe nicio modificare inainte sa te uiti in `svfiles` / `sursa` la ce e
relevant pentru taskul respectiv. Nici macar la cele care par banale.

Procedura, de fiecare data:

1. **Ce fel de task e?** date / quest / sursa server / sursa client / client
   python / DB / sistem
2. **Unde traieste in pachetul asta?** Cauta efectiv — retetele de `grep` si
   `find` sunt in `docs/dezvoltare.md`, sectiunea 0.
3. **Citeste** ce ai gasit: fisierul si codul care il foloseste.
4. **Spune ce ai gasit si ce vei schimba**, inainte sa schimbi.
5. Abia apoi modifica.

Costul e de cateva minute. Alternativa — modificarea ghicita — costa ore de
depanare pe un server care nu porneste, plus un restart ratat. Utilizatorul a
cerut explicit sa nu pierdem timpul asa.

### 3.3. Intelege inainte sa modifici

Nu atinge cod pe care nu l-ai citit. Serverfiles-urile de Metin2 au dependinte
implicite peste tot: o schimbare intr-un header poate afecta sisteme care par
fara legatura. Inainte de orice modificare, raspunde la: *ce face codul asta acum,
cine il apeleaza, ce se strica daca il schimb?*

### 3.4. O modificare pe rand, verificata

Nu aduna zece schimbari si apoi restart. Cand crapa, nu mai stii care a fost.
Commit separat pentru fiecare, cu explicatie.

### 3.5. Nu declara nimic gata pe baza de speranta

"Gata" inseamna: serverul porneste, `syserr` e curat, si ai vazut modificarea
functionand efectiv in joc. Nu inainte.

### 3.6. Despre C++

Codul e vechi, in stil C++98/03: pointeri bruti, gestiune manuala de memorie,
structuri de pachete cu aliniere fixa, buffere de dimensiune fixa.

- **Scrie in stilul codului existent.** Nu moderniza pe capul tau — o rescriere
  "mai frumoasa" intr-un cod fara teste inseamna bug-uri noi.
- **Repara probleme reale**: lipsa verificarii de lungime, indici nevalidati,
  variabile neinitializate, scapari de memorie, overflow pe intregi.
- Atentie la structurile de pachete: aliniere, dimensiuni, tipuri. O schimbare
  acolo rupe compatibilitatea cu clientul.
- Compileaza des. Nu scrie 300 de linii si apoi incerci.

---

## 3bis. Ce trebuie sa stii sa faci

Utilizatorul se asteapta sa poti duce oricare din lucrurile astea, corect si
fara sa ghicesti. Fiecare are documentul lui:

| Capabilitate | Unde e detaliat |
|---|---|
| Inspectat pachetul si gasit orice in el | `docs/dezvoltare.md` §0 |
| Implementat orice cere utilizatorul — arme, item-e, sisteme | `docs/dezvoltare.md` §2–3 |
| **Creat sisteme noi de la zero**, moderne si functionale | `docs/dezvoltare.md` §1–2 |
| `item_proto` / `mob_proto`: editat, generat, **trecut pe SQL** | `docs/dezvoltare.md` §4 |
| Tradus continutul serverului si al clientului | `docs/dezvoltare.md` §5 |
| **Update de FreeBSD** — de pe versiune veche pe una noua | `docs/migrare.md` A |
| **Portat sursa de pe gcc vechi pe gcc nou si pe clang** | `docs/migrare.md` B |
| Gasit si eliminat backdoor-uri; anticheat | `docs/securitate.md` |
| Masurat si optimizat | `docs/optimizare.md` |
| Documentat-te pe surse externe, in siguranta | `docs/resurse.md` |

Ce nu stii inca, **inveti inainte sa faci** — vezi Faza 1 si `docs/resurse.md`.
Ce nu se poate face sau e o idee proasta tehnic, **spui**, cu motivul si cu
alternativa. Nu incepe un lucru mare pe baza unei presupuneri despre cum
functioneaza pachetul.

---

## 4. Impartirea rolurilor

| | Sesiunea de pe PC (tu) | Repo-ul asta |
|---|---|---|
| Citit/scris fisiere locale | ✅ | — |
| Terminal, SSH, upload pe VPS | ✅ | ❌ |
| Compilat pe FreeBSD | ✅ (prin SSH) | ❌ |
| Istoric, diff, rollback | prin git | ✅ |

Repo: `https://github.com/dinica600-bot/Test`, branch
**`claude/svfiles-v8-setup-72w2sb`**.

---

## 5. Reguli de siguranta

1. **Backup inainte de ORICE modificare pe server.** Fisiere
   (`tar czf /root/backup_$(date +%F_%H%M).tar.gz <radacina serverului>`) si baza
   de date (`mysqldump --all-databases | gzip > /root/db_$(date +%F_%H%M).sql.gz`).
   Verifica arhiva inainte sa continui.
2. **Pastreaza binarul vechi** (`cp game game.bak_$(date +%F)`).
3. **Fara parole in git.** Versioneaza cu placeholder; originalul ramane pe server.
4. **Testeaza pe un canal**, nu pe toate deodata. Ideal, pe un server de test.
5. **Dupa fiecare restart, citeste `syserr`.**
6. **Confirmare de la utilizator inainte de comenzi distructive** — `rm -rf`,
   `DROP`, `TRUNCATE`, import SQL pe productie.
7. **Nu atinge nimic ce nu tine de task.**

---

## 6. Planul pe faze

### Faza 0 — Inventar total

**Nu sari peste ea si nu o face superficial.** Aici afli ce ai. Tot restul
depinde de calitatea fazei asteia.

Rezultatul se scrie in **`docs/inventar.md`** — are un checklist detaliat acolo,
urmeaza-l punct cu punct. Pe scurt, trebuie sa stii:

- **Structura completa** a lui `svfiles` si `sursa` — nu ghicita, ci parcursa
- **Unde se editeaza fiecare lucru**: rate, drop-uri, item-e, mobi, quest-uri,
  sisteme, texte, interfata
- **Ce format are fiecare** (text? binar? tabela in DB?)
- **Toate versiunile**: FreeBSD (si arhitectura — i386 sau amd64), **compilatorul
  (clang sau gcc, si ce versiune)**, MySQL/MariaDB, Python de pe server (pentru
  `qc`), versiunea de client, versiunea de Python din client
- **Cum porneste si se opreste** serverul, ce scripturi exista
- **Ce sisteme sunt deja in pachet** — enumerate, nu presupuse
- **Daca sursa corespunde binarelor livrate**

Detaliul cu compilatorul nu e formalitate: FreeBSD modern foloseste **clang**
implicit, iar multe surse de Metin2 sunt scrise pentru **gcc 4.x** si nu compileaza
curat cu clang fara ajustari. Afla ce e instalat si cu ce a fost construit
pachetul **inainte** sa incerci sa compilezi.

**Test obligatoriu la finalul fazei:** compileaza sursa **nemodificata**. Daca nu
compileaza curat, ai o problema de pachet, nu de cod scris de tine — afla asta
acum, nu peste trei ore de modificari.

La final, **arata inventarul utilizatorului** si confirma-l inainte sa mergi mai
departe.

---

### Faza 1 — Documentare

Devino competent pe **pachetul asta**, nu pe Metin2 in general.

Vezi **`docs/resurse.md`** — surse, ce sa cauti, si regula esentiala: **codul de
pe forumuri e cod nesigur si nu ajunge pe server neverificat.** Forumurile se
folosesc ca sa intelegi, nu ca sa copiezi.

Ordinea corecta de invatare: intai citesti codul tau, apoi cauti pe internet
lucrurile pe care nu le-ai inteles. Nu invers. Cand o sursa externa contrazice
codul din fata ta, codul tau are dreptate.

---

### Faza 2 — Baseline in git

Pune in repo starea **originala**, nemodificata, a partii editabile: sursa,
quest-uri, `CONFIG`-uri (fara parole), fisierele de date text, scripturile de
client. Fara baseline nu exista diff si nu exista "cum era inainte".

Nu intra: binare, `.o`, pack-uri `.eix`/`.epk`, loguri, arhive, dump-uri complete
de DB. `.gitignore`-ul acopera astea — verifica cu `git status` inainte de commit.

Commit: `Baseline ServerFiles v8 - stare initiala, nemodificata`

---

### Faza 3 — Audit de securitate

**Inainte ca serverul sa vada primul jucator.** Urmeaza integral
**`docs/securitate.md`**, Partea A.

Pe scurt de ce: serverfiles-urile de Metin2 descind din leak-uri vechi cu
exploit-uri publice nepatch-uite, iar pachetele redistribuite contin frecvent
backdoor-uri puse intentionat. Pachetul asta a trecut prin mainile firmei de
hosting si prin ale cui l-a impachetat inaintea lor.

Rezultatele se scriu in `docs/audit-securitate.md`. Tot ce e suspect se
investigheaza pana intelegi exact ce face.

Concluzia implicita: **ruleaza binare compilate de tine din sursa auditata**, si
schimba toate parolele livrate.

---

### Faza 3bis — Migrare (daca e cazul)

Daca sistemul e pe un FreeBSD vechi sau sursa e legata de un gcc vechi, migrarea
se face **acum**, inainte sa se acumuleze modificari proprii — altfel portezi si
sistemul, si schimbarile tale, in acelasi timp, si nu mai stii ce a stricat ce.

`docs/migrare.md`, integral. Pe scurt:
- sistemul si compilatorul sunt **doua migrari separate**, facute pe rand
- nimic nu se face direct pe productie
- `gcc vechi → gcc nou → clang`, cu standardul original (`-std=gnu++98`), nu direct
- toate obiectele si bibliotecile C++ trebuie sa foloseasca **aceeasi biblioteca
  standard** (clang = `libc++`, gcc din pkg = `libstdc++`) — amestecul da crash-uri
- pachetele de compatibilitate FreeBSD lasa serverul sa mearga pe sistemul nou cu
  binarele vechi cat timp portezi sursa
- i386 → amd64 nu e upgrade, e proiect separat — vezi de ce in document

---

### Faza 4 — Wishlist si plan

Deschide `docs/wishlist.md`. Daca e goala, completeaz-o cu utilizatorul. Nu
accepta cereri vagi.

Pentru fiecare cerere stabileste: **ce** se schimba, **unde** traieste (config /
quest / proto / sursa / client), daca cere **recompilare**, daca cere **patch de
client**, si daca se poate **da inapoi**.

Filtreaza prin viziunea de la sectiunea 2: un sistem nou trebuie sa isi justifice
existenta. Daca o cerere adauga complexitate fara castig clar, **spune asta** si
propune alternativa mai simpla. Decizia ramane a utilizatorului, dar el trebuie
sa aiba parerea ta tehnica.

Propune o ordine: intai ce nu cere recompilare, apoi sursa, la final clientul.
**Arata planul si cere acordul inainte sa implementezi.**

---

### Faza 5 — Implementare

Unde traieste fiecare tip de modificare — **ipoteze de verificat in Faza 0**,
nu adevaruri:

| Ce vrea | Unde se face, de obicei | Recompilare | Efect |
|---|---|---|---|
| Rate exp/yang/drop | `CONFIG`, fisiere de drop, uneori quest sau sursa | uneori | restart |
| Drop-uri de la mobi | `mob_drop_item.txt`, `special_item_group.txt` | nu | restart / reload |
| Item-e (stats, bonusuri) | `item_proto` (fisier sau tabela DB) **+ client** | nu | restart + patch client |
| Mobi (viata, damage, spawn) | `mob_proto`, fisiere de regen/spawn | nu | restart |
| Quest nou/modificat | `*.quest` + `quest_list`, compilat cu `qc` | nu | `/reload q` sau restart |
| Sisteme on/off | `CONFIG`, uneori `#define` in sursa | depinde | restart |
| Limite hardcodate (level, etc.) | sursa C++ | **da** | restart |
| Interfata, texte | client: `uiscript`, `locale_*` | nu | patch client |
| Logica de client | client: `root/*.py` — **Python 2.7** | nu | patch client |

Pentru sisteme noi, arme, proto-uri si traduceri, procedura completa e in
**`docs/dezvoltare.md`** — anatomia unui sistem, cum se construieste unul de la
zero, cum se gestioneaza proto-urile (inclusiv trecerea pe SQL) si cum se traduce
fara sa strici codificarea caracterelor.

Reguli specifice:
- **Quest-urile** se compileaza cu `qc` (are nevoie de Python 2). **Citeste
  output-ul compilatorului** — serverul porneste linistit cu un quest rupt.
- **`item_proto` de server si cel de client sunt fisiere diferite** si trebuie
  tinute sincronizate. Desincronizarea = item-e afisate gresit sau client care crapa.
- **Clientul e Python 2.7**, nu 3.

Commit separat per modificare, cu ce si de ce.

---

### Faza 6 — Compilare

Pe server, pe FreeBSD. Ordinea tipica (verific-o pe pachetul tau):

```
libthecore → libpoly → libsql → libgame → liblua → game, db
```

Pe FreeBSD e `gmake`, nu `make`. Daca pachetul are un script de build propriu,
foloseste-l pe ala.

Erori frecvente si ce inseamna:
- lipsa `libmysqlclient` / `libcrypto` → dependinte neinstalate (`pkg install`)
- `cannot find -lgame` → librarii necompilate sau in ordine gresita
- simboluri lipsa la link → obiecte vechi amestecate (`gmake clean`) sau
  arhitecturi diferite
- erori de sintaxa in cod care "ar trebui sa mearga" → probabil clang vs gcc
  (vezi Faza 0)

Flag-uri: pastreaza-le pe cele ale pachetului. `-O2` e sigur; **nu sari la `-O3`
sau `-march=native`** — vezi `docs/optimizare.md`.

---

### Faza 7 — Deploy

1. **Backup complet** (fisiere + DB). Fara exceptie.
2. Opreste curat. Verifica cu `ps auxww | grep game` ca s-a oprit efectiv.
3. Urca fisierele. Verifica **owner si permisiuni** dupa upload; binarele au
   nevoie de `+x`.
4. Aplica modificarile de DB, pe rand, verificand fiecare.
5. Porneste. `tail -f syserr` in timp ce porneste.
6. Verifica **din joc**: conectare, intrare pe harta, si concret ce ai modificat.

**Daca e rupt:** opreste, pune binarul vechi inapoi, porneste, confirma ca merge.
Abia apoi analizezi. Intai serverul in picioare.

---

### Faza 8 — Hardening, anticheat, optimizare

- **`docs/securitate.md` Partea B** — hardening (SSH, MySQL, firewall, backup).
- **`docs/securitate.md` Partea C** — anticheat: cele 10 clase de exploit,
  verificate una cate una in codul tau.
- **`docs/optimizare.md`** — masoara intai, apoi optimizeaza. De obicei problema
  e in baza de date, nu in codul de joc.

Checklist-ul dinainte de live e in `docs/securitate.md`, Partea D.

---

### Faza 9 — Jurnal si intretinere

- Commit + push cu tot.
- `docs/schimbari.md`: ce s-a modificat, unde, ce efect, cum se da inapoi.
- Spune-i utilizatorului ce e gata, ce a ramas, si ce trebuie sa faca el.
- Stabiliti o rutina: backup verificat, citit loguri, urmarit evenimente suspecte.

---

## 7. Ce sa NU faci

- Sa nu presupui nimic. (Vezi 3.1. E prima regula din motive intemeiate.)
- Sa nu modifici nimic inainte sa fi inspectat fisierele relevante. (Vezi 3.2.)
- Sa nu faci migrare de sistem si de compilator in acelasi timp.
- Sa nu amesteci obiecte compilate cu `libstdc++` si cu `libc++`.
- Sa nu copiezi cod de pe forumuri direct pe server.
- Sa nu modifici direct pe server prin WinSCP fara sa treaca si prin repo.
- Sa nu compilezi pe Windows si sa urci binarul. Serverul e FreeBSD.
- Sa nu desincronizezi `item_proto` server / client.
- Sa nu adaugi sisteme pe care nu le-a cerut utilizatorul.
- Sa nu rescrii cod functional ca sa fie "mai frumos".
- Sa nu urci parole in git.
- Sa nu spui ca e gata pana n-ai vazut-o mergand in joc.

---

## 8. Prima ta replica, cand deschizi sesiunea pe PC

> Am citit brief-ul. Incep cu Faza 0 — inventarul: parcurg efectiv `svfiles` si
> `sursa` si notez structura reala, unde se editeaza fiecare lucru, si toate
> versiunile — inclusiv FreeBSD, arhitectura si compilatorul, de care depinde
> daca avem de facut o migrare. Am nevoie de acces SSH la VPS pentru partea de
> server. Nu presupun nimic despre pachet pana nu vad cu ochii mei.
> Intre timp, spune-mi ce vrei modificat — le trec in `docs/wishlist.md`.

Apoi Faza 0. Punct cu punct, din `docs/inventar.md`.
