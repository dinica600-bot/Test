import { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { embeds, ts } from '../lib/embeds.js';
import { getChannel, getRole } from '../lib/guildMap.js';
import { settings } from '../lib/db.js';
import { log } from '../lib/logger.js';
import { COLORS, config } from '../config/config.js';
import { withBanner } from '../lib/assets.js';
import { giveAutoPings } from '../components/configPings.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const { guild } = member;

    // autorole (ex: rol de bot pentru boti, sau rol de membru daca nu folosesti verificarea)
    if (member.user.bot) {
      const botRole = getRole(guild, 'bots');
      if (botRole) await member.roles.add(botRole, 'Autorole bot').catch(() => {});
    } else {
      const autoKey = settings.get(guild.id, 'autorole');
      if (autoKey) {
        const role = guild.roles.cache.get(autoKey) ?? getRole(guild, autoKey);
        if (role) await member.roles.add(role, 'Autorole').catch(() => {});
        // fara verificare, notificarile se dau chiar la intrare
        await giveAutoPings(member).catch(() => {});
      }
    }

    // mesaj de bun venit
    const welcome = getChannel(guild, 'welcome');
    if (welcome?.isTextBased() && !member.user.bot) {
      const verify = getChannel(guild, 'verify');
      const rules = getChannel(guild, 'rules');
      const roles = getChannel(guild, 'roles');

      const embed = embeds
        .custom(COLORS.primary)
        .setTitle(`🩸 Bun venit în ${config.squadName}!`)
        .setDescription(
          `Salut ${member}! Esti membrul **#${guild.memberCount}** al squad-ului.\n\n` +
          `**Primii pasi:**\n` +
          `\`1.\` Citeste ${rules ?? '`📜︱reguli`'}\n` +
          `\`2.\` Verifica-te in ${verify ?? '`✅︱verificare`'}\n` +
          `\`3.\` Alege-ti lane-ul si rank-ul in ${roles ?? '`🎭︱self-roles`'}\n` +
          `\`4.\` Prezinta-te si hai la un rank! ⚔️`,
        )
        .setThumbnail(member.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'Cont creat', value: ts(member.user.createdAt), inline: true },
          { name: 'Membri', value: `**${guild.memberCount}**`, inline: true },
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Reguli').setEmoji('📜').setStyle(ButtonStyle.Link)
          .setURL(rules ? `https://discord.com/channels/${guild.id}/${rules.id}` : 'https://discord.com'),
      );

      const files = withBanner(embed, 'welcome.png');
      await welcome.send({
        content: `${member}`,
        embeds: [embed],
        components: rules ? [row] : [],
        files,
      }).catch(() => {});
    }

    await log(guild, 'join', embeds.custom(COLORS.success)
      .setTitle('📥 A intrat pe server')
      .setDescription(`${member.user} \`${member.id}\``)
      .addFields(
        { name: 'Cont creat', value: ts(member.user.createdAt), inline: true },
        { name: 'Total membri', value: `${guild.memberCount}`, inline: true },
      )
      .setThumbnail(member.displayAvatarURL()));

  },
};
