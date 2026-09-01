import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { Collection } from 'discord.js';
import { console_ } from '../lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = join(__dirname, '..', 'commands');

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (entry.endsWith('.js')) files.push(full);
  }
  return files;
}

/** Incarca toate comenzile din /src/commands (recursiv). */
export async function loadCommands() {
  const commands = new Collection();
  for (const file of walk(COMMANDS_DIR)) {
    const mod = await import(pathToFileURL(file).href);
    const command = mod.default ?? mod.command;
    if (!command?.data || typeof command.execute !== 'function') {
      console_.warn(`Comanda invalida (lipseste data/execute): ${file}`);
      continue;
    }
    command.category = file.split(/[\\/]/).at(-2);
    commands.set(command.data.name, command);
  }
  console_.ok(`Am incarcat ${commands.size} comenzi slash.`);
  return commands;
}

export function toJSON(commands) {
  return [...commands.values()].map((c) => c.data.toJSON());
}
