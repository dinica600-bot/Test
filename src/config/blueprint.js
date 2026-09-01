/**
 * BLUEPRINT-UL SERVERULUI BLOOD×DIAMONDS
 * -------------------------------------------------------------
 * Aici e descris TOT serverul: roluri, categorii, canale, permisiuni.
 * Comanda /setup server citeste fisierul asta si construieste totul.
 * Daca vrei sa schimbi ceva (nume, culori, canale) modifici doar aici.
 */

/* ============================================================
 *  ROLURI
 *  key       = identificator intern (folosit in permisiuni)
 *  perms     = permisiuni Discord (nume din PermissionFlagsBits)
 *  hoist     = se afiseaza separat in lista de membri
 * ========================================================== */
export const ROLES = [
  // ---------- STAFF ----------
  {
    key: 'owner', gradient: null, holographic: true, name: '🩸 Owner', color: 0x8b0000, hoist: true, mentionable: false,
    perms: ['Administrator'], group: 'staff',
    desc: 'Fondatorul squad-ului. Control total.',
  },
  {
    key: 'coowner', gradient: [0x38bdf8, 0xa78bfa], name: '💎 Co-Owner', color: 0x38bdf8, hoist: true, mentionable: false,
    perms: ['Administrator'], group: 'staff',
    desc: 'Mana dreapta a owner-ului.',
  },
  {
    key: 'admin', gradient: [0xe01e37, 0xff8c42], name: '⚔️ Admin', color: 0xe01e37, hoist: true, mentionable: true, group: 'staff',
    perms: [
      'ManageGuild', 'ManageChannels', 'ManageRoles', 'ManageMessages', 'ManageNicknames',
      'ManageEvents', 'KickMembers', 'BanMembers', 'ModerateMembers', 'MentionEveryone',
      'MoveMembers', 'MuteMembers', 'DeafenMembers', 'ViewAuditLog', 'ManageWebhooks',
    ],
    desc: 'Administreaza serverul si staff-ul.',
  },
  {
    key: 'mod', gradient: [0xff6b6b, 0xffd166], name: '🛡️ Moderator', color: 0xff6b6b, hoist: true, mentionable: true, group: 'staff',
    perms: [
      'ManageMessages', 'ManageNicknames', 'KickMembers', 'ModerateMembers',
      'MoveMembers', 'MuteMembers', 'DeafenMembers', 'ViewAuditLog',
    ],
    desc: 'Tine ordinea in chat si in voice.',
  },
  {
    key: 'coach', gradient: [0xf4a261, 0xe76f51], name: '🎯 Coach / Analyst', color: 0xf4a261, hoist: true, mentionable: true, group: 'staff',
    perms: ['ManageEvents', 'MuteMembers', 'MoveMembers', 'ManageMessages'],
    desc: 'Face draft-ul, VOD review si strategia.',
  },
  {
    key: 'creator', gradient: [0x9b5de5, 0xf72585], name: '🎥 Content Creator', color: 0x9b5de5, hoist: true, mentionable: true, group: 'staff',
    perms: ['EmbedLinks', 'AttachFiles', 'Stream', 'PrioritySpeaker'],
    desc: 'Streameri / editori care fac content pentru squad.',
  },

  // ---------- ECHIPA ----------
  {
    key: 'roster', gradient: [0xffd700, 0xff8c00], name: '🏆 Roster Principal', color: 0xffd700, hoist: true, mentionable: true, group: 'team',
    perms: [], desc: 'Cei 5 titulari care joaca oficialele.',
  },
  {
    key: 'sub', gradient: [0xe2e8f0, 0x94a3b8], name: '🔁 Rezervă', color: 0xc0c0c0, hoist: true, mentionable: true, group: 'team',
    perms: [], desc: 'Substitute — intra cand lipseste un titular.',
  },
  {
    key: 'academy', gradient: [0x4cc9f0, 0x4361ee], name: '🎓 Academy', color: 0x4cc9f0, hoist: true, mentionable: true, group: 'team',
    perms: [], desc: 'Lotul de perspectiva, se antreneaza pentru roster.',
  },
  {
    key: 'tryout', name: '🧪 Tryout', color: 0x90be6d, hoist: false, mentionable: true, group: 'team',
    perms: [], desc: 'In proba. Are acces temporar la Academy.',
  },
  {
    key: 'ally', name: '🤝 Aliat', color: 0x577590, hoist: false, mentionable: true, group: 'team',
    perms: [], desc: 'Membri din squad-uri partenere (scrim buddies).',
  },

  // ---------- COMUNITATE ----------
  {
    key: 'member', name: '💠 Membru', color: 0x5865f2, hoist: true, mentionable: false, group: 'community',
    perms: [], desc: 'Rolul primit dupa verificare. Deschide serverul.',
  },
  {
    key: 'booster', gradient: [0xf47fff, 0x9b5de5], name: '🚀 Server Booster', color: 0xf47fff, hoist: true, mentionable: false, group: 'community',
    perms: [], desc: 'Multumim pentru boost! (se da manual sau prin Discord)',
  },
  {
    key: 'muted', name: '🔇 Muted', color: 0x4e4e4e, hoist: false, mentionable: false, group: 'system',
    perms: [], desc: 'Nu poate scrie sau vorbi. Se da de /timeout sau automod.',
  },
  {
    key: 'bots', name: '🤖 Bots', color: 0x2b2d31, hoist: false, mentionable: false, group: 'system',
    perms: [], desc: 'Pentru boti.',
  },

  // ---------- LANE / ROL IN JOC (self-assign) ----------
  { key: 'lane_gold', name: '🥇 Gold Lane', color: 0xe9c46a, hoist: false, mentionable: true, group: 'lane', perms: [] },
  { key: 'lane_exp', name: '🛡️ EXP Lane', color: 0xe76f51, hoist: false, mentionable: true, group: 'lane', perms: [] },
  { key: 'lane_mid', name: '🔮 Mid Lane', color: 0xa06cd5, hoist: false, mentionable: true, group: 'lane', perms: [] },
  { key: 'lane_jungle', name: '🌲 Jungler', color: 0x2a9d8f, hoist: false, mentionable: true, group: 'lane', perms: [] },
  { key: 'lane_roam', name: '🧿 Roamer', color: 0x48cae4, hoist: false, mentionable: true, group: 'lane', perms: [] },

  // ---------- RANK MLBB (self-assign) ----------
  { key: 'rank_warrior', name: '⚔️ Warrior', color: 0xa8763e, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_elite', name: '🔰 Elite', color: 0x6baa75, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_master', name: '🎖️ Master', color: 0x3fa7d6, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_gm', name: '🏅 Grandmaster', color: 0x7b68ee, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_epic', name: '💜 Epic', color: 0xc77dff, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_legend', name: '🔥 Legend', color: 0xff6d00, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_mythic', name: '🌌 Mythic', color: 0xff206e, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_honor', name: '✨ Mythical Honor', color: 0xffb703, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_glory', gradient: [0xff4d6d, 0xffd700], name: '👑 Mythical Glory', color: 0xff4d6d, hoist: false, mentionable: false, group: 'rank', perms: [] },
  { key: 'rank_immortal', gradient: [0xf72585, 0x7209b7], name: '💫 Mythical Immortal', color: 0xf72585, hoist: false, mentionable: false, group: 'rank', perms: [] },

  // ---------- PING / NOTIFICARI (self-assign) ----------
  { key: 'ping_announce', name: '📢 Anunțuri', color: 0x94a3b8, hoist: false, mentionable: true, group: 'ping', perms: [] },
  { key: 'ping_scrim', name: '⚔️ Scrim Ping', color: 0x94a3b8, hoist: false, mentionable: true, group: 'ping', perms: [] },
  { key: 'ping_tournament', name: '🏆 Turnee', color: 0x94a3b8, hoist: false, mentionable: true, group: 'ping', perms: [] },
  { key: 'ping_giveaway', name: '🎁 Giveaway', color: 0x94a3b8, hoist: false, mentionable: true, group: 'ping', perms: [] },
  { key: 'ping_event', name: '🎉 Evenimente', color: 0x94a3b8, hoist: false, mentionable: true, group: 'ping', perms: [] },
  { key: 'ping_lfg', name: '🎮 LFG', color: 0x94a3b8, hoist: false, mentionable: true, group: 'ping', perms: [] },

  // ---------- NIVELE (se dau automat de sistemul de XP) ----------
  { key: 'lvl_5', name: '🔰 Lv.5 — Recrut', color: 0x8d99ae, hoist: false, mentionable: false, group: 'level', level: 5, perms: [] },
  { key: 'lvl_10', name: '⭐ Lv.10 — Activ', color: 0x00b4d8, hoist: false, mentionable: false, group: 'level', level: 10, perms: [] },
  { key: 'lvl_20', name: '🌟 Lv.20 — Veteran', color: 0x7209b7, hoist: false, mentionable: false, group: 'level', level: 20, perms: [] },
  { key: 'lvl_35', name: '💫 Lv.35 — Elite Member', color: 0xf72585, hoist: false, mentionable: false, group: 'level', level: 35, perms: [] },
  { key: 'lvl_50', gradient: [0xffd700, 0xff006e], name: '👑 Lv.50 — Legendă BxD', color: 0xffd700, hoist: true, mentionable: false, group: 'level', level: 50, perms: [] },
];

