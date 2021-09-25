import { getDominantColor } from '../../../dist/dominant-color.js';

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

function callbackAfterGetColor(imgNode) {
  return (color, colors) => {
    const [r, g, b] = color.split(',').map(Number);
    imgNode.parentNode.parentNode.parentNode.style.setProperty('--dominant-color', `rgb(${color})`);
    imgNode.parentNode.style.boxShadow = getShadow(r, g, b);

    imgNode.parentNode.parentNode.parentNode.querySelector('.palette').innerHTML = colors.map(c => {
      const v = lightOrDark(`rgb(${c})`) === 'light' ? 0 : 255;
      const dotStyle = `background-color:rgb(${c}); border: 1px solid rgba(${v},${v},${v},0.45)`;
      return `<div style='${dotStyle}'></div>`;
    }).join('');
  };
}

[...document.querySelectorAll('.palette-example img')].forEach(imgNode => {
  getDominantColor(imgNode, {
    downScaleFactor: 10,
    skipPixels: 10,
    colorsPaletteLength: 7,
    callback: callbackAfterGetColor(imgNode),
  });
});
