function rgbToHex(rgb) {
    const [_r, _g, _b] = getRgbValues(rgb).map((val) => val.toString(16).padStart(2, '0'));
    return `#${_r}${_g}${_b}`;
}
function rgbToHsl(rgb) {
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
function getRgbValues(rgb) {
    const values = rgb.match(/\d+/g);
    if (!values || values.length < 3) {
        throw new Error(`Invalid RGB color: ${rgb}`);
    }
    return values.slice(0, 3).map(Number);
}
function toRgbKey(r, g, b) {
    return `${Math.round(r)},${Math.round(g)},${Math.round(b)}`;
}
function quantizeColor(color, bucketSize) {
    const [r, g, b] = getRgbValues(color);
    const maxColorValue = 255;
    return toRgbKey(Math.min(maxColorValue, Math.floor(r / bucketSize) * bucketSize + bucketSize / 2), Math.min(maxColorValue, Math.floor(g / bucketSize) * bucketSize + bucketSize / 2), Math.min(maxColorValue, Math.floor(b / bucketSize) * bucketSize + bucketSize / 2));
}
function quantizeColors(colors, config) {
    if (config.colorQuantization === 'exact') {
        return colors;
    }
    return Object.keys(colors).reduce((quantizedColors, color) => {
        const quantizedColor = quantizeColor(color, config.colorBucketSize);
        quantizedColors[quantizedColor] = (quantizedColors[quantizedColor] || 0) + colors[color];
        return quantizedColors;
    }, {});
}
function getColorDistanceSquared(r1, g1, b1, r2, g2, b2) {
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}
function groupColors(colors, threshold) {
    if (threshold === 0) {
        return colors;
    }
    const groups = [];
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
    }, {});
}
function detectColor(imageData, config) {
    const { data } = imageData;
    const colors = {};
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
    primaryColor = '';
    maxCount = 0;
    Object.keys(groupedColors).forEach((color) => {
        if (groupedColors[color] > maxCount) {
            primaryColor = color;
            maxCount = groupedColors[color];
        }
    });
    return [{ color: primaryColor, count: maxCount }, groupedColors];
}
function getImageData(img, downScaleFactor = 1) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const scaledWidth = Math.max(1, Math.floor(img.width / downScaleFactor));
    const scaledHeight = Math.max(1, Math.floor(img.height / downScaleFactor));
    if (!context) {
        throw new Error('Canvas 2D context is not available');
    }
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
function formatPalette(colorsPalette, format) {
    if (!colorsPalette.length || typeof colorsPalette[0] === 'string') {
        return colorsPalette.map((color) => getColorByFormat(color, format));
    }
    return colorsPalette.map((item) => (Object.assign(Object.assign({}, item), { color: getColorByFormat(item.color, format) })));
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
function validateOptions(config) {
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
    if (!['exact', 'bucket'].includes(config.colorQuantization)) {
        throw new Error('colorQuantization must be "exact" or "bucket"');
    }
}
const defaultOptions = {
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
function getDominantColorConfig(options) {
    const config = Object.assign(Object.assign({}, defaultOptions), options);
    validateOptions(config);
    return config;
}
export function getDominantColor(element, options = {}) {
    const config = getDominantColorConfig(options);
    processDominantColor(element, config);
}
export function getDominantColorAsync(element, options = {}) {
    return new Promise((resolve, reject) => {
        const config = getDominantColorConfig(Object.assign(Object.assign({}, options), { callback: (dominant, colorsPalette) => {
                resolve({ dominant, colorsPalette });
            }, errorCallback: reject }));
        processDominantColor(element, config);
    });
}
function processDominantColor(element, config) {
    const source = element.currentSrc || element.src;
    if (!source) {
        config.errorCallback(new Error('Image source is empty'));
        return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        try {
            const imageData = getImageData(img, config.downScaleFactor);
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
        catch (error) {
            config.errorCallback(error instanceof Error ? error : new Error(String(error)));
        }
    };
    img.onerror = () => {
        config.errorCallback(new Error(`Unable to load image: ${source}`));
    };
    img.src = source;
}
//# sourceMappingURL=dominant-color.js.map