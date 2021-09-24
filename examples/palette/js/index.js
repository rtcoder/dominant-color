import { getDominantColor } from '../../../dist/dominant-color.js';

function callbackAfterGetColor(imgNode) {
  return (color, colors) => {
    const [r, g, b] = color.split(',').map(Number);
    imgNode.parentNode.parentNode.parentNode.style.setProperty('--dominant-color', `rgb(${color})`);
    imgNode.parentNode.style.boxShadow = getShadow(r, g, b);

    imgNode.parentNode.parentNode.parentNode.querySelector('.palette').innerHTML = colors.map(c => {
      const v = lightOrDark(`rgb(${c})`) === "light" ? 0 : 255;
      const dotStyle = `background-color:rgb(${c}); border: 1px solid rgba(${v},${v},${v},0.45)`;
      return `<div style="${dotStyle}"></div>`;
    }).join('');
  }
}

[...document.querySelectorAll('.palette-example img')].forEach(imgNode => {
  getDominantColor(imgNode, {
    downScaleFactor: 10,
    skipPixels: 10,
    colorsPaletteLength: 7,
    callback: callbackAfterGetColor(imgNode)
  })
})
