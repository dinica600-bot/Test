import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { settings, db } from '../../lib/db.js';
import { PERSONAS, playConversation, pickScene, removeWebhooks } from '../../lib/personas.js';
import { getChannel } from '../../lib/guildMap.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ambianta')
    .setDescription('Personaje care poartă conversații în chat, ca serverul să nu pară gol')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) => s
      .setName('pornit')
      .setDescription('Pornește conversațiile automate')
      .addChannelOption((o) => o.setName('canal').setDescription('Unde (implicit: general)').addChannelTypes(ChannelType.GuildText))
      .addIntegerOption((o) => o.setName('minim').setDescription('Minim minute între conversații (implicit 45)').setMinValue(15).setMaxValue(720))
      .addIntegerOption((o) => o.setName('maxim').setDescription('Maxim minute între conversații (implicit 180)').setMinValue(20).setMaxValue(1440)))
    .addSubcommand((s) => s.setName('oprit').setDescription('Oprește conversațiile automate'))
    .addSubcommand((s) => s
      .setName('raspunsuri')
      .setDescription('Personajele răspund sau nu la mesajele din chat')
      .addBooleanOption((o) => o.setName('activ').setDescription('Pornit / oprit').setRequired(true)))
    .addSubcommand((s) => s.setName('acum').setDescription('Pornește o conversație pe loc'))
    .addSubcommand((s) => s.setName('status').setDescription('Cum e configurată ambianța'))
    .addSubcommand((s) => s.setName('sterge').setDescription('Șterge definitiv personajele (webhook-urile)')),

  staffOnly: true,
  cooldown: 10,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === 'pornit') {
      const channel = interaction.options.getChannel('canal') ?? getChannel(interaction.guild, 'general');
      if (!channel?.isTextBased()) {
        return interaction.reply({ embeds: [embeds.error('Nu am gasit canalul.')], flags: MessageFlags.Ephemeral });
      }
      const min = interaction.options.getInteger('minim') ?? 45;
      const max = Math.max(min + 5, interaction.options.getInteger('maxim') ?? 180);

      settings.set(gid, 'ambiance.enabled', true);
      settings.set(gid, 'ambiance.channel', channel.id);
      settings.set(gid, 'ambiance.minMinutes', min);
      settings.set(gid, 'ambiance.maxMinutes', max);
      db.set('ambiance', `${gid}.next`, Date.now() + 60_000);

      return interaction.reply({
        embeds: [
          embeds.custom(COLORS.success)
            .setTitle('💬 Ambianță pornită')
            .setDescription(
              `Personajele vor discuta în ${channel}, la **${min}-${max} minute**, ` +
              'doar când e liniște de cel puțin 15 minute (nu întrerup o discuție reală).',
            )
            .addFields({
              name: 'Personaje',
              value: Object.values(PERSONAS).map((p) => `• ${p.name}`).join('\n'),
            }, {
              name: 'Ce fac',
              value:
                '• poartă conversații între ele când e liniște\n' +
                '• **răspund la întrebările voastre** — despre eroi, counter-e, build-uri\n' +
                '• mai pun și ele întrebări în chat',
            }, {
              name: '⚠️ De reținut',
              value: 'Discord le pune automat eticheta **APP** lângă nume. Nu pot arăta ca membri reali.',
            }),
        ],
      });
    }

    if (sub === 'raspunsuri') {
      const on = interaction.options.getBoolean('activ');
      settings.set(gid, 'ambiance.reply', on);
      return interaction.reply({
        embeds: [embeds.success(on
          ? 'Personajele răspund acum la mesajele din chat — la întrebări aproape mereu, la afirmații rar, și cel mult o dată pe minut.'
          : 'Personajele nu mai răspund la mesaje. Conversațiile automate rămân.')],
      });
    }

    if (sub === 'oprit') {
      settings.set(gid, 'ambiance.enabled', false);
      return interaction.reply({ embeds: [embeds.success('Am oprit conversațiile automate. Personajele rămân, dar tac.')] });
    }

    if (sub === 'acum') {
      const channelId = settings.get(gid, 'ambiance.channel');
      const channel = (channelId && interaction.guild.channels.cache.get(channelId)) ?? getChannel(interaction.guild, 'general');
      if (!channel?.isTextBased()) {
        return interaction.reply({ embeds: [embeds.error('Nu am gasit canalul.')], flags: MessageFlags.Ephemeral });
      }
      await interaction.reply({ embeds: [embeds.success(`Pornesc o conversație în ${channel}...`)], flags: MessageFlags.Ephemeral });
      playConversation(channel, pickScene()).catch(() => {});
      return null;
    }

    if (sub === 'sterge') {
      const channelId = settings.get(gid, 'ambiance.channel');
      const channel = (channelId && interaction.guild.channels.cache.get(channelId)) ?? getChannel(interaction.guild, 'general');
      settings.set(gid, 'ambiance.enabled', false);
      const removed = channel ? await removeWebhooks(channel) : 0;
      return interaction.reply({ embeds: [embeds.success(`Am sters **${removed}** personaje. Mesajele deja trimise raman.`)] });
    }

    const on = settings.get(gid, 'ambiance.enabled', false);
    const next = db.get('ambiance', `${gid}.next`, 0);
    return interaction.reply({
      embeds: [
        embeds.custom(on ? COLORS.success : COLORS.neutral)
          .setTitle('💬 Ambianță')
          .addFields(
            { name: 'Stare', value: on ? '🟢 pornită' : '🔴 oprită', inline: true },
            { name: 'Canal', value: settings.get(gid, 'ambiance.channel') ? `<#${settings.get(gid, 'ambiance.channel')}>` : '`general`', inline: true },
            { name: 'Interval', value: `${settings.get(gid, 'ambiance.minMinutes', 45)}-${settings.get(gid, 'ambiance.maxMinutes', 180)} min`, inline: true },
            { name: 'Răspund în chat', value: settings.get(gid, 'ambiance.reply', true) === false ? '🔴 nu' : '🟢 da', inline: true },
            { name: 'Următoarea', value: on && next > Date.now() ? `<t:${Math.floor(next / 1000)}:R>` : '—' },
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
