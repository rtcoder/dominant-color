# Dominant Color

This is a JavaScript library that allows you to extract the dominant color from images. It provides an easy-to-use interface to get started quickly.

## Installation

To install the library, use the following command:

```bash
npm i @rtcoder/dominant-color
```

## Usage

Import the `getDominantColor` function from `@rtcoder/dominant-color` in your JavaScript file:

```javascript
import { getDominantColor } from "@rtcoder/dominant-color";
```

Select an image element from your HTML:

```javascript
const img = document.querySelector('img');
```

Call the `getDominantColor` function with the image element and configuration options:

```javascript
getDominantColor(img, {
    downScaleFactor: 1,
    skipPixels: 0,
    colorsPaletteLength: 5,
    paletteWithCountOfOccurrences: false,
    colorFormat: 'rgb',
    callback: (color, palette) => {
        // Your code here
    }
});
```

## Configuration Options

The `getDominantColor` function accepts the following configuration options:

| Name                        | Type     | Default Value | Description                                                  |
| --------------------------- | -------- | ------------- | ------------------------------------------------------------ |
| `downScaleFactor`           | number   | 1             | Factor of scale down for the image. Recommended for large images. |
| `skipPixels`                | number   | 0             | Skips every `n` pixels while determining the dominant color. Recommended for large images. |
| `colorsPaletteLength`       | number   | 5             | Length of the returned color palette.                        |
| `paletteWithCountOfOccurrences` | boolean  | false         | Determines whether to return colors with the number of occurrences. |
| `colorFormat`               | string   | `'rgb'`       | Defines the format of the returned colors. Available values are `'rgb'`, `'hsl'`, and `'hex'`. |
| `callback`                  | function | [empty function] | Callback function that receives the dominant color and the colors palette. |

## Interfaces

The library provides the following interfaces for type checking:

```typescript
type ColorFormat = 'rgb' | 'hsl' | 'hex';

interface PrimaryColor {
  color: string;
  count: number;
}

interface DominantColorOptions {
  downScaleFactor: number;
  skipPixels: number;
  colorsPaletteLength: number;
  paletteWithCountOfOccurrences: boolean;
  colorFormat: ColorFormat;
  callback: DominantColorCallback;
}

type DominantColorCallback = (dominant: string, colorsPalette: string[] | PrimaryColor[]) => void;

function getDominantColor(element: HTMLImageElement, options: Partial<DominantColorOptions>): void;
```

Feel free to explore and utilize these interfaces for better code development.

Remember to replace `your code here` in the usage example with your own code to handle the dominant color and colors palette.
