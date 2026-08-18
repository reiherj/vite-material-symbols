/** Neither package ships types; these cover the surface actually used. */

declare module 'subset-font' {
  export interface SubsetOptions {
    targetFormat?: 'truetype' | 'woff' | 'woff2' | 'sfnt';
    preserveNameIds?: number[];
    /**
     * Pins an axis to a value, or narrows its range. Omit entirely to keep
     * every axis fully variable.
     */
    variationAxes?: Record<string, number | { min: number; max: number; default: number }>;
    /**
     * Skips HarfBuzz's layout closure. Required for this font: with closure on,
     * the subset follows `rlig` from the supplied letters to every ligature
     * they can spell.
     */
    noLayoutClosure?: boolean;
  }

  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: SubsetOptions
  ): Promise<Buffer>;
}

declare module 'fontverter' {
  export function convert(
    font: Buffer,
    targetFormat: 'truetype' | 'woff' | 'woff2' | 'sfnt',
    sourceFormat?: string
  ): Promise<Buffer>;

  export function detectFormat(font: Buffer): string | undefined;

  const fontverter: { convert: typeof convert; detectFormat: typeof detectFormat };
  export default fontverter;
}
