import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { embeds } from '../../lib/embeds.js';
import { COLORS, config } from '../../config/config.js';

const CATEGORY_INFO = {
  admin: { emoji: '🛠️', label: 'Administrare' },
  moderation: { emoji: '🛡️', label: 'Moderare' },
  mlbb: { emoji: '⚔️', label: 'Mobile Legends' },
  scrim: { emoji: '🏆', label: 'Competitiv & Scrim' },
  community: { emoji: '💬', label: 'Comunitate' },
  utility: { emoji: '🔧', label: 'Utile' },
};

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Toate comenzile botului')
    .addStringOption((o) => o.setName('comanda').setDescription('Detalii despre o anumită comandă')),

  cooldown: 3,

  async execute(interaction, client) {
    const wanted = interaction.options.getString('comanda')?.replace('/', '').toLowerCase();

    if (wanted) {
      const command = client.commands.get(wanted);
      if (!command) {
        return interaction.reply({ embeds: [embeds.error(`Nu exista comanda \`/${wanted}\`.`)], flags: MessageFlags.Ephemeral });
      }
      const json = command.data.toJSON();
      const subs = (json.options ?? []).filter((o) => o.type === 1 || o.type === 2);
      const opts = (json.options ?? []).filter((o) => o.type !== 1 && o.type !== 2);

      return interaction.reply({
        embeds: [
          embeds.custom(COLORS.info)
            .setTitle(`/${json.name}`)
            .setDescription(json.description)
            .addFields(
              ...(subs.length ? [{ name: 'Subcomenzi', value: subs.map((s) => `\`/${json.name} ${s.name}\` — ${s.description}`).join('\n') }] : []),
              ...(opts.length ? [{ name: 'Opțiuni', value: opts.map((o) => `\`${o.name}\`${o.required ? ' *(obligatoriu)*' : ''} — ${o.description}`).join('\n') }] : []),
              { name: 'Acces', value: command.ownerOnly ? '👑 doar owner' : command.staffOnly ? '🛡️ doar staff' : '👥 toată lumea', inline: true },
              { name: 'Cooldown', value: `${command.cooldown ?? 3}s`, inline: true },
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const grouped = new Map();
    for (const command of client.commands.values()) {
      const cat = command.category ?? 'utility';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat).push(command);
    }

    const embed = embeds
      .custom(COLORS.primary)
      .setTitle(`🩸 Comenzile ${config.squadName}`)
      .setDescription(
        `Scrie **/** in chat si iti apar toate. Pentru detalii: \`/help comanda:<nume>\`.\n` +
        `Total: **${client.commands.size}** comenzi.`,
      )
      .setThumbnail(interaction.guild?.iconURL() ?? null);

    for (const [cat, commands] of grouped) {
      const info = CATEGORY_INFO[cat] ?? { emoji: '📦', label: cat };
      embed.addFields({
        name: `${info.emoji} ${info.label}`,
        value: commands.map((c) => `\`/${c.data.name}\``).join(' • '),
      });
    }

    embed.addFields({
      name: '💡 Cele mai folositoare',
      value:
        '`/setup server` — construieste tot serverul\n' +
        '`/scrim creeaza` — programeaza un scrim cu line-up\n' +
        '`/draft` — simulator de ban/pick\n' +
        '`/hero` si `/counter` — info despre eroi\n' +
        '`/profil seteaza` — profilul tau de MLBB',
    });

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
