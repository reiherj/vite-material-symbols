import { describe, expect, it } from 'vitest';
import { loadIconTable, subsetText, toExportName } from './icons';

describe('toExportName', () => {
  it('pascal-cases snake_case ligature names', () => {
    expect(toExportName('menu_open')).toBe('MenuOpen');
    expect(toExportName('arrow_forward')).toBe('ArrowForward');
    expect(toExportName('home')).toBe('Home');
  });

  it('prefixes names that would start with a digit', () => {
    expect(toExportName('10k')).toBe('Icon10k');
    expect(toExportName('3d_rotation')).toBe('Icon3dRotation');
  });

  it('tolerates repeated and trailing underscores', () => {
    expect(toExportName('a__b_')).toBe('AB');
  });
});

describe('loadIconTable', () => {
  const table = loadIconTable();

  it('parses the shipped codepoints file', () => {
    expect(table.codepoints.size).toBeGreaterThan(4000);
    expect(table.codepoints.get('home')).toMatch(/^[0-9a-f]+$/);
  });

  it('maps export names back to ligature names', () => {
    expect(table.exports.get('ArrowForward')).toBe('arrow_forward');
  });

  it('drops the upstream misspelling of fluorescent', () => {
    expect(table.codepoints.has('flourescent')).toBe(false);
    expect(table.codepoints.has('fluorescent')).toBe(true);
  });
});

describe('subsetText', () => {
  const table = loadIconTable();

  it('includes both the ligature letters and the icon codepoint', () => {
    const text = subsetText(['home'], table);
    for (const c of 'home') expect(text).toContain(c);

    const cp = String.fromCodePoint(parseInt(table.codepoints.get('home')!, 16));
    expect(text).toContain(cp);
  });

  it('deduplicates characters shared between icon names', () => {
    const text = subsetText(['home', 'home'], table);
    expect(new Set(text).size).toBe(text.length);
  });

  it('ignores unknown icon names', () => {
    expect(subsetText(['definitely_not_an_icon'], table)).toBe('');
  });
});
