interface PrimaryColor {
  rgb: string;
  count: number;
}

interface Colors {
  [key: string]: number;
}

interface DominantColorOptions {
  downScaleFactor: number;
  skipPixels: number;
  colorsPaletteLength: number;
  paletteWithCountOfOccurrences: boolean;
  callback: DominantColorCallback;
}

type DominantColorCallback = (color: string, colors: (string[]) | (PrimaryColor[])) => void;

const isApproximateColor = (color1: string, color2: string, threshold = 25): boolean => {
  if (!color1 || !color2) {
    return false;
  }
  const [r1, g1, b1] = color1.split(',').map(Number);
  const [r2, g2, b2] = color2.split(',').map(Number);
  const r = r1 - r2;
  const g = g1 - g2;
  const b = b1 - b2;
  const l = Math.sqrt(r * r + g * g + b * b);
  return l < threshold;
};
const detectColor = (imageData: ImageData, skip = 0): [PrimaryColor, Colors] => {
  const { data } = imageData;
  const primary: PrimaryColor = { rgb: '', count: 0 };
  const colors: Colors = {};

  for (let px = 0, len = data.length; px < len; px += (skip + 1) * 4) {
    if (data[px + 3] < 255) {
      continue;
    }
    const tmpRgb = `${data[px]},${data[px + 1]},${data[px + 2]}`;
    const rgb = primary.rgb && isApproximateColor(primary.rgb, tmpRgb) ? primary.rgb : tmpRgb;

    colors[rgb] = (colors[rgb] || 0) + 1;
    if (colors[rgb] > primary.count) {
      primary.rgb = rgb;
      primary.count = colors[rgb];
    }
  }
  return [primary, colors];
};
const getImageData = (img: HTMLImageElement, downScaleFactor = 1): ImageData => {
  if (downScaleFactor < 1) {
    throw new Error('downScaleFactor must be equal to 1 or greater');
  }
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  const { width, height } = img;
  const dividedWidth = width / downScaleFactor;
  const dividedHeight = height / downScaleFactor;
  canvas.width = dividedWidth;
  canvas.height = dividedHeight;
  context.drawImage(img, 0, 0, width, height, 0, 0, dividedWidth, dividedHeight);
  return context.getImageData(0, 0, img.width, img.height);
};

const sortColors = (colors: Colors, withOccurrences = false): (string[]) | PrimaryColor[] => {
  const sorted = Object.keys(colors).sort((a, b) => colors[b] - colors[a]);
  return withOccurrences
    ? sorted.map(color => ({
      rgb: color,
      count: colors[color],
    }))
    : sorted;
};

export function getDominantColor(element: HTMLImageElement, options: DominantColorOptions) {
  const defaultOptions = {
    downScaleFactor: 1,
    skipPixels: 0,
    colorsPaletteLength: 5,
    paletteWithCountOfOccurrences: false,
    callback: null,
  };
  options = Object.assign(defaultOptions, options);
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = (e) => {
    const imageData = getImageData(e.currentTarget as HTMLImageElement, options.downScaleFactor);
    const [primaryColor, colors] = detectColor(imageData, options.skipPixels);
    if (typeof options.callback === 'function') {
      options.callback(primaryColor.rgb, sortColors(colors, options.paletteWithCountOfOccurrences).slice(0, options.colorsPaletteLength));
    }
  };

  img.src = element.src;
}
