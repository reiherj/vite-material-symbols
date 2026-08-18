import type { CSSProperties, HTMLAttributes } from 'react';
// `?inline` keeps the CSS an editable file while landing it in the bundle as a
// string. A plain import would be extracted to a separate stylesheet in lib
// mode and the import stripped, leaving consumers with unstyled ligature text.
import symbolsCss from './symbols.css?inline';

const FONT_FAMILY = 'Material Symbols Outlined';

let registered = false;

/**
 * Injects the base styles and the `@font-face` rule. Both go in together
 * because the font URL is only known after the build has hashed the subsetted
 * font, so it cannot live in a static stylesheet.
 *
 * `font-display: block` matters here: the element's text content is the
 * ligature name, so with `swap` the literal word "home" would flash before
 * the font loads.
 */
export function registerFontFace(url: string): void {
  if (registered || typeof document === 'undefined') return;
  registered = true;

  const style = document.createElement('style');
  style.dataset['viteMatSymbols'] = '';
  style.textContent =
    symbolsCss +
    `@font-face{font-family:'${FONT_FAMILY}';` +
    `src:url(${JSON.stringify(url)}) format(${JSON.stringify(
      url.endsWith('.ttf') ? 'truetype' : 'woff2'
    )});` +
    `font-style:normal;font-weight:100 700;font-display:block}`;
  document.head.appendChild(style);
}

/** Resolved values for the font's four variation axes. */
export interface Axes {
  wght: number;
  FILL: number;
  GRAD: number;
  opsz: number;
}

export const DEFAULT_AXES: Axes = { wght: 400, FILL: 0, GRAD: 0, opsz: 24 };

/**
 * Axis order must stay stable between renders: the browser can only
 * interpolate two `font-variation-settings` values that list the same axes in
 * the same order, and a mismatch silently degrades to a hard switch.
 */
function axisCss({ wght, FILL, GRAD, opsz }: Axes): string {
  return `'FILL' ${FILL}, 'GRAD' ${GRAD}, 'opsz' ${opsz}, 'wght' ${wght}`;
}

export interface SymbolProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Axis `wght`, 100-700. */
  weight?: number;
  /** Axis `FILL`, 0-1. Fractional values are valid and animate smoothly. */
  fill?: number;
  /** Axis `GRAD`, -50-200. */
  grade?: number;
  /** Axis `opsz`, 20-48. */
  opticalSize?: number;
  /** Rendered size; any CSS length. Defaults to 24px. */
  size?: number | string;
  /** Transition duration for axis changes, e.g. `'200ms'`. */
  duration?: string;
  /**
   * Accessible name. Omit for decorative icons — they are then hidden from
   * assistive technology, which is the right default for an icon sitting
   * next to its own text label.
   */
  label?: string;
}

interface InternalProps extends SymbolProps {
  name: string;
  defaults: Axes;
}

function MaterialSymbol({
  name,
  defaults,
  weight,
  fill,
  grade,
  opticalSize,
  size,
  duration,
  label,
  className,
  style,
  ...rest
}: InternalProps) {
  const vars: Record<string, string | number> = {
    fontVariationSettings: axisCss({
      wght: weight ?? defaults.wght,
      FILL: fill ?? defaults.FILL,
      GRAD: grade ?? defaults.GRAD,
      opsz: opticalSize ?? defaults.opsz,
    }),
  };
  if (size !== undefined) vars['--ms-size'] = typeof size === 'number' ? `${size}px` : size;
  if (duration !== undefined) vars['--ms-duration'] = duration;

  const a11y = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };

  return (
    <span
      {...rest}
      {...a11y}
      className={className ? `vite-mat-symbol ${className}` : 'vite-mat-symbol'}
      style={{ ...vars, ...style } as CSSProperties}
    >
      {name}
    </span>
  );
}

/**
 * Builds the component for one icon. The element's text content is the
 * ligature name, which the font's `rlig` feature substitutes for the glyph.
 */
export function createSymbol(name: string, defaults: Axes = DEFAULT_AXES) {
  const Symbol = (props: SymbolProps) => (
    <MaterialSymbol name={name} defaults={defaults} {...props} />
  );
  Symbol.displayName = `MaterialSymbol(${name})`;
  return Symbol;
}
