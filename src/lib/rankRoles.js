import { RANKS, findRank } from './mlbbRanks.js';
import { getRole } from './guildMap.js';

/**
 * Pune rolul de rank corespunzator si le scoate pe celelalte
 * (poti avea un singur rank la un moment dat).
 */
export async function syncRankRole(member, rankName) {
  const target = findRank(rankName);
  if (!member || !target) return null;
  const wanted = getRole(member.guild, target.key);
  try {
    const others = RANKS.filter((r) => r.key !== target.key)
      .map((r) => getRole(member.guild, r.key))
      .filter((r) => r && member.roles.cache.has(r.id));
    if (others.length) await member.roles.remove(others, 'Actualizare rank MLBB');
    if (wanted && !member.roles.cache.has(wanted.id)) await member.roles.add(wanted, 'Actualizare rank MLBB');
    return wanted;
  } catch {
    return null;
  }
}
