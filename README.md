<p align="center">

# Dominant color

Get dominant color from images using only JavaScript

## Installation

    npm i @rtcoder/dominant-color

## Usage

    import {getDominantColor} from "@rtcoder/dominant-color";
    
    const img = document.querySelector('img');
    
    getDominantColor(img, {
        downScaleFactor: 1,
        skipPixels: 0,
        colorsPaletteLength: 5,
        paletteWithCountOfOccurrences: false,
        colorFormat: 'rgb',
        callback: (color, palette) => {
           // your code here
        }
    });

## Config options
|Name|Type|Default value|Description|
|--|--|--|--|
| `downScaleFactor` | number | 1 | factor of scale down of image, recommend to use for many large images |
| `skipPixels` | number | 0 | when larger than 0, skips every n pixels of while determine dominant color, recommend to use for large images |
| `colorsPaletteLength` | number | 5 | length of returned palette of colors |
| `paletteWithCountOfOccurrences` | boolean | false | determines whether to return colors with the number of occurrences |
| `colorFormat` | string | `'rgb'` | defines the format of the returned colors, available values are `'rgb'`, `'hsl'` and `'hex'` |
| `callback` | function| [empty function] | callback function |



## Interfaces

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
  
	type DominantColorCallback = (dominant: string, colorsPalette: (string[]) | (PrimaryColor[])) => void;

	function getDominantColor(element: HTMLImageElement, options: Partial<DominantColorOptions>): void

</p>
