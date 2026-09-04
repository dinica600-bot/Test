# Optimizare — server care merge fara lag

> Regula care le bate pe toate: **masoara intai.** Optimizarea ghicita e cea mai
> buna metoda de a strica un server functional fara sa castigi nimic.

## Ordinea corecta

1. Masoara si afla **unde** se pierde timpul.
2. Schimba **un** lucru.
3. Masoara din nou.
4. Pastreaza daca s-a imbunatatit; da inapoi daca nu.

Noteaza cifrele in `docs/schimbari.md`. "Pare mai rapid" nu e o masuratoare.

## Cum masori

**Sistem (FreeBSD):**
```sh
top -aSH              # ce proces / thread consuma CPU
systat -vmstat 1      # CPU, disc, memorie
iostat 1              # I/O pe disc
sockstat -4           # conexiuni
```

**MySQL — de obicei aici e problema:**
```sql
SHOW FULL PROCESSLIST;              -- ce ruleaza chiar acum
SHOW ENGINE INNODB STATUS;
SHOW GLOBAL STATUS LIKE 'Slow_queries';
```
Activeaza `slow_query_log` cu `long_query_time = 0.5` si citeste ce iese. Asta
singur rezolva de obicei jumatate din "lag-ul de server".

**Serverul de joc:** urmareste `syserr` in fiecare core. Spam-ul de `SYSERR` nu e
zgomot inofensiv — e munca irosita si semn de ceva rupt.

## Unde sta de obicei problema, la Metin2

| Cauza | Semn | Ce faci |
|---|---|---|
| Indecsi lipsa in DB | query-uri lente pe `player`, `item`, `guild` | verifica `EXPLAIN` pe query-urile lente; adauga indecsi pe coloanele de cautare (ex. `item.owner_id`) |
| `innodb_buffer_pool_size` prea mic | disc citit continuu | seteaza-l relativ la RAM-ul VPS-ului (tipic 50–70% pe un server dedicat DB-ului) |
| Tabele de log uriase | `log.log` de zeci de GB, insert-uri lente | rotatie/arhivare periodica; nu loga ce nu citesti niciodata |
| `SAVE_EVENT_SECOND_CYCLE` prea mic | scrieri constante in DB | mareste-l; compromis intre pierderi la crash si incarcare |
| Core-ul `db` supraincarcat | toate canalele asteapta dupa el | e punct unic de esec — tine-i incarcarea mica si DB-ul rapid |
| Spawn/regen exagerate | CPU mare pe un canal, lag pe harta | reduce densitatea de mobi acolo unde e absurda |
| Quest-uri cu timere per jucator | CPU creste liniar cu jucatorii | revizuieste quest-urile care ruleaza permanent |
| Loguri pe disc lent | I/O wait mare | verifica daca VPS-ul e pe SSD; muta logurile |

## Compilare

- Foloseste flag-urile cu care e construit pachetul. Daca vrei sa le schimbi,
  fa-o **dupa** ce ai un build de referinta functional.
- `-O2` e alegerea sigura. **Nu sari la `-O3` sau `-march=native`** pe cod vechi:
  serverfiles-urile de Metin2 contin undefined behavior pe care optimizarile
  agresive il transforma din "merge din intamplare" in "crapa".
- Daca schimbi flag-urile, `gmake clean` complet — obiecte amestecate = bug-uri
  imposibil de gasit.

## MySQL — ce merita reglat

Porneste de la RAM-ul real al VPS-ului, nu de la un `my.cnf` copiat de pe forum:
`innodb_buffer_pool_size`, `innodb_log_file_size`, `max_connections`,
`query_cache` (dezactivat pe versiuni moderne), `tmp_table_size`.

Schimba cate un parametru, cu masuratoare inainte si dupa.

## Ce sa NU faci

- Sa nu "optimizezi" cod pe care nu l-ai masurat.
- Sa nu rescrii sisteme intregi pentru performanta inainte sa stii ca ele sunt
  problema. De obicei nu sunt — DB-ul e.
- Sa nu copiezi `my.cnf` sau flag-uri de compilare de pe forumuri fara sa
  intelegi fiecare linie.
- Sa nu dezactivezi logarea de securitate ca sa castigi performanta.
