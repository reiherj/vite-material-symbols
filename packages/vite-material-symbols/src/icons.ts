import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Shipped alongside the package; see project.json `assets`. */
export const FONT_DIR = join(here, '..', 'font');
export const FONT_TTF = join(FONT_DIR, 'material-symbols-outlined.ttf');
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
