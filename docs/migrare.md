# Migrare — FreeBSD mai nou, gcc mai nou, clang

> Doua lucruri diferite care se confunda des:
> **(A)** sistemul de operare pe care ruleaza serverul, si
> **(B)** compilatorul cu care se construieste sursa.
> Se fac in ordinea asta, separat, cu verificare intre ele. Amestecate, nu mai
> stii ce a stricat ce.

**Nimic din documentul asta nu se face direct pe productie.** Se face pe o masina
de test sau pe un VPS nou, se verifica, si abia apoi se comuta.

---

## Partea A — FreeBSD mai nou

### A0. Intai afla ce ai (fara presupuneri)

```sh
uname -a
freebsd-version -kru        # kernel, userland, running
sysctl hw.machine hw.machine_arch    # i386 sau amd64
pkg -vv | grep -A2 'url:'   # ce repo de pachete
```

Scrie rezultatele in `docs/inventar.md`. Restul deciziilor depind de ele.

### A1. Decizia care iti economiseste cel mai mult timp

| Situatie | Ce faci |
|---|---|
| FreeBSD-ul curent e **inca suportat** (nu e EOL) si sari o singura versiune majora | `freebsd-update` in loc, pe o clona de test |
| FreeBSD-ul e **vechi si EOL** (9.x, 10.x, 11.x) | **VPS nou cu FreeBSD actual + migrare de date.** Mai rapid si mai sigur decat un lant de upgrade-uri |
| Vrei sa treci de la **i386 la amd64** | **Nu exista upgrade in loc.** E reinstalare — vezi A4 |

Serverele EOL nu mai sunt servite de infrastructura `freebsd-update`, deci lantul
de upgrade-uri pica oricum la un moment dat. Nu te incapatana cu el.

### A2. Upgrade in loc (cand e posibil)

Secventa documentata, pe test, nu pe productie:
```sh
freebsd-update fetch install              # intai adu sistemul la zi in ramura curenta
freebsd-update -r <VERSIUNE>-RELEASE upgrade
freebsd-update install                    # instaleaza kernel
shutdown -r now
freebsd-update install                    # instaleaza userland
pkg-static install -f pkg                 # reface pkg
pkg upgrade -f                            # RECONSTRUIESTE toate pachetele
shutdown -r now
freebsd-update install                    # curata vechiturile
```

`pkg upgrade -f` nu e optional dupa un upgrade major: ABI-ul se schimba si
pachetele vechi devin instabile in feluri greu de diagnosticat.

**Dupa upgrade, binarele de joc se recompileaza.** Chiar daca par sa porneasca.

### A3. Podul: pachetele de compatibilitate

Daca vrei sistemul nou **inainte** sa fi portat sursa, FreeBSD are pachete de
compatibilitate pentru binare construite pe versiuni vechi (`misc/compat9x`,
`compat10x`, `compat11x`, `compat12x` — instaleaza-l pe cel potrivit versiunii
pe care au fost construite binarele tale).

Asta iti da o secventa mult mai comoda:

1. Sistem nou, cu pachete de compatibilitate → serverul merge cu binarele vechi
2. Portezi sursa la compilatorul nou, in ritmul tau (Partea B)
3. Comuti pe binarele proprii
4. Scoti pachetele de compatibilitate

Compatibilitatea e un pod, nu o destinatie. Un server care ramane permanent pe
biblioteci vechi e un server pe care nu il mai poti actualiza.

### A4. i386 → amd64

Nu e upgrade, e **reinstalare** — si e o schimbare mai mare decat pare.

Sursele vechi de Metin2 contin presupuneri de 32 de biti: dimensiuni de
`long`, pointeri pusi in `int`, structuri de pachete cu dimensiuni calculate
manual, casturi intre pointeri si intregi. Pe 64 de biti multe din ele se rup —
uneori la compilare (usor), alteori la rulare, tacut (greu).

Daca faci trecerea:
- trateaz-o ca proiect separat, nu ca pas intr-un upgrade
- structurile de pachete client↔server sunt zona de risc maxim: clientul ramane
  32 de biti, deci **dimensiunile trebuie sa ramana identice**
- verifica fiecare `sizeof`, fiecare cast pointer↔intreg, fiecare
  `#pragma pack`
- testeaza intens, nu doar „porneste si intru in joc"

Daca serverul merge bine pe i386 si nu ai un motiv concret (peste ~2-3 GB RAM
folositi de un singur proces, de exemplu), **amana**.

### A5. MySQL / MariaDB

