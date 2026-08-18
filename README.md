# vite-material-symbols

A Vite plugin that ships only the Material Symbols your app imports, as a
subsetted **variable** font — keeping weight, fill, grade and optical size
adjustable (and animatable) at runtime.

A 7-icon app emits 8.9 KB, against ~3.4MB for the full variable font.

- **`packages/vite-material-symbols`** — the plugin. See its [README](packages/vite-material-symbols/README.md).
- **`apps/web-react-test-app`** — a demo exercising runtime axis switching.

```sh
npm install
npx nx dev web-react-test-app
npx vitest run --root packages/vite-material-symbols
```

## Attributions

This library includes icons derived from Google's Material Symbols, which are
licensed under the Apache License 2.0.