/**
 * NOTA despre `gradient` si `holographic`:
 * sunt "Enhanced Role Styles" — numele membrului se coloreaza in degrade
 * (2 culori) sau capata un luciu animat. Discord le cere boost-uri pe server:
 * Nivel 2 pentru gradient, Nivel 3 pentru holografic. Daca nu le ai, rolul
 * primeste culoarea simpla si totul merge la fel. Cand ajungi la boost-uri,
 * rulezi /setup stiluri si se aplica peste rolurile existente.
 */

/** Grupurile de roluri care se pot lua singur din #self-roles. */
export const SELF_ROLE_GROUPS = [
  {
    id: 'lane', label: 'Lane-ul tău', emoji: '⚔️', max: 5,
    description: 'Ce pozitie joci in MLBB? Poti alege mai multe.',
    roles: ['lane_gold', 'lane_exp', 'lane_mid', 'lane_jungle', 'lane_roam'],
  },
  {
    id: 'rank', label: 'Rank-ul tău', emoji: '🏅', max: 1,
    description: 'Alege rank-ul actual (se schimba automat cand alegi altul).',
    roles: ['rank_warrior', 'rank_elite', 'rank_master', 'rank_gm', 'rank_epic',
      'rank_legend', 'rank_mythic', 'rank_honor', 'rank_glory', 'rank_immortal'],
    exclusive: true,
  },
  {
    id: 'ping', label: 'Notificări', emoji: '🔔', max: 6,
    description: 'Alege pentru ce vrei sa fii mentionat.',
    roles: ['ping_announce', 'ping_scrim', 'ping_tournament', 'ping_giveaway', 'ping_event', 'ping_lfg'],
  },
];

