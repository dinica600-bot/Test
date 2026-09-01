import { Events } from 'discord.js';
import { embeds } from '../lib/embeds.js';
import { log } from '../lib/logger.js';
import { COLORS } from '../config/config.js';

export default {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    if (!message.content && !message.attachments?.size) return;

    await log(message.guild, 'message', embeds.custom(COLORS.danger)
      .setTitle('🗑️ Mesaj șters')
      .setDescription(`Autor: ${message.author ?? 'necunoscut'}\nCanal: ${message.channel}`)
      .addFields(
        { name: 'Conținut', value: `\`\`\`${(message.content || '—').slice(0, 900)}\`\`\`` },
        ...(message.attachments?.size
          ? [{ name: 'Atașamente', value: [...message.attachments.values()].map((a) => a.url).join('\n').slice(0, 900) }]
          : []),
      ));
  },
};
