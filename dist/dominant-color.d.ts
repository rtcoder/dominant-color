interface PrimaryColor {
    rgb: string;
    count: number;
}
interface DominantColorOptions {
    downScaleFactor: number;
    skipPixels: number;
    colorsPaletteLength: number;
    paletteWithCountOfOccurrences: boolean;
    callback: DominantColorCallback;
}
declare type DominantColorCallback = (color: string, colors: (string[]) | (PrimaryColor[])) => void;
export declare function getDominantColor(element: HTMLImageElement, options: DominantColorOptions): void;
export {};
