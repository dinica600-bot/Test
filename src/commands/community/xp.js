import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { addXp, getUser, handleLevelUp } from '../../lib/leveling.js';
import { db } from '../../lib/db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('xp')
    .setDescription('Administrează XP-ul membrilor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('adauga')
      .setDescription('Dă XP unui membru')
      .addUserOption((o) => o.setName('membru').setDescription('Cui').setRequired(true))
      .addIntegerOption((o) => o.setName('cantitate').setDescription('Cât XP').setRequired(true).setMinValue(1).setMaxValue(100000)))
    .addSubcommand((s) => s
      .setName('scoate')
      .setDescription('Ia XP de la un membru')
      .addUserOption((o) => o.setName('membru').setDescription('Cui').setRequired(true))
      .addIntegerOption((o) => o.setName('cantitate').setDescription('Cât XP').setRequired(true).setMinValue(1)))
    .addSubcommand((s) => s
      .setName('reseteaza')
      .setDescription('Resetează XP-ul unui membru')
      .addUserOption((o) => o.setName('membru').setDescription('Cui').setRequired(true))),

  staffOnly: true,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('membru');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const path = `${interaction.guild.id}.${user.id}`;

    if (sub === 'reseteaza') {
      db.set('levels', path, { xp: 0, level: 0, messages: 0, voice: 0 });
      return interaction.reply({ embeds: [embeds.success(`Am resetat XP-ul lui **${user.tag}**.`)], flags: MessageFlags.Ephemeral });
    }

    const amount = interaction.options.getInteger('cantitate');
    if (sub === 'adauga') {
      const { leveledUp, level } = addXp(interaction.guild.id, user.id, amount);
      if (leveledUp && member) await handleLevelUp(member, level).catch(() => {});
      return interaction.reply({ embeds: [embeds.success(`Am dat **${amount} XP** lui **${user.tag}**.`)] });
    }

    const data = getUser(interaction.guild.id, user.id);
    data.xp = Math.max(0, data.xp - amount);
    db.set('levels', path, data);
    return interaction.reply({ embeds: [embeds.success(`Am scos **${amount} XP** de la **${user.tag}**.`)] });
  },
};
