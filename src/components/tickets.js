import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits,
  StringSelectMenuBuilder, AttachmentBuilder,
} from 'discord.js';
import { embeds, fail } from '../lib/embeds.js';
import { db, settings } from '../lib/db.js';
import { getChannel, getRole } from '../lib/guildMap.js';
import { STAFF_KEYS } from '../config/blueprint.js';
import { isStaff } from '../lib/permissions.js';
import { log } from '../lib/logger.js';
import { COLORS, config } from '../config/config.js';

export const TICKET_TYPES = {
  support: { label: 'Ajutor general', emoji: '❓', desc: 'Ai o intrebare sau o problema pe server.' },
  report: { label: 'Raportează un membru', emoji: '🚨', desc: 'Cineva incalca regulile? Spune-ne aici.' },
  apply: { label: 'Aplicare în squad', emoji: '🎯', desc: 'Vrei sa intri in Blood×Diamonds.' },
  scrim: { label: 'Cerere de scrim', emoji: '⚔️', desc: 'Reprezinti alt squad si vrei un scrim.' },
  partner: { label: 'Parteneriat / Sponsor', emoji: '🤝', desc: 'Colaborari si propuneri.' },
  other: { label: 'Altceva', emoji: '📩', desc: 'Orice nu se incadreaza mai sus.' },
};

/** Mesajul-panou din #deschide-ticket. */
export function ticketPanel() {
  const embed = embeds
    .custom(COLORS.primary)
    .setTitle('🎫 Suport Blood×Diamonds')
    .setDescription(
      'Ai nevoie de ajutor, vrei sa raportezi pe cineva sau sa aplici in squad?\n' +
      'Alege mai jos motivul si iti deschid un **canal privat** doar cu staff-ul.\n\n' +
      '**Reguli pentru tickete**\n' +
      '• Un ticket deschis o data. Nu deschide 5 pentru acelasi lucru.\n' +
      '• Scrie direct problema, cu detalii si dovezi (screenshot / clip).\n' +
      '• Ai rabdare — staff-ul raspunde cat de repede poate.',
    )
    .setFooter({ text: `${config.squadName} • suport 24/7` });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket:open')
    .setPlaceholder('📩 Alege motivul ticket-ului...')
    .addOptions(
      Object.entries(TICKET_TYPES).map(([value, t]) => ({
        label: t.label, value, description: t.desc, emoji: t.emoji,
      })),
    );

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}

function staffRoles(guild) {
  return STAFF_KEYS.map((k) => getRole(guild, k)).filter(Boolean);
}

export async function openTicket(interaction) {
  const type = interaction.values?.[0] ?? 'support';
  const meta = TICKET_TYPES[type] ?? TICKET_TYPES.support;
  const { guild, user } = interaction;

  const existing = db.get('tickets', `${guild.id}.open.${user.id}`);
  if (existing && guild.channels.cache.has(existing)) {
    return fail(interaction, `Ai deja un ticket deschis: <#${existing}>. Inchide-l inainte sa deschizi altul.`);
  }

  await interaction.deferReply({ flags: 64 });

  const number = db.add('tickets', `${guild.id}.counter`, 1);
  const parent = getChannel(guild, 'tickets');
  const roles = staffRoles(guild);

  const channel = await guild.channels.create({
    name: `${meta.emoji}-${String(number).padStart(4, '0')}-${user.username}`.slice(0, 95),
    type: ChannelType.GuildText,
    parent: parent?.id ?? null,
    topic: `Ticket #${number} • ${meta.label} • deschis de ${user.tag} (${user.id})`,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      ...roles.map((r) => ({
        id: r.id,
        allow: [
          PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ManageMessages,
        ],
      })),
    ],
  });

  db.set('tickets', `${guild.id}.open.${user.id}`, channel.id);
  db.set('tickets', `${guild.id}.data.${channel.id}`, {
    userId: user.id, type, number, createdAt: Date.now(), claimedBy: null,
  });

  const embed = embeds
    .custom(COLORS.diamond)
    .setTitle(`${meta.emoji} Ticket #${String(number).padStart(4, '0')} — ${meta.label}`)
    .setDescription(
      `Salut ${user}! Staff-ul a fost anuntat.\n\n` +
      '**Ca sa mearga repede, scrie de la inceput:**\n' +
      '```\n• Despre ce e vorba (pe scurt)\n• Cine e implicat (nume + ID)\n• Dovezi: screenshot / clip / ora\n```',
    )
    .setFooter({ text: `Deschis de ${user.tag}` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:claim').setLabel('Preiau eu').setEmoji('🙋').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket:close').setLabel('Închide').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );

  await channel.send({
    content: `${user} ${roles.map((r) => `<@&${r.id}>`).join(' ')}`,
    embeds: [embed],
    components: [buttons],
  });

  await log(guild, 'ticket', embeds.custom(COLORS.info)
    .setTitle('🎫 Ticket deschis')
    .setDescription(`${channel} • **${meta.label}**\nDeschis de ${user} \`${user.id}\``));

  return interaction.editReply({
    embeds: [embeds.success(`Ticket-ul tau e gata: ${channel}`)],
  });
}

