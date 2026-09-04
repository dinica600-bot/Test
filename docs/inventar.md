# Inventar — ce avem efectiv

> Se completează în **Faza 0** din `docs/brief.md`, înainte de orice modificare.
> Nu ghici — deschide fișierele și verifică. Șterge liniile care nu se aplică.

## VPS

- Furnizor: Clever-Host.ro
- Sistem: FreeBSD `<versiune>` — arhitectura: `<i386 / amd64>`
- MySQL / MariaDB: `<versiune>`
- Rădăcina serverului: `<cale>`
- Scripturi start/stop: `<cale>`
- Python pe server (pentru `qc`): `<versiune>`

## Structura svfiles

```
<pune aici output-ul de la `ls -R` pe primele 2-3 niveluri, sau un arbore scris de mână>
```

- Canale / core-uri: `<cate, cum sunt numite>`
- Binare (`game`, `db`, `auth`) — unde stau: `<cale>`
- `share/locale/<limba>/`: `<care limba>`
- `CONFIG`-uri: `<cai>`
- `conf.txt` (conexiune MySQL) — **doar calea, nu conținutul**: `<cale>`

## Fișiere de date cheie

| Fișier | Cale | Format |
|---|---|---|
| `item_proto` (server) | | txt / binar / tabelă DB |
| `mob_proto` (server) | | txt / binar / tabelă DB |
| `item_proto` (client) | | |
| `mob_drop_item.txt` | | |
| `common_drop_item.txt` | | |
| `special_item_group.txt` | | |
| `item_attr.txt` | | |
| quest-uri `.quest` | | |
| `quest_list` | | |

## Bază de date

- Baze existente: `<account, player, common, log, ...>`
- Proto-urile se citesc din fișiere sau din DB? `<...>`
- Tabelă cu GM-i (`common.gmlist`): `<da/nu>`

## Sursa

```
<structura pe primele 2-3 niveluri>
```

- Sursă de server: `<da/nu>` — cale: `<...>`
- Sursă de client: `<da/nu>` — cale: `<...>`
- Sistem de build: `<gmake per director / build.sh / altceva>`
- **Compilează curat nemodificată?** `<da / nu — ce erori>`
- Binarele livrate corespund sursei? `<verificat cum>`

## Client

- Versiune client: `<...>`
- `root` / `uiscript` / `locale` — despachetate sau în pack-uri? `<...>`
- Unealtă de pack (EterNexus / MassPacker / altele): `<...>`

## Observații

<orice ai găsit ciudat, rupt, sau care nu se potrivește cu documentația pachetului>
