import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { embeds, fail, ts } from '../lib/embeds.js';
import { db } from '../lib/db.js';
import { COLORS, config } from '../config/config.js';

export function giveawayEmbed(g, ended = false) {
  return embeds
    .custom(ended ? COLORS.neutral : COLORS.gold)
    .setTitle(`🎁 ${g.prize}`)
    .setDescription(
      ended
        ? `Giveaway-ul s-a incheiat ${ts(g.endsAt, 'R')}.`
        : `Apasa **🎉 Particip** ca sa intri la tragere!\n\n` +
          `⏰ Se termina: ${ts(g.endsAt, 'F')} (${ts(g.endsAt, 'R')})\n` +
          `🏆 Castigatori: **${g.winners}**\n` +
          (g.requiredRole ? `🔒 Necesita rolul: <@&${g.requiredRole}>\n` : '') +
          `👥 Participanti: **${g.entries.length}**`,
    )
    .setFooter({ text: `Organizat de ${g.hostTag} • ${config.squadName}` });
}

export function giveawayButtons(ended = false, count = 0) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway:enter')
      .setLabel(ended ? 'Încheiat' : `Particip (${count})`)
      .setEmoji('🎉')
      .setStyle(ended ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(ended),
  );
}

export async function handleGiveawayEnter(interaction) {
  const key = `${interaction.guild.id}.${interaction.message.id}`;
  const g = db.get('giveaways', key);
  if (!g || g.ended) return fail(interaction, 'Giveaway-ul s-a incheiat.');
  if (g.requiredRole && !interaction.member.roles.cache.has(g.requiredRole)) {
    return fail(interaction, `Ai nevoie de rolul <@&${g.requiredRole}> ca sa participi.`);
  }

  const id = interaction.user.id;
  let message;
  if (g.entries.includes(id)) {
    g.entries = g.entries.filter((e) => e !== id);
    message = 'Te-am scos din giveaway. 😢';
  } else {
    g.entries.push(id);
    message = `Esti inscris! Baftă 🍀 (participanti: ${g.entries.length})`;
  }
  db.set('giveaways', key, g);

  await interaction.update({ embeds: [giveawayEmbed(g)], components: [giveawayButtons(false, g.entries.length)] });
  return interaction.followUp({ embeds: [embeds.success(message)], flags: 64 });
}

function pickWinners(entries, count) {
  const pool = [...entries];
  const winners = [];
  while (winners.length < count && pool.length) {
    winners.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  }
  return winners;
}

export async function endGiveaway(client, guildId, messageId, reroll = false) {
  const key = `${guildId}.${messageId}`;
  const g = db.get('giveaways', key);
  if (!g) return null;

  const channel = await client.channels.fetch(g.channelId).catch(() => null);
  const message = await channel?.messages.fetch(messageId).catch(() => null);
  const winners = pickWinners(g.entries, g.winners);

  g.ended = true;
  g.lastWinners = winners;
  db.set('giveaways', key, g);

  if (message) {
    await message.edit({ embeds: [giveawayEmbed(g, true)], components: [giveawayButtons(true)] }).catch(() => {});
  }
  if (channel?.isTextBased()) {
    await channel.send({
      content: winners.length ? winners.map((w) => `<@${w}>`).join(' ') : undefined,
      embeds: [
        embeds.custom(winners.length ? COLORS.success : COLORS.danger)
          .setTitle(reroll ? '🔄 Reroll giveaway' : '🎉 Giveaway încheiat!')
          .setDescription(
            winners.length
              ? `**Premiu:** ${g.prize}\n**Castigator(i):** ${winners.map((w) => `<@${w}>`).join(', ')}\n\nFelicitari! Deschide un ticket ca sa-ti revendici premiul.`
              : `**Premiu:** ${g.prize}\nNimeni nu a participat. 😢`,
          ),
      ],
    }).catch(() => {});
  }
  return winners;
}

/** Verifica din 15 in 15 secunde daca s-a terminat vreun giveaway. */
export function startGiveawayLoop(client) {
  setInterval(async () => {
    const all = db.get('giveaways', null, {});
    for (const [guildId, giveaways] of Object.entries(all)) {
      for (const [messageId, g] of Object.entries(giveaways)) {
        if (!g.ended && g.endsAt <= Date.now()) {
          await endGiveaway(client, guildId, messageId).catch(() => {});
        }
      }
    }
  }, 15_000).unref?.();
}
