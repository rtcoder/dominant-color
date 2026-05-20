export declare type ColorFormat = 'rgb' | 'hsl' | 'hex';
export declare type ColorQuantization = 'exact' | 'bucket' | 'median-cut';
export declare type DominantColorSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | string | Blob;
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
export declare type DominantColorCallback = (dominant: string, colorsPalette: string[] | PrimaryColor[]) => void;
export declare type DominantColorErrorCallback = (error: Error) => void;
export interface DominantColorResult {
    dominant: string;
    colorsPalette: string[] | PrimaryColor[];
}
