import { Events } from 'discord.js';
import { runAutomod } from '../lib/automod.js';
import { addXp, addMessage, handleLevelUp } from '../lib/leveling.js';
import { db, settings } from '../lib/db.js';
import { getChannel } from '../lib/guildMap.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    if (await runAutomod(message)) return;

    // ---- canalul de numaratoare ----
    const counting = getChannel(message.guild, 'counting');
    if (counting && message.channel.id === counting.id) {
      const state = db.get('counting', message.guild.id, { current: 0, lastUser: null });
      const number = Number(message.content.trim());
      if (!Number.isInteger(number) || number !== state.current + 1 || state.lastUser === message.author.id) {
        await message.react('❌').catch(() => {});
        await message.reply({
          content: number === state.current + 1 && state.lastUser === message.author.id
            ? `❌ ${message.author}, nu poti numara de doua ori la rand! O luam de la **1**.`
            : `❌ ${message.author} a stricat sirul la **${state.current}**. O luam de la **1**.`,
        }).catch(() => {});
        db.set('counting', message.guild.id, { current: 0, lastUser: null });
      } else {
        db.set('counting', message.guild.id, { current: number, lastUser: message.author.id });
        await message.react(number % 100 === 0 ? '🎉' : '✅').catch(() => {});
      }
    }

    // ---- XP ----
    if (settings.get(message.guild.id, 'leveling.enabled', true) === false) return;
    const blocked = settings.get(message.guild.id, 'leveling.blockedChannels', []);
    if (blocked.includes(message.channel.id)) return;

    addMessage(message.guild.id, message.author.id);
    const gain = 15 + Math.floor(Math.random() * 11); // 15-25 XP
    const { leveledUp, level } = addXp(message.guild.id, message.author.id, gain, true);
    if (leveledUp) await handleLevelUp(message.member, level).catch(() => {});
  },
};
