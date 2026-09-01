import { getChannel } from './guildMap.js';
import { CATEGORIES } from '../config/blueprint.js';

const STAT_CHANNELS = CATEGORIES.find((c) => c.key === 'stats')?.channels ?? [];

/** Redenumeste canalele de voice din categoria STATISTICI cu numerele curente. */
export async function updateStats(guild) {
  const members = guild.memberCount;
  const online = guild.members.cache.filter(
    (m) => !m.user.bot && m.presence && m.presence.status !== 'offline',
  ).size;
  const boosts = guild.premiumSubscriptionCount ?? 0;

  const values = { members, online, boosts };
  for (const def of STAT_CHANNELS) {
    const channel = getChannel(guild, def.key);
    if (!channel) continue;
    const label = def.name.replace(/:\s*\d+$/, `: ${values[def.stat] ?? 0}`);
    if (channel.name !== label) await channel.setName(label).catch(() => {});
  }
}
