import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { embeds, fail, ok } from '../lib/embeds.js';
import { getRole } from '../lib/guildMap.js';
import { RULES } from '../config/blueprint.js';
import { COLORS, config } from '../config/config.js';
import { log } from '../lib/logger.js';

export function verifyPanel() {
  const embed = embeds
    .custom(COLORS.primary)
    .setTitle('✅ Verificare — intră în Blood×Diamonds')
    .setDescription(
      'Ca sa vezi tot serverul trebuie sa te verifici. Dureaza 2 secunde.\n\n' +
      '**Apasand butonul de mai jos confirmi ca:**\n' +
      '• ai citit si accepti regulile din `📜︱reguli`\n' +
      '• nu esti bot si nu folosesti cont alternativ\n' +
      '• intelegi ca sanctiunile se discuta doar in ticket\n\n' +
      '_Dupa verificare treci prin `🎭︱self-roles` si iti alegi lane-ul si rank-ul._',
    )
    .setFooter({ text: `${config.squadName} • verificare` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('verify:accept').setLabel('Accept regulile').setEmoji('🩸').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('verify:rules').setLabel('Vezi regulile').setEmoji('📜').setStyle(ButtonStyle.Secondary),
  );
  return { embeds: [embed], components: [row] };
}

export function rulesEmbed() {
  return embeds
    .custom(COLORS.primary)
    .setTitle('📜 Regulile serverului Blood×Diamonds')
    .setDescription('Sunt simple. Cine nu le respecta pleaca — fara discutii lungi.')
    .addFields(RULES.map((r) => ({ name: `${r.emoji} ${r.title}`, value: r.text })))
    .setFooter({ text: 'Regulile se aplica si in voice, si in DM-uri intre membri.' });
}

export async function handleVerify(interaction) {
  if (interaction.customId === 'verify:rules') {
    return interaction.reply({ embeds: [rulesEmbed()], flags: 64 });
  }
  const role = getRole(interaction.guild, 'member');
  if (!role) return fail(interaction, 'Rolul de membru nu exista. Roaga un admin sa ruleze `/setup server`.');
  if (interaction.member.roles.cache.has(role.id)) {
    return fail(interaction, 'Esti deja verificat. Distractie placuta! 🩸');
  }
  try {
    await interaction.member.roles.add(role, 'Verificare');
  } catch {
    return fail(interaction, 'Nu am putut sa-ti dau rolul. Rolul botului trebuie sa fie mai sus decat rolul de membru.');
  }
  await log(interaction.guild, 'join', embeds.custom(COLORS.success)
    .setTitle('✅ Membru verificat')
    .setDescription(`${interaction.user} \`${interaction.user.id}\``));
  return ok(interaction, 'Verificat! Ai acces la tot serverul. Treci prin `🎭︱self-roles` si alege-ti lane-ul. 🩸');
}
