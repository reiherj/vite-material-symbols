import type { Plugin } from 'vite';
import { get_icon } from './font';
import { iconMapping, supportedExports } from './mappings';

export const materialSymbolsPlugin = (): Plugin => {
  const VIRTUAL_ID = 'vite-mat-symbols';
  const RESOLVED_ID = '\0virtual:' + VIRTUAL_ID;

  const ICON_PREFIX = VIRTUAL_ID + ':';
  const RESOLVED_ICON_PREFIX = '\0virtual:' + ICON_PREFIX;

  return {
    name: 'vite:material-symbols',
    enforce: 'pre',
    resolveId(id) {
      // Resolve barrel mod
      if (id === VIRTUAL_ID) return RESOLVED_ID;

      if (id.startsWith(ICON_PREFIX)) {
        const glyph = id.split(':')[1];

        return RESOLVED_ICON_PREFIX + glyph;
      }
    },
    async load(id) {
      // Split into multiple imports
      if (id === RESOLVED_ID) {
        const lines = supportedExports.map((exp) => {
          const glyph = iconMapping[exp];

          return `export { default as ${exp} } from '${ICON_PREFIX}${glyph}';`;
        });

        return lines.join('\n');
      }

      // Per-icon virtual module source
      if (id.startsWith(RESOLVED_ICON_PREFIX)) {
        const glyph = id.slice(RESOLVED_ICON_PREFIX.length);
        const svg = get_icon(glyph, 350);

        return `
          import { jsx as _jsx } from 'react/jsx-runtime';
          export default function() { 
          
            return _jsx('div', {
              dangerouslySetInnerHTML: { __html: ${JSON.stringify(svg)} } 
            });
          }
        `;
      }
    },
  };
};
