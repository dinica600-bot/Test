import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import {
  announceLive, accounts, addAccount, removeAccount, autoCheckAvailable,
} from '../../lib/tiktok.js';
import { getChannel } from '../../lib/guildMap.js';
import { COLORS } from '../../config/config.js';

const PLATFORMS = [
  { name: '📱 TikTok', value: 'TikTok' },
  { name: '🟣 Twitch', value: 'Twitch' },
  { name: '▶️ YouTube', value: 'YouTube' },
  { name: '📘 Facebook Gaming', value: 'Facebook' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('live')
    .setDescription('Anunță că ești live și gestionează conturile urmărite')
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('anunta')
      .setDescription('Anunță pe server că ai intrat live')
      .addStringOption((o) => o.setName('link').setDescription('Linkul live-ului').setRequired(true))
      .addStringOption((o) => o.setName('platforma').setDescription('Unde ești live').addChoices(...PLATFORMS))
      .addStringOption((o) => o.setName('titlu').setDescription('Ce faci în live').setMaxLength(200)))
    .addSubcommand((s) => s
      .setName('adauga-cont')
      .setDescription('(staff) Urmărește un cont de TikTok și anunță automat când intră live')
      .addStringOption((o) => o.setName('username').setDescription('Username-ul de TikTok, fără @').setRequired(true))
      .addUserOption((o) => o.setName('membru').setDescription('Cine e pe server (ca să fie menționat)')))
    .addSubcommand((s) => s
      .setName('sterge-cont')
      .setDescription('(staff) Nu mai urmări un cont')
      .addStringOption((o) => o.setName('username').setDescription('Username-ul de TikTok').setRequired(true)))
    .addSubcommand((s) => s.setName('conturi').setDescription('Ce conturi sunt urmărite')),

  cooldown: 30,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'anunta') {
      const url = interaction.options.getString('link');
      if (!/^https?:\/\//i.test(url)) {
        return interaction.reply({ embeds: [embeds.error('Linkul trebuie sa inceapa cu `https://`.')], flags: MessageFlags.Ephemeral });
      }

      const message = await announceLive(interaction.guild, {
        username: interaction.user.username,
        url,
        title: interaction.options.getString('titlu'),
        platform: interaction.options.getString('platforma') ?? 'TikTok',
        memberId: interaction.user.id,
        avatar: interaction.user.displayAvatarURL({ size: 256 }),
      });

      const channel = getChannel(interaction.guild, 'live');
      return interaction.reply({
        embeds: [message
          ? embeds.success(`Am anuntat live-ul in ${channel ?? 'canalul de live'}. Distractie placuta! 🔴`)
          : embeds.error('Nu am gasit canalul de live. Ruleaza `/setup server`.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'conturi') {
      const list = accounts(gid);
      return interaction.reply({
        embeds: [
          embeds.custom(COLORS.info)
            .setTitle('📱 Conturi TikTok urmărite')
            .setDescription(
              list.length
                ? list.map((a) => `• [@${a.username}](https://www.tiktok.com/@${a.username})${a.memberId ? ` — <@${a.memberId}>` : ''}`).join('\n')
                : 'Niciun cont urmărit. Adaugă cu `/live adauga-cont`.',
            )
            .addFields({
              name: 'Verificare automată',
              value: autoCheckAvailable()
                ? '🟢 activă — verific din 3 în 3 minute'
                : '🔴 inactivă — rulează `npm install tiktok-live-connector` în folderul botului, apoi repornește-l.\n' +
                  '_Fără ea, foloseşte `/live anunta` când intri live — merge întotdeauna._',
            }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // ---- subcomenzi de staff ----
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [embeds.error('Doar staff-ul poate gestiona conturile urmarite.')], flags: MessageFlags.Ephemeral });
    }

    const username = interaction.options.getString('username').replace(/^@/, '').trim();

    if (sub === 'adauga-cont') {
      const added = addAccount(gid, username, interaction.options.getUser('membru')?.id ?? null);
      return interaction.reply({
        embeds: [added
          ? embeds.success(`Urmăresc acum **@${username}**.` + (autoCheckAvailable() ? '' : '\n\n⚠️ Verificarea automată nu e instalată — până atunci folosiți `/live anunta`.'))
          : embeds.warn(`**@${username}** era deja pe listă.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    removeAccount(gid, username);
    return interaction.reply({ embeds: [embeds.success(`Nu mai urmăresc **@${username}**.`)], flags: MessageFlags.Ephemeral });
  },
};
