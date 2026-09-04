# Dezvoltare — sisteme, arme, proto-uri, traduceri

> Cum se adauga ceva nou in pachet, corect. Toate caile si numele de aici sunt
> **ipoteze de verificat pe pachetul real** (vezi Regula #1). Structura de idei
> ramane valabila; numele fisierelor difera de la pachet la pachet.

---

## 0. Inainte de orice: inspecteaza

Pentru **fiecare** task, indiferent cat de simplu pare:

1. **Ce fel de task e?** date / quest / sursa server / sursa client / client python / DB / infrastructura
2. **Unde traieste in pachetul asta?** Cauta efectiv. Nu presupune.
3. **Citeste ce ai gasit** — fisierul si codul care il foloseste.
4. **Spune ce ai gasit si ce vei schimba**, inainte sa schimbi.
5. Abia apoi modifica.

### Cum gasesti orice in pachet

```sh
# Pornind de la un text vazut in joc
grep -rn "textul exact din joc" .

# Pornind de la numele unui sistem
grep -rni "bonus_board\|kill_status\|numele_sistemului" .

# Unde e definita o constanta / o limita
grep -rn "MAX_LEVEL\|NUMELE_CONSTANTEI" --include=*.h --include=*.cpp .

# Fisiere de date
find . -iname '*proto*' -o -iname '*drop*' -o -iname '*_names*'

# Cine apeleaza o functie
grep -rn "NumeleFunctiei" --include=*.cpp --include=*.h .

# Ce s-a modificat recent (util la audit)
find . -type f -mtime -30 -ls
```

Un text vizibil in joc e cel mai bun punct de plecare: te duce in `locale`, de
acolo in codul care il foloseste, de acolo in sistemul intreg.

---

## 1. Anatomia unui sistem de Metin2

Un „sistem" nu e un fisier. Aproape orice sistem real atinge, in grade diferite:

| Strat | Ce contine | Cand e necesar |
|---|---|---|
| **Sursa server (C++)** | logica, handler de pachet, validari | mereu, daca sistemul are stare pe server |
| **Comunicare game ↔ db** | pachet intern, query, persistenta | daca datele trebuie salvate |
| **Baza de date** | tabela/coloane noi | daca datele supravietuiesc relogului |
| **Sursa client (C++)** | acelasi pachet, oglindit exact; expunere catre Python | daca clientul trebuie sa afiseze/trimita ceva nou |
| **Client Python** | logica (`root/*.py`), interfata (`uiscript/*.py`) | aproape mereu |
| **Locale** | textele | aproape mereu |
| **Proto** | item-e noi implicate | daca sunt item-e |
| **Quest** | declansatori, NPC-uri | daca interactiunea e prin NPC |

**Cel mai important cuplaj:** structura pachetului trebuie sa fie **identica**
byte cu byte intre server si client — aceleasi campuri, aceeasi ordine, aceleasi
tipuri, aceeasi aliniere (`#pragma pack`). O nepotrivire de un octet inseamna
client deconectat sau date aiurea, iar cauza e greu de gasit daca nu te uiti
acolo din prima.

Si: **antetele de pachete nu se aleg la intamplare.** Citeste enum-ul existent si
foloseste o valoare libera. O coliziune rupe un sistem existent, aleatoriu.

---

## 2. Sistem nou, de la zero — procedura

### Pasul 1: proiectare, inainte de cod

Raspunde in scris (in `docs/`, nu in cap):
- **Ce face**, in doua propozitii, din perspectiva jucatorului
- **Ce date** are nevoie, si unde stau (memorie / DB / ambele)
- **Cine valideaza ce.** Serverul valideaza tot ce vine de la client. Fara exceptii.
- **Ce se intampla la**: relog, schimbare de canal, crash de server, doi jucatori
  simultan, deconectare in mijlocul actiunii
- **Se poate da inapoi?** Daca adaugi coloane in DB, cum arata revenirea?
- **Chiar e nevoie de el?** Viziunea proiectului e *cat mai putine sisteme*.
  Daca acelasi rezultat se obtine dintr-un quest sau o modificare de date,
  ala e raspunsul corect.

### Pasul 2: cel mai mic lucru care functioneaza

Nu construi sistemul complet si apoi il testezi. Fa un drum complet minimal:
client trimite → server primeste, valideaza, raspunde → client afiseaza. Ruleaza-l.
**Abia apoi** adauga functionalitate.

Un sistem construit integral inainte de prima rulare inseamna zece bug-uri care
se manifesta simultan.

### Pasul 3: persistenta

Datele care trebuie sa supravietuiasca relogului trec prin core-ul `db`. Ce
traieste doar in memoria unui core de joc se pierde la restart si **nu exista**
pe celelalte canale. Daca sistemul trebuie sa fie consistent intre canale, starea
sta in DB sau trece prin P2P — nu in memoria unui singur core.

### Pasul 4: validare adversariala

Inainte sa zici ca merge, incearca sa-l spargi tu:
- valori negative, zero, valoare maxima, valoare peste maxim
- indici in afara intervalului
- actiunea repetata foarte rapid
- doi jucatori pe acelasi obiect simultan
- deconectare fix in mijlocul tranzactiei
- acelasi cont pe doua canale

Fiecare din astea a fost, la un moment dat, un exploit real intr-un server de
Metin2. Vezi `docs/securitate.md`, Partea C.

### Pasul 5: integrare

Locale (fara texte hardcodate in cod), interfata, quest-uri daca e cazul, si
jurnal in `docs/schimbari.md`.

---

## 3. Arme si item-e noi

Doua situatii complet diferite:

**Arma noua dintr-un tip existent** (inca o sabie, inca un arc) — task de date:
1. intrare noua in `item_proto` (server) si in cel de **client**
2. nume in fisierele de nume / locale
3. model si texturi in pack-ul de client
4. drop-uri, daca trebuie sa se obtina din joc
5. verificat: apare corect, se echipeaza, bonusurile se aplica

**Tip nou de arma** (o categorie care nu exista) — task de sursa:
- tipuri/subtipuri de item in sursa server **si** client
- animatii si logica de echipare in client
- formule de damage, restrictii de clasa, in server
- proto-uri pe ambele parti

Nu confunda cele doua: primul e o dupa-amiaza, al doilea e un proiect.

**Regula care se incalca cel mai des:** `item_proto` de server si cel de client
sunt fisiere diferite si **trebuie sa ramana sincronizate**. Desincronizarea da
item-e afisate gresit, bonusuri care nu se aplica, sau client care crapa — si te
uiti ore in cod, cand de fapt problema e ca ai editat un fisier si nu pe celalalt.

---

## 4. Proto-uri: `item_proto` si `mob_proto`

### Intai: afla ce format foloseste pachetul tau

Sunt trei variante in circulatie, si **nu poti ghici care e**:

| Varianta | Cum arata | Cum se editeaza |
|---|---|---|
| Fisiere text | `item_proto.txt`, `mob_proto.txt` | direct, apoi generate in binar |
| Fisiere binare | `item_proto`, `mob_proto` | dintr-un `.txt` sursa, cu unealta de dump |
| Tabele in DB | `item_proto` / `mob_proto` ca tabele | SQL; serverul le citeste la pornire |

Verifica: ce citeste serverul efectiv la pornire (cauta in sursa unde se incarca
proto-urile), ce fisiere exista, si ce tabele exista in DB. Daca exista **si**
fisier **si** tabela, afla **care dintre ele e folosit** — asta e o sursa clasica
de ore pierdute: editezi fisierul, serverul citeste din DB, si nu se intampla nimic.

### O singura sursa de adevar

Indiferent de varianta aleasa: **un singur loc de unde se editeaza**, si restul
generat din el. Doua locuri editabile manual inseamna ca se vor desincroniza — nu
daca, ci cand.

### Trecerea txt → SQL

Se poate, si e adesea mai comod (editare, cautare, script-uri). Dar:

1. **Verifica intai daca sursa suporta citirea din DB.** Multe pachete o au deja,
   controlata de un flag de configurare. Daca nu o are, e modificare de sursa — un
   task mai mare decat pare.
2. Creeaza tabela cu **exact** coloanele si tipurile din formatul text.
3. Importa si **compara**: numar de randuri, si cateva zeci de valori luate la
   intamplare, camp cu camp.
4. Comuta serverul pe DB pe **test**, nu pe productie.
5. Pastreaza fisierele vechi ca referinta pana esti sigur.
6. Clientul **tot are nevoie de proto-ul lui**, ca fisier. Trecerea la SQL e doar
   pe server. Nu uita pasul de generare a proto-ului de client.

### Dupa orice modificare de proto

- regenereaza proto-ul de client si distribuie patch-ul
- verifica in joc, pe item-ul/mobul modificat concret
- daca ai schimbat coloane, verifica si item-ele existente ale jucatorilor

---

## 5. Traduceri

### Unde stau textele

- **Client**: fisierele de locale (texte de joc si de interfata), sirurile din
  `uiscript/*.py`, si sirurile scrise direct in `root/*.py`
- **Server**: nume de item-e si mobi, mesaje de sistem, si **textele din
  quest-uri** (`.quest` — acolo sunt multe, si se uita usor)

Cauta un text vazut in joc cu `grep -rn` ca sa afli unde traieste. E cea mai
rapida metoda.

### Capcana: codificarea caracterelor

Fisierele de locale sunt de obicei intr-o **codificare mostenita** (o pagina de
cod veche), nu UTF-8. Conversia oarba la UTF-8 rupe afisarea in client.

Deci, in ordinea asta:
1. **Afla ce codificare foloseste pachetul tau** (verifica un fisier existent cu
   diacritice, si ce asteapta clientul).
2. **Verifica daca fontul clientului contine diacriticele romanesti.** Daca nu,
   ai de ales intre a adauga suport de font (proiect de client) si a scrie fara
   diacritice. Afla asta **inainte** sa traduci mii de linii — altfel le traduci
   de doua ori.
3. Pastreaza codificarea existenta la editare. Configureaza editorul explicit.

### Metoda

- **Glosar** intai: termenii recurenti (nume de clase, item-e, sisteme) traduse
  o singura data, consecvent. Fara glosar, acelasi lucru ajunge tradus in trei
  feluri.
- Nu traduce chei, nume de fisiere, nume de variabile sau identificatori din
  quest-uri — doar textul afisat.
- **Atentie la lungime.** Romana e mai lunga decat engleza; textele lungi ies din
  butoane si din casete. Verifica in joc, nu doar in fisier.
- Textele noi se pun in locale, **niciodata hardcodate in sursa**.
- Traducerile intra in git ca orice alta modificare.

---

## 6. Cand implementezi ceva cerut de utilizator

1. **Inspecteaza intai** (sectiunea 0). Spune ce ai gasit.
2. Stabileste **ce straturi** din tabelul de la sectiunea 1 sunt atinse.
3. Spune daca cere **recompilare** si **patch de client** — utilizatorul trebuie
   sa stie asta inainte, nu dupa.
4. Daca cererea adauga complexitate fara castig clar, **spune-o** si propune
   varianta mai simpla. Decizia ramane a lui, dar cu parerea ta tehnica pe masa.
5. Implementeaza minimal, testeaza adversarial, comite separat.
6. Verifica **in joc** inainte sa zici ca e gata.
