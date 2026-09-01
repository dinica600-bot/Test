/**
 * Inregistreaza comenzile slash la Discord.
 * - cu GUILD_ID in .env -> instant, doar pe serverul tau (recomandat)
 * - fara GUILD_ID       -> global, dar poate dura pana la o ora
 */
import { REST, Routes } from 'discord.js';
import { config, assertConfig } from './config/config.js';
import { loadCommands, toJSON } from './handlers/commandHandler.js';
import { console_ } from './lib/logger.js';

assertConfig();

const commands = toJSON(await loadCommands());
const rest = new REST().setToken(config.token);

try {
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  const data = await rest.put(route, { body: commands });
  console_.ok(
    `Am inregistrat ${data.length} comenzi ${config.guildId ? `pe serverul ${config.guildId}` : 'global'}.`,
  );
  for (const c of data) console.log(`   /${c.name}`);
} catch (err) {
  console_.error('Nu am putut inregistra comenzile:', err);
  process.exitCode = 1;
}
