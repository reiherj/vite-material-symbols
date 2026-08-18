import { describe, expect, it } from 'vitest';
import * as fk from 'fontkit';
import { loadIconTable } from './icons';
import { subsetIcons } from './subset';

const fontkit = (fk as any).default ?? fk;
const table = loadIconTable();
const ICONS = ['home', 'menu', 'person', 'settings', 'search'];

describe('subsetIcons', () => {
  it('keeps all four variation axes so they stay adjustable at runtime', async () => {
    const { font } = await subsetIcons(ICONS, table, 'truetype');
    const parsed = fontkit.create(font);

    expect(Object.keys(parsed.variationAxes).sort()).toEqual(['FILL', 'GRAD', 'opsz', 'wght']);
    expect(parsed.variationAxes.wght).toMatchObject({ min: 100, max: 700 });
    expect(parsed.variationAxes.FILL).toMatchObject({ min: 0, max: 1 });
  }, 30_000);

  it('still resolves each icon name to a single glyph via rlig', async () => {
    const { font } = await subsetIcons(ICONS, table, 'truetype');
    const parsed = fontkit.create(font);

    expect(parsed.availableFeatures).toContain('rlig');
    for (const name of ICONS) {
      expect(parsed.layout(name).glyphs, name).toHaveLength(1);
    }
  }, 30_000);

  it('excludes icons that were not requested', async () => {
    const { font } = await subsetIcons(ICONS, table, 'truetype');
    const parsed = fontkit.create(font);

    // "wifi" was not subsetted in, so it stays as separate letter glyphs.
    expect(parsed.layout('wifi').glyphs.length).toBeGreaterThan(1);
  }, 30_000);

  /**
   * Regression guard. Enabling HarfBuzz layout closure makes the subset follow
   * rlig from the supplied letters to every ligature they can spell — ~4600
   * glyphs and 2.7MB instead of ~40 and 15KB. It fails silently as a size
   * blowup rather than a broken build, so it is asserted explicitly.
   */
  it('stays proportional to the icons requested', async () => {
    const { font } = await subsetIcons(ICONS, table, 'truetype');
    const parsed = fontkit.create(font);

    const distinctLetters = new Set(ICONS.join('')).size;
    expect(parsed.numGlyphs).toBeLessThanOrEqual(ICONS.length + distinctLetters + 5);
  }, 30_000);
});
