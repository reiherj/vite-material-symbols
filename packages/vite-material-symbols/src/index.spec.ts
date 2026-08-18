import { describe, expect, it } from 'vitest';
import * as fk from 'fontkit';
import { materialSymbolsPlugin } from './index';

const fontkit = (fk as any).default ?? fk;

/** Minimal stand-ins for the Vite/Rollup context the plugin uses. */
function setup(command: 'build' | 'serve' = 'build') {
  const plugin = materialSymbolsPlugin() as any;
  const emitted: any[] = [];
  const ctx = {
    emitFile: (f: any) => (emitted.push(f), `ref${emitted.length}`),
    setAssetSource: () => undefined,
    warn: () => undefined,
  };

  plugin.configResolved({ command, base: '/', logger: { info: () => undefined } });
  plugin.buildStart.call(ctx);
  return { plugin, ctx, emitted };
}

describe('resolveId', () => {
  const { plugin } = setup();

  it('claims the barrel', () => {
    expect(plugin.resolveId('vite-mat-symbols')).toBe('\0vms:barrel');
  });

  it('claims a per-icon id for a real icon', () => {
    expect(plugin.resolveId('vite-mat-symbols:home')).toBe('\0vms:icon:home');
  });

  it('declines an unknown icon rather than emitting a broken module', () => {
    expect(plugin.resolveId('vite-mat-symbols:not_an_icon')).toBeNull();
  });

  it('ignores unrelated ids', () => {
    expect(plugin.resolveId('react')).toBeNull();
  });
});

describe('load', () => {
  const { plugin } = setup();

  it('emits one module for the whole barrel, not one re-export per icon', () => {
    const code = plugin.load('\0vms:barrel');
    expect(code).not.toContain('export {');
    expect(code).toContain('export const Home =');
    // PURE annotations are what let Rollup drop the unused ones.
    expect(code).toContain('/*#__PURE__*/');
  });

  it('renders the ligature name as the icon module', () => {
    expect(plugin.load("\0vms:icon:home")).toContain(`createSymbol("home"`);
  });
});

describe('usage tracking', () => {
  /**
   * Drives the plugin the way Rollup would and returns the icons that actually
   * made it into the subsetted font. This is the behaviour that matters: usage
   * is scanned from import statements rather than counted from `load` calls,
   * because Rollup loads every module a barrel re-exports before tree-shaking.
   */
  async function iconsInFont(sources: Array<[string, string]>) {
    const plugin = materialSymbolsPlugin() as any;
    let font: Buffer | undefined;
    const warnings: string[] = [];
    const ctx = {
      emitFile: () => 'ref1',
      setAssetSource: (_id: string, source: Buffer) => (font = source),
      warn: (msg: string) => warnings.push(msg),
    };

    plugin.configResolved({ command: 'build', base: '/', logger: { info: () => undefined } });
    plugin.buildStart.call(ctx);
    for (const [code, id] of sources) plugin.transform.call(ctx, code, id);
    await plugin.renderStart.call(ctx);

    const parsed = fontkit.create(font!);
    return {
      resolves: (name: string) => parsed.layout(name).glyphs.length === 1,
      glyphs: parsed.numGlyphs,
      warnings,
    };
  }

  it('subsets to exactly the icons that were imported', async () => {
    const font = await iconsInFont([
      [`import { Home, ArrowForward } from 'vite-mat-symbols';`, '/app.tsx'],
    ]);

    expect(font.resolves('home')).toBe(true);
    expect(font.resolves('arrow_forward')).toBe(true);
    expect(font.resolves('settings')).toBe(false);
  }, 30_000);

  it('handles aliased and multi-line imports', async () => {
    const font = await iconsInFont([
      [`import {\n  Home as HouseIcon,\n  Search,\n} from 'vite-mat-symbols';`, '/a.tsx'],
    ]);

    expect(font.resolves('home')).toBe(true);
    expect(font.resolves('search')).toBe(true);
  }, 30_000);

  it('unions icons across several source files', async () => {
    const font = await iconsInFont([
      [`import { Home } from 'vite-mat-symbols';`, '/a.tsx'],
      [`import { Search } from 'vite-mat-symbols';`, '/b.tsx'],
    ]);

    expect(font.resolves('home')).toBe(true);
    expect(font.resolves('search')).toBe(true);
  }, 30_000);

  it('falls back to the whole font when a wildcard import defeats tracking', async () => {
    const font = await iconsInFont([
      [`import * as icons from 'vite-mat-symbols';`, '/a.tsx'],
    ]);

    // Nothing was statically knowable, so everything has to ship. Slow by
    // nature: this is the one path that subsets the entire font.
    expect(font.glyphs).toBeGreaterThan(3000);
    expect(font.warnings.join('\n')).toMatch(/wildcard import/);
  }, 120_000);

  it('skips files that cannot reference icons', () => {
    const plugin = materialSymbolsPlugin() as any;
    plugin.configResolved({ command: 'build', base: '/', logger: { info: () => undefined } });
    plugin.buildStart.call({ emitFile: () => 'r', setAssetSource: () => undefined, warn: () => undefined });

    expect(plugin.transform('body{color:red}', '/a.css')).toBeNull();
    expect(plugin.transform("import { Home } from 'vite-mat-symbols'", '/node_modules/x/i.js')).toBeNull();
  });

  it('returns null so it never rewrites user source', () => {
    const { plugin } = setup();
    expect(plugin.transform(`import { Home } from 'vite-mat-symbols';`, '/app.tsx')).toBeNull();
  });
});

describe('build wiring', () => {
  it('reserves the font asset up front so the CSS can reference its final URL', () => {
    const { emitted } = setup('build');
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({ type: 'asset', name: 'material-symbols.woff2' });
    expect(emitted[0].source).toBeUndefined();
  });

  it('emits no asset in dev, where the full font is served instead', () => {
    const { emitted } = setup('serve');
    expect(emitted).toHaveLength(0);
  });

  it('points the font-face module at the dev middleware when serving', () => {
    const { plugin } = setup('serve');
    expect(plugin.load('\0vms:font-face')).toContain('/@vite-mat-symbols/font.ttf');
  });

  it('points the font-face module at the hashed asset when building', () => {
    const { plugin } = setup('build');
    expect(plugin.load('\0vms:font-face')).toContain('import.meta.ROLLUP_FILE_URL_');
  });
});
