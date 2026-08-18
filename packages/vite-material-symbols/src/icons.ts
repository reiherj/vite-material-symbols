import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const TTF_NAME = 'material-symbols-outlined.ttf';

/**
 * The font sits next to the package root, but this module's depth differs
 * between layouts: `src/icons.ts` during development, flattened to the package
 * root once built. Probing both keeps a published install working without
 * making the source tree pretend to be the built one.
 */
function resolveFontDir(): string {
  const candidates = [
    join(here, 'font'), // built: this module is at the package root
    join(here, '..', 'font'), // source: this module is in src/
  ];

  const found = candidates.find((dir) => existsSync(join(dir, TTF_NAME)));
  if (!found) {
    throw new Error(
      `[vite-material-symbols] could not locate ${TTF_NAME}. Looked in:\n` +
        candidates.map((c) => `  ${c}`).join('\n')
    );
  }
  return found;
}

export const FONT_DIR = resolveFontDir();
export const FONT_TTF = join(FONT_DIR, TTF_NAME);
export const CODEPOINTS = join(FONT_DIR, 'material-symbols-outlined.codepoints');

/** Upstream ships a misspelled duplicate of `fluorescent`. */
const EXCLUDED = new Set(['flourescent']);

export interface IconTable {
  /** Ligature name -> hex codepoint, e.g. "home" -> "e88a". */
  codepoints: Map<string, string>;
  /** Exported identifier -> ligature name, e.g. "Home" -> "home". */
  exports: Map<string, string>;
}

/**
 * `menu_open` -> `MenuOpen`. Identifiers may not start with a digit, so
 * `10k` becomes `Icon10k`.
 */
export function toExportName(ligature: string): string {
  const pascal = ligature
    .split('_')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

  return /^[0-9]/.test(pascal) ? `Icon${pascal}` : pascal;
}

let cached: IconTable | undefined;

/** Parses the `.codepoints` file shipped with the font. Cached per process. */
export function loadIconTable(codepointsPath = CODEPOINTS): IconTable {
  if (cached) return cached;

  const codepoints = new Map<string, string>();
  const exports = new Map<string, string>();

  for (const line of readFileSync(codepointsPath, 'utf8').split('\n')) {
    const [name, hex] = line.trim().split(/\s+/);
    if (!name || !hex || EXCLUDED.has(name)) continue;

    codepoints.set(name, hex);
    exports.set(toExportName(name), name);
  }

  cached = { codepoints, exports };
  return cached;
}

/**
 * The subset text for a set of icons: the characters needed to type each
 * ligature, plus each icon's codepoint so its glyph is retained explicitly.
 *
 * Requesting the glyphs by codepoint is essential — relying on HarfBuzz's
 * layout closure to reach them from the letters instead pulls in every icon
 * whose name is spellable with those letters (~4600 glyphs, 2.7MB).
 */
export function subsetText(names: Iterable<string>, table: IconTable): string {
  const chars = new Set<string>();

  for (const name of names) {
    const hex = table.codepoints.get(name);
    if (!hex) continue;
    for (const c of name) chars.add(c);
    chars.add(String.fromCodePoint(parseInt(hex, 16)));
  }

  return [...chars].join('');
}
