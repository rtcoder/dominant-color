interface DominantColorOptions {
    downScaleFactor: number;
    skipPixels: number;
    colorsPaletteLength: number;
    callback: DominantColorCallback;
}
declare type DominantColorCallback = (color: string, colors: string[]) => void;
export declare function getDominantColor(element: HTMLImageElement, options: DominantColorOptions): void;
export {};
