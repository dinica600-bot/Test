# Cerintele utilizatorului — lista completa

> Tot ce a cerut utilizatorul, enumerat, cu locul unde e tratat. Se foloseste ca
> lista de verificare: la finalul fiecarei faze, uita-te aici si confirma ca nu
> ai scapat nimic. Daca o cerinta nu poate fi indeplinita asa cum e formulata,
> **spui**, cu motivul si cu alternativa — nu o lasi tacut deoparte.

## A. Rezultatul dorit

| # | Cerinta | Unde e tratata |
|---|---|---|
| A1 | Server **curat** — cod si fisiere in ordine | `brief.md` §2, `optimizare.md` |
| A2 | **Optimizat**, fara lag, si cu multi jucatori | `optimizare.md` |
| A3 | **Modern, dar cu cat mai putine sisteme noi.** „Old school new school" | `brief.md` §2, `dezvoltare.md` §2 pasul 1 |
| A4 | **Fara erori** — `syserr` curat | `brief.md` §5 regula 5, Faza 7 |
| A5 | **Fara backdoor**, sa nu poata fi spart | `securitate.md` A + B |
| A6 | **Anticheat** | `securitate.md` C |
| A7 | Sa devina **server popular** | `brief.md` §2 — partea tehnica e conditia necesara |
| A8 | „Totul perfect" | se obtine prin verificare, nu prin intentie: `brief.md` §3.5, Faza 7 |

## B. Cum se lucreaza

| # | Cerinta | Unde e tratata |
|---|---|---|
| B1 | **Fara presupuneri** — fiecare pachet e diferit | REGULA #1 (`CLAUDE.md`), `brief.md` §3.1 |
| B2 | **Intai inspecteaza** svfiles/sursa in functie de task, apoi modifica | REGULA #2 (`CLAUDE.md`), `brief.md` §3.2, `dezvoltare.md` §0 |
| B3 | Sa stie **tot despre folder**: ce contine, unde e fiecare lucru, de unde se editeaza | Faza 0 + `inventar.md` (tabel §3) |
| B4 | Sa stie **toate versiunile** — FreeBSD, arhitectura, clang/gcc, MySQL, Python | `inventar.md` §1 |
| B5 | Sa se **documenteze de pe internet** — orice surse, inclusiv video | Faza 1 + `resurse.md` |
| B6 | Sa devina competent pe Metin2 **si specific pe pachetul asta** | `resurse.md` — „codul tau are dreptate" |
| B7 | **Master in C++** pe codul asta | `brief.md` §3.6, `CLAUDE.md` sectiunea C++ |
| B8 | **Sa nu pierdem timp degeaba** | B1 + B2 + `migrare.md` „o schimbare pe rand" |

## C. Ce trebuie sa stie sa faca

| # | Cerinta | Unde e tratata |
|---|---|---|
| C1 | **Update FreeBSD** — de pe versiune veche pe una noua | `migrare.md` A |
| C2 | **Update de compilator** — gcc vechi → gcc nou → clang | `migrare.md` B |
| C3 | **Implementeaza orice** i se cere — arme, sisteme, orice | `dezvoltare.md` §2–3 |
| C4 | **Creeaza sisteme de la zero**, moderne si functionale | `dezvoltare.md` §1–2 |
| C5 | **Traduceri** pe server si client | `dezvoltare.md` §5 |
| C6 | **`item_proto` / `mob_proto`** — editat, generat, sau **trecut pe SQL** | `dezvoltare.md` §4 |
| C7 | Modifica orice in `svfiles` si in `sursa` | Faza 5 |
| C8 | **Urca sursa pe host, compileaza si instaleaza** | Fazele 6–7 |

## D. Contextul practic

| # | Fapt |
|---|---|
| D1 | Pachetul e ServerFiles v8 de la Clever-Host.ro, instalat de ei pe VPS |
| D2 | Pe PC exista un folder cu `svfiles` si `sursa` |
| D3 | Instalate: PuTTY, WinSCP, VS Code, browser |
| D4 | Utilizatorul are datele de acces la host si la site — **nu se scriu in git** |

## E. Ce ramane de aflat de la utilizator

| # | Ce | Unde se scrie |
|---|---|---|
| E1 | Lista concreta de modificari dorite | `wishlist.md` — tabelul de cereri |
| E2 | Ce sisteme existente se pastreaza si care ies | `wishlist.md` — tabelul de decizii |
| E3 | Daca vrea migrare de sistem/compilator acum sau mai tarziu | dupa Faza 0 |

## F. Verificare finala

Inainte sa spui ca un task e gata, treci prin A si C si confirma ca cerintele
atinse de el sunt respectate. In special: A4 (`syserr` curat), A5 (nimic nou
expus), B2 (ai inspectat inainte sa modifici).
