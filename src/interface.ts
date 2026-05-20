export type ColorFormat = 'rgb' | 'hsl' | 'hex';
export type ColorQuantization = 'exact' | 'bucket';

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
  colorBucketSize: number;
  colorGroupingThreshold: number;
  colorQuantization: ColorQuantization;
  paletteWithCountOfOccurrences: boolean;
  colorFormat: ColorFormat;
  callback: DominantColorCallback;
  errorCallback: DominantColorErrorCallback;
}

export type DominantColorCallback = (dominant: string, colorsPalette: string[] | PrimaryColor[]) => void;
export type DominantColorErrorCallback = (error: Error) => void;

export interface DominantColorResult {
  dominant: string;
  colorsPalette: string[] | PrimaryColor[];
}