/* ============================================================
 *  CATEGORII SI CANALE
 *  visibility: public  -> vede oricine (inclusiv neverificat)
 *              member  -> doar cei verificati (rol Membru)
 *              team    -> roster + sub + coach + staff
 *              academy -> academy + tryout + coach + staff
 *              staff   -> doar staff
 *  readonly:   doar staff poate scrie
 * ========================================================== */
export const CATEGORIES = [
  {
    key: 'portal',
    name: '『🩸』BLOOD × DIAMONDS',
    visibility: 'public',
    channels: [
      { key: 'welcome', name: '👋︱bun-venit', type: 'text', readonly: true, topic: 'Fiecare legenda incepe aici. Bun venit in Blood×Diamonds!' },
      { key: 'rules', name: '📜︱reguli', type: 'text', readonly: true, topic: 'Citeste regulile. Necunoasterea lor nu e scuza.' },
      { key: 'verify', name: '✅︱verificare', type: 'text', readonly: true, topic: 'Apasa butonul ca sa primesti acces pe server.' },
      { key: 'roles', name: '🎭︱self-roles', type: 'text', readonly: true, topic: 'Alege-ti lane-ul, rank-ul si notificarile.' },
    ],
  },
  {
    key: 'info',
    name: '『📢』INFO & ANUNȚURI',
    visibility: 'member',
    channels: [
      { key: 'announcements', name: '📢︱anunțuri', type: 'announcement', readonly: true, topic: 'Anunturi oficiale ale squad-ului.' },
      { key: 'events', name: '🎉︱evenimente', type: 'text', readonly: true, topic: 'Turnee, giveaway-uri, custom room nights.' },
      { key: 'roster-board', name: '🏅︱roster', type: 'text', readonly: true, topic: 'Line-up-ul oficial Blood×Diamonds.' },
      { key: 'partners', name: '🤝︱parteneri', type: 'text', readonly: true, topic: 'Squad-uri aliate si colaborari.' },
      { key: 'levelup', name: '⭐︱level-up', type: 'text', readonly: true, topic: 'Aici anunta botul cand cineva urca in nivel.' },
    ],
  },
  {
    key: 'community',
    name: '『💬』COMUNITATE',
    visibility: 'member',
    channels: [
      { key: 'general', name: '💬︱general', type: 'text', slowmode: 3, topic: 'Chat general. Respecta regulile.' },
      { key: 'commands', name: '🤖︱comenzi-bot', type: 'text', topic: 'Spam de comenzi permis aici. Scrie / ca sa vezi tot ce stiu.' },
      { key: 'media', name: '🖼️︱clipuri-media', type: 'text', slowmode: 10, topic: 'Highlight-uri, savage, maniac, screenshot-uri.' },
      { key: 'memes', name: '😂︱meme', type: 'text', slowmode: 5, topic: 'Meme MLBB si nu numai.' },
      { key: 'music', name: '🎵︱muzică', type: 'text', topic: 'Ce asculti cand faci grind pe rank.' },
      { key: 'suggestions', name: '💡︱sugestii', type: 'text', readonly: true, topic: 'Foloseste /suggest ca sa propui ceva. Se voteaza cu butoane.' },
      { key: 'birthdays', name: '🎂︱zile-de-naștere', type: 'text', topic: 'Zilele de nastere din squad.' },
      { key: 'counting', name: '🔢︱numărătoare', type: 'text', topic: 'Numarati corect. Cine greseste, o ia de la 1.' },
    ],
  },
  {
    key: 'mlbb',
    name: '『⚔️』MOBILE LEGENDS',
    visibility: 'member',
    channels: [
      { key: 'lfg', name: '🎮︱caut-echipă', type: 'text', topic: 'Cauti coechipieri pentru rank/classic? Aici. Foloseste /lfg.' },
      { key: 'draft', name: '🧩︱draft-strategii', type: 'text', topic: 'Ban/pick, comps, counter-picks. Foloseste /draft.' },
      { key: 'builds', name: '🛠️︱builds-embleme', type: 'text', topic: 'Item build-uri, embleme, spell-uri.' },
      { key: 'meta', name: '📊︱meta-patch', type: 'text', topic: 'Discutii despre patch notes si meta actuala.' },
      { key: 'tips', name: '🎯︱hero-tips', type: 'text', topic: 'Tips & tricks pe eroi. /hero iti da info rapid.' },
      { key: 'rankup', name: '📈︱rank-progress', type: 'text', topic: 'Arata-ti progresul spre Mythical Glory.' },
      { key: 'wins', name: '📸︱victorii', type: 'text', topic: 'Screenshot-uri cu MVP si win-uri.' },
    ],
  },
  {
    key: 'competitive',
    name: '『🏆』COMPETITIV & SCRIM',
    visibility: 'team',
    channels: [
      { key: 'scrim-schedule', name: '📅︱program-scrim', type: 'text', readonly: true, topic: 'Scrim-urile programate. Se creeaza cu /scrim create.' },
      { key: 'scrim-requests', name: '🤝︱cereri-scrim', type: 'text', topic: 'Cereri de scrim de la alte squad-uri.' },
      { key: 'lineup', name: '📝︱lineup', type: 'text', topic: 'Cine joaca in meciul urmator.' },
      { key: 'vod', name: '🎥︱vod-review', type: 'text', topic: 'Analiza meciurilor. Link-uri + timestamps.' },
      { key: 'results', name: '📌︱rezultate', type: 'text', readonly: true, topic: 'Rezultatele oficiale ale squad-ului.' },
      { key: 'tournaments', name: '🏟️︱turnee', type: 'text', topic: 'Inscrieri si informatii despre turnee.' },
      { key: 'strategy', name: '🔐︱strategii-secrete', type: 'text', topic: 'Doar pentru roster. Nimic de aici nu iese afara.', restrict: ['roster', 'coach'] },
    ],
  },
  {
    key: 'academy',
    name: '『🎓』ACADEMY & TRYOUT',
    visibility: 'academy',
    channels: [
      { key: 'how-to-apply', name: '📖︱cum-aplici', type: 'text', readonly: true, topic: 'Pasii ca sa intri in Blood×Diamonds.' },
      { key: 'applications', name: '📥︱aplicații', type: 'text', readonly: true, topic: 'Aplicatiile trimise cu /tryout apply ajung aici.' },
      { key: 'tryout-chat', name: '🧪︱tryout-chat', type: 'text', topic: 'Chat pentru cei aflati in proba.' },
      { key: 'training', name: '📚︱antrenamente', type: 'text', topic: 'Program de antrenament, teme, drills.' },
    ],
  },
  {
    key: 'support',
    name: '『🎫』SUPORT',
    visibility: 'member',
    channels: [
      { key: 'ticket-panel', name: '🎫︱deschide-ticket', type: 'text', readonly: true, topic: 'Ai o problema? Deschide un ticket privat cu staff-ul.' },
      { key: 'faq', name: '❓︱faq', type: 'text', readonly: true, topic: 'Intrebari frecvente.' },
    ],
  },
  {
    key: 'tickets',
    name: '『📨』TICKETE DESCHISE',
    visibility: 'staff',
    channels: [],
  },
  {
    key: 'voice',
    name: '『🔊』VOICE',
    visibility: 'member',
    channels: [
      { key: 'vc-create', name: '➕ Creează canal', type: 'voice', topic: 'Intra aici si botul iti face un canal privat.' },
      { key: 'vc-lobby', name: '🩸 Lobby', type: 'voice' },
      { key: 'vc-team-a', name: '🎮 Team A', type: 'voice', userLimit: 5 },
      { key: 'vc-team-b', name: '🎮 Team B', type: 'voice', userLimit: 5 },
      { key: 'vc-scrim-1', name: '🏟️ Scrim Room 1', type: 'voice', userLimit: 6, restrict: ['roster', 'sub', 'coach'] },
      { key: 'vc-scrim-2', name: '🏟️ Scrim Room 2', type: 'voice', userLimit: 6, restrict: ['roster', 'sub', 'coach', 'academy'] },
      { key: 'vc-chill', name: '🎧 Chill Zone', type: 'voice' },
      { key: 'vc-stream', name: '🎥 Stream Room', type: 'stage' },
      { key: 'vc-afk', name: '💤 AFK', type: 'voice', afk: true },
    ],
  },
  {
    key: 'stats',
    name: '『📈』STATISTICI',
    visibility: 'member',
    channels: [
      { key: 'stat-members', name: '🩸 Membri: 0', type: 'voice', locked: true, stat: 'members' },
      { key: 'stat-online', name: '💎 Online: 0', type: 'voice', locked: true, stat: 'online' },
      { key: 'stat-boosts', name: '🚀 Boosts: 0', type: 'voice', locked: true, stat: 'boosts' },
    ],
  },
  {
    key: 'staff',
    name: '『🛡️』STAFF',
    visibility: 'staff',
    channels: [
      { key: 'staff-chat', name: '💼︱staff-chat', type: 'text', topic: 'Discutii interne staff.' },
      { key: 'staff-todo', name: '📋︱to-do', type: 'text', topic: 'Task-uri de facut.' },
      { key: 'reports', name: '🚨︱rapoarte', type: 'text', topic: 'Raportarile de la membri ajung aici.' },
      { key: 'decisions', name: '🗳️︱decizii', type: 'text', topic: 'Voturi si decizii de conducere.' },
      { key: 'vc-staff', name: '🔒 Staff Voice', type: 'voice' },
    ],
  },
  {
    key: 'logs',
    name: '『📁』LOGS',
    visibility: 'staff',
    channels: [
      { key: 'log-join', name: '📥︱join-leave', type: 'text' },
      { key: 'log-message', name: '📝︱mesaje', type: 'text' },
      { key: 'log-mod', name: '🔨︱mod-logs', type: 'text' },
      { key: 'log-voice', name: '🔊︱voice-logs', type: 'text' },
      { key: 'log-ticket', name: '🎫︱ticket-logs', type: 'text' },
      { key: 'log-bot', name: '🤖︱bot-logs', type: 'text' },
    ],
  },
];

