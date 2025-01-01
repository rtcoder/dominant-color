function rgbToHex(rgb) {
    const [_r, _g, _b] = rgb.match(/\d+/g).map((val) => (+val).toString(16).padStart(2, '0'));
    return `#${_r}${_g}${_b}`;
}
function rgbToHsl(rgb) {
    const [_r, _g, _b] = rgb.match(/\d+/g).map(Number);
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
        }
        else if (cMax === g) {
            h = (b - r) / delta + 2;
        }
        else {
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
function isApproximateColor(color1, color2, threshold = 25) {
    const [r1, g1, b1] = color1.split(',').map(Number);
    const [r2, g2, b2] = color2.split(',').map(Number);
    const distanceSquared = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
    return distanceSquared < threshold ** 2;
}
function detectColor(imageData, skip = 0) {
    const { data } = imageData;
    const colors = {};
    let primaryColor = '';
    let maxCount = 0;
    for (let px = 0; px < data.length; px += (skip + 1) * 4) {
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
    return [{ color: primaryColor, count: maxCount }, colors];
}
function getImageData(img, downScaleFactor = 1) {
    if (downScaleFactor < 1) {
        throw new Error('downScaleFactor must be equal to 1 or greater');
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const scaledWidth = Math.floor(img.width / downScaleFactor);
    const scaledHeight = Math.floor(img.height / downScaleFactor);
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    context.drawImage(img, 0, 0, scaledWidth, scaledHeight);
    return context.getImageData(0, 0, scaledWidth, scaledHeight);
}
function sortColors(colors, withOccurrences = false) {
    const sorted = Object.keys(colors).sort((a, b) => colors[b] - colors[a]);
    return withOccurrences
        ? sorted.map((color) => ({
            color,
            count: colors[color],
        }))
        : sorted;
}
function getColorByFormat(color, format) {
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
export function getDominantColor(element, options) {
    const defaultOptions = {
        downScaleFactor: 1,
        skipPixels: 0,
        colorsPaletteLength: 5,
        paletteWithCountOfOccurrences: false,
        colorFormat: 'rgb',
        callback: () => {
            // callback
        },
    };
    const config = Object.assign(Object.assign({}, defaultOptions), options);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        const imageData = getImageData(img, config.downScaleFactor);
        const [primaryColor, colors] = detectColor(imageData, config.skipPixels);
        const colorsPalette = config.colorsPaletteLength
            ? sortColors(colors, config.paletteWithCountOfOccurrences).slice(0, config.colorsPaletteLength)
            : [];
        const dominant = getColorByFormat(primaryColor.color, config.colorFormat);
        config.callback(dominant, colorsPalette);
    };
    img.src = element.src;
}
//# sourceMappingURL=dominant-color.js.map