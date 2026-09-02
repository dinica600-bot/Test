/**
 * Aplica decorul direct din terminal:  npm run decor
 *
 * De ce exista: la o comanda `/` Discord da botului doar 3 secunde ca sa
 * confirme. Pe un telefon pe care Android incetineste procesul, fereastra
 * se pierde si primesti "Unknown interaction" (10062).
 *
 * Scriptul asta nu foloseste nicio interactiune — se conecteaza, face
 * treaba cu rabdare si iese. Nu are nicio limita de timp.
 */
import { Client, GatewayIntentBits } from 'discord.js';
import { config, assertConfig } from '../src/config/config.js';
import { applyIcon, applyAvatar, uploadEmojis, postBanners } from '../src/lib/decor.js';
import { db } from '../src/lib/db.js';

assertConfig();

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const only = process.argv[2] ?? 'tot'; // tot | emoji | banere | icon | avatar

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`\n${c.green('✔')} Conectat ca ${c.bold(client.user.tag)}`);

  const guild = config.guildId
    ? await client.guilds.fetch(config.guildId).catch(() => null)
    : client.guilds.cache.first();

  if (!guild) {
    console.log(c.red('✘ Nu gasesc serverul. Verifica GUILD_ID din .env.'));
    client.destroy();
    process.exit(1);
  }
  console.log(`${c.green('✔')} Server: ${c.bold(guild.name)}\n`);
  await guild.channels.fetch().catch(() => {});
  await guild.emojis.fetch().catch(() => {});

  const OK = ['incarcat', 'postat', 'pus'];
  const step = (name, state) => {
    const mark = OK.includes(state) ? c.green('✔')
      : state === 'exista deja' ? c.dim('•') : c.red('✘');
    console.log(`   ${mark} ${name.padEnd(14)} ${c.dim(state)}`);
  };

  if (only === 'tot' || only === 'icon') {
    console.log(c.cyan('▸ Iconul serverului'));
    await applyIcon(guild).then(() => step('icon', 'pus')).catch((e) => step('icon', e.message));
  }

  if (only === 'tot' || only === 'avatar') {
    console.log(c.cyan('▸ Avatarul botului'));
    await applyAvatar(client).then(() => step('avatar', 'pus'))
      .catch(() => step('avatar', 'refuzat (Discord permite 2 schimbari pe ora)'));
  }

  if (only === 'tot' || only === 'emoji') {
    console.log(c.cyan('\n▸ Emoji (32 de bucati, dureaza ~1 minut)'));
    const { uploaded, skipped, failed } = await uploadEmojis(guild, step);
    console.log(`   ${c.bold(`${uploaded.length} incarcate`)}, ${skipped.length} existau deja, ${failed.length} esuate`);
  }

  if (only === 'tot' || only === 'banere') {
    console.log(c.cyan('\n▸ Banere'));
    const { posted, missing } = await postBanners(guild, step);
    console.log(`   ${c.bold(`${posted} postate`)}, ${missing} sarite`);
  }

  console.log(`\n${c.green('✔ Gata.')} Intra pe Discord si uita-te la server. ${c.dim('(Ctrl+C daca nu iese singur)')}\n`);
  db.flushAll();
  await client.destroy();
  process.exit(0);
});

client.on('error', (err) => console.log(c.red(`Eroare: ${err.message}`)));

console.log(c.dim('Ma conectez la Discord...'));
try {
  await client.login(config.token);
} catch (err) {
  const code = err.code ?? err.cause?.code;
  if (['ENOTFOUND', 'EAI_AGAIN', 'ENETUNREACH', 'ETIMEDOUT'].includes(code)) {
    console.log(c.red('\n✘ Nu am internet.') + ' Daca esti pe WiFi fara internet, treci pe date mobile si incearca din nou.\n');
  } else {
    console.log(c.red(`\n✘ Nu m-am putut conecta: ${err.message}\n`));
  }
  process.exit(1);
}
