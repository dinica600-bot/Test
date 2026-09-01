import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { db } from '../../lib/db.js';
import { suggestionEmbed, suggestionButtons } from '../../components/suggestion.js';
import { getChannel } from '../../lib/guildMap.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sugestie')
    .setDescription('Propune ceva pentru server sau pentru squad')
    .setDMPermission(false)
    .addStringOption((o) => o.setName('text').setDescription('Sugestia ta').setRequired(true).setMaxLength(1500)),

  cooldown: 60,

  async execute(interaction) {
    const channel = getChannel(interaction.guild, 'suggestions') ?? interaction.channel;

    const suggestion = {
      text: interaction.options.getString('text'),
      authorId: interaction.user.id,
      authorTag: interaction.user.tag,
      authorAvatar: interaction.user.displayAvatarURL(),
      up: [], down: [], status: 'pending', at: Date.now(),
    };

    const message = await channel.send({
      embeds: [suggestionEmbed(suggestion)],
      components: [suggestionButtons(suggestion)],
    });
    db.set('suggestions', `${interaction.guild.id}.${message.id}`, suggestion);
    await message.startThread({ name: `💡 ${suggestion.text.slice(0, 60)}` }).catch(() => {});

    return interaction.reply({
      embeds: [embeds.success(`Sugestia ta a fost postata in ${channel}. Mersi! 💡`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
