import { DominantColorOptions, DominantColorResult } from './interface';
export type { ColorFormat, ColorQuantization, Colors, DominantColorCallback, DominantColorErrorCallback, DominantColorOptions, DominantColorResult, PrimaryColor, } from './interface';
export declare function getDominantColor(element: HTMLImageElement, options?: Partial<DominantColorOptions>): void;
export declare function getDominantColorAsync(element: HTMLImageElement, options?: Partial<DominantColorOptions>): Promise<DominantColorResult>;
