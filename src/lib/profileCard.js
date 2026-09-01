import { embeds, ts } from './embeds.js';
import { findRank, formatRank } from './mlbbRanks.js';
import { getUser, rankOf } from './leveling.js';
import { getRole } from './guildMap.js';
import { COLORS, config } from '../config/config.js';
import { ROLE_EMOJI, findHero } from '../data/heroes.js';
import { e } from './emojis.js';

/** Rolurile care apar ca insigna pe fisa, in ordinea importantei. */
const TEAM_BADGES = [
  { key: 'owner', label: 'Owner' },
  { key: 'coowner', label: 'Co-Owner' },
  { key: 'admin', label: 'Admin' },
  { key: 'mod', label: 'Moderator' },
  { key: 'coach', label: 'Coach' },
  { key: 'creator', label: 'Content Creator' },
  { key: 'roster', label: 'Roster Principal' },
  { key: 'sub', label: 'Rezervă' },
  { key: 'academy', label: 'Academy' },
  { key: 'tryout', label: 'Tryout' },
];

function heroLine(name) {
  const hero = findHero(name);
  return hero ? `${ROLE_EMOJI[hero.role] ?? '•'} ${hero.name}` : name;
}

/** Cardul de profil — arata ca o fisa de jucator, nu ca un embed banal. */
export function profileCard(user, member, profile, guildId) {
  const rank = findRank(profile.rankTier);
  const level = getUser(guildId, user.id);
  const position = rankOf(guildId, user.id);

  const badges = [];
  if (profile.verifiedId) badges.push('✅ ID verificat');
  if (profile.verifiedStats) badges.push('🛡️ Stats confirmate de staff');
  if (member) {
    for (const { key, label } of TEAM_BADGES) {
      const role = getRole(member.guild, key);
      if (role && member.roles.cache.has(role.id)) badges.push(`${e(member.guild, key)} ${label}`);
    }
  }

  const idLine = profile.gameId
    ? `\`${profile.gameId}\`${profile.zoneId ? ` (\`${profile.zoneId}\`)` : ''}`
    : '_nesetat_';

  const mains = [profile.main1, profile.main2, profile.main3].filter(Boolean);

  const embed = embeds
    .custom(rank?.color ?? COLORS.diamond)
    .setAuthor({
      name: profile.ign ? `${profile.ign}` : user.username,
      iconURL: user.displayAvatarURL(),
    })
    .setTitle(`🎮 Profil Mobile Legends`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setDescription(
      `${user}\n${badges.length ? badges.join('  ') : '`⚠️ cont neverificat`'}`,
    )
    .addFields(
      { name: '🆔 User ID (Zone)', value: idLine, inline: true },
      { name: '🏅 Rank', value: formatRank(profile, member?.guild) ?? '_nesetat_', inline: true },
      {
        name: '📊 Winrate',
        value: Number.isFinite(profile.winrate)
          ? `**${profile.winrate}%**${Number.isFinite(profile.matches) ? ` din ${profile.matches} meciuri` : ''}`
          : '_nesetat_',
        inline: true,
      },
      { name: '📍 Lane', value: profile.lane ?? '_nesetat_', inline: true },
      { name: '🏷️ Squad', value: profile.squad ?? config.squadName, inline: true },
      { name: '⭐ Main', value: mains.length ? mains.map(heroLine).join('\n') : '_nesetat_', inline: true },
      {
        name: '💠 Pe server',
        value:
          `Nivel **${level.level}** • ${position.of ? `locul **#${position.position}** din ${position.of}` : 'încă neclasat'}\n` +
          `Membru din ${member?.joinedAt ? ts(member.joinedAt, 'D') : '—'}`,
      },
    );

  if (profile.verifiedAt) {
    embed.setFooter({ text: `${config.squadName} • verificat ${new Date(profile.verifiedAt).toLocaleDateString('ro-RO')}` });
  }

  return embed;
}
