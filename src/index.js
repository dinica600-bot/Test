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
import { acquireLock, releaseLock } from './lib/lock.js';

assertConfig();

// o singura copie a botului odata — altfel raspunde de doua ori la tot
if (!acquireLock()) process.exit(1);

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
process.on('exit', releaseLock);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console_.info('Opresc botul, salvez datele...');
    db.flushAll();
    releaseLock();
    client.destroy();
    process.exit(0);
  });
}

/**
 * Conectarea, cu reincercari. Pe telefon netul mai cade (WiFi fara internet,
 * trecere de pe date mobile pe WiFi), iar botul nu are motiv sa moara pentru
 * atat — asteapta si incearca din nou.
 */
const NETWORK_ERRORS = ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'ENETUNREACH'];

async function connect(attempt = 1) {
  try {
    await client.login(config.token);
  } catch (err) {
    const code = err.code ?? err.cause?.code;

    if (err.message?.includes('TOKEN_INVALID') || err.status === 401) {
      console_.error('Tokenul e gresit sau a fost resetat.');
      console_.info('Ia-l din nou: Developer Portal → Bot → Reset Token, apoi ruleaza  npm run setup');
      process.exit(1);
    }

    if (!NETWORK_ERRORS.includes(code)) {
      console_.error('Nu m-am putut conecta:', err.message);
      process.exit(1);
    }

    const wait = Math.min(60, 5 * 2 ** (attempt - 1));
    console_.warn(
      `Nu am internet (${code}). Verifica conexiunea — daca esti pe WiFi fara internet, ` +
      'treci pe date mobile.',
    );
    console_.info(`Reincerc peste ${wait} secunde... (incercarea ${attempt})`);
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
    return connect(attempt + 1);
  }
  return null;
}

await connect();
