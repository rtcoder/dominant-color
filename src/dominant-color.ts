import { ColorFormat, Colors, DominantColorOptions, DominantColorResult, DominantColorSource, PrimaryColor } from './interface';

export type {
  ColorFormat,
  ColorQuantization,
  Colors,
  DominantColorCallback,
  DominantColorErrorCallback,
  DominantColorOptions,
  DominantColorResult,
  DominantColorSource,
  PrimaryColor,
} from './interface';

interface ColorGroup {
  b: number;
  count: number;
  g: number;
  r: number;
}

interface MedianCutColor {
  b: number;
  count: number;
  g: number;
  r: number;
}

type DrawableDominantColorSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

function rgbToHex(rgb: string): string {
  const [_r, _g, _b] = getRgbValues(rgb).map((val) => val.toString(16).padStart(2, '0'));
  return `#${_r}${_g}${_b}`;
}

function rgbToHsl(rgb: string): string {
  const [_r, _g, _b] = getRgbValues(rgb);
  const r = _r / 255;
  const g = _g / 255;
  const b = _b / 255;

  const cMin = Math.min(r, g, b);
  const cMax = Math.max(r, g, b);
  const delta = cMax - cMin;

  let h = 0;
  if (delta !== 0) {
    if (cMax === r) {
      h = ((g - b) / delta) % 6;
    } else if (cMax === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) {
    h += 360;
  }

  const l = (cMax + cMin) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `hsl(${h},${(s * 100).toFixed(1)}%,${(l * 100).toFixed(1)}%)`;
}

function getRgbValues(rgb: string): number[] {
  const values = rgb.match(/\d+/g);
  if (!values || values.length < 3) {
    throw new Error(`Invalid RGB color: ${rgb}`);
  }
  return values.slice(0, 3).map(Number);
}

function toRgbKey(r: number, g: number, b: number): string {
  return `${Math.round(r)},${Math.round(g)},${Math.round(b)}`;
}

function quantizeColor(color: string, bucketSize: number): string {
  const [r, g, b] = getRgbValues(color);
  const maxColorValue = 255;
  return toRgbKey(
    Math.min(maxColorValue, Math.floor(r / bucketSize) * bucketSize + bucketSize / 2),
    Math.min(maxColorValue, Math.floor(g / bucketSize) * bucketSize + bucketSize / 2),
    Math.min(maxColorValue, Math.floor(b / bucketSize) * bucketSize + bucketSize / 2),
  );
}

function quantizeColors(colors: Colors, config: DominantColorOptions): Colors {
  if (config.colorQuantization !== 'bucket') {
    return colors;
  }

  return Object.keys(colors).reduce((quantizedColors, color) => {
    const quantizedColor = quantizeColor(color, config.colorBucketSize);
    quantizedColors[quantizedColor] = (quantizedColors[quantizedColor] || 0) + colors[color];
    return quantizedColors;
  }, {} as Colors);
}

function getMedianCutRange(colors: MedianCutColor[], channel: 'r' | 'g' | 'b'): number {
  return Math.max(...colors.map((color) => color[channel])) - Math.min(...colors.map((color) => color[channel]));
}

function getMedianCutChannel(colors: MedianCutColor[]): 'r' | 'g' | 'b' {
  const ranges = {
    b: getMedianCutRange(colors, 'b'),
    g: getMedianCutRange(colors, 'g'),
    r: getMedianCutRange(colors, 'r'),
  };
  return Object.keys(ranges).sort((a, b) => ranges[b as 'r' | 'g' | 'b'] - ranges[a as 'r' | 'g' | 'b'])[0] as 'r' | 'g' | 'b';
}

function splitMedianCutBox(colors: MedianCutColor[]): MedianCutColor[][] {
  if (colors.length <= 1) {
    return [colors];
  }

  const channel = getMedianCutChannel(colors);
  const sorted = [...colors].sort((a, b) => a[channel] - b[channel]);
  const totalCount = sorted.reduce((sum, color) => sum + color.count, 0);
  let runningCount = 0;
  let splitIndex = 1;

  for (let index = 0; index < sorted.length - 1; index++) {
    runningCount += sorted[index].count;
    if (runningCount >= totalCount / 2) {
      splitIndex = index + 1;
      break;
    }
  }

  return [sorted.slice(0, splitIndex), sorted.slice(splitIndex)];
}

function averageMedianCutBox(colors: MedianCutColor[]): PrimaryColor {
  const totalCount = colors.reduce((sum, color) => sum + color.count, 0);
  const weighted = colors.reduce(
    (sum, color) => ({
      b: sum.b + color.b * color.count,
      g: sum.g + color.g * color.count,
      r: sum.r + color.r * color.count,
    }),
    { b: 0, g: 0, r: 0 },
  );

  return {
    color: toRgbKey(weighted.r / totalCount, weighted.g / totalCount, weighted.b / totalCount),
    count: totalCount,
  };
}

function medianCutColors(colors: Colors, paletteLength: number): Colors {
  if (paletteLength === 0) {
    return {};
  }

  let boxes = [
    Object.keys(colors).map((color) => {
      const [r, g, b] = getRgbValues(color);
      return { r, g, b, count: colors[color] };
    }),
  ];

  while (boxes.length < paletteLength) {
    const sortedBoxes = [...boxes].sort((a, b) => {
      const aRange = Math.max(getMedianCutRange(a, 'r'), getMedianCutRange(a, 'g'), getMedianCutRange(a, 'b'));
      const bRange = Math.max(getMedianCutRange(b, 'r'), getMedianCutRange(b, 'g'), getMedianCutRange(b, 'b'));
      return bRange * b.reduce((sum, color) => sum + color.count, 0) - aRange * a.reduce((sum, color) => sum + color.count, 0);
    });
    const boxToSplit = sortedBoxes.find((box) => box.length > 1);
    if (!boxToSplit) {
      break;
    }

    const splitBoxes = splitMedianCutBox(boxToSplit).filter((box) => box.length);
    boxes = boxes.filter((box) => box !== boxToSplit).concat(splitBoxes);
  }

  return boxes.reduce((palette, box) => {
    const color = averageMedianCutBox(box);
    palette[color.color] = (palette[color.color] || 0) + color.count;
    return palette;
  }, {} as Colors);
}

function getColorDistanceSquared(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

function groupColors(colors: Colors, threshold: number): Colors {
  if (threshold === 0) {
    return colors;
  }

  const groups: ColorGroup[] = [];
  const thresholdSquared = threshold ** 2;

  Object.keys(colors).forEach((color) => {
    const [r, g, b] = getRgbValues(color);
    const group = groups.find((item) => getColorDistanceSquared(item.r, item.g, item.b, r, g, b) <= thresholdSquared);

    if (!group) {
      groups.push({ r, g, b, count: colors[color] });
      return;
    }

    const totalCount = group.count + colors[color];
    group.r = (group.r * group.count + r * colors[color]) / totalCount;
    group.g = (group.g * group.count + g * colors[color]) / totalCount;
    group.b = (group.b * group.count + b * colors[color]) / totalCount;
    group.count = totalCount;
  });

  return groups.reduce((groupedColors, group) => {
    const color = toRgbKey(group.r, group.g, group.b);
    groupedColors[color] = (groupedColors[color] || 0) + group.count;
    return groupedColors;
  }, {} as Colors);
}

function detectColor(imageData: ImageData, config: DominantColorOptions): [PrimaryColor, Colors] {
  const { data } = imageData;
  const colors: Colors = {};
  let primaryColor = '';
  let maxCount = 0;

  for (let px = 0; px < data.length; px += (config.skipPixels + 1) * 4) {
    if (data[px + 3] < 255) {
      continue; // Ignore transparent pixels
    }
    const rgb = `${data[px]},${data[px + 1]},${data[px + 2]}`;
    colors[rgb] = (colors[rgb] || 0) + 1;
    if (colors[rgb] > maxCount) {
      primaryColor = rgb;
      maxCount = colors[rgb];
    }
  }

  const quantizedColors = quantizeColors(colors, config);
  const groupedColors = groupColors(quantizedColors, config.colorGroupingThreshold);
  const paletteColors =
    config.colorQuantization === 'median-cut' ? medianCutColors(groupedColors, config.colorsPaletteLength || 1) : groupedColors;
  primaryColor = '';
  maxCount = 0;
  Object.keys(paletteColors).forEach((color) => {
    if (paletteColors[color] > maxCount) {
      primaryColor = color;
      maxCount = paletteColors[color];
    }
  });

  return [{ color: primaryColor, count: maxCount }, paletteColors];
}

function getSourceWidth(source: DrawableDominantColorSource): number {
  return source.width;
}

function getSourceHeight(source: DrawableDominantColorSource): number {
  return source.height;
}

function getImageData(source: DrawableDominantColorSource, downScaleFactor = 1): ImageData {
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  const scaledWidth = Math.max(1, Math.floor(getSourceWidth(source) / downScaleFactor));
  const scaledHeight = Math.max(1, Math.floor(getSourceHeight(source) / downScaleFactor));

  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }

  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  context.drawImage(source, 0, 0, scaledWidth, scaledHeight);
  return context.getImageData(0, 0, scaledWidth, scaledHeight);
}

function sortColors(colors: Colors, withOccurrences = false): string[] | PrimaryColor[] {
  const sorted = Object.keys(colors).sort((a, b) => colors[b] - colors[a]);
  return withOccurrences
    ? sorted.map((color) => ({
        color,
        count: colors[color],
      }))
    : sorted;
}

function formatPalette(colorsPalette: string[] | PrimaryColor[], format: ColorFormat): string[] | PrimaryColor[] {
  if (!colorsPalette.length || typeof colorsPalette[0] === 'string') {
    return (colorsPalette as string[]).map((color) => getColorByFormat(color, format));
  }
  return (colorsPalette as PrimaryColor[]).map((item) => ({
    ...item,
    color: getColorByFormat(item.color, format),
  }));
}

function getColorByFormat(color: string, format: ColorFormat): string {
  switch (format) {
    case 'rgb':
      color = `rgb(${color})`;
      break;
    case 'hsl':
      color = rgbToHsl(`rgb(${color})`);
      break;
    case 'hex':
      color = rgbToHex(`rgb(${color})`);
      break;
  }
  return color;
}

function validateOptions(config: DominantColorOptions): void {
  if (!Number.isFinite(config.downScaleFactor) || config.downScaleFactor < 1) {
    throw new Error('downScaleFactor must be equal to 1 or greater');
  }
  if (!Number.isInteger(config.skipPixels) || config.skipPixels < 0) {
    throw new Error('skipPixels must be a non-negative integer');
  }
  if (!Number.isInteger(config.colorsPaletteLength) || config.colorsPaletteLength < 0) {
    throw new Error('colorsPaletteLength must be a non-negative integer');
  }
  if (!Number.isInteger(config.colorBucketSize) || config.colorBucketSize < 1 || config.colorBucketSize > 256) {
    throw new Error('colorBucketSize must be an integer between 1 and 256');
  }
  if (!Number.isFinite(config.colorGroupingThreshold) || config.colorGroupingThreshold < 0) {
    throw new Error('colorGroupingThreshold must be a non-negative number');
  }
  if (!['exact', 'bucket', 'median-cut'].includes(config.colorQuantization)) {
    throw new Error('colorQuantization must be "exact", "bucket", or "median-cut"');
  }
}

const defaultOptions: DominantColorOptions = {
  downScaleFactor: 1,
  skipPixels: 0,
  colorsPaletteLength: 5,
  colorBucketSize: 24,
  colorGroupingThreshold: 0,
  colorQuantization: 'exact',
  paletteWithCountOfOccurrences: false,
  colorFormat: 'rgb',
  callback: () => {
    // callback
  },
  errorCallback: () => {
    // error callback
  },
};

function getDominantColorConfig(options: Partial<DominantColorOptions>): DominantColorOptions {
  const config: DominantColorOptions = { ...defaultOptions, ...options };
  validateOptions(config);
  return config;
}

export function getDominantColor(source: DominantColorSource, options: Partial<DominantColorOptions> = {}): void {
  const config = getDominantColorConfig(options);
  processDominantColor(source, config);
}

export function getDominantColorAsync(
  source: DominantColorSource,
  options: Partial<DominantColorOptions> = {},
): Promise<DominantColorResult> {
  return new Promise((resolve, reject) => {
    const config = getDominantColorConfig({
      ...options,
      callback: (dominant, colorsPalette) => {
        resolve({ dominant, colorsPalette });
      },
      errorCallback: reject,
    });

    processDominantColor(source, config);
  });
}

function handleImageData(imageData: ImageData, config: DominantColorOptions): void {
  const [primaryColor, colors] = detectColor(imageData, config);
  const colorsPalette = config.colorsPaletteLength
    ? sortColors(colors, config.paletteWithCountOfOccurrences).slice(0, config.colorsPaletteLength)
    : [];

  if (!primaryColor.color) {
    config.callback('', []);
    return;
  }

  const dominant = getColorByFormat(primaryColor.color, config.colorFormat);
  config.callback(dominant, formatPalette(colorsPalette, config.colorFormat));
}

function isCanvasSource(source: DominantColorSource): source is HTMLCanvasElement | ImageBitmap {
  return typeof source !== 'string' && typeof Blob !== 'undefined' && !(source instanceof Blob) && !('src' in source);
}

function getImageSource(source: HTMLImageElement | string | Blob): string {
  if (typeof source === 'string') {
    return source;
  }
  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    return URL.createObjectURL(source);
  }
  const element = source as HTMLImageElement;
  return element.currentSrc || element.src;
}

function processDominantColor(source: DominantColorSource, config: DominantColorOptions): void {
  if (isCanvasSource(source)) {
    try {
      handleImageData(getImageData(source, config.downScaleFactor), config);
    } catch (error) {
      config.errorCallback(error instanceof Error ? error : new Error(String(error)));
    }
    return;
  }

  const imageSource = getImageSource(source);
  if (!imageSource) {
    config.errorCallback(new Error('Image source is empty'));
    return;
  }
  const shouldRevokeObjectUrl = typeof Blob !== 'undefined' && source instanceof Blob;

  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      handleImageData(getImageData(img, config.downScaleFactor), config);
    } catch (error) {
      config.errorCallback(error instanceof Error ? error : new Error(String(error)));
    } finally {
      if (shouldRevokeObjectUrl) {
        URL.revokeObjectURL(imageSource);
      }
    }
  };
  img.onerror = () => {
    if (shouldRevokeObjectUrl) {
      URL.revokeObjectURL(imageSource);
    }
    config.errorCallback(new Error(`Unable to load image: ${imageSource}`));
  };

  img.src = imageSource;
}
