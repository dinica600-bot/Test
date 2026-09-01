import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { embeds, fail } from '../lib/embeds.js';
import { SELF_ROLE_GROUPS, ROLES } from '../config/blueprint.js';
import { getRole } from '../lib/guildMap.js';
import { COLORS } from '../config/config.js';

export function selfRolePanels(guild) {
  return SELF_ROLE_GROUPS.map((group) => {
    const options = group.roles
      .map((key) => ({ def: ROLES.find((r) => r.key === key), role: getRole(guild, key) }))
      .filter((r) => r.role)
      .map((r) => ({
        label: r.def.name.replace(/^\S+\s/, ''),
        value: r.def.key,
        emoji: r.def.name.split(' ')[0],
      }));

    const embed = embeds
      .custom(COLORS.diamond)
      .setTitle(`${group.emoji} ${group.label}`)
      .setDescription(
        `${group.description}\n\n` +
        (group.exclusive ? '_Poti avea un singur rol din grupul asta._' : '_Poti alege mai multe. Selecteaza din nou ca sa scoti un rol._'),
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`selfrole:${group.id}`)
      .setPlaceholder(`Alege ${group.label.toLowerCase()}...`)
      .setMinValues(0)
      .setMaxValues(group.exclusive ? 1 : Math.max(1, Math.min(group.max ?? options.length, options.length)))
      .addOptions(options.length ? options : [{ label: 'Ruleaza /setup server intai', value: 'none' }]);

    return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
  });
}

export async function handleSelfRole(interaction) {
  const groupId = interaction.customId.split(':')[1];
  const group = SELF_ROLE_GROUPS.find((g) => g.id === groupId);
  if (!group) return fail(interaction, 'Grupul de roluri nu mai exista.');

  const chosen = interaction.values.filter((v) => v !== 'none');
  const groupRoles = group.roles.map((key) => getRole(interaction.guild, key)).filter(Boolean);
  const added = [];
  const removed = [];

  try {
    if (group.exclusive) {
      const keep = chosen[0] ? getRole(interaction.guild, chosen[0]) : null;
      for (const role of groupRoles) {
        const has = interaction.member.roles.cache.has(role.id);
        if (keep && role.id === keep.id) {
          if (!has) { await interaction.member.roles.add(role); added.push(role); }
        } else if (has) {
          await interaction.member.roles.remove(role); removed.push(role);
        }
      }
    } else {
      for (const role of groupRoles) {
        const wanted = chosen.some((key) => getRole(interaction.guild, key)?.id === role.id);
        const has = interaction.member.roles.cache.has(role.id);
        if (wanted && !has) { await interaction.member.roles.add(role); added.push(role); }
        if (!wanted && has) { await interaction.member.roles.remove(role); removed.push(role); }
      }
    }
  } catch {
    return fail(interaction, 'Nu am putut modifica rolurile. Rolul botului trebuie sa fie deasupra lor.');
  }

  const parts = [];
  if (added.length) parts.push(`**Adăugat:** ${added.join(', ')}`);
  if (removed.length) parts.push(`**Scos:** ${removed.join(', ')}`);
  return interaction.reply({
    embeds: [embeds.success(parts.join('\n') || 'Nimic de schimbat.')],
    flags: 64,
  });
}