Un upgrade de sistem aduce de obicei si o versiune noua de MySQL. Aia are reguli
proprii:
- `mysqldump` complet **inainte**, verificat
- upgrade pe trepte, nu sarind versiuni majore
- `mysql_upgrade` (sau echivalentul versiunii) dupa
- verifica ce s-a schimbat in modul strict / `sql_mode` — cod vechi scrie adesea
  query-uri pe care versiunile noi le resping

### A6. Verificare dupa migrare

- [ ] Serverul porneste, toate canalele
- [ ] `syserr` curat, in fiecare core
- [ ] Login, intrare pe harta, schimbare de canal
- [ ] Trade, seif, shop, breasla
- [ ] Salvare si relog (personajul chiar se salveaza?)
- [ ] Quest-urile ruleaza
- [ ] Performanta cel putin la fel ca inainte (masurata, nu simtita)

---

## Partea B — Compilator: gcc vechi → gcc nou → clang

### B0. Intai afla cu ce a fost construit

```sh
cc --version; c++ --version         # clang-ul de baza
pkg info | grep -i gcc              # exista gcc din pachete?
strings -a game | grep -iE 'GCC|clang|FreeBSD clang'   # cu ce a fost construit binarul livrat
```
Si citeste Makefile-urile din `sursa`: ce compilator, ce standard, ce flag-uri.

### B1. Ordinea care functioneaza

Nu sari direct de la gcc 4.x la clang. Fa-o in doi pasi — fiecare pas iti da
erori dintr-o singura categorie, si stii ce le-a cauzat:

```
gcc vechi  →  gcc nou (din pkg: lang/gcc12 etc.)  →  clang
```

Pasul 1 elimina codul care se baza pe comportamente scoase din gcc modern.
Pasul 2 ramane doar cu diferentele reale gcc↔clang.

La fiecare pas: **compileaza cu standardul pentru care a fost scris codul**
(`-std=gnu++98` sau `-std=gnu++03`). Nu incerca sa treci la C++17 in aceeasi
trecere — sunt doua proiecte, nu unul.

### B2. Capcana numarul unu: bibliotecile standard

Pe FreeBSD, **clang foloseste `libc++`, gcc din pachete foloseste `libstdc++`.**
Cod C++ construit cu una si legat cu cealalta da erori de link bizare si
crash-uri la rulare.

Regula: **toate** obiectele si toate bibliotecile C++ din build trebuie sa
foloseasca aceeasi biblioteca standard. Include aici si pachetele externe pe care
le legi — cele din `pkg` sunt construite cu clang/`libc++`.

In practica asta inseamna ca **clang e destinatia corecta**, nu gcc: te aliniezi
cu restul sistemului. gcc-ul nou e doar treapta intermediara.

#### Simptomul: „compileaza, se leaga, dar serverul nu porneste"

Cand in acelasi proces ajung **ambele** biblioteci standard, ai doi alocatori si
doua mecanisme de exceptii. Crapa la prima alocare sau exceptie care trece
granita — de multe ori inainte sa scrie ceva util in `syserr`.

**Diagnostic, in 10 secunde:**
```sh
ldd game | grep -E 'libstdc\+\+|libc\+\+'
```
Daca apar **amandoua**, asta e problema. Nu cauta in alta parte.
Dupa reparare trebuie sa ramana doar `libc++.so.1` (plus `libcxxrt.so.1`).

**Cauzele, in ordinea probabilitatii:**

1. **`-lstdc++` scris explicit in Makefile-uri.** Cauza numarul unu intr-o sursa
   de Metin2: linia e acolo din era gcc. Clang leaga `libc++` singur, iar
   `-lstdc++` il aduce si pe celalalt langa.
   ```sh
   grep -rn 'stdc++' --include=Makefile* --include=*.mk .
   ```
   Verifica si `-L` catre directoare de gcc (`/usr/local/lib/gcc*`).

2. **Obiecte `.o` ramase de la compilarea veche.** `gmake clean` trebuie facut pe
   **fiecare** librarie, nu doar pe `game`. Verificare directa pe obiecte:
   ```sh
   nm -A *.o | grep -q 'St3__1'                  && echo "obiecte clang/libc++"
   nm -A *.o | grep -qE '_ZNSs|_ZNSt7__cxx11'    && echo "obiecte gcc/libstdc++"
   ```
   Daca apar amandoua in acelasi build, acolo e problema.
   (Simbolurile `libc++` contin `St3__1` — namespace-ul intern `std::__1`;
   cele `libstdc++` apar ca `_ZNSs` sau `_ZNSt7__cxx11`.)

