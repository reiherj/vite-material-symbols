import { readFileSync } from 'node:fs';
import subsetFont from 'subset-font';
import { FONT_TTF, subsetText, type IconTable } from './icons';

let original: Buffer | undefined;

function originalFont(): Buffer {
  original ??= readFileSync(FONT_TTF);
  return original;
}

export interface SubsetResult {
  font: Buffer;
  /** Number of icons the subset was built for, for logging and tests. */
  iconCount: number;
}

/**
 * Subsets the variable font down to `names`, keeping all four variation axes
 * so weight/fill/grade/optical-size stay adjustable at runtime.
 *
 * `noLayoutClosure` is required: with closure enabled HarfBuzz walks the `rlig`
 * rules from the supplied letters out to every ligature they can spell, which
 * for this font means ~4600 glyphs instead of ~44.
 */
export async function subsetIcons(
  names: Iterable<string>,
  table: IconTable,
  targetFormat: 'woff2' | 'woff' | 'truetype' = 'woff2'
): Promise<SubsetResult> {
  const list = [...names];
  const text = subsetText(list, table);

  const font = await subsetFont(originalFont(), text, {
    noLayoutClosure: true,
    targetFormat,
  });

  return { font, iconCount: list.length };
}

/** The unsubsetted font, converted for the browser. Used by the dev server. */
export async function fullFont(
  targetFormat: 'woff2' | 'woff' | 'truetype' = 'woff2'
): Promise<Buffer> {
  const table = readFileSync(FONT_TTF);
  if (targetFormat === 'truetype') return table;

  const { default: fontverter } = await import('fontverter');
  return fontverter.convert(table, targetFormat);
}
