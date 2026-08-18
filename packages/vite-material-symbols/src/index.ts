import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { loadIconTable, type IconTable } from './icons';
import { fullFont, subsetIcons } from './subset';

export type { SymbolProps } from './runtime';

const BARREL = 'vite-mat-symbols';
const ICON_PREFIX = `${BARREL}:`;

const RESOLVED_BARREL = '\0vms:barrel';
const RESOLVED_ICON = '\0vms:icon:';
const RESOLVED_FONT_FACE = '\0vms:font-face';

const RUNTIME = 'vite-material-symbols/runtime';
const DEV_FONT_PATH = '/@vite-mat-symbols/font.ttf';

/** Files worth scanning for icon imports. */
const SCANNABLE = /\.(?:[jt]sx?|mjs|cjs|vue|svelte|astro)(?:\?|$)/;
const BARREL_IMPORT = new RegExp(
  `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${BARREL}['"]`,
  'g'
);

export interface MaterialSymbolsOptions {
  /** Default axis `wght` (100-700). */
  weight?: number;
  /** Default axis `FILL` (0-1). */
  fill?: number;
  /** Default axis `GRAD` (-50-200). */
  grade?: number;
  /** Default axis `opsz` (20-48). */
  opticalSize?: number;
  /** Output font format. Defaults to `woff2`. */
  format?: 'woff2' | 'woff';
}

export function materialSymbolsPlugin(options: MaterialSymbolsOptions = {}): Plugin {
  const { format = 'woff2' } = options;

  /** Defaults baked into every generated icon module. */
  const axes = JSON.stringify({
    wght: options.weight ?? 400,
    FILL: options.fill ?? 0,
    GRAD: options.grade ?? 0,
    opsz: options.opticalSize ?? 24,
  });

  let table: IconTable;
  let config: ResolvedConfig;
  let isBuild = false;
  let fontRefId: string | undefined;

  /** Ligature names referenced anywhere in the app. Drives the subset. */
  const used = new Set<string>();
  /** Set when a wildcard import makes static tracking unreliable. */
  let trackingBroken = false;

  const iconModule = (name: string) =>
    `import { createSymbol } from ${JSON.stringify(RUNTIME)};\n` +
    `import ${JSON.stringify(RESOLVED_FONT_FACE)};\n` +
    `export default /*#__PURE__*/ createSymbol(${JSON.stringify(name)}, ${axes});\n`;

  function barrelModule(): string {
    const lines = [
      `import { createSymbol } from ${JSON.stringify(RUNTIME)};`,
      `import ${JSON.stringify(RESOLVED_FONT_FACE)};`,
    ];

    // A single module rather than 4000 re-exports: in dev that is one request
    // instead of one per icon, and in build the PURE annotations let Rollup
    // drop the ones nobody imported.
    for (const [exportName, ligature] of table.exports) {
      lines.push(
        `export const ${exportName} = ` +
          `/*#__PURE__*/ createSymbol(${JSON.stringify(ligature)}, ${axes});`
      );
    }

    return lines.join('\n');
  }

  function fontFaceModule(): string {
    const url = isBuild
      ? `import.meta.ROLLUP_FILE_URL_${fontRefId}`
      : JSON.stringify(config.base.replace(/\/$/, '') + DEV_FONT_PATH);

    return (
      `import { registerFontFace } from ${JSON.stringify(RUNTIME)};\n` +
      `registerFontFace(${url});\n`
    );
  }

  return {
    name: 'vite:material-symbols',
    enforce: 'pre',

    configResolved(resolved) {
      config = resolved;
      isBuild = resolved.command === 'build';
      table = loadIconTable();
    },

    buildStart() {
      used.clear();
      trackingBroken = false;

      if (!isBuild) return;

      // Emitted without a source; filled in at renderStart, once every module
      // has been scanned and the used-icon set is final.
      fontRefId = this.emitFile({
        type: 'asset',
        name: `material-symbols.${format}`,
      });
    },

    resolveId(id) {
      if (id === BARREL) return RESOLVED_BARREL;
      if (id === RESOLVED_FONT_FACE) return RESOLVED_FONT_FACE;

      if (id.startsWith(ICON_PREFIX)) {
        const name = id.slice(ICON_PREFIX.length);
        return table.codepoints.has(name) ? RESOLVED_ICON + name : null;
      }

      return null;
    },

    load(id) {
      if (id === RESOLVED_BARREL) return barrelModule();
      if (id === RESOLVED_FONT_FACE) return fontFaceModule();

      if (id.startsWith(RESOLVED_ICON)) {
        const name = id.slice(RESOLVED_ICON.length);
        used.add(name);
        return iconModule(name);
      }

      return null;
    },

    /**
     * Usage is collected here rather than from the module graph. Rollup loads
     * every module a barrel re-exports before it tree-shakes, so counting
     * `load` calls would mark all ~4000 icons as used and defeat subsetting.
     * Scanning the import statements in source is exact for the common cases.
     */
    transform(code, id) {
      if (!SCANNABLE.test(id) || id.includes('node_modules')) return null;
      if (!code.includes(BARREL)) return null;

      if (new RegExp(`import\\s+\\*\\s+as\\s+\\w+\\s+from\\s*['"]${BARREL}['"]`).test(code)) {
        trackingBroken = true;
        return null;
      }

      for (const match of code.matchAll(BARREL_IMPORT)) {
        for (const spec of match[1].split(',')) {
          const local = spec.trim().split(/\s+as\s+/)[0].trim();
          const ligature = table.exports.get(local);
          if (ligature) used.add(ligature);
        }
      }

      return null;
    },

    async renderStart() {
      if (!isBuild || !fontRefId) return;

      if (trackingBroken) {
        this.warn(
          `[vite-material-symbols] a wildcard import of '${BARREL}' was found; ` +
            `the font cannot be subsetted and the full ~3MB variable font will be ` +
            `emitted. Use named imports to keep the subset small.`
        );
      }

      const names = trackingBroken ? [...table.codepoints.keys()] : [...used];
      const { font } = await subsetIcons(names, table, format);

      this.setAssetSource(fontRefId, font);

      config.logger.info(
        `[vite-material-symbols] subsetted ${names.length} icons ` +
          `into ${(font.length / 1024).toFixed(1)} KB ${format}`
      );
    },

    configureServer(server: ViteDevServer) {
      // The used-icon set is never complete in dev, because modules load
      // lazily, so the whole font is served instead. It is deliberately *not*
      // compressed to woff2 here: encoding the 10MB font costs ~30s on first
      // request, long enough for `font-display: block` to give up and paint
      // the ligature name as literal text. Uncompressed over localhost is
      // an order of magnitude faster, and never reaches production.
      let cached: Buffer | undefined;

      server.middlewares.use(DEV_FONT_PATH, async (_req, res) => {
        try {
          cached ??= await fullFont('truetype');
          res.setHeader('Content-Type', 'font/ttf');
          res.setHeader('Cache-Control', 'max-age=31536000,immutable');
          res.end(cached);
        } catch (err) {
          res.statusCode = 500;
          res.end(String(err));
        }
      });
    },
  };
}

export default materialSymbolsPlugin;
