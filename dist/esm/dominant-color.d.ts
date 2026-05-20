import { DominantColorOptions, DominantColorResult, DominantColorSource } from './interface';
export type { ColorFormat, ColorQuantization, Colors, DominantColorCallback, DominantColorErrorCallback, DominantColorOptions, DominantColorResult, DominantColorSource, PrimaryColor, } from './interface';
export declare function getDominantColor(source: DominantColorSource, options?: Partial<DominantColorOptions>): void;
export declare function getDominantColorAsync(source: DominantColorSource, options?: Partial<DominantColorOptions>): Promise<DominantColorResult>;
