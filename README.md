# vite-material-symbols

A Vite plugin that ships only the Material Symbols your app imports, as a
subsetted **variable** font, so weight, fill, grade and optical size stay
adjustable and animatable at runtime. The example 7-icon app emits ~8.9 KB against ~3.4 MB
for the full font.

Work in progress.

## Develop

```sh
npm install
npx nx dev web-react-test-app   # demo on :4200, exercises runtime axis switching
```

| Command | Does |
| --- | --- |
| `npx nx build web-react-test-app` | Build the demo and log the emitted subset size |
| `npx nx build vite-material-symbols` | Build the publishable package into `dist/` |
| `npx vitest run --root packages/vite-material-symbols` | 29 tests, ~2 min |
| `npx nx run vite-material-symbols:generate-types` | Regenerate `client.d.ts` |

## Layout

```
packages/vite-material-symbols/   The plugin, the only thing that ships
  src/index.ts                    Virtual modules, usage scanning, font emission, dev middleware
  src/subset.ts                   subset-font wrapper
  src/icons.ts                    .codepoints parsing, name transforms, subset text
  src/runtime.tsx                 React component and @font-face injection
  font/                           9.7 MB TTF + .codepoints, read at build time
  client.d.ts                     Generated, 4093 icons
apps/web-react-test-app/          Demo
```

## Things worth knowing

Subsetting needs `noLayoutClosure: true` and explicit PUA codepoints. Layout
closure works on characters, not words, so reaching the glyphs through the
ligature letters drags in every icon spellable with them. That is 4,630 glyphs
and 2,743 KB instead of 44 and 15.1 KB.

Usage comes from scanning `import { … } from 'vite-mat-symbols'` statements, not
from the module graph. Rollup loads every barrel re-export before tree-shaking,
so the graph claims all 4,000 icons are used.

Axes are inline `font-variation-settings`, not `@property` custom properties,
which React's style updates never transition. Keep the axis order stable between
renders or the browser hard-switches instead of interpolating.

Dev serves the raw TTF on purpose.
## Todo

- [ ] CI matrix over Vite versions, then a peer range that matches it
- [ ] Import scanning is regex-based, so barrel re-exports under-subset and wildcard
  [ ] imports fall back to the full font
- [ ] Runtime is React-only
- [ ] Ship both licenses in the tarball (root MIT, font Apache-2.0)
- [ ] Publish to npm

## Attributions

Icons derive from Google's Material Symbols, licensed under the Apache License 2.0.
