import { SlashCommandBuilder } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { COLORS } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Latența botului'),
  cooldown: 5,

  async execute(interaction, client) {
    await interaction.reply({ embeds: [embeds.info('🏓 Măsor...')] });
    const message = await interaction.fetchReply();
    const roundtrip = message.createdTimestamp - interaction.createdTimestamp;
    const ws = client.ws.ping;

    const quality = ws < 100 ? '🟢 excelent' : ws < 250 ? '🟡 ok' : '🔴 laggy';
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);

    return interaction.editReply({
      embeds: [
        embeds.custom(COLORS.diamond)
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'API', value: `**${ws}ms** ${quality}`, inline: true },
            { name: 'Răspuns', value: `**${roundtrip}ms**`, inline: true },
            { name: 'Uptime', value: `**${days}z ${hours}h ${mins}m**`, inline: true },
            { name: 'Memorie', value: `**${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB**`, inline: true },
          ),
      ],
    });
  },
};
