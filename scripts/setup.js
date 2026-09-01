/**
 * Configurare asistata — scrie fisierul .env fara sa fie nevoie de editor.
 * Ruleaza cu:  npm run setup
 *
 * Tot ce trebuie sa dai e TOKENUL. Restul (Application ID, ID-ul tau,
 * serverul) le afla botul singur de la Discord.
 */
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(ROOT, '.env');
const API = 'https://discord.com/api/v10';

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const rl = createInterface({ input, output });

/** Intrebare care nu crapa daca inchizi terminalul (Ctrl+C / Ctrl+D). */
async function ask(question) {
  try {
    return await rl.question(question);
  } catch {
    console.log(`\n\n${c.yellow('Am oprit configurarea.')} Cand vrei sa reiei: ${c.bold('npm run setup')}\n`);
    process.exit(1);
  }
}

let finished = false;

function bail() {
  console.log(`\n\n${c.yellow('Am oprit configurarea.')} Cand vrei sa reiei: ${c.bold('npm run setup')}\n`);
  process.exit(1);
}

// daca se inchide intrarea (Ctrl+D, terminal inchis) nu ramanem blocati
rl.on('close', () => { if (!finished) bail(); });

rl.on('SIGINT', () => {
  console.log(`\n\n${c.yellow('Am oprit configurarea.')} Cand vrei sa reiei: ${c.bold('npm run setup')}\n`);
  process.exit(1);
});

function readExistingEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const values = {};
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (match) values[match[1]] = match[2].trim();
  }
  return values;
}

function mask(token) {
  if (!token || token.length < 12) return '***';
  return `${token.slice(0, 6)}${'*'.repeat(12)}${token.slice(-4)}`;
}

