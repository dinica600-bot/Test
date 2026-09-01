/**
 * BLOOD×DIAMONDS — bot de squad pentru Mobile Legends.
 * Pornire: npm run deploy (o data) apoi npm start
 */
import { Client, GatewayIntentBits, Partials, Collection, ActivityType } from 'discord.js';
import { config, assertConfig } from './config/config.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { console_ } from './lib/logger.js';
import { db } from './lib/db.js';

assertConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
  presence: {
    status: 'online',
    activities: [{ name: `${config.squadName} • /help`, type: ActivityType.Competing }],
  },
});

client.commands = await loadCommands();
client.cooldowns = new Collection();
await loadEvents(client);

process.on('unhandledRejection', (err) => console_.error('Unhandled rejection:', err));
process.on('uncaughtException', (err) => console_.error('Uncaught exception:', err));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console_.info('Opresc botul, salvez datele...');
    db.flushAll();
    client.destroy();
    process.exit(0);
  });
}

await client.login(config.token);
