const rgbToHex = (rgb) => {
    // Choose correct separator
    const sep = rgb.indexOf(',') > -1 ? ',' : ' ';
    // Turn "rgb(r,g,b)" into [r,g,b]
    const _rgb = rgb.substr(4).split(')')[0].split(sep);
    let r = (+_rgb[0]).toString(16);
    let g = (+_rgb[1]).toString(16);
    let b = (+_rgb[2]).toString(16);
    if (r.length === 1)
        r = '0' + r;
    if (g.length === 1)
        g = '0' + g;
    if (b.length === 1)
        b = '0' + b;
    return '#' + r + g + b;
};
const rgbToHsl = (rgb) => {
    const sep = rgb.indexOf(',') > -1 ? ',' : ' ';
    const _rgb = rgb
        .substr(4)
        .split(')')[0]
        .split(sep)
        .map((c) => (c.indexOf('%') > -1 ? Math.round((+c.substr(0, c.length - 1) / 100) * 255) : c));
    // Make r, g, and b fractions of 1
    const r = _rgb[0] / 255;
    const g = _rgb[1] / 255;
    const b = _rgb[2] / 255;
    // Find greatest and smallest channel values
    const cmin = Math.min(r, g, b);
    const cmax = Math.max(r, g, b);
    const delta = cmax - cmin;
    let h = 0;
    let s = 0;
    let l = 0;
    // Calculate hue
    // No difference
    if (delta === 0)
        h = 0;
    // Red is max
    else if (cmax === r)
        h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax === g)
        h = (b - r) / delta + 2;
    // Blue is max
    else
        h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;
    // Calculate lightness
    l = (cmax + cmin) / 2;
    // Calculate saturation
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
};
const isApproximateColor = (color1, color2, threshold = 25) => {
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
const detectColor = (imageData, skip = 0) => {
    const { data } = imageData;
    const primary = { color: '', count: 0 };
    const colors = {};
    for (let px = 0, len = data.length; px < len; px += (skip + 1) * 4) {
        if (data[px + 3] < 255) {
            continue;
        }
        const tmpRgb = `${data[px]},${data[px + 1]},${data[px + 2]}`;
        const rgb = primary.color && isApproximateColor(primary.color, tmpRgb) ? primary.color : tmpRgb;
        colors[rgb] = (colors[rgb] || 0) + 1;
        if (colors[rgb] > primary.count) {
            primary.color = rgb;
            primary.count = colors[rgb];
        }
    }
    return [primary, colors];
};
const getImageData = (img, downScaleFactor = 1) => {
    if (downScaleFactor < 1) {
        throw new Error('downScaleFactor must be equal to 1 or greater');
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const { width, height } = img;
    const dividedWidth = width / downScaleFactor;
    const dividedHeight = height / downScaleFactor;
    canvas.width = dividedWidth;
    canvas.height = dividedHeight;
    context.drawImage(img, 0, 0, width, height, 0, 0, dividedWidth, dividedHeight);
    return context.getImageData(0, 0, img.width, img.height);
};
const sortColors = (colors, withOccurrences = false) => {
    const sorted = Object.keys(colors).sort((a, b) => colors[b] - colors[a]);
    return withOccurrences
        ? sorted.map((color) => ({
            color,
            count: colors[color],
        }))
        : sorted;
};
const getColorByFormat = (color, format) => {
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
};
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
    options = Object.assign(defaultOptions, options);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = (e) => {
        const imageData = getImageData(e.currentTarget, options.downScaleFactor);
        const [primaryColor, colors] = detectColor(imageData, options.skipPixels);
        if (typeof options.callback === 'function') {
            const colorsPalette = options.colorsPaletteLength
                ? sortColors(colors, options.paletteWithCountOfOccurrences).slice(0, options.colorsPaletteLength)
                : [];
            const dominant = getColorByFormat(primaryColor.color, defaultOptions.colorFormat);
            options.callback(dominant, colorsPalette);
        }
    };
    img.src = element.src;
}
//# sourceMappingURL=dominant-color.js.map