# vite-material-symbols

A Vite plugin that ships only the Material Symbols an app actually imports, as a
**subsetted variable font** — so weight, fill, grade and optical size stay
adjustable at runtime.

```tsx
import { Home, Favorite } from 'vite-mat-symbols';

<Home />
<Favorite size={48} fill={liked ? 1 : 0} weight={liked ? 600 : 400} duration="300ms" />
```

## Why a font and not SVG

Pre-generated SVG paths cannot interpolate between axis values. A variable font
can, so `fill` can animate from 0 to 1 instead of snapping — which is how
Material Symbols' own fill transitions work.

The cost of a font is normally its size: the full variable Material Symbols is
~3.4MB as woff2, of which `gvar` (the variation deltas) is the overwhelming
majority. Subsetting to the icons you import removes almost all of it. A
7-icon app emits **8.9 KB**.

## Setup

```ts
// vite.config.ts
import { materialSymbolsPlugin } from 'vite-material-symbols';

export default defineConfig({
  plugins: [
    react(),
    materialSymbolsPlugin({ weight: 400, fill: 0, grade: 0, opticalSize: 24 }),
  ],
});
```

Add the ambient types so icon names autocomplete:

```jsonc
// tsconfig.json
{ "include": ["node_modules/vite-material-symbols/client.d.ts", "src"] }
```

## Props

| Prop | Axis | Range | Default |
|---|---|---|---|
| `weight` | `wght` | 100–700 | 400 |
| `fill` | `FILL` | 0–1, fractional allowed | 0 |
| `grade` | `GRAD` | -50–200 | 0 |
| `opticalSize` | `opsz` | 20–48 | 24 |
| `size` | — | any CSS length | 24px |
| `duration` | — | transition time for axis changes | 0s |
| `label` | — | accessible name; omit for decorative icons | — |

Icons render as ligature text (`<span>home</span>`), so the DOM stays readable.
Without a `label` they are `aria-hidden`, which is the right default for an icon
sitting beside its own text.

## How usage is detected

The plugin scans `import { … } from 'vite-mat-symbols'` statements to decide what
to subset. It cannot do this from the module graph: Rollup loads every module a
barrel re-exports *before* tree-shaking, so all ~4000 icons would look used.

A wildcard import (`import * as icons`) defeats static analysis. The plugin warns
and falls back to emitting the full font.

## Dev vs build

Dev serves the whole font uncompressed — the used-icon set is never complete
while modules load lazily, and compressing 10MB to woff2 on the first request
takes long enough that `font-display: block` gives up and paints the ligature
name as text. Production emits the exact subset as woff2.

## Regenerating types

`client.d.ts` is generated from the shipped `.codepoints` file:

```sh
nx run vite-material-symbols:generate-types
```

## Attribution

Icons derive from Google's Material Symbols, licensed under the Apache License 2.0.
