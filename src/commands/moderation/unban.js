import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { modLog } from '../../lib/logger.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Ridică banul unui utilizator')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addStringOption((o) => o.setName('id').setDescription('ID-ul utilizatorului').setRequired(true).setAutocomplete(true))
    .addStringOption((o) => o.setName('motiv').setDescription('De ce')),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const bans = await interaction.guild.bans.fetch().catch(() => null);
    if (!bans) return interaction.respond([]);
    const choices = [...bans.values()]
      .filter((b) => b.user.tag.toLowerCase().includes(focused) || b.user.id.includes(focused))
      .slice(0, 25)
      .map((b) => ({ name: `${b.user.tag} (${b.user.id})`.slice(0, 100), value: b.user.id }));
    return interaction.respond(choices);
  },

  async execute(interaction) {
    const id = interaction.options.getString('id');
    const reason = interaction.options.getString('motiv') ?? 'Fără motiv specificat';
    try {
      const ban = await interaction.guild.bans.fetch(id);
      await interaction.guild.bans.remove(id, `${reason} • de ${interaction.user.tag}`);
      await modLog(interaction.guild, {
        action: 'Unban', target: ban.user, moderator: interaction.user, reason, color: COLORS.success,
      });
      return interaction.reply({ embeds: [embeds.success(`**${ban.user.tag}** nu mai e banat.`)] });
    } catch {
      return interaction.reply({ embeds: [embeds.error('Nu am gasit niciun ban pentru ID-ul asta.')], flags: MessageFlags.Ephemeral });
    }
  },
};
