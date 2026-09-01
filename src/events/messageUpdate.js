import { Events } from 'discord.js';
import { embeds } from '../lib/embeds.js';
import { log } from '../lib/logger.js';
import { COLORS } from '../config/config.js';
import { runAutomod } from '../lib/automod.js';

export default {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await runAutomod(newMessage);

    await log(newMessage.guild, 'message', embeds.custom(COLORS.warning)
      .setTitle('✏️ Mesaj editat')
      .setDescription(`Autor: ${newMessage.author}\nCanal: ${newMessage.channel}\n[Sari la mesaj](${newMessage.url})`)
      .addFields(
        { name: 'Înainte', value: `\`\`\`${(oldMessage.content || '—').slice(0, 500)}\`\`\`` },
        { name: 'După', value: `\`\`\`${(newMessage.content || '—').slice(0, 500)}\`\`\`` },
      ));
  },
};
