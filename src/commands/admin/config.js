import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { settings } from '../../lib/db.js';
import { COLORS } from '../../config/config.js';

const LOG_TYPES = [
  { name: 'Intrări / ieșiri', value: 'join' },
  { name: 'Mesaje (șterse/editate)', value: 'message' },
  { name: 'Moderare', value: 'mod' },
  { name: 'Voice', value: 'voice' },
  { name: 'Tickete', value: 'ticket' },
  { name: 'Erori bot', value: 'bot' },
];

const AUTOMOD_KEYS = [
  { name: 'Tot automod-ul', value: 'enabled' },
  { name: 'Blochează invite-uri', value: 'invites' },
  { name: 'Blochează link-uri', value: 'links' },
  { name: 'Filtru limbaj', value: 'profanity' },
  { name: 'Anti mass-mention', value: 'mentions' },
  { name: 'Anti caps-lock', value: 'caps' },
  { name: 'Anti spam', value: 'spam' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Setările botului pe serverul ăsta')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) => s.setName('vezi').setDescription('Arată toate setările curente'))
    .addSubcommand((s) => s
      .setName('log')
      .setDescription('Setează canalul pentru un tip de log')
      .addStringOption((o) => o.setName('tip').setDescription('Ce fel de log').setRequired(true).addChoices(...LOG_TYPES))
      .addChannelOption((o) => o.setName('canal').setDescription('Canalul').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand((s) => s
      .setName('automod')
      .setDescription('Pornește sau oprește un filtru')
      .addStringOption((o) => o.setName('filtru').setDescription('Filtrul').setRequired(true).addChoices(...AUTOMOD_KEYS))
      .addBooleanOption((o) => o.setName('activ').setDescription('Pornit / oprit').setRequired(true)))
    .addSubcommand((s) => s
      .setName('cuvinte')
      .setDescription('Setează lista de cuvinte interzise (separate prin virgulă)')
      .addStringOption((o) => o.setName('lista').setDescription('cuvant1, cuvant2, ...').setRequired(true)))
    .addSubcommand((s) => s
      .setName('nivele')
      .setDescription('Reglează sistemul de XP')
      .addBooleanOption((o) => o.setName('activ').setDescription('Pornește/oprește XP-ul'))
      .addBooleanOption((o) => o.setName('anunturi').setDescription('Anunță level-up în chat')))
    .addSubcommand((s) => s
      .setName('autorole')
      .setDescription('Rol dat automat la intrare (lasă gol ca să-l ștergi)')
      .addRoleOption((o) => o.setName('rol').setDescription('Rolul'))),

  staffOnly: true,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'vezi') {
      const all = settings.all(gid);
      const logs = LOG_TYPES.map((t) => `${t.name}: ${all.logs?.[t.value] ? `<#${all.logs[t.value]}>` : '`nesetat`'}`).join('\n');
      const automod = AUTOMOD_KEYS.map((k) => {
        const def = k.value === 'links' ? false : true;
        const value = all.automod?.[k.value] ?? def;
        return `${value ? '🟢' : '🔴'} ${k.name}`;
      }).join('\n');

      return interaction.reply({
        embeds: [
          embeds.custom(COLORS.info)
            .setTitle('⚙️ Setările serverului')
            .addFields(
              { name: '📁 Canale de log', value: logs, inline: true },
              { name: '🤖 Automod', value: automod, inline: true },
              {
                name: '⭐ Nivele',
                value: `XP: ${all.leveling?.enabled === false ? '🔴 oprit' : '🟢 pornit'}\n` +
                  `Anunțuri: ${all.leveling?.announce === false ? '🔴 oprite' : '🟢 pornite'}`,
                inline: true,
              },
              { name: '🎭 Autorole', value: all.autorole ? `<@&${all.autorole}>` : '`nesetat`', inline: true },
              { name: '🧱 Setup rulat', value: all.setupDoneAt ? `<t:${Math.floor(all.setupDoneAt / 1000)}:R>` : '`niciodată`', inline: true },
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'log') {
      const type = interaction.options.getString('tip');
      const channel = interaction.options.getChannel('canal');
      settings.set(gid, `logs.${type}`, channel.id);
      return interaction.reply({ embeds: [embeds.success(`Log-urile **${type}** merg acum in ${channel}.`)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'automod') {
      const key = interaction.options.getString('filtru');
      const value = interaction.options.getBoolean('activ');
      settings.set(gid, `automod.${key}`, value);
      return interaction.reply({ embeds: [embeds.success(`Filtrul **${key}** e acum **${value ? 'pornit' : 'oprit'}**.`)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'cuvinte') {
      const list = interaction.options.getString('lista').split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
      settings.set(gid, 'automod.words', list);
      return interaction.reply({ embeds: [embeds.success(`Am salvat **${list.length}** cuvinte interzise.`)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'nivele') {
      const enabled = interaction.options.getBoolean('activ');
      const announce = interaction.options.getBoolean('anunturi');
      if (enabled !== null) settings.set(gid, 'leveling.enabled', enabled);
      if (announce !== null) settings.set(gid, 'leveling.announce', announce);
      return interaction.reply({ embeds: [embeds.success('Setările de nivele au fost salvate.')], flags: MessageFlags.Ephemeral });
    }

    const role = interaction.options.getRole('rol');
    if (role) settings.set(gid, 'autorole', role.id);
    else settings.set(gid, 'autorole', null);
    return interaction.reply({
      embeds: [embeds.success(role ? `Membrii noi primesc automat ${role}.` : 'Am scos autorole-ul.')],
      flags: MessageFlags.Ephemeral,
    });
  },
};
