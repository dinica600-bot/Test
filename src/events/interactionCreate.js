import { Events, Collection, MessageFlags } from 'discord.js';
import { handleComponent } from '../components/index.js';
import { console_, log } from '../lib/logger.js';
import { embeds } from '../lib/embeds.js';
import { isStaff, isOwner } from '../lib/permissions.js';
import { COLORS } from '../config/config.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // --- butoane / meniuri / modale ---
    if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
      return handleComponent(interaction);
    }

    // --- autocomplete ---
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return null;
      try {
        return await command.autocomplete(interaction);
      } catch (err) {
        console_.error(`Autocomplete ${interaction.commandName}:`, err);
        return null;
      }
    }

    if (!interaction.isChatInputCommand()) return null;

    const command = client.commands.get(interaction.commandName);
    if (!command) return null;

    // --- comenzile functioneaza doar pe server ---
    if (!interaction.guild || !interaction.member) {
      return interaction.reply({
        embeds: [embeds.error('Comenzile mele merg doar pe serverul Blood×Diamonds, nu in DM.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    // --- verificari de acces ---
    if (command.ownerOnly && !isOwner(interaction.member)) {
      return interaction.reply({
        embeds: [embeds.error('Comanda asta e doar pentru owner-ul squad-ului.')],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (command.staffOnly && !isStaff(interaction.member)) {
      return interaction.reply({
        embeds: [embeds.error('Comanda asta e doar pentru staff.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    // --- cooldown ---
    const cooldown = (command.cooldown ?? 3) * 1000;
    if (!client.cooldowns.has(command.data.name)) client.cooldowns.set(command.data.name, new Collection());
    const timestamps = client.cooldowns.get(command.data.name);
    const last = timestamps.get(interaction.user.id);
    if (last && Date.now() < last + cooldown && !isStaff(interaction.member)) {
      const left = ((last + cooldown - Date.now()) / 1000).toFixed(1);
      return interaction.reply({
        embeds: [embeds.warn(`Mai asteapta **${left}s** inainte sa folosesti \`/${command.data.name}\` din nou.`)],
        flags: MessageFlags.Ephemeral,
      });
    }
    timestamps.set(interaction.user.id, Date.now());
    setTimeout(() => timestamps.delete(interaction.user.id), cooldown).unref?.();

    // --- executie ---
    try {
      await command.execute(interaction, client);
    } catch (err) {
      // 10062 = interactiunea a expirat: Discord da 3 secunde ca sa confirmi,
      // iar telefonul/serverul n-a apucat. Nu se mai poate raspunde la ea.
      if (err.code === 10062) {
        console_.warn(
          `/${interaction.commandName}: interactiunea a expirat (raspuns mai lent de 3s). ` +
          'De obicei e din cauza conexiunii sau a telefonului adormit — da comanda din nou.',
        );
        return;
      }

      console_.error(`Comanda /${interaction.commandName}:`, err);
      const payload = {
        embeds: [embeds.error('Ceva a crapat la comanda asta. Staff-ul a fost anuntat.')],
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
      else await interaction.reply(payload).catch(() => {});

      await log(interaction.guild, 'bot', embeds.custom(COLORS.danger)
        .setTitle('❗ Eroare la comandă')
        .setDescription(`**/${interaction.commandName}** de ${interaction.user}\n\`\`\`${String(err).slice(0, 900)}\`\`\``));
    }
    return null;
  },
};
