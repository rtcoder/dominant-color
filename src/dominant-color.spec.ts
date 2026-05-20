import { getDominantColor, getDominantColorAsync } from './dominant-color';

let pixels: Uint8ClampedArray;
let shouldFailImageLoad = false;

class MockImage {
  public crossOrigin = '';
  public currentSrc = '';
  public height = 2;
  public onerror: (() => void) | null = null;
  public onload: (() => void) | null = null;
  public width = 2;
  private imageSrc = '';

  public get src(): string {
    return this.imageSrc;
  }

  public set src(value: string) {
    this.imageSrc = value;
    if (shouldFailImageLoad) {
      this.onerror?.();
      return;
    }
    this.onload?.();
  }
}

function mockCanvas(): void {
  const getImageData = jest.fn(() => ({
    data: pixels,
    height: 2,
    width: 2,
  }));
  const drawImage = jest.fn();
  const getContext = jest.fn(() => ({
    drawImage,
    getImageData,
  }));

  (global as any).document = {
    createElement: jest.fn(() => ({
      getContext,
      height: 0,
      width: 0,
    })),
  };
}

beforeEach(() => {
  shouldFailImageLoad = false;
  pixels = new Uint8ClampedArray([
    255,
    0,
    0,
    255,
    255,
    0,
    0,
    255,
    0,
    0,
    255,
    255,
    0,
    255,
    0,
    255,
  ]);
  mockCanvas();
  (global as any).Image = MockImage;
});

it('returns dominant color and palette in the requested format', () => {
  const callback = jest.fn();

  getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
    callback,
    colorFormat: 'hex',
    colorsPaletteLength: 2,
  });

  expect(callback).toHaveBeenCalledWith('#ff0000', ['#ff0000', '#0000ff']);
});

it('uses default options when they are not provided', () => {
  const callback = jest.fn();

  getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
    callback,
  });

  expect(callback).toHaveBeenCalledWith('rgb(255,0,0)', ['rgb(255,0,0)', 'rgb(0,0,255)', 'rgb(0,255,0)']);
});

it('formats colors with occurrence counts', () => {
  const callback = jest.fn();

  getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
    callback,
    colorFormat: 'rgb',
    colorsPaletteLength: 2,
    paletteWithCountOfOccurrences: true,
  });

  expect(callback).toHaveBeenCalledWith('rgb(255,0,0)', [
    { color: 'rgb(255,0,0)', count: 2 },
    { color: 'rgb(0,0,255)', count: 1 },
  ]);
});

it('groups similar colors when colorGroupingThreshold is provided', () => {
  pixels = new Uint8ClampedArray([
    255,
    0,
    0,
    255,
    250,
    5,
    0,
    255,
    0,
    0,
    255,
    255,
  ]);
  const callback = jest.fn();

  getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
    callback,
    colorFormat: 'hex',
    colorGroupingThreshold: 10,
    colorsPaletteLength: 2,
  });

  expect(callback).toHaveBeenCalledWith('#fd0300', ['#fd0300', '#0000ff']);
});

it('quantizes colors into buckets when bucket quantization is enabled', () => {
  pixels = new Uint8ClampedArray([
    255,
    0,
    0,
    255,
    250,
    5,
    0,
    255,
    0,
    0,
    255,
    255,
  ]);
  const callback = jest.fn();

  getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
    callback,
    colorFormat: 'hex',
    colorQuantization: 'bucket',
    colorBucketSize: 24,
    colorsPaletteLength: 2,
  });

  expect(callback).toHaveBeenCalledWith('#fc0c0c', ['#fc0c0c', '#0c0cfc']);
});

it('returns a promise result from getDominantColorAsync', async () => {
  await expect(
    getDominantColorAsync({ src: 'image.jpg' } as HTMLImageElement, {
      colorFormat: 'hex',
      colorsPaletteLength: 2,
    }),
  ).resolves.toEqual({
    dominant: '#ff0000',
    colorsPalette: ['#ff0000', '#0000ff'],
  });
});

it('rejects getDominantColorAsync on image load errors', async () => {
  shouldFailImageLoad = true;

  await expect(getDominantColorAsync({ src: 'missing.jpg' } as HTMLImageElement)).rejects.toThrow('Unable to load image');
});

it('returns an empty result when all pixels are transparent', () => {
  pixels = new Uint8ClampedArray([255, 0, 0, 0, 0, 0, 255, 0]);
  const callback = jest.fn();

  getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
    callback,
    colorFormat: 'hex',
  });

  expect(callback).toHaveBeenCalledWith('', []);
});

it('throws for invalid skipPixels values before loading the image', () => {
  expect(() =>
    getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
      skipPixels: -1,
    }),
  ).toThrow('skipPixels must be a non-negative integer');
});

it('throws for invalid colorGroupingThreshold values before loading the image', () => {
  expect(() =>
    getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
      colorGroupingThreshold: -1,
    }),
  ).toThrow('colorGroupingThreshold must be a non-negative number');
});

it('throws for invalid colorQuantization values before loading the image', () => {
  expect(() =>
    getDominantColor({ src: 'image.jpg' } as HTMLImageElement, {
      colorQuantization: 'median-cut' as any,
    }),
  ).toThrow('colorQuantization must be "exact" or "bucket"');
});

it('reports image load errors through errorCallback', () => {
  shouldFailImageLoad = true;
  const errorCallback = jest.fn();

  getDominantColor({ src: 'missing.jpg' } as HTMLImageElement, {
    errorCallback,
  });

  expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
  expect(errorCallback.mock.calls[0][0].message).toContain('Unable to load image');
});
