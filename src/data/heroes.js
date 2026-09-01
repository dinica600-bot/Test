/**
 * Baza de date de eroi Mobile Legends: Bang Bang.
 * Poti adauga eroi noi la fel ca cei de mai jos — comenzile /hero, /counter,
 * /random-hero si /draft citesc automat de aici.
 *
 * lanes: gold | exp | mid | jungle | roam
 */
export const HEROES = [
  // ---------------- TANK ----------------
  { name: 'Akai', role: 'Tank', lanes: ['roam'], diff: 'Ușor', counters: ['Diggie', 'Khufra', 'Wanwan'] },
  { name: 'Atlas', role: 'Tank', lanes: ['roam', 'exp'], diff: 'Mediu', counters: ['Diggie', 'Wanwan', 'Fanny'] },
  { name: 'Barats', role: 'Tank', lanes: ['exp', 'jungle'], diff: 'Mediu', counters: ['Karrie', 'Esmeralda', 'Baxia'] },
  { name: 'Baxia', role: 'Tank', lanes: ['roam', 'jungle'], diff: 'Mediu', counters: ['Karrie', 'Xborg', 'Esmeralda'] },
  { name: 'Belerick', role: 'Tank', lanes: ['exp', 'roam'], diff: 'Ușor', counters: ['Karrie', 'Baxia', 'Xborg'] },
  { name: 'Carmilla', role: 'Tank', lanes: ['roam'], diff: 'Mediu', counters: ['Wanwan', 'Diggie', 'Baxia'] },
  { name: 'Chip', role: 'Tank', lanes: ['roam'], diff: 'Mediu', counters: ['Khufra', 'Wanwan'] },
  { name: 'Edith', role: 'Tank', lanes: ['exp', 'roam'], diff: 'Mediu', counters: ['Karrie', 'Baxia', 'Esmeralda'] },
  { name: 'Franco', role: 'Tank', lanes: ['roam'], diff: 'Greu', counters: ['Diggie', 'Wanwan', 'Kaja'] },
  { name: 'Gatotkaca', role: 'Tank', lanes: ['exp', 'roam'], diff: 'Ușor', counters: ['Karrie', 'Baxia'] },
  { name: 'Gloo', role: 'Tank', lanes: ['exp', 'roam'], diff: 'Mediu', counters: ['Karrie', 'Esmeralda', 'Baxia'] },
  { name: 'Grock', role: 'Tank', lanes: ['exp', 'roam'], diff: 'Mediu', counters: ['Wanwan', 'Diggie'] },
  { name: 'Hylos', role: 'Tank', lanes: ['exp', 'roam'], diff: 'Ușor', counters: ['Karrie', 'Baxia', 'Esmeralda'] },
  { name: 'Johnson', role: 'Tank', lanes: ['roam'], diff: 'Mediu', counters: ['Diggie', 'Khufra', 'Wanwan'] },
  { name: 'Khufra', role: 'Tank', lanes: ['roam'], diff: 'Mediu', counters: ['Wanwan', 'Diggie', 'Beatrix'] },
  { name: 'Lolita', role: 'Tank', lanes: ['roam'], diff: 'Ușor', counters: ['Kagura', 'Esmeralda', 'Wanwan'] },
  { name: 'Minotaur', role: 'Tank', lanes: ['roam'], diff: 'Ușor', counters: ['Diggie', 'Wanwan', 'Khufra'] },
  { name: 'Tigreal', role: 'Tank', lanes: ['roam'], diff: 'Ușor', counters: ['Diggie', 'Wanwan', 'Khufra'] },
  { name: 'Uranus', role: 'Tank', lanes: ['exp'], diff: 'Ușor', counters: ['Baxia', 'Karrie', 'Esmeralda'] },
  { name: 'Hilda', role: 'Tank', lanes: ['exp', 'roam'], diff: 'Ușor', counters: ['Karrie', 'Esmeralda'] },

  // ---------------- FIGHTER ----------------
  { name: 'Alpha', role: 'Fighter', lanes: ['exp'], diff: 'Ușor', counters: ['Esmeralda', 'Uranus', 'Phoveus'] },
  { name: 'Alucard', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Ușor', counters: ['Phoveus', 'Esmeralda', 'Ruby'] },
  { name: 'Argus', role: 'Fighter', lanes: ['exp'], diff: 'Ușor', counters: ['Baxia', 'Belerick', 'Kaja'] },
  { name: 'Arlott', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Mediu', counters: ['Esmeralda', 'Phoveus', 'Uranus'] },
  { name: 'Aulus', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Ușor', counters: ['Kaja', 'Franco', 'Khufra'] },
  { name: 'Badang', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Esmeralda', 'Uranus', 'Wanwan'] },
  { name: 'Balmond', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Ușor', counters: ['Esmeralda', 'Uranus'] },
  { name: 'Bane', role: 'Fighter', lanes: ['exp', 'gold'], diff: 'Ușor', counters: ['Esmeralda', 'Uranus'] },
  { name: 'Chou', role: 'Fighter', lanes: ['exp', 'roam'], diff: 'Greu', counters: ['Phoveus', 'Esmeralda', 'Khufra'] },
  { name: 'Cici', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Baxia', 'Karrie', 'Silvanna'] },
  { name: 'Dyrroth', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Mediu', counters: ['Esmeralda', 'Uranus', 'Phoveus'] },
  { name: 'Fredrinn', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Mediu', counters: ['Esmeralda', 'Karrie', 'Baxia'] },
  { name: 'Freya', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Mediu', counters: ['Phoveus', 'Esmeralda'] },
  { name: 'Guinevere', role: 'Fighter', lanes: ['exp', 'mid'], diff: 'Greu', counters: ['Phoveus', 'Esmeralda', 'Khufra'] },
  { name: 'Jawhead', role: 'Fighter', lanes: ['exp', 'roam', 'jungle'], diff: 'Mediu', counters: ['Esmeralda', 'Phoveus'] },
  { name: 'Julian', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Greu', counters: ['Esmeralda', 'Khufra', 'Uranus'] },
  { name: 'Khaleed', role: 'Fighter', lanes: ['exp'], diff: 'Ușor', counters: ['Esmeralda', 'Phoveus', 'Uranus'] },
  { name: 'Lapu-Lapu', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Esmeralda', 'Uranus', 'Phoveus'] },
  { name: 'Leomord', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Mediu', counters: ['Khufra', 'Esmeralda'] },
  { name: 'Lukas', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Mediu', counters: ['Esmeralda', 'Baxia'] },
  { name: 'Martis', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Ușor', counters: ['Esmeralda', 'Uranus', 'Phoveus'] },
  { name: 'Masha', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Baxia', 'Belerick', 'Esmeralda'] },
  { name: 'Minsitthar', role: 'Fighter', lanes: ['exp', 'roam'], diff: 'Mediu', counters: ['Esmeralda', 'Xborg'] },
  { name: 'Paquito', role: 'Fighter', lanes: ['exp', 'jungle'], diff: 'Greu', counters: ['Esmeralda', 'Phoveus', 'Khufra'] },
  { name: 'Phoveus', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Xborg', 'Yu Zhong', 'Esmeralda'] },
  { name: 'Roger', role: 'Fighter', lanes: ['exp', 'gold', 'jungle'], diff: 'Mediu', counters: ['Esmeralda', 'Khufra'] },
  { name: 'Ruby', role: 'Fighter', lanes: ['exp', 'roam'], diff: 'Mediu', counters: ['Baxia', 'Esmeralda', 'Karrie'] },
  { name: 'Silvanna', role: 'Fighter', lanes: ['exp', 'roam'], diff: 'Mediu', counters: ['Esmeralda', 'Phoveus'] },
  { name: 'Sun', role: 'Fighter', lanes: ['exp'], diff: 'Ușor', counters: ['Xborg', 'Esmeralda', 'Chang\'e'] },
  { name: 'Suyou', role: 'Fighter', lanes: ['jungle', 'exp'], diff: 'Greu', counters: ['Khufra', 'Esmeralda'] },
  { name: 'Terizla', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Esmeralda', 'Baxia', 'Phoveus'] },
  { name: 'Thamuz', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Baxia', 'Esmeralda', 'Karrie'] },
  { name: 'X.Borg', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Esmeralda', 'Baxia', 'Karrie'] },
  { name: 'Yin', role: 'Fighter', lanes: ['jungle', 'exp'], diff: 'Greu', counters: ['Esmeralda', 'Khufra'] },
  { name: 'Yu Zhong', role: 'Fighter', lanes: ['exp'], diff: 'Mediu', counters: ['Baxia', 'Karrie', 'Esmeralda'] },
  { name: 'Zilong', role: 'Fighter', lanes: ['exp', 'gold', 'jungle'], diff: 'Ușor', counters: ['Khufra', 'Franco', 'Phoveus'] },

  // ---------------- ASSASSIN ----------------
  { name: 'Aamon', role: 'Assassin', lanes: ['jungle', 'mid'], diff: 'Greu', counters: ['Khufra', 'Franco', 'Saber'] },
  { name: 'Benedetta', role: 'Assassin', lanes: ['exp', 'jungle'], diff: 'Greu', counters: ['Khufra', 'Phoveus', 'Esmeralda'] },
  { name: 'Fanny', role: 'Assassin', lanes: ['jungle'], diff: 'Foarte greu', counters: ['Khufra', 'Franco', 'Chou', 'Saber'] },
  { name: 'Gusion', role: 'Assassin', lanes: ['jungle', 'mid'], diff: 'Greu', counters: ['Khufra', 'Franco', 'Saber'] },
  { name: 'Hanzo', role: 'Assassin', lanes: ['jungle'], diff: 'Greu', counters: ['Khufra', 'Ling', 'Fanny'] },
  { name: 'Harley', role: 'Assassin', lanes: ['mid', 'jungle'], diff: 'Mediu', counters: ['Khufra', 'Franco', 'Kaja'] },
  { name: 'Hayabusa', role: 'Assassin', lanes: ['jungle'], diff: 'Greu', counters: ['Khufra', 'Franco', 'Saber'] },
  { name: 'Helcurt', role: 'Assassin', lanes: ['jungle'], diff: 'Mediu', counters: ['Khufra', 'Franco'] },
  { name: 'Joy', role: 'Assassin', lanes: ['jungle'], diff: 'Greu', counters: ['Khufra', 'Franco', 'Chou'] },
  { name: 'Karina', role: 'Assassin', lanes: ['jungle', 'mid'], diff: 'Ușor', counters: ['Khufra', 'Franco', 'Esmeralda'] },
  { name: 'Lancelot', role: 'Assassin', lanes: ['jungle'], diff: 'Greu', counters: ['Khufra', 'Franco', 'Chou'] },
  { name: 'Ling', role: 'Assassin', lanes: ['jungle'], diff: 'Foarte greu', counters: ['Khufra', 'Franco', 'Chou', 'Kaja'] },
  { name: 'Natalia', role: 'Assassin', lanes: ['jungle'], diff: 'Greu', counters: ['Khufra', 'Franco', 'Rafaela'] },
  { name: 'Nolan', role: 'Assassin', lanes: ['jungle'], diff: 'Greu', counters: ['Khufra', 'Franco'] },
  { name: 'Saber', role: 'Assassin', lanes: ['jungle'], diff: 'Ușor', counters: ['Khufra', 'Diggie', 'Uranus'] },
  { name: 'Selena', role: 'Assassin', lanes: ['roam', 'mid'], diff: 'Greu', counters: ['Diggie', 'Wanwan', 'Kaja'] },

  // ---------------- MAGE ----------------
  { name: 'Alice', role: 'Mage', lanes: ['exp', 'mid'], diff: 'Mediu', counters: ['Esmeralda', 'Khufra', 'Baxia'] },
  { name: 'Aurora', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Wanwan', 'Diggie', 'Fanny'] },
  { name: 'Cecilion', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Lancelot'] },
  { name: 'Chang\'e', role: 'Mage', lanes: ['mid'], diff: 'Ușor', counters: ['Fanny', 'Ling', 'Hayabusa'] },
  { name: 'Cyclops', role: 'Mage', lanes: ['mid', 'jungle'], diff: 'Ușor', counters: ['Fanny', 'Ling', 'Diggie'] },
  { name: 'Esmeralda', role: 'Mage', lanes: ['exp', 'jungle'], diff: 'Mediu', counters: ['Baxia', 'Xborg', 'Karrie', 'Dyrroth'] },
  { name: 'Eudora', role: 'Mage', lanes: ['mid'], diff: 'Ușor', counters: ['Diggie', 'Fanny', 'Ling'] },
  { name: 'Faramis', role: 'Mage', lanes: ['roam', 'mid'], diff: 'Mediu', counters: ['Khufra', 'Wanwan'] },
  { name: 'Gord', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Hayabusa'] },
  { name: 'Harith', role: 'Mage', lanes: ['mid', 'jungle'], diff: 'Greu', counters: ['Khufra', 'Franco', 'Saber'] },
  { name: 'Kadita', role: 'Mage', lanes: ['mid', 'roam'], diff: 'Greu', counters: ['Diggie', 'Wanwan', 'Khufra'] },
  { name: 'Kagura', role: 'Mage', lanes: ['mid'], diff: 'Greu', counters: ['Khufra', 'Fanny', 'Ling'] },
  { name: 'Lunox', role: 'Mage', lanes: ['mid'], diff: 'Greu', counters: ['Khufra', 'Fanny', 'Saber'] },
  { name: 'Luo Yi', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Diggie'] },
  { name: 'Lylia', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Natalia'] },
  { name: 'Nana', role: 'Mage', lanes: ['roam', 'mid'], diff: 'Ușor', counters: ['Diggie', 'Wanwan', 'Fanny'] },
  { name: 'Novaria', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Ling', 'Fanny', 'Natalia'] },
  { name: 'Odette', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Khufra', 'Fanny', 'Diggie'] },
  { name: 'Pharsa', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Natalia'] },
  { name: 'Vale', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Diggie', 'Fanny', 'Ling'] },
  { name: 'Valentina', role: 'Mage', lanes: ['mid', 'roam'], diff: 'Greu', counters: ['Khufra', 'Fanny', 'Wanwan'] },
  { name: 'Vexana', role: 'Mage', lanes: ['mid', 'roam'], diff: 'Mediu', counters: ['Diggie', 'Wanwan', 'Fanny'] },
  { name: 'Xavier', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Natalia'] },
  { name: 'Yve', role: 'Mage', lanes: ['mid'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Zhask', role: 'Mage', lanes: ['mid', 'exp'], diff: 'Ușor', counters: ['Fanny', 'Ling', 'Wanwan'] },
  { name: 'Zhuxin', role: 'Mage', lanes: ['mid', 'roam'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Diggie'] },

  // ---------------- MARKSMAN ----------------
  { name: 'Beatrix', role: 'Marksman', lanes: ['gold'], diff: 'Greu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Brody', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Franco'] },
  { name: 'Bruno', role: 'Marksman', lanes: ['gold'], diff: 'Ușor', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Claude', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Khufra', 'Franco', 'Ling'] },
  { name: 'Clint', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Franco'] },
  { name: 'Granger', role: 'Marksman', lanes: ['gold', 'jungle'], diff: 'Mediu', counters: ['Khufra', 'Fanny', 'Ling'] },
  { name: 'Hanabi', role: 'Marksman', lanes: ['gold'], diff: 'Ușor', counters: ['Ling', 'Fanny', 'Natalia'] },
  { name: 'Irithel', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Ixia', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Franco'] },
  { name: 'Karrie', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Kimmy', role: 'Marksman', lanes: ['gold', 'mid'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Layla', role: 'Marksman', lanes: ['gold'], diff: 'Ușor', counters: ['Fanny', 'Ling', 'Natalia'] },
  { name: 'Lesley', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Melissa', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Ling', 'Fanny', 'Xavier'] },
  { name: 'Miya', role: 'Marksman', lanes: ['gold'], diff: 'Ușor', counters: ['Fanny', 'Ling', 'Natalia'] },
  { name: 'Moskov', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Natan', role: 'Marksman', lanes: ['gold'], diff: 'Greu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Popol and Kupa', role: 'Marksman', lanes: ['gold'], diff: 'Mediu', counters: ['Fanny', 'Ling', 'Khufra'] },
  { name: 'Wanwan', role: 'Marksman', lanes: ['gold'], diff: 'Greu', counters: ['Khufra', 'Franco', 'Ling'] },
  { name: 'Yi Sun-shin', role: 'Marksman', lanes: ['jungle', 'gold'], diff: 'Greu', counters: ['Khufra', 'Franco'] },

  // ---------------- SUPPORT ----------------
  { name: 'Angela', role: 'Support', lanes: ['roam'], diff: 'Mediu', counters: ['Khufra', 'Franco', 'Wanwan'] },
  { name: 'Diggie', role: 'Support', lanes: ['roam'], diff: 'Mediu', counters: ['Ling', 'Fanny', 'Natalia'] },
  { name: 'Estes', role: 'Support', lanes: ['roam'], diff: 'Ușor', counters: ['Baxia', 'Xborg', 'Ling'] },
  { name: 'Floryn', role: 'Support', lanes: ['roam'], diff: 'Ușor', counters: ['Baxia', 'Xborg', 'Ling'] },
  { name: 'Kaja', role: 'Support', lanes: ['roam', 'exp'], diff: 'Mediu', counters: ['Diggie', 'Wanwan', 'Khufra'] },
  { name: 'Mathilda', role: 'Support', lanes: ['roam', 'jungle'], diff: 'Mediu', counters: ['Khufra', 'Franco'] },
  { name: 'Rafaela', role: 'Support', lanes: ['roam'], diff: 'Ușor', counters: ['Baxia', 'Xborg', 'Ling'] },
];

/** Aliasuri ca sa gaseasca eroul si daca scrii scurt. */
export const ALIASES = {
  ysc: 'Yi Sun-shin', yss: 'Yi Sun-shin', xborg: 'X.Borg', 'x borg': 'X.Borg',
  lapu: 'Lapu-Lapu', popol: 'Popol and Kupa', chang: 'Chang\'e', yz: 'Yu Zhong',
  esme: 'Esmeralda', lance: 'Lancelot', haya: 'Hayabusa', gato: 'Gatotkaca',
  mino: 'Minotaur', tigi: 'Tigreal', bene: 'Benedetta', pharsa: 'Pharsa',
};

export const ROLE_EMOJI = {
  Tank: '🛡️', Fighter: '⚔️', Assassin: '🗡️', Mage: '🔮', Marksman: '🏹', Support: '💚',
};

export const LANE_LABEL = {
  gold: '🥇 Gold Lane', exp: '🛡️ EXP Lane', mid: '🔮 Mid Lane',
  jungle: '🌲 Jungle', roam: '🧿 Roam',
};

/** Build-uri generice pe rol — punct de plecare, se adapteaza la meci. */
export const BUILD_TEMPLATES = {
  Marksman: {
    emblem: 'Marksman / Assassin — Weapon Master, Quantum Charge sau Doom Blade',
    spell: 'Flicker, Inspire sau Purify',
    items: ['Swift Boots', 'Windtalker / Corrosion Scythe', 'Berserker\'s Fury', 'Scarlet Phantom', 'Endless Battle / Malefic Roar', 'Immortality / Blade of Despair'],
    tip: 'Positioning > damage. Stai in spatele tank-ului si loveste tinta cea mai apropiata sigura.',
  },
  Mage: {
    emblem: 'Mage — Lethal Ignition, Impure Rage sau Bargain Hunter',
    spell: 'Flicker sau Flameshot',
    items: ['Magic Shoes / Arcane Boots', 'Enchanted Talisman / Clock of Destiny', 'Lightning Truncheon', 'Holy Crystal', 'Divine Glaive', 'Immortality / Winter Truncheon'],
    tip: 'Curata wave-ul rapid, roteste pe lane-uri si ai grija la jungler la 1-2 minute dupa respawn-ul buff-urilor.',
  },
  Assassin: {
    emblem: 'Assassin — Quantum Charge sau Killing Spree',
    spell: 'Retribution (jungle) sau Flicker',
    items: ['Warrior/Tough Boots', 'Hunter Strike', 'Blade of Despair', 'Endless Battle', 'Malefic Roar', 'Immortality'],
    tip: 'Nu incepe fight-ul. Intra al doilea, dupa ce tank-ul a folosit CC-ul.',
  },
  Fighter: {
    emblem: 'Fighter — Festival of Blood, Brave Smite sau Concussive Blast',
    spell: 'Petrify, Flicker sau Execute',
    items: ['Warrior/Tough Boots', 'Bloodlust Axe', 'Hunter Strike', 'Blade of Despair / Oracle', 'Queen\'s Wings', 'Immortality'],
    tip: 'Split-push cand nu e obiectiv pe harta si forteaza rotatii pe partea ta.',
  },
  Tank: {
    emblem: 'Tank — Concussive Blast, Brave Smite sau Vengeance',
    spell: 'Flicker sau Vengeance',
    items: ['Tough/Warrior Boots', 'Dominance Ice', 'Athena\'s Shield', 'Antique Cuirass', 'Oracle / Guardian Helmet', 'Immortality'],
    tip: 'Tu incepi fight-ul si tu tii vision-ul. Cumpara mereu 1-2 itemi in functie de damage-ul lor.',
  },
  Support: {
    emblem: 'Support — Focusing Mark, Pull Yourself Together sau Vengeance',
    spell: 'Flicker sau Vengeance',
    items: ['Tough/Magic Boots', 'Dominance Ice / Fleeting Time', 'Oracle', 'Athena\'s Shield', 'Antique Cuirass', 'Immortality'],
    tip: 'Stai langa carry, tine-l in viata si da vision inainte de obiective.',
  },
};

export function findHero(query) {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  const alias = ALIASES[q];
  const target = (alias ?? q).toLowerCase();
  return (
    HEROES.find((h) => h.name.toLowerCase() === target) ||
    HEROES.find((h) => h.name.toLowerCase().startsWith(target)) ||
    HEROES.find((h) => h.name.toLowerCase().includes(target)) ||
    null
  );
}

export function heroesBy({ role, lane } = {}) {
  return HEROES.filter(
    (h) => (!role || h.role === role) && (!lane || h.lanes.includes(lane)),
  );
}

/** Cine il contreaza pe eroul dat (inversul listei de counters). */
export function counteredBy(hero) {
  return HEROES.filter((h) => h.counters?.some((c) => c.toLowerCase() === hero.name.toLowerCase()))
    .map((h) => h.name);
}