/** Rolurile care au acces la fiecare tip de vizibilitate. */
export const VISIBILITY_ROLES = {
  public: null, // toata lumea
  member: ['member', 'ally', 'tryout', 'academy', 'sub', 'roster', 'coach', 'creator', 'mod', 'admin', 'coowner', 'owner'],
  team: ['roster', 'sub', 'coach', 'mod', 'admin', 'coowner', 'owner'],
  academy: ['academy', 'tryout', 'coach', 'sub', 'roster', 'mod', 'admin', 'coowner', 'owner'],
  staff: ['mod', 'admin', 'coowner', 'owner'],
};

/** Rolurile de staff care pot scrie in canalele readonly. */
export const STAFF_KEYS = ['mod', 'admin', 'coowner', 'owner'];

/** Textul regulilor postat automat in #reguli. */
export const RULES = [
  { emoji: '1️⃣', title: 'Respect înainte de toate', text: 'Fara jigniri, rasism, homofobie sau atacuri la persoana. Toxicitatea din joc ramane in joc.' },
  { emoji: '2️⃣', title: 'Fără spam & self-promo', text: 'Nu da flood, nu face spam de mentiuni si nu-ti promova serverul/canalul fara acordul staff-ului.' },
  { emoji: '3️⃣', title: 'Folosește canalele corect', text: 'Fiecare canal are un scop. Comenzile de bot in `🤖︱comenzi-bot`, meme-urile in `😂︱meme`.' },
  { emoji: '4️⃣', title: 'Zero NSFW', text: 'Nimic explicit, gore sau content pentru adulti. Ban instant.' },
  { emoji: '5️⃣', title: 'Nu da leak', text: 'Strategiile, draft-urile si discutiile interne NU ies din server.' },
  { emoji: '6️⃣', title: 'Un singur cont', text: 'Fara alt-uri pentru evitat sanctiuni. Se verifica.' },
  { emoji: '7️⃣', title: 'Respectă staff-ul', text: 'Deciziile staff-ului se discuta in ticket, nu in chat public.' },
  { emoji: '8️⃣', title: 'Reprezinți squad-ul', text: 'Cand porti tag-ul BxD, comportamentul tau se reflecta asupra intregii echipe.' },
];

/** Intrebarile din formularul de tryout. */
export const TRYOUT_QUESTIONS = [
  { id: 'ign', label: 'IGN + ID (ex: BxD•Nova (12345678))', style: 'short', max: 60, required: true },
  { id: 'rank', label: 'Rank actual + cel mai mare rank atins', style: 'short', max: 80, required: true },
  { id: 'lanes', label: 'Ce lane joci? (main + secundar)', style: 'short', max: 80, required: true },
  { id: 'heroes', label: 'Top 3 eroi (cu winrate daca stii)', style: 'short', max: 100, required: true },
  { id: 'about', label: 'De ce vrei in Blood×Diamonds? Disponibilitate?', style: 'paragraph', max: 800, required: true },
];
