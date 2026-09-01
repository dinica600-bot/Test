import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { embeds, progressBar, fail } from '../lib/embeds.js';
import { db } from '../lib/db.js';
import { COLORS } from '../config/config.js';

export const POLL_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

export function pollEmbed(poll) {
  const counts = poll.options.map((_, i) => Object.values(poll.votes).filter((v) => v === i).length);
  const total = counts.reduce((a, b) => a + b, 0);
  return embeds
    .custom(COLORS.info)
    .setTitle(`📊 ${poll.question}`)
    .setDescription(
      poll.options
        .map((opt, i) => `${POLL_EMOJI[i]} **${opt}**\n${progressBar(counts[i], total || 1)} — ${counts[i]} vot${counts[i] === 1 ? '' : 'uri'}`)
        .join('\n\n'),
    )
    .setFooter({ text: `${total} voturi • un vot de persoana, poti sa-l schimbi` });
}

export function pollButtons(poll, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      poll.options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`poll:${i}`)
          .setLabel(opt.slice(0, 40))
          .setEmoji(POLL_EMOJI[i])
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
      ),
    ),
  ];
}

export async function handlePollVote(interaction) {
  const key = `${interaction.guild.id}.${interaction.message.id}`;
  const poll = db.get('polls', key);
  if (!poll) return fail(interaction, 'Sondajul asta nu mai e activ.');
  const index = Number(interaction.customId.split(':')[1]);
  poll.votes[interaction.user.id] = index;
  db.set('polls', key, poll);
  await interaction.update({ embeds: [pollEmbed(poll)], components: pollButtons(poll) });
  return interaction.followUp({
    embeds: [embeds.success(`Ai votat **${poll.options[index]}**.`)], flags: 64,
  });
}
