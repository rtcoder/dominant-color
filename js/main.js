function shift_color([r, g, b], val, percent) {
  return '#' +
    ((0 | (1 << 8) + r + (val - r) * percent / 100).toString(16)).substr(1) +
    ((0 | (1 << 8) + g + (val - g) * percent / 100).toString(16)).substr(1) +
    ((0 | (1 << 8) + b + (val - b) * percent / 100).toString(16)).substr(1);
}

function lighter_color([r, g, b], percent) {
  return shift_color([r, g, b], 256, percent);
}

function darker_color([r, g, b], percent) {
  return shift_color([r, g, b], 1, percent);
}

function getShadow(r, g, b) {
  return ` 22px 22px 44px ${darker_color([r, g, b], 20)},
             -22px -22px 44px ${lighter_color([r, g, b], 20)}`;
}

const lightOrDark = (color) => {
  let r, g, b;
  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {

    // If HEX --> store the red, green, blue values in separate variables
    color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

    r = color[1];
    g = color[2];
    b = color[3];
  } else {

    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    color = +('0x' + color.slice(1).replace(
        color.length < 5 && /./g, '$&$&',
      )
    );

    // tslint:disable-next-line:no-bitwise
    r = color >> 16;
    // tslint:disable-next-line:no-bitwise
    g = color >> 8 & 255;
    // tslint:disable-next-line:no-bitwise
    b = color & 255;
  }

  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b),
  );

  // Using the HSP value, determine whether the color is light or dark
  return hsp > 127.5 ? 'light' : 'dark';
};

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function RGBToHSL(rgb) {
  let sep = rgb.indexOf(',') > -1 ? ',' : ' ';
  rgb = rgb.substr(4).split(')')[0].split(sep);

  for (let R in rgb) {
    let r = rgb[R];
    if (r.indexOf('%') > -1)
      rgb[R] = Math.round(r.substr(0, r.length - 1) / 100 * 255);
  }

  // Make r, g, and b fractions of 1
  let r = rgb[0] / 255,
    g = rgb[1] / 255,
    b = rgb[2] / 255;

  // Find greatest and smallest channel values
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;
  // Calculate hue
  // No difference
  if (delta == 0)
    h = 0;
  // Red is max
  else if (cmax == r)
    h = ((g - b) / delta) % 6;
  // Green is max
  else if (cmax == g)
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
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Multiply l and s by 100
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}

function HSLToRGB(hsl) {
  let sep = hsl.indexOf(',') > -1 ? ',' : ' ';
  hsl = hsl.substr(4).split(')')[0].split(sep);

  let h = hsl[0],
    s = hsl[1].substr(0, hsl[1].length - 1) / 100,
    l = hsl[2].substr(0, hsl[2].length - 1) / 100;


  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs((h / 60) % 2 - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function parseHSL(str) {
  let hsl, h, s, l;
  hsl = str.replace(/[^\d,.]/g, '').split(',');
  h = Number(hsl[0]);
  s = Number(hsl[1]);
  l = Number(hsl[2]);
  return [h, s, l];
}

function harmonize(color, start, end, interval, range = 360) {
  const colors = [color];
  const [h, s, l] = parseHSL(color);
  console.log({h,s,l})

  for (let i = start; i <= end; i += interval) {
    const h1 = (h + i) % range;
    const l1 = 100-l;
    const c1 = `hsl(${h1}, ${s}%, ${l1}%)`;
    colors.push(c1);
  }

  return colors;
}

function complementColor(color) {
  return harmonize(color, 180, 180, 1);
}

function splitColor(color) {
  return harmonize(color, 150, 210, 60);
}

function triadColor(color) {
  return harmonize(color, 120, 240, 120);
}

function tetradColor(color) {
  return harmonize(color, 90, 270, 90);
}

function analogousColor(color) {
  return harmonize(color, 30, 90, 30);
}
