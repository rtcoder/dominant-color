# Dominant Color

This is a JavaScript library that allows you to extract the dominant color from images. It provides an easy-to-use interface to get started quickly.

## Installation

To install the library, use the following command:

```bash
npm i @rtcoder/dominant-color
```

## Usage

Import the `getDominantColor` or `getDominantColorAsync` function from `@rtcoder/dominant-color` in your JavaScript file:

```javascript
import { getDominantColor, getDominantColorAsync } from "@rtcoder/dominant-color";
```

Select an image source:

```javascript
const img = document.querySelector('img');
```

Call the `getDominantColor` function with the image element and configuration options:

```javascript
getDominantColor(img, {
    downScaleFactor: 1,
    skipPixels: 0,
    colorsPaletteLength: 5,
    colorBucketSize: 24,
    colorGroupingThreshold: 0,
    colorQuantization: 'exact',
    paletteWithCountOfOccurrences: false,
    colorFormat: 'rgb',
    callback: (color, palette) => {
        // Your code here
    },
    errorCallback: (error) => {
        // Handle image loading or canvas errors here
    }
});
```

You can also use the Promise-based API:

```javascript
const { dominant, colorsPalette } = await getDominantColorAsync(img, {
    colorFormat: 'hex',
    colorQuantization: 'median-cut'
});
```

Image sources can be an `HTMLImageElement`, `HTMLCanvasElement`, `ImageBitmap`, image URL string, `Blob`, or `File`.

## Configuration Options

The `getDominantColor` and `getDominantColorAsync` functions accept the following configuration options:

| Name                        | Type     | Default Value | Description                                                  |
| --------------------------- | -------- | ------------- | ------------------------------------------------------------ |
| `downScaleFactor`           | number   | 1             | Factor of scale down for the image. Recommended for large images. |
| `skipPixels`                | number   | 0             | Skips every `n` pixels while determining the dominant color. Recommended for large images. |
| `colorsPaletteLength`       | number   | 5             | Length of the returned color palette.                        |
| `colorBucketSize`           | number   | 24            | RGB bucket size used when `colorQuantization` is `'bucket'`. Smaller values keep more detail; larger values merge more colors. |
| `colorGroupingThreshold`    | number   | 0             | Groups similar RGB colors before sorting. Use `0` for exact pixel matching, or a larger value such as `10`-`30` for photos. |
| `colorQuantization`         | string   | `'exact'`     | Defines the color counting algorithm. Use `'exact'` for exact RGB matching, `'bucket'` for fast grouped palettes, or `'median-cut'` for more balanced photo palettes. |
| `paletteWithCountOfOccurrences` | boolean  | false         | Determines whether to return colors with the number of occurrences. |
| `colorFormat`               | string   | `'rgb'`       | Defines the format of the returned dominant color and palette colors. Available values are `'rgb'`, `'hsl'`, and `'hex'`. |
| `callback`                  | function | [empty function] | Callback function that receives the dominant color and the colors palette. |
| `errorCallback`             | function | [empty function] | Callback function that receives image loading, canvas, and processing errors. |

## Interfaces

The library provides the following interfaces for type checking:

```typescript
type ColorFormat = 'rgb' | 'hsl' | 'hex';
type ColorQuantization = 'exact' | 'bucket' | 'median-cut';
type DominantColorSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | string | Blob;

interface PrimaryColor {
  color: string;
  count: number;
}

interface DominantColorOptions {
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

type DominantColorCallback = (dominant: string, colorsPalette: string[] | PrimaryColor[]) => void;
type DominantColorErrorCallback = (error: Error) => void;

interface DominantColorResult {
  dominant: string;
  colorsPalette: string[] | PrimaryColor[];
}

function getDominantColor(source: DominantColorSource, options?: Partial<DominantColorOptions>): void;
function getDominantColorAsync(source: DominantColorSource, options?: Partial<DominantColorOptions>): Promise<DominantColorResult>;
```

Feel free to explore and utilize these interfaces for better code development.

Remember to replace `your code here` in the usage example with your own code to handle the dominant color and colors palette.
