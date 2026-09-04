# Securitate — backdoor-uri, hardening, anticheat

> Documentul asta se executa in **Faza 3** din `docs/brief.md`, inainte ca
> serverul sa vada primul jucator. Nimic din ce urmeaza nu e optional.

## De ce conteaza, concret

Aproape toate serverfiles-urile de Metin2 in circulatie descind din leak-uri
vechi de peste zece ani (baza "kraizy" si derivatele ei). De atunci s-au
descoperit multe exploit-uri publice, iar **majoritatea au ramas nepatch-uite**
in pachetele care circula. Proiectul open-source [Old Metin2](https://git.old-metin2.com/metin2/server)
spune asta explicit despre propria baza de cod.

In plus, pachetele redistribuite pe forumuri contin frecvent backdoor-uri puse
intentionat de cine le-a impachetat: conturi GM ascunse, verificari pe numele
personajului care dau privilegii, handlere de pachete nedocumentate, cod care
suna acasa. Comunitatea are discutii dedicate exact pe tema asta
([exemplu](https://metin2.dev/topic/8552-serverfile-and-backdoors/),
[checklist](https://metin2.dev/topic/2749-a-security-checklist-for-your-metin2-server)).

**Concluzia operationala:** trateaza pachetul primit ca pe cod nesigur pana l-ai
verificat tu. Faptul ca vine de la firma de hosting nu il face curat — ei l-au
luat, la randul lor, de undeva.

---

## Partea A — Vanatoarea de backdoor-uri

Ruleaza toate verificarile de mai jos si **scrie rezultatele** in
`docs/audit-securitate.md` (creeaza-l). Fiecare rezultat suspect se investigheaza
pana intelegi ce face codul — nu il stergi orbeste (poti rupe serverul), dar nici
nu il lasi pentru ca "probabil e ok".

### A1. Sursa C++

```sh
# Executie de comenzi si procese — nu au ce cauta intr-un core de joc
grep -rnE '\b(system|popen|execl|execlp|execle|execv|execvp|execve)\s*\(' \
     --include=*.cpp --include=*.c --include=*.h --include=*.hpp .

# Retea catre exterior din game/db (in afara de socketurile serverului)
grep -rnE '\b(connect|inet_addr|inet_pton|gethostbyname|getaddrinfo|curl_easy)\s*\(' \
     --include=*.cpp --include=*.h .

# IP-uri si domenii hardcodate
grep -rnE '([0-9]{1,3}\.){3}[0-9]{1,3}' --include=*.cpp --include=*.h .
grep -rniE 'https?://' --include=*.cpp --include=*.h .

# Acordare de privilegii GM — cine si pe ce baza
grep -rnE 'SetGMLevel|GM_IMPLEMENTOR|GM_HIGH_WIZARD|GM_GOD|gm_get_level' \
     --include=*.cpp --include=*.h .

# Comparatii pe nume de personaj / cont (tiparul clasic de backdoor)
grep -rnE 'strcmp\s*\(\s*[^,)]*(GetName|GetAccountName|GetPlayerName)' \
     --include=*.cpp --include=*.h .

# Ofuscare
grep -rniE 'base64|b64decode|rot13|obfusc|unhex|\\x[0-9a-f]{2}\\x[0-9a-f]{2}' \
     --include=*.cpp --include=*.h .

# Cuvinte care apar in backdoor-uri lasate in graba
grep -rniE 'backdoor|hidden|bypass|secret|admin123|test123|hackerman' \
     --include=*.cpp --include=*.h .
```

Pe langa grep, **citeste** aceste zone, oricat de curat pare grep-ul:
- handlerele de pachete de la client (`CInputMain`, `CInputLogin`, `CInputP2P`) —
  cauta handlere care nu exista in documentatia pachetului, si mai ales
  **handlere care creeaza item-e, yang sau seteaza nivel/GM**
- comenzile de chat (`cmd.cpp` / tabela de comenzi) — comenzi nedocumentate
- `input_login.cpp` — logica de autentificare
- codul de la trade, shop offline, seif (`safebox`), guild storage — acolo stau
  cele mai multe dupe-uri

### A2. Quest-uri (lua)

```sh
grep -rniE '\bos\.|\bio\.|loadstring|dofile|require|package\.' quest/
grep -rniE 'command|gm|set_level|item_award|give_item|change_gold' quest/
```
Un quest poate acorda orice. Citeste quest-urile care dau recompense mari sau
care verifica nume de personaj.

### A3. Binarele livrate

```sh
strings -a game | grep -iE 'https?://|\.php|([0-9]{1,3}\.){3}[0-9]{1,3}|passw|backdoor'
strings -a db   | grep -iE 'https?://|\.php|([0-9]{1,3}\.){3}[0-9]{1,3}|passw|backdoor'
ldd game        # dependinte neasteptate?
```

**Testul decisiv:** compileaza sursa nemodificata si compara binarul rezultat cu
cel livrat (dimensiune, `strings`, comportament). Daca binarul livrat contine
siruri pe care sursa nu le explica, **sursa nu e sursa binarului** — si atunci
singura solutie curata e sa rulezi doar binare compilate de tine.

Recomandarea implicita, indiferent de rezultat: **ruleaza binare compilate de
tine din sursa auditata.** E singurul mod in care stii ce ruleaza.

### A4. Baza de date

```sql
SELECT * FROM common.gmlist;                      -- cine e GM si de ce
SELECT id, login, status FROM account.account ORDER BY id LIMIT 50;
SELECT id, login FROM account.account WHERE login NOT IN (/* conturile tale */);
SHOW GRANTS FOR CURRENT_USER;
SELECT user, host FROM mysql.user;                -- conturi MySQL neasteptate
```
Cauta: intrari in `gmlist` pe care nu le-ai pus tu, conturi create la instalare,
utilizatori MySQL cu `host = '%'` (acces din orice IP).

### A5. VPS-ul

```sh
crontab -l                        # si pentru fiecare user: crontab -l -u <user>
cat /etc/crontab; ls -la /etc/cron.d/ 2>/dev/null
find / -name authorized_keys -exec ls -la {} \; -exec cat {} \; 2>/dev/null
sockstat -4 -l                    # ce asculta pe retea (FreeBSD)
ps auxww                          # procese care nu ar trebui sa fie acolo
cat /etc/rc.conf                  # ce porneste la boot
pkg check -s                      # checksum-uri pachete de sistem
```
Orice cheie SSH pe care nu ai pus-o tu, orice cron pe care nu l-ai scris tu, orice
port deschis pe care nu il recunosti — investigheaza pana ai raspuns.

### A6. Site-ul / CMS-ul

```sh
grep -rnE '(eval|assert|base64_decode|gzinflate|gzuncompress|str_rot13|shell_exec|system|passthru|proc_open|`)' --include=*.php .
grep -rn 'preg_replace' --include=*.php . | grep -E "/[a-z]*e[a-z]*['\"]"
find . -name '*.php' -newermt '2024-01-01' -ls    # fisiere adaugate recent
```
Verifica si folderul de upload-uri: acolo nu trebuie sa se poata executa PHP.

### A7. Dupa audit

Schimba **toate** parolele care au trecut prin mainile altcuiva: root SSH, useri
MySQL, panoul de host, contul de admin al site-ului, orice cont GM livrat.
Firma de hosting le-a avut pe toate.

---

## Partea B — Hardening

| Zona | Ce faci |
|---|---|
| SSH | autentificare pe cheie, `PermitRootLogin no`, port schimbat, `fail2ban` sau `blacklistd` |
| MySQL | `bind-address` doar pe localhost, fara `root` remote, user separat per baza cu privilegii minime, parole lungi si diferite |
| Firewall (`pf`) | deschis doar ce trebuie: porturile de auth/game, SSH, web. Portul core-ului `db` **niciodata** expus |
| Core-ul `db` | asculta doar pe localhost / retea interna |
| Site | separat de serverul de joc daca se poate; altfel, user si permisiuni separate |
| Backup | automat, zilnic, **si in afara serverului**. Un backup care sta doar pe VPS nu e backup |
| Update-uri | `pkg upgrade` regulat pentru sistem si MySQL |
| Loguri | pastrate si citite; rotatie configurata ca sa nu umple discul |

Testeaza backup-ul: restaureaza-l o data pe un mediu de test. Un backup neverificat
e o presupunere, nu o siguranta.

---

## Partea C — Anticheat

### Principiul de baza

**Clientul minte.** Orice validare facuta doar in client e o sugestie, nu o regula.
Tot ce conteaza se verifica pe server. Metin2 are cod vechi in care serverul are
incredere in pachete de la client in locuri unde nu ar trebui — acolo stau
majoritatea exploit-urilor.

### Clase de exploit de verificat in sursa

1. **Validare de lungime la pachete.** In handlerele din `CInputMain` si
   celelalte: fiecare pachet cu dimensiune variabila trebuie sa aiba verificare
   de lungime inainte de `memcpy`/copiere in buffer fix. Lipsa ei = overflow.
2. **Indici nevalidati.** Pozitii in inventar, celule de seif, sloturi de shop,
   `window_type` — orice index venit de la client trebuie verificat ca e in
   interval inainte de folosire.
3. **Duplicare de item-e.** Zonele critice: trade, seif (`safebox`), depozit de
   breasla, shop offline, si tranzitiile intre ele. Verifica ca mutarea unui item
   e atomica si ca item-ul nu poate exista in doua locuri simultan. Testeaza
   deconectarea in mijlocul unui trade.
4. **Yang / puncte cu valori negative sau overflow.** Orice `PointChange` cu
   valoare venita indirect de la client trebuie limitata. Verifica scaderile care
   pot deveni adunari prin valoare negativa.
5. **Speedhack.** `SPEEDHACK_LIMIT_COUNT` / `SPEEDHACK_LIMIT_BONUS` in `CONFIG`,
   plus validare server-side a distantei parcurse intre pachete de miscare.
6. **Viteza de atac si cooldown-uri** validate pe server, nu doar in client.
7. **SQL injection** prin siruri de la jucator: nume de personaj, nume de breasla,
   titluri de shop, mesaje. Verifica ca tot ce ajunge in SQL trece prin escape.
8. **Quest-uri care dau recompense fara verificare de stare** pe server.
9. **Multi-login** — acelasi cont pe mai multe canale simultan.
10. **Flood de pachete** — limitare pe numar de pachete pe secunda per conexiune.

Pentru fiecare punct: gaseste locul in codul **tau**, verifica daca protectia
exista, si noteaza in `docs/audit-securitate.md` ce ai gasit. Unde lipseste,
adaug-o — dar minimal si testat, nu rescriind sistemul.

### Masuri de client (secundare)

Utile ca sa ridice bariera, dar **bypass-abile** — nu te baza pe ele:
- criptarea pack-urilor si verificarea integritatii lor
- verificare de versiune/checksum al clientului la login
- detectie de procese cunoscute de cheat

Nu investi mult aici inainte sa fie server-side-ul curat. Un anticheat de client
peste un server care are incredere in pachete e teatru.

### Detectie prin loguri

Anticheat-ul care chiar prinde lume e logarea plus cineva care citeste logurile:
- castiguri de yang imposibile intr-un interval scurt
- item-e aparute fara sursa
- rate de omorare de mobi peste plauzibil
- login-uri din IP-uri multiple pe acelasi cont

Logheaza-le si verifica-le periodic. Fara asta, nu afli ca esti spart decat cand
economia serverului e deja distrusa.

---

## Partea D — Checklist inainte de live

- [ ] Audit A1–A7 rulat, rezultate scrise in `docs/audit-securitate.md`
- [ ] Ruleaza binare compilate de mine din sursa auditata
- [ ] Toate parolele schimbate fata de cele livrate
- [ ] `common.gmlist` contine doar conturile mele
- [ ] Firewall configurat; portul `db` inaccesibil din exterior
- [ ] SSH pe cheie, root dezactivat
- [ ] MySQL fara acces remote, useri cu privilegii minime
- [ ] Backup automat, in afara serverului, **testat prin restaurare**
- [ ] Cele 10 clase de exploit din Partea C verificate una cate una
- [ ] Logare activa pe evenimentele suspecte
- [ ] Testat pe server de test: trade cu deconectare, seif, shop offline, valori negative
