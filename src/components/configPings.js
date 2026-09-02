import {
  ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} from 'discord.js';
import { embeds, fail } from '../lib/embeds.js';
import { settings } from '../lib/db.js';
import { ROLES } from '../config/blueprint.js';
import { getRole } from '../lib/guildMap.js';
import { isStaff } from '../lib/permissions.js';
import { COLORS } from '../config/config.js';

const PING_ROLES = ROLES.filter((r) => r.group === 'ping');

/** Rolurile de notificare date automat pe serverul asta. */
export function autoPingKeys(guildId) {
  return settings.get(guildId, 'autoPings', []);
}

/** Le pune pe membru. Returneaza cate a primit. */
export async function giveAutoPings(member) {
  const keys = autoPingKeys(member.guild.id);
  if (!keys.length) return 0;

  const roles = keys
    .map((key) => getRole(member.guild, key))
    .filter((role) => role && !member.roles.cache.has(role.id));
  if (!roles.length) return 0;

  try {
    await member.roles.add(roles, 'Notificări date automat');
    return roles.length;
  } catch {
    return 0;
  }
}

/** Meniul din /config notificari. */
export function pingConfigPanel(guild) {
  const current = autoPingKeys(guild.id);

  const embed = embeds
    .custom(COLORS.info)
    .setTitle('🔔 Notificări date automat')
    .setDescription(
      'Alege ce roluri de notificare primesc membrii **automat**, fără să și le mai ia singuri din `🎭︱self-roles`.\n\n' +
      'Se dau la verificare (sau la intrare, dacă nu folosești verificarea). ' +
      'Oricine le poate scoate oricând din self-roles.',
    )
    .addFields({
      name: 'Acum se dau automat',
      value: current.length
        ? current.map((key) => `• ${PING_ROLES.find((r) => r.key === key)?.name ?? key}`).join('\n')
        : '_niciunul_',
    });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('cfgping:set')
    .setPlaceholder('Alege rolurile date automat...')
    .setMinValues(0)
    .setMaxValues(PING_ROLES.length)
    .addOptions(PING_ROLES.map((r) => ({
      label: r.name.replace(/^\S+\s/, ''),
      value: r.key,
      emoji: r.name.split(' ')[0],
      default: current.includes(r.key),
    })));

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('cfgping:all').setLabel('Toate').setEmoji('✅').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('cfgping:none').setLabel('Niciunul').setEmoji('🚫').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('cfgping:apply').setLabel('Dă-le și membrilor actuali').setEmoji('👥').setStyle(ButtonStyle.Primary),
  );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu), buttons],
    flags: MessageFlags.Ephemeral,
  };
}

export async function handlePingConfig(interaction) {
  if (!isStaff(interaction.member)) return fail(interaction, 'Doar staff-ul poate schimba setarea asta.');
  const action = interaction.customId.split(':')[1];
  const gid = interaction.guild.id;

  if (action === 'set') {
    settings.set(gid, 'autoPings', interaction.values);
    return interaction.update(pingConfigPanel(interaction.guild));
  }

  if (action === 'all') {
    settings.set(gid, 'autoPings', PING_ROLES.map((r) => r.key));
    return interaction.update(pingConfigPanel(interaction.guild));
  }

  if (action === 'none') {
    settings.set(gid, 'autoPings', []);
    return interaction.update(pingConfigPanel(interaction.guild));
  }

  // aplicam pe membrii care sunt deja pe server
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const keys = autoPingKeys(gid);
  if (!keys.length) {
    return interaction.editReply({ embeds: [embeds.warn('Nu ai ales niciun rol de dat automat.')] });
  }

  await interaction.guild.members.fetch();
  let changed = 0;
  for (const member of interaction.guild.members.cache.values()) {
    if (member.user.bot) continue;
    if (await giveAutoPings(member)) changed += 1;
  }

  return interaction.editReply({
    embeds: [embeds.success(`Am dat rolurile la **${changed}** membri.`)],
  });
}
