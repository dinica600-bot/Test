# Resurse de documentare — Metin2 development

> Se foloseste in **Faza 1** din `docs/brief.md`. Scopul nu e sa citesti tot
> internetul, ci sa intelegi **pachetul pe care il ai**, cu ajutorul a ce a scris
> comunitatea despre coduri similare.

## Regula de aur

**Codul de pe forumuri e cod nesigur.** Asa se raspandesc backdoor-urile in
Metin2. Nimic descarcat de pe un forum nu ajunge pe server inainte sa fie citit
linie cu linie si trecut prin verificarile din `docs/securitate.md`.

Foloseste forumurile ca sa **intelegi**, nu ca sa **copiezi**.

## Unde se documenteaza lumea

| Sursa | Ce gasesti | Note |
|---|---|---|
| [Metin2Dev / M2Dev](https://metin2.dev/) | cel mai mare forum international: development, ghiduri, sisteme, suport | calitatea variaza mult de la topic la topic |
| [Old Metin2 Project](https://git.old-metin2.com/metin2/server) | port open-source pe Linux al serverului, cu istoric de commit-uri | foarte util ca **referinta de citit**: vezi cum e structurat codul si ce s-a reparat |
| [RaGEZONE — sectiunea Metin2](https://forum.ragezone.com/community/metin2.677/) | forum vechi de dezvoltare MMO | multe topicuri vechi, dar cu informatie de baza solida |
| [Metin2Hub](https://metin2hub.com/) | serverfiles, surse, discutii | la fel: verifica tot |
| [m2dev.net](https://m2dev.net/forum/37-serverfiles/) | serverfiles | idem |

Comunitatea turceasca (TurkMMO) si sectiunile de Metin2 de pe elitepvpers au si
ele material, dar bariera de limba si calitatea neuniforma le fac surse
secundare.

## Video

Exista tutoriale video (YouTube, in special in turca, germana si poloneza).
Foloseste-le pentru **proceduri**: cum se impacheteaza un client, cum se
configureaza o unealta, cum arata un flux de lucru. Sunt slabe pentru **cod** —
nu poti verifica ce ruleaza, nu poti cauta in ele, si nu vezi contextul.

Regula ramane: un video care ofera „sistemul X gata facut, link in descriere"
este exact canalul prin care circula backdoor-urile. Codul din descriere trece
prin `docs/securitate.md` ca oricare altul, sau nu se foloseste.

## Cod public de citit

Cel mai bun material de invatare nu sunt tutorialele, ci **cod real**:

- [Old Metin2 Project](https://git.old-metin2.com/metin2/server) — port
  open-source, cu istoric de commit-uri. Vezi cum e structurat serverul si, mai
  ales, **ce s-a reparat si de ce**.
- Fork-uri publice de sursa pe GitHub — cauta sisteme dupa nume si compara cu
  implementarea din pachetul tau.

Citit, nu copiat. Diferenta e esentiala.

## Documentatie care nu e despre Metin2

Pentru partea de sistem, sursele oficiale bat orice forum:

- [FreeBSD Handbook](https://docs.freebsd.org/en/books/handbook/) — upgrade-uri,
  `pf`, `pkg`, securitate
- Documentatia MySQL/MariaDB pentru versiunea ta — upgrade si tuning
- Documentatia clang pentru diagnosticele pe care le intalnesti la portare

Cand ai o eroare de compilare sau de sistem, documentatia oficiala iti da
raspunsul corect mai repede decat un topic de forum din 2016 despre alta versiune.

## Cum inveti eficient

1. Intalnesti ceva ce nu intelegi in **codul tau**.
2. Cauti exact acel lucru (numele fisierului, mesajul de eroare, numele
   sistemului), nu subiectul in general.
3. Citesti doua-trei surse, nu una.
4. **Verifici in codul tau** ca se aplica.
5. Notezi ce ai aflat in `docs/cunostinte.md`, ca sa nu recauti peste o luna.

Cautarile generice („cum fac server de Metin2") iti dau tutoriale pentru alte
pachete si te fac sa presupui lucruri false despre al tau. Cauta specific.

## Ce sa cauti, concret

Nu cauta „cum fac server de Metin2". Cauta lucruri specifice pachetului tau, pe
masura ce le intalnesti in Faza 0:

- numele exacte ale sistemelor gasite in sursa (fiecare are de obicei un topic)
- mesajele de eroare din `syserr`, copiate ca atare
- erorile de compilare, copiate ca atare
- numele fisierelor de configurare pe care nu le recunosti
- clasele de exploit din `docs/securitate.md`, cautate cu numele lor

## Ce sa notezi

Tot ce afli si e **specific pachetului tau** merge in `docs/inventar.md` sau
intr-un `docs/cunostinte.md` separat. Scopul: peste o luna, sa nu recautati
aceleasi lucruri.

Cand o informatie de pe forum contrazice ce vezi in codul tau, **codul tau are
dreptate**. Pachetele difera.

## Sursa cea mai buna

Codul din fata ta. Aproape orice intrebare despre cum se comporta serverul are
raspunsul in `sursa`, iar raspunsul de acolo e cel corect pentru pachetul tau —
spre deosebire de un post de forum despre alt pachet, din 2015.
