/**
 * Imaginile din folderul /assets — banere, icon, poza de bun venit.
 * Se ataseaza la embed-uri ca sa arate ca un server profesionist.
 *
 * Le regenerezi/modifici cu:  python3 scripts/generate-assets.py
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AttachmentBuilder } from 'discord.js';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets');

export function assetPath(name) {
  const path = join(ASSETS, name);
  return existsSync(path) ? path : null;
}

/** Atasamentul pentru un embed. Returneaza null daca imaginea lipseste. */
export function asset(name) {
  const path = assetPath(name);
  return path ? new AttachmentBuilder(path, { name }) : null;
}

/** Adresa de folosit in embed.setImage() pentru o imagine atasata. */
export function assetUrl(name) {
  return `attachment://${name}`;
}

/**
 * Pune imaginea pe embed si intoarce lista de fisiere pentru mesaj.
 * Daca imaginea nu exista, embed-ul ramane neschimbat.
 */
export function withBanner(embed, name, thumbnail = false) {
  const file = asset(name);
  if (!file) return [];
  if (thumbnail) embed.setThumbnail(assetUrl(name));
  else embed.setImage(assetUrl(name));
  return [file];
}