async function discord(path, token) {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

console.log(`
${c.red('🩸')} ${c.bold('BLOOD × DIAMONDS')} ${c.cyan('💎')}  —  configurare

Iti trebuie un singur lucru: ${c.bold('tokenul botului')}.
   Discord Developer Portal → aplicatia ta → ${c.bold('Bot')} → ${c.bold('Reset Token')} → Copy
`);

const existing = readExistingEnv();
let token = '';
let app = null;

/* ---------- 1. tokenul, verificat direct la Discord ---------- */
for (let attempt = 1; ; attempt += 1) {
  const hint = existing.DISCORD_TOKEN && existing.DISCORD_TOKEN !== 'token_ul_tau_aici'
    ? c.dim(` [Enter = pastrez ${mask(existing.DISCORD_TOKEN)}]`)
    : '';
  const answer = (await ask(`${c.bold('Tokenul botului')}${hint}: `)).trim();
  token = answer || existing.DISCORD_TOKEN || '';

  if (!token) {
    console.log(c.red('   Fara token nu pot merge mai departe.\n'));
    continue;
  }
  if (token.startsWith('Bot ')) token = token.slice(4).trim();

  process.stdout.write(c.dim('   verific tokenul... '));
  try {
    app = await discord('/oauth2/applications/@me', token);
    console.log(c.green('valid ✔'));
    break;
  } catch (err) {
    console.log(c.red('nu merge ✘'));
    if (String(err.message).includes('401')) {
      console.log(c.red('   Tokenul e gresit sau a fost resetat. Ia-l din nou din Developer Portal → Bot → Reset Token.\n'));
    } else if (err.name === 'TimeoutError' || String(err.message).includes('fetch')) {
      console.log(c.yellow('   Nu am internet sau Discord nu raspunde. Verifica conexiunea.\n'));
    } else {
      console.log(c.red(`   Eroare: ${err.message}\n`));
    }

    // dupa 3 incercari mergem mai departe si completezi manual
    if (attempt >= 3) {
      console.log(c.yellow('   Continui fara verificare automata — completezi manual mai jos.\n'));
      break;
    }
  }
}

/* ---------- 2. datele care se afla singure ---------- */
let clientId = app?.id ?? existing.CLIENT_ID ?? '';
let ownerId = app?.owner?.id ?? existing.OWNER_ID ?? '';

if (app) {
  console.log(`
${c.green('Bot:')} ${c.bold(app.bot?.username ?? app.name)}
${c.green('Application ID:')} ${clientId}   ${c.dim('(completat automat)')}
${c.green('Owner:')} ${app.owner?.username ?? '?'} — ${ownerId}   ${c.dim('(completat automat)')}`);
}

/* ---------- 3. serverul ---------- */
let guildId = existing.GUILD_ID ?? '';
if (token) {
  try {
    const guilds = await discord('/users/@me/guilds', token);
    if (guilds.length === 1) {
      guildId = guilds[0].id;
      console.log(`${c.green('Server:')} ${c.bold(guilds[0].name)} — ${guildId}   ${c.dim('(singurul unde esti invitat)')}`);
    } else if (guilds.length > 1) {
      console.log(`\n${c.bold('Pe ce server il folosesti?')}`);
      guilds.forEach((g, i) => console.log(`  ${c.cyan(`${i + 1}.`)} ${g.name}`));
      for (;;) {
        const pick = Number((await ask(`Alege numarul [1-${guilds.length}]: `)).trim());
        if (pick >= 1 && pick <= guilds.length) { guildId = guilds[pick - 1].id; break; }
        console.log(c.red('   Numar invalid.'));
      }
    } else {
      console.log(`\n${c.yellow('⚠️  Botul nu e inca pe niciun server.')}`);
      console.log(`   Invita-l cu linkul asta, apoi ruleaza din nou ${c.bold('npm run setup')}:`);
      console.log(c.cyan(`   https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands\n`));
    }
  } catch {
    console.log(c.yellow('\n   Nu am putut lua lista de servere.'));
  }
}

/* ---------- 4. completare manuala pentru ce lipseste ---------- */
async function askId(label, current) {
  if (current) return current;
  for (;;) {
    const value = (await ask(`${c.bold(label)}: `)).trim();
    if (/^\d{17,20}$/.test(value)) return value;
    console.log(c.red('   Trebuie sa fie un ID de Discord (17-20 cifre).'));
  }
}
clientId = await askId('Application ID', clientId);
ownerId = await askId('ID-ul tau de Discord', ownerId);
if (!guildId) {
  const value = (await ask(`${c.bold('ID-ul serverului')} ${c.dim('(Enter = sar peste)')}: `)).trim();
  if (/^\d{17,20}$/.test(value)) guildId = value;
}

/* ---------- 5. scriem .env ---------- */
const env = `# Generat cu "npm run setup" pe ${new Date().toLocaleString('ro-RO')}
# NU da fisierul asta nimanui si nu-l urca pe GitHub — contine tokenul.

DISCORD_TOKEN=${token}
CLIENT_ID=${clientId}
GUILD_ID=${guildId}
OWNER_ID=${ownerId}

SQUAD_NAME=${existing.SQUAD_NAME || 'Blood×Diamonds'}
SQUAD_TAG=${existing.SQUAD_TAG || 'BxD'}

# Verificarea contului de Mobile Legends (nume real din joc pe baza de ID).
MLBB_NICKNAME_API=${existing.MLBB_NICKNAME_API || 'https://api.isan.eu.org/nickname/ml?id={id}&server={server}'}
MLBB_STATS_API=${existing.MLBB_STATS_API || ''}
`;

writeFileSync(ENV_PATH, env);
finished = true;
rl.close();

console.log(`
${c.green('✔ Gata!')} Am scris fisierul ${c.bold('.env')}.

${c.bold('Mai departe, doua comenzi:')}

   ${c.cyan('npm run deploy')}   ${c.dim('# inregistreaza comenzile / la Discord (o singura data)')}
   ${c.cyan('npm start')}        ${c.dim('# porneste botul')}

Cand botul apare ${c.green('online')} pe server, scrie in orice canal:

   ${c.bold('/setup server')}

...si iti construieste tot serverul. 🩸
`);