3. **Librarii terte precompilate**, livrate ca `.a`/`.so` in pachet si construite
   cu gcc acum ani. Gaseste care dintre ele trage `libstdc++`:
   ```sh
   for f in $(ldd game | awk '{print $3}'); do
     readelf -d "$f" 2>/dev/null | grep -q stdc++ && echo "$f"
   done
   ```
   Solutie: reconstruieste-le din sursa cu clang, sau instaleaza-le din `pkg`
   (pachetele oficiale sunt construite cu clang/`libc++`).

4. **Pachetele de compatibilitate** (`compat9x` si celelalte) pun un
   `libstdc++.so.6` vechi in sistem. Util pentru binarele vechi, dar poate fi
   gasit primul de linkerul dinamic la binarul nou.

**Ce restrange panica:** trebuie recompilat doar codul **C++** — toate
librariile Metin2 si dependentele C++ pe care le legi. `libmysqlclient`, openssl
si celelalte biblioteci C nu au ABI de C++ si nu conteaza cu ce au fost
construite.

### B3. Erorile pe care le vei intalni, si ce inseamna

| Eroare | Cauza | Rezolvare |
|---|---|---|
| `use of undeclared identifier` pentru membri mosteniti dintr-o clasa de baza template | clang aplica *two-phase lookup*, gcc vechi nu | `this->membru` sau `Baza<T>::membru`. **Cea mai frecventa eroare la portare** |
| `<cstring>`, `<cstdlib>`, `<stdint.h>`, `<unistd.h>` lipsa | gcc vechi le includea tranzitiv | adauga `#include`-urile explicit |
| conversie din literal la `char*` | interzisa in standardele noi | `const char*`, sau temporar `-Wno-writable-strings` |
| `register` nu mai e permis | scos din C++17 | compileaza cu `-std=gnu++98`, sau sterge cuvantul |
| `typeof` necunoscut | extensie gcc | `__typeof__` sau `decltype` |
| `>>` in template-uri imbricate | parsare pre-C++11 | adauga spatiu: `> >` |
| comportament ciudat la optimizare | strict aliasing | `-fno-strict-aliasing` (recomandat pentru codul asta) |
| `auto_ptr` inexistent | scos in C++17 | ramai pe `-std=gnu++98` |

Flag-uri utile la inceput, ca sa vezi erorile reale printre avertismente:
`-fno-strict-aliasing -Wno-writable-strings -Wno-deprecated-declarations`

### B4. Metoda

1. `gmake clean` complet. Obiecte amestecate = ore pierdute pe bug-uri fantoma.
2. Compileaza si **salveaza toata iesirea intr-un fisier**. Sunt sute de linii.
3. Rezolva erorile **de la prima catre ultima**, un fisier pe rand. Prima eroare
   e adesea cauza urmatoarelor 40.
4. Commit dupa fiecare fisier reparat. Cand strici ceva, te intorci un pas.
5. Nu „repara" o eroare punand un cast ca sa taca compilatorul. Intelege de ce
   se plange. Un cast pus orbeste transforma o eroare de compilare intr-un bug
   de rulare.
6. Nu schimba logica in aceeasi trecere cu portarea. Portare intai, functionalitate
   dupa.

### B5. Compilarea nu inseamna ca merge

Un binar care se construieste poate fi complet rupt. Dupa portare:
- ruleaza pe serverul de test, nu pe productie
- `syserr` complet curat, nu „doar cateva erori"
- testeaza tot ce e din lista A6
- ruleaza cateva zile pe test cu jucatori inainte de comutare

Optional, dar merita pe codul asta: o trecere cu **sanitizere**
(`-fsanitize=address,undefined`) pe serverul de test. Codul vechi de Metin2 e
plin de undefined behavior, iar sanitizerele iti arata exact unde — inclusiv
bug-uri care se manifesta ca „crash aleator o data pe saptamana".

### B6. Flag-uri de optimizare, dupa portare

`-O2`. **Nu `-O3`, nu `-march=native`** pana nu ai trecut prin sanitizere:
optimizarile agresive transforma undefined behavior din „merge din intamplare"
in „crapa". Vezi `docs/optimizare.md`.

---

## Regula de aur a migrarilor

**O schimbare pe rand, cu verificare intre ele.** Sistem nou, verificat.
Compilator nou, verificat. Optimizari, verificate.

Cine face sistem + compilator + optimizari deodata si apoi vede ca serverul crapa
va pierde mai mult timp gasind cauza decat ar fi pierdut facandu-le separat.
Exact timpul pe care utilizatorul a cerut sa nu-l pierdem.
