import { Events, ChannelType, PermissionFlagsBits } from 'discord.js';
import { embeds } from '../lib/embeds.js';
import { log } from '../lib/logger.js';
import { getChannel } from '../lib/guildMap.js';
import { db } from '../lib/db.js';
import { addXp, handleLevelUp } from '../lib/leveling.js';
import { COLORS } from '../config/config.js';

const voiceJoins = new Map(); // userId -> timestamp

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;
    const guild = newState.guild;

    // ---------- canale temporare (join-to-create) ----------
    const hub = getChannel(guild, 'vc-create');
    if (hub && newState.channelId === hub.id) {
      try {
        const channel = await guild.channels.create({
          name: `🎮 ${member.displayName}`.slice(0, 95),
          type: ChannelType.GuildVoice,
          parent: hub.parentId,
          userLimit: 5,
          permissionOverwrites: [
            ...hub.parent?.permissionOverwrites.cache.map((o) => ({
              id: o.id, allow: o.allow.toArray(), deny: o.deny.toArray(),
            })) ?? [],
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.MuteMembers, PermissionFlagsBits.Connect,
                PermissionFlagsBits.ViewChannel,
              ],
            },
          ],
        });
        db.set('tempvc', `${guild.id}.${channel.id}`, { ownerId: member.id, createdAt: Date.now() });
        await member.voice.setChannel(channel).catch(() => {});
      } catch { /* fara permisiuni */ }
    }

    // sterge canalul temporar cand ramane gol
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const temp = db.get('tempvc', `${guild.id}.${oldState.channelId}`);
      if (temp && oldState.channel && oldState.channel.members.size === 0) {
        db.delete('tempvc', `${guild.id}.${oldState.channelId}`);
        await oldState.channel.delete('Canal temporar gol').catch(() => {});
      }
    }

    // ---------- XP din voice ----------
    if (!oldState.channelId && newState.channelId) {
      voiceJoins.set(member.id, Date.now());
    } else if (oldState.channelId && !newState.channelId) {
      const start = voiceJoins.get(member.id);
      voiceJoins.delete(member.id);
      if (start) {
        const minutes = Math.floor((Date.now() - start) / 60_000);
        if (minutes >= 1) {
          const data = db.get('levels', `${guild.id}.${member.id}`, {});
          db.set('levels', `${guild.id}.${member.id}`, { ...data, voice: (data.voice ?? 0) + minutes });
          const { leveledUp, level } = addXp(guild.id, member.id, Math.min(minutes, 120) * 5);
          if (leveledUp) await handleLevelUp(member, level).catch(() => {});
        }
      }
    }

    // ---------- logs ----------
    if (oldState.channelId !== newState.channelId) {
      const text = !oldState.channelId
        ? `➡️ a intrat in ${newState.channel}`
        : !newState.channelId
          ? `⬅️ a iesit din ${oldState.channel}`
          : `🔄 s-a mutat din ${oldState.channel} in ${newState.channel}`;
      await log(guild, 'voice', embeds.custom(COLORS.info)
        .setTitle('🔊 Activitate voice')
        .setDescription(`${member} ${text}`));
    }
  },
};
