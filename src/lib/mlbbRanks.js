/**
 * Sistemul de rank din Mobile Legends — folosit la profil, la rolurile de
 * rank si la afisarea stelelor.
 *
 * Warrior → Legend au diviziuni si stele.
 * De la Mythic in sus se merge pe puncte:
 *   0-24 Mythic • 25-49 Mythical Honor • 50-99 Mythical Glory • 100+ Immortal
 */
import { e } from './emojis.js';

export const RANKS = [
  { key: 'rank_warrior', name: 'Warrior', emoji: '⚔️', divisions: 3, stars: 3, color: 0xa8763e },
  { key: 'rank_elite', name: 'Elite', emoji: '🔰', divisions: 3, stars: 4, color: 0x6baa75 },
  { key: 'rank_master', name: 'Master', emoji: '🎖️', divisions: 4, stars: 4, color: 0x3fa7d6 },
  { key: 'rank_gm', name: 'Grandmaster', emoji: '🏅', divisions: 5, stars: 5, color: 0x7b68ee },
  { key: 'rank_epic', name: 'Epic', emoji: '💜', divisions: 5, stars: 5, color: 0xc77dff },
  { key: 'rank_legend', name: 'Legend', emoji: '🔥', divisions: 5, stars: 5, color: 0xff6d00 },
  { key: 'rank_mythic', name: 'Mythic', emoji: '🌌', points: [0, 24], color: 0xff206e },
  { key: 'rank_honor', name: 'Mythical Honor', emoji: '✨', points: [25, 49], color: 0xffb703 },
  { key: 'rank_glory', name: 'Mythical Glory', emoji: '👑', points: [50, 99], color: 0xff4d6d },
  { key: 'rank_immortal', name: 'Mythical Immortal', emoji: '💫', points: [100, Infinity], color: 0xf72585 },
];

export const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

/** Cheia emoji-ului personalizat pentru un rank (rank_glory -> glory). */
export function rankEmojiKey(rank) {
  return rank?.key?.replace('rank_', '') ?? null;
}

export function findRank(name) {
  if (!name) return null;
  const q = String(name).toLowerCase();
  return RANKS.find((r) => r.name.toLowerCase() === q) ?? RANKS.find((r) => r.key === q) ?? null;
}

/** Din puncte deducem singuri tier-ul de Mythic. */
export function rankFromPoints(points) {
  if (!Number.isFinite(points)) return null;
  return RANKS.find((r) => r.points && points >= r.points[0] && points <= r.points[1]) ?? null;
}

export function renderStars(stars, max) {
  const filled = Math.max(0, Math.min(stars ?? 0, max));
  return `${'★'.repeat(filled)}${'☆'.repeat(max - filled)}`;
}

/**
 * Textul afisat pe profil, ex:
 *   "<emblema> Legend II  ★★★☆☆"
 *   "<emblema> Mythical Glory — 63 puncte"
 *
 * Daca primeste `guild` si emblemele sunt incarcate cu /decor emoji,
 * foloseste emblema desenata; altfel ramane emoji-ul unicode.
 */
export function formatRank(profile, guild = null) {
  const rank = findRank(profile?.rankTier);
  if (!rank) return null;

  const badge = guild ? e(guild, rankEmojiKey(rank)) || rank.emoji : rank.emoji;

  if (rank.points) {
    const points = Number.isFinite(profile.points) ? profile.points : null;
    return `${badge} **${rank.name}**${points !== null ? ` — **${points}** puncte` : ''}`;
  }

  const division = profile.division ? ` ${ROMAN[profile.division] ?? profile.division}` : '';
  const stars = Number.isFinite(profile.stars) ? `  ${renderStars(profile.stars, rank.stars)}` : '';
  return `${badge} **${rank.name}${division}**${stars}`;
}

/** Optiunile pentru comenzile slash. */
export function rankChoices() {
  return RANKS.map((r) => ({ name: `${r.emoji} ${r.name}`, value: r.name }));
}

/** Cate diviziuni/stele are rank-ul ales (pentru validare). */
export function rankLimits(name) {
  const rank = findRank(name);
  if (!rank || rank.points) return null;
  return { divisions: rank.divisions, stars: rank.stars };
}
