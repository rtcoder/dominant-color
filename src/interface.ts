export type ColorFormat = 'rgb' | 'hsl' | 'hex';

export interface PrimaryColor {
  color: string;
  count: number;
}

export interface Colors {
  [key: string]: number;
}

export interface DominantColorOptions {
  downScaleFactor: number;
  skipPixels: number;
  colorsPaletteLength: number;
  paletteWithCountOfOccurrences: boolean;
  colorFormat: ColorFormat;
  callback: DominantColorCallback;
}

export type DominantColorCallback = (dominant: string, colorsPalette: string[] | PrimaryColor[]) => void;