export async function claimTicket(interaction) {
  if (!isStaff(interaction.member)) return fail(interaction, 'Doar staff-ul poate prelua tickete.');
  const data = db.get('tickets', `${interaction.guild.id}.data.${interaction.channel.id}`);
  if (!data) return fail(interaction, 'Canalul asta nu e un ticket.');
  if (data.claimedBy) return fail(interaction, `Ticket-ul e deja preluat de <@${data.claimedBy}>.`);

  data.claimedBy = interaction.user.id;
  db.set('tickets', `${interaction.guild.id}.data.${interaction.channel.id}`, data);
  await interaction.channel.setName(`✅-${interaction.channel.name.replace(/^[^-]+-/, '')}`.slice(0, 95)).catch(() => {});
  return interaction.reply({
    embeds: [embeds.success(`${interaction.user} preia acest ticket. Iti raspunde imediat.`)],
  });
}

export async function askCloseTicket(interaction) {
  const data = db.get('tickets', `${interaction.guild.id}.data.${interaction.channel.id}`);
  if (!data) return fail(interaction, 'Canalul asta nu e un ticket.');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:confirm').setLabel('Da, închide').setEmoji('✅').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:cancel').setLabel('Anulează').setStyle(ButtonStyle.Secondary),
  );
  return interaction.reply({
    embeds: [embeds.warn('Sigur inchizi ticket-ul? Se salveaza un transcript pentru staff.')],
    components: [row],
  });
}

export async function cancelClose(interaction) {
  return interaction.update({ embeds: [embeds.info('Am anulat inchiderea.')], components: [] });
}

async function buildTranscript(channel, data) {
  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  const lines = [
    `TRANSCRIPT TICKET #${data?.number ?? '?'} — ${channel.name}`,
    `Deschis de: ${data?.userId ? `<@${data.userId}>` : 'necunoscut'}`,
    `Inchis la: ${new Date().toLocaleString('ro-RO')}`,
    '='.repeat(60),
    '',
  ];
  if (messages) {
    for (const m of [...messages.values()].reverse()) {
      const time = new Date(m.createdTimestamp).toLocaleString('ro-RO');
      const content = m.content || (m.embeds.length ? '[embed]' : '[atasament]');
      lines.push(`[${time}] ${m.author.tag}: ${content}`);
      for (const att of m.attachments.values()) lines.push(`    ↳ fisier: ${att.url}`);
    }
  }
  return new AttachmentBuilder(Buffer.from(lines.join('\n'), 'utf8'), {
    name: `ticket-${data?.number ?? Date.now()}.txt`,
  });
}

export async function closeTicket(interaction) {
  const { guild, channel } = interaction;
  const data = db.get('tickets', `${guild.id}.data.${channel.id}`);
  await interaction.update({
    embeds: [embeds.warn('Inchid ticket-ul in 5 secunde si salvez transcriptul...')],
    components: [],
  });

  const file = await buildTranscript(channel, data);
  const logChannel = getChannel(guild, 'log-ticket');
  if (logChannel?.isTextBased()) {
    await logChannel.send({
      embeds: [
        embeds.custom(COLORS.neutral)
          .setTitle(`🎫 Ticket #${data?.number ?? '?'} inchis`)
          .addFields(
            { name: 'Deschis de', value: data?.userId ? `<@${data.userId}>` : 'necunoscut', inline: true },
            { name: 'Inchis de', value: `${interaction.user}`, inline: true },
            { name: 'Tip', value: TICKET_TYPES[data?.type]?.label ?? '—', inline: true },
          ),
      ],
      files: [file],
    }).catch(() => {});
  }

  if (data?.userId) {
    db.delete('tickets', `${guild.id}.open.${data.userId}`);
    guild.members.fetch(data.userId).then((m) => m.send({
      embeds: [embeds.info(`Ticket-ul tau **#${data.number}** de pe **${guild.name}** a fost inchis. Iti atasez conversatia.`)],
      files: [file],
    })).catch(() => {});
  }
  db.delete('tickets', `${guild.id}.data.${channel.id}`);

  setTimeout(() => channel.delete('Ticket inchis').catch(() => {}), 5000);
  return null;
}
