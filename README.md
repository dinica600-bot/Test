<div align="center">

# 🩸 BLOOD × DIAMONDS 💎

**Server Discord complet + bot pentru squad-ul tău de Mobile Legends**

O singură comandă — `/setup server` — îți construiește tot serverul: 41 de roluri,
12 categorii, 60 de canale, permisiuni gata setate și panouri interactive.
Plus 38 de comenzi slash făcute special pentru un squad de MLBB.

</div>

---

## ⚡ Pornire rapidă (10 minute)

### 1. Creează aplicația bot
1. Intră pe <https://discord.com/developers/applications> → **New Application** → nume: `Blood×Diamonds`.
2. Meniul **Bot** → **Reset Token** → copiază tokenul (nu-l da nimănui!).
3. Tot pe pagina **Bot**, activează cele 3 **Privileged Gateway Intents**:
   - ✅ `PRESENCE INTENT` (pentru statistica „Online")
   - ✅ `SERVER MEMBERS INTENT` (welcome, roluri, line-up)
   - ✅ `MESSAGE CONTENT INTENT` (XP, automod, numărătoare)
4. Meniul **General Information** → copiază **Application ID**.

### 2. Invită botul pe server
Înlocuiește `APPLICATION_ID` cu al tău și deschide link-ul:

```
https://discord.com/api/oauth2/authorize?client_id=APPLICATION_ID&permissions=8&scope=bot%20applications.commands
```

> `permissions=8` = Administrator. E necesar ca botul să poată **crea canale, roluri
> și permisiuni**. După setup poți reduce permisiunile dacă vrei.

### 3. Descarcă și configurează
```bash
git clone https://github.com/dinica600-bot/Test.git bxd
cd bxd
npm install
npm run setup
```

`npm run setup` te întreabă **doar tokenul**. Restul le află singur de la Discord:
Application ID, ID-ul tău de owner și serverul (ți-l alege dintr-o listă). Scrie `.env` gata completat.

> Dacă preferi manual: `cp .env.example .env` și completezi tu câmpurile.

### 4. Înregistrează comenzile și pornește botul
```bash
npm run deploy   # o singură dată (și după ce adaugi comenzi noi)
npm start
```

### 5. Construiește serverul
Pe Discord, într-un server **gol** (recomandat):

```
/setup server
```

Botul construiește tot în ~1 minut. La final îți spune exact ce mai ai de făcut:
mută rolul botului sus de tot, ia-ți rolul `🩸 Owner`, verifică-te în `✅︱verificare`.

> ⚠️ **Important:** în *Setări server → Roluri*, trage rolul botului **deasupra**
> tuturor rolurilor create. Altfel nu poate da rolurile de verificare/level.

---

## 🏗️ Ce îți construiește `/setup server`

<details open>
<summary><b>Structura completă a serverului</b></summary>

```
『🩸』BLOOD × DIAMONDS            ← vizibil pentru oricine (neverificați)
   👋︱bun-venit        mesaj automat de bun venit
   📜︱reguli           cele 8 reguli, postate automat
   ✅︱verificare       buton de verificare → deblochează serverul
   🎭︱self-roles       lane / rank / notificări (meniuri)

『📢』INFO & ANUNȚURI            ← doar membri verificați
   📢︱anunțuri  🎉︱evenimente  🏅︱roster  🤝︱parteneri  ⭐︱level-up

『💬』COMUNITATE
   💬︱general  🤖︱comenzi-bot  🖼️︱clipuri-media  😂︱meme
   🎵︱muzică  💡︱sugestii  🎂︱zile-de-naștere  🔢︱numărătoare

『⚔️』MOBILE LEGENDS
   🎮︱caut-echipă  🧩︱draft-strategii  🛠️︱builds-embleme
   📊︱meta-patch  🎯︱hero-tips  📈︱rank-progress  📸︱victorii

『🏆』COMPETITIV & SCRIM         ← roster + rezerve + coach + staff
   📅︱program-scrim  🤝︱cereri-scrim  📝︱lineup  🎥︱vod-review
   📌︱rezultate  🏟️︱turnee  🔐︱strategii-secrete (doar roster & coach)

『🎓』ACADEMY & TRYOUT           ← academy, tryout, coach, staff
   📖︱cum-aplici  📥︱aplicații  🧪︱tryout-chat  📚︱antrenamente

『🎫』SUPORT
   🎫︱deschide-ticket  ❓︱faq
『📨』TICKETE DESCHISE           ← aici apar canalele private de ticket

『🔊』VOICE
   ➕ Creează canal   ← intri și îți face automat canal privat
   🩸 Lobby  🎮 Team A  🎮 Team B  🎧 Chill Zone  🎥 Stream Room  💤 AFK
   🏟️ Scrim Room 1 & 2 (doar roster / rezerve / coach)

『📈』STATISTICI                 ← canale care se actualizează singure
   🩸 Membri: 0   💎 Online: 0   🚀 Boosts: 0

『🛡️』STAFF                      ← doar staff
   💼︱staff-chat  📋︱to-do  🚨︱rapoarte  🗳️︱decizii  🔒 Staff Voice

『📁』LOGS                       ← doar staff
   📥︱join-leave  📝︱mesaje  🔨︱mod-logs  🔊︱voice-logs
   🎫︱ticket-logs  🤖︱bot-logs
```
</details>

<details>
<summary><b>Cele 41 de roluri</b></summary>

| Grup | Roluri |
|---|---|
| **Staff** | 🩸 Owner · 💎 Co-Owner · ⚔️ Admin · 🛡️ Moderator · 🎯 Coach/Analyst · 🎥 Content Creator |
| **Echipă** | 🏆 Roster Principal · 🔁 Rezervă · 🎓 Academy · 🧪 Tryout · 🤝 Aliat |
| **Comunitate** | 💠 Membru · 🚀 Server Booster · 🔇 Muted · 🤖 Bots |
| **Lane** | 🥇 Gold · 🛡️ EXP · 🔮 Mid · 🌲 Jungler · 🧿 Roamer |
| **Rank MLBB** | Warrior → Elite → Master → Grandmaster → Epic → Legend → Mythic → Mythical Honor → Glory → Immortal |
| **Notificări** | 📢 Anunțuri · ⚔️ Scrim · 🏆 Turnee · 🎁 Giveaway · 🎉 Evenimente · 🎮 LFG |
| **Nivele** | 🔰 Lv.5 · ⭐ Lv.10 · 🌟 Lv.20 · 💫 Lv.35 · 👑 Lv.50 (se dau automat din XP) |

</details>

---

## 🤖 Ce știe botul să facă

| Sistem | Cum funcționează |
|---|---|
| **Verificare** | Buton în `✅︱verificare` → primești `💠 Membru` → se deschide tot serverul. Ține boții și trolii afară. |
| **Self-roles** | Trei meniuri: lane (multiplu), rank (unic, se schimbă automat), notificări. |
| **Tickete** | Meniu cu 6 motive → canal privat cu staff-ul, buton de preluare, închidere cu **transcript** trimis în logs și în DM. |
| **Recrutare** | Formular (modal) cu 5 întrebări → aplicația ajunge în `📥︱aplicații` cu butoane **Acceptă / Academy / Respinge**, care dau rolul și dau DM candidatului. |
| **Scrim** | `/scrim creeaza` postează un anunț cu butoane **Joc / Rezervă / Nu pot** — line-up-ul se completează singur, 5 sloturi + rezerve. |
| **Draft simulator** | `/draft` — ban/pick în format MPL (6 ban, 6 pick, 4 ban, 4 pick), cu buton de **Înapoi** și **Reset**. |
| **Profil MLBB** | `/profil conecteaza` verifică User ID + Zone ID prin serviciul folosit de site-urile de top-up și îți întoarce **numele real din joc** → badge `✅ ID verificat` (îți pune și numele ăla pe server). Rank, stele și winrate se declară cu `/profil stats` și se confirmă de staff pe bază de screenshot → badge `🛡️ Stats confirmate`. Rolul de rank se dă automat. |
| **Bază de eroi** | 125 de eroi cu rol, lane, dificultate și counter-e. `/hero`, `/counter`, `/build`, `/random-hero`, `/comp`. |
| **Nivele & XP** | 15–25 XP pe mesaj (cooldown 1 min) + 5 XP pe minut de voice. Roluri automate la Lv. 5/10/20/35/50, anunț în `⭐︱level-up`. |
| **Moderare** | ban, kick, timeout, warn cu **escaladare automată** (3 warn → timeout 1h, 5 warn → kick), purge, lock, slowmode, istoric. |
| **Automod** | Anti-invite, anti-spam, anti caps-lock, anti mass-mention, filtru de limbaj. 3 abateri în 10 min → timeout automat. Tot ce prinde se loghează. |
| **Logs** | Intrări/ieșiri, mesaje șterse și editate, moderare, voice, tickete, erori. |
| **Canale temporare** | Intri în `➕ Creează canal` → primești un canal doar al tău, îl controlezi cu `/vc`. Se șterge singur când rămâne gol. |
| **Statistici live** | Canale de voice care afișează numărul de membri, cine e online și boost-urile. |
| **Giveaway** | Buton de participare, contor live, câștigători aleși automat la timp, reroll. |
| **Sondaje** | Butoane + bară de progres, un vot de persoană (se poate schimba). |
| **Sugestii** | `/sugestie` → embed cu 👍/👎 și thread automat; staff-ul aprobă sau respinge. |
| **Rezultate** | `/rezultat adauga` ține evidența meciurilor; `/rezultat statistici` dă winrate-ul și topul MVP. |
| **Zile de naștere** | Se anunță automat în `🎂︱zile-de-naștere`. |
| **Numărătoare** | Canal de counting cu validare (nu poți număra de două ori la rând). |

---

## 📜 Toate comenzile

<details open>
<summary><b>⚔️ Mobile Legends</b></summary>

| Comandă | Ce face |
|---|---|
| `/hero <nume>` | Rol, lane, dificultate, counter-e, build. Are autocomplete. |
| `/counter <inamic>` | Ce eroi îl bat pe inamicul respectiv. |
| `/build <erou>` | Itemi în ordine, emblemă, battle spell, cum se joacă. |
| `/random-hero [rol] [lane]` | Îți alege botul eroul. Fără reroll 😈 |
| `/comp [meta]` | Generează o compoziție completă, câte un erou pe lane. |
| `/draft` | Simulator de ban/pick în format MPL, cu butoane. |
| `/profil conecteaza` | **Verifică ID-ul real de MLBB** și îți ia numele din joc. `/profile` merge la fel. |
| `/profil stats` | Rank + diviziune + stele (sau puncte de Mythic), winrate, meciuri, main-uri. |
| `/profil dovada` | Trimiți screenshot → staff-ul îți confirmă stats-urile cu un buton. |
| `/profil vezi` | Fișa de jucător completă, cu badge-uri. |
| `/lfg` | Caută coechipieri — party cu butoane, până la 5 locuri. |

</details>

<details>
<summary><b>🏆 Competitiv & scrim</b></summary>

| Comandă | Ce face |
|---|---|
| `/scrim creeaza` | Programează un scrim (adversar, oră, dată, format) cu line-up pe butoane. |
| `/scrim lista` | Scrim-urile care urmează. |
| `/scrim curata` | Șterge scrim-urile trecute. |
| `/lineup [grup]` | Line-up-ul pe lane-uri, cu IGN și rank din profil. |
| `/rezultat adauga` | Salvează rezultatul unui meci (+ MVP și note). |
| `/rezultat statistici` | Bilanț, winrate, top MVP, ultimele meciuri. |
| `/tryout aplica \| panou \| lista` | Formular de recrutare și gestionarea aplicațiilor. |

</details>

<details>
<summary><b>💬 Comunitate</b></summary>

| Comandă | Ce face |
|---|---|
| `/rank [membru]` | Nivel, XP, poziție, mesaje, ore de voice. |
| `/clasament [tip]` | Top 10 după XP, mesaje sau timp în voice. |
| `/sondaj` | Sondaj cu până la 5 opțiuni și bară de progres. |
| `/giveaway start \| incheie \| reroll` | Giveaway complet, cu rol necesar opțional. |
| `/sugestie <text>` | Sugestie cu vot și thread. |
| `/zi-nastere seteaza \| lista \| sterge` | Zile de naștere anunțate automat. |
| `/xp adauga \| scoate \| reseteaza` | *(staff)* Administrare XP. |

</details>

<details>
<summary><b>🛡️ Moderare</b></summary>

| Comandă | Ce face |
|---|---|
| `/ban` `/unban` `/kick` | Clasicele, cu DM către membru și log. `/unban` are autocomplete pe lista de banați. |
| `/timeout da \| scoate` | Timeout de la 60s până la o săptămână. |
| `/warn da \| lista \| sterge \| curata` | Avertismente cu escaladare automată. |
| `/curata <câte>` | Șterge mesaje (filtre: doar un membru / doar boți). |
| `/canal blocheaza \| deblocheaza \| slowmode` | Control rapid pe canal. |
| `/istoric <membru>` | Tot cazierul: warn-uri + acțiuni de moderare. |

</details>

<details>
<summary><b>🛠️ Administrare & utile</b></summary>

| Comandă | Ce face |
|---|---|
| `/setup server \| panouri \| logs \| status` | Construiește / repară serverul. |
| `/config vezi \| log \| automod \| cuvinte \| nivele \| autorole` | Toate setările botului. |
| `/panou <tip>` | Postează un panou (verificare, reguli, self-roles, tickete, tryout). |
| `/anunt` | Anunț oficial cu embed, ping de rol și imagine (se și publică automat în canalele de anunțuri). |
| `/spune` | Botul scrie în numele serverului. |
| `/help [comanda]` | Lista completă sau detalii despre o comandă. |
| `/ping` `/serverinfo` `/userinfo` `/avatar` | Informații. |
| `/vc nume \| limita \| blocheaza \| deblocheaza \| da-afara \| invita` | Controlul canalului tău temporar. |

</details>

---

## ✨ Partea vizuală

Serverul nu arată ca un server gol cu canale text — vine cu un pachet vizual complet.

**Imagini generate** (în `assets/`, făcute cu `scripts/generate-assets.py`):

| Imagine | Unde apare |
|---|---|
| `icon.png` | iconul serverului **și** poza de profil a botului |
| `welcome.png` | banner în `👋︱bun-venit` + pe mesajul primit de fiecare membru nou |
| 8 banere de categorie | header în `📢︱anunțuri`, `💬︱general`, `🎯︱hero-tips`, `📅︱program-scrim`, `📚︱antrenamente`, `❓︱faq`, `💼︱staff-chat`, `🎮︱caut-echipă` |

Le pui pe toate cu o comandă:
```
/decor tot
```
Vrei alt stil? Editezi culorile și textele în `scripts/generate-assets.py`, rulezi `python3 scripts/generate-assets.py` și dai `/decor banere` din nou.

**Panourile au imagini** — verificarea, regulile, ticketele și recrutarea vin cu banner propriu, nu doar text.

**Nume cu gradient și holografice** (Enhanced Role Styles):

| Rol | Stil |
|---|---|
| 🩸 Owner | ✨ holografic (luciu animat) |
| 💎 Co-Owner | albastru → mov |
| ⚔️ Admin | roșu → portocaliu |
| 🛡️ Moderator | coral → auriu |
| 🏆 Roster Principal | auriu → portocaliu |
| 👑 Mythical Glory, 💫 Immortal, 👑 Lv.50 | gradient propriu |

Discord cere boost-uri pentru ele: **Nivel 2** (7 boost-uri) pentru gradient, **Nivel 3** (14) pentru holografic. Fără boost-uri rolurile primesc culoarea simplă și totul merge normal — când ajungi acolo, rulezi `/setup stiluri` și se aplică peste rolurile existente.

**Emoji personalizate** — 32 emoji generate, încărcate cu `/decor emoji` (din cele 50 de sloturi gratuite):

| Set | Ce conține |
|---|---|
| **10 embleme de rank** (scut) | Warrior → Immortal, în progresia din joc: stea, apoi stele, aripi, gemă, flacără, aură, coroană |
| **10 embleme de staff** (hexagon) | Owner și Co-Owner cu coroană și aură, Admin sabie, Moderator scut, Coach țintă, Creator play, Roster trofeu, Rezervă săgeți, Academy tocă, Tryout eprubetă |
| **12 utilitare** | marca BxD, picătură, diamant, lane-uri, win / loss / MVP / scrim |

Emblemele apar automat pe fișa de jucător (`/profil vezi`) — la rank și ca insigne de rol —, în meniul de rank din `🎭︱self-roles`, la `/lineup` și la `/rezultat`.

> Emblemele sunt **desen propriu**, nu iconițele oficiale Moonton — alea sunt protejate de drepturi de autor și nu pot fi redistribuite. **Nu cer niciun boost** — orice server are 50 de sloturi gratuite. Botul le folosește automat în embed-uri, iar membrii le pot pune în chat și ca reacții.

**Community, ecran de bun venit și onboarding** — `/setup comunitate` activează modul Community (gratis), pune ecranul de bun venit cu scurtături spre canalele importante și configurează **onboarding-ul**: la intrarea pe server, noii membri primesc întrebările *„Ce lane joci?"*, *„Ce rank ai?"*, *„Ce notificări vrei?"* și primesc rolurile automat. Tot activarea Community transformă `📢︱anunțuri` în canal de anunțuri, pe care alte servere îl pot urmări.

**Conținut zilnic** — în fiecare zi botul postează singur în `🎯︱hero-tips` **eroul zilei** (rol, lane, counter-e, primii itemi) plus un sfat de joc, ca serverul să aibă viață și când nu scrie nimeni.

---

## 🎮 Cum funcționează profilul de Mobile Legends

**Ce se poate verifica automat și ce nu — pe scurt:**

| | Se poate? | Cum |
|---|---|---|
| Există contul? Care e numele real din joc? | ✅ **Da, automat** | User ID + Zone ID sunt trimise la serviciul de validare folosit de site-urile de top-up (Codashop & co.), care întoarce nickname-ul. Exact mecanismul folosit de toate boturile MLBB serioase. |
| Rank, stele, winrate, meciuri, istoric | ❌ **Nu automat** | Moonton **nu are API public** pentru statistici de jucător. Botul de pe serverul oficial (Halpo) are acces special de partener, pe care un bot terț nu-l poate obține. |

De aceea fluxul e în doi pași — și tot iese o fișă în care poți avea încredere:

```
1. /profil conecteaza  user_id:1114917746  zone_id:2019
   → botul confirmă contul, îți ia numele din joc și îți dă  ✅ ID verificat

2. /profil stats  rank:Mythical Glory  puncte:63  winrate:62.4  meciuri:1248
   → primești automat rolul 👑 Mythical Glory

3. /profil dovada  screenshot:<poza din joc>
   → staff-ul apasă „Confirm" și primești  🛡️ Stats confirmate
```

Rank-ul e modelat exact ca în joc: Warrior → Legend au **diviziuni și stele**
(`🔥 Legend II ★★★☆☆`), iar de la Mythic în sus se merge pe **puncte**, din care
botul deduce singur tier-ul corect (0-24 Mythic, 25-49 Honor, 50-99 Glory, 100+ Immortal).

> **Dacă serviciul de verificare cade** (sunt endpoint-uri neoficiale, se mai schimbă),
> nu trebuie să modifici cod: pui alt URL în `.env` la `MLBB_NICKNAME_API`, cu
> `{id}` și `{server}` ca variabile. Botul caută singur numele în răspuns.
> Iar dacă apare vreodată un serviciu care dă și statistici, îl pui la `MLBB_STATS_API`
> și sunt preluate automat la conectare.

---

## 🎨 Personalizare

Tot serverul e descris într-un singur fișier: **`src/config/blueprint.js`**.

```js
// vrei un canal nou? adaugă o linie în categoria potrivită:
{ key: 'clips', name: '🎬︱clipuri-pro', type: 'text', topic: 'Doar highlight-uri' },

// vrei alt rol? adaugă-l în ROLES:
{ key: 'streamer', name: '🔴 Live Now', color: 0xff0000, hoist: true, mentionable: true, group: 'community', perms: [] },
```

Apoi rulezi din nou `/setup server` — creează **doar ce lipsește**, nu strică nimic din ce există.

| Vreau să schimb... | Fișier |
|---|---|
| Canale, roluri, permisiuni, reguli, întrebările de tryout | `src/config/blueprint.js` |
| Eroi, counter-e, build-uri | `src/data/heroes.js` |
| Culorile și numele squad-ului | `src/config/config.js` + `.env` |
| Filtrele de automod | `src/lib/automod.js` (sau live, cu `/config automod`) |
| Formula de XP și recompensele | `src/lib/leveling.js` |

---

## 🖥️ Cum îl ții pornit 24/7

Botul trebuie să ruleze undeva non-stop. Variante:

```bash
# pe un VPS / Raspberry Pi, cu pm2
npm install -g pm2
pm2 start src/index.js --name blood-diamonds
pm2 save && pm2 startup
```

<details>
<summary><b>📱 Direct de pe telefon, cu Termux (fără PC)</b></summary>

Instalează **Termux de pe [F-Droid](https://f-droid.org/en/packages/com.termux/)** — versiunea din Play Store e veche și nu merge.

```bash
pkg update -y && pkg upgrade -y
pkg install nodejs git -y

git clone https://github.com/dinica600-bot/Test.git bxd
cd bxd
npm install
npm run setup
npm run deploy
npm start
```

**Ca să nu-l omoare Android:**
- rulează `termux-wake-lock` înainte de `npm start`
- Setări Android → Aplicații → Termux → Baterie → **Fără restricții**
- nu da swipe pe Termux din aplicațiile recente

**Mai târziu:** îl repornești cu `cd bxd && npm start`, iar codul îl actualizezi cu `cd bxd && git pull && npm install`.

Botul e online cât timp Termux rulează. Pentru 24/7 real, mută-l pe un hosting.
</details>

Merge și pe orice host care rulează Node.js 18+ (Railway, Fly.io, Pterodactyl etc.).
Setează acolo aceleași variabile din `.env` și comanda de start `npm start`.

Datele (XP, warn-uri, profile, scrim-uri) stau în fișiere JSON în folderul `data/`.
Fă-i backup din când în când — e tot ce trebuie salvat.

---

## 🧯 Probleme frecvente

| Problemă | Rezolvare |
|---|---|
| „Missing Permissions" la `/setup` | Rolul botului trebuie să fie **Administrator** și **cât mai sus** în listă. |
| Comenzile `/` nu apar | Rulează `npm run deploy`. Cu `GUILD_ID` setat apar instant; global durează până la o oră. |
| Butonul de verificare nu dă rolul | Rolul botului trebuie să fie deasupra rolului `💠 Membru`. |
| Nu se dă XP / nu merge automod-ul | Activează **MESSAGE CONTENT INTENT** în Developer Portal. |
| `📢︱anunțuri` a fost creat ca text normal | Canalele de tip announcement/stage cer **Community** activat pe server. Activează-l și rulează `/setup server` din nou. |
| Statistica „Online" arată 0 | Activează **PRESENCE INTENT**. |
| Ceva lipsește după setup | `/setup status` îți arată exact ce, apoi `/setup server` completează. |

---

## 📁 Structura proiectului

```
src/
├── index.js              pornirea botului
├── deploy-commands.js    înregistrarea comenzilor slash
├── config/
│   ├── config.js         token, culori, numele squad-ului
│   └── blueprint.js      ⭐ TOT serverul: roluri, canale, permisiuni, reguli
├── data/heroes.js        125 de eroi MLBB + build-uri
├── commands/             38 de comenzi, grupate pe categorii
├── components/           butoane, meniuri, modale (tickete, scrim, draft…)
├── events/               ready, mesaje, membri, voice, interacțiuni
└── lib/                  db, embeds, permisiuni, XP, automod, logs
```

---

<div align="center">

**🩸 Blood × Diamonds — Sânge pe rank, diamante în vitrină. 💎**

</div>
