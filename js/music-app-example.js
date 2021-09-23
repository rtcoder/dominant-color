import { getDominantColor } from '../lib/dominant-color.js';

let mousePosOnSlideStartX = 0;
let mousePosOnSlideCurrentX = 0;
let isMouseDownOnSlide = false;
let mousePosOnBarStartX = 0;
let mousePosOnBarCurrentX = 0;
let isMouseDownOnBar = false;
let slidesWrapperOffset = 0;
let tmpSlidesWrapperOffset = 0;
const slideWidth = 278;
let currentSlide = 0;
let currentSongTime = 0;
const maxSongTime = 132;
const musicAppContainer = document.querySelector('.music-app-example');
const phoneContainer = musicAppContainer.querySelector('.phone-container');
const sliderContainer = musicAppContainer.querySelector('.slides-container');
const slidesWrapper = sliderContainer.querySelector('.slides');
const slides = slidesWrapper.querySelectorAll('.slide');
const slidesCount = [...slides].length;
const currentTime = musicAppContainer.querySelector('.time');
const bar = musicAppContainer.querySelector('.bar');
sliderContainer.addEventListener('mousedown', mouseDownOnSlide);
bar.addEventListener('mousedown', mouseDownOnBar);
window.addEventListener('mouseup', mouseUp);
window.addEventListener('mouseleave', mouseUp);
window.addEventListener('mousemove', mouseMove);

musicAppContainer.querySelector('.next').addEventListener('click', nextSong);
musicAppContainer.querySelector('.prev').addEventListener('click', prevSong);


function mouseUp() {
  if (isMouseDownOnBar) {
    mouseUpOnBar();
  }
  if (isMouseDownOnSlide) {
    mouseUpOnSlide();
  }
}

function mouseMove(e) {
  if (isMouseDownOnBar) {
    mouseMoveOnBar(e);
  }
  if (isMouseDownOnSlide) {
    mouseMoveOnSlide(e);
  }
}

function mouseDownOnBar(e) {
  isMouseDownOnBar = true;
  const { pageX } = e;
  mousePosOnBarStartX = pageX;
}

function mouseUpOnBar() {
  if (!isMouseDownOnBar) {
    return;
  }
  console.log('mouseUp');
  isMouseDownOnBar = false;
  resetMousePosition();
}

function mouseMoveOnBar(e) {
  if (!isMouseDownOnBar) {
    return;
  }
  const { pageX } = e;
  mousePosOnBarCurrentX = pageX;
  const { left, width } = bar.getBoundingClientRect();
  let leftPos = pageX - left;
  if (leftPos < 0) {
    leftPos = 0;
  } else if (leftPos > width) {
    leftPos = width;
  }
  const percentVal = percent(leftPos, width);
  currentSongTime = parseInt((percentVal / 100) * maxSongTime);
  updateSongTime();
}

function mouseDownOnSlide(e) {
  const { pageX } = e;
  mousePosOnSlideStartX = pageX;
  isMouseDownOnSlide = true;
  slidesWrapper.style.transitionDuration = '0s';
}

function mouseUpOnSlide() {
  if (!isMouseDownOnSlide) {
    return;
  }
  console.log('mouseUp');
  resetMousePosition();
  isMouseDownOnSlide = false;
  slidesWrapper.style.transitionDuration = '0.4s';
  const oldSlide = currentSlide;
  currentSlide = Math.round((tmpSlidesWrapperOffset / slideWidth) * -1);
  updateBackgroundColor();
  if (oldSlide !== currentSlide) {
    resetSongTime();
  }
  slidesWrapperOffset = (currentSlide * slideWidth) * -1;
  slidesWrapper.style.marginLeft = `${slidesWrapperOffset}px`;

}

function mouseMoveOnSlide(e) {
  if (!isMouseDownOnSlide) {
    return;
  }
  const { pageX } = e;
  mousePosOnSlideCurrentX = pageX;
  setOffset();
}

function resetMousePosition() {
  mousePosOnSlideStartX = 0;
  mousePosOnSlideCurrentX = 0;

  mousePosOnBarCurrentX = 0;
  mousePosOnBarStartX = 0;
}

function setOffset() {
  const offset = slidesWrapperOffset + (mousePosOnSlideCurrentX - mousePosOnSlideStartX);
  console.log(offset);
  if (offset > slideWidth / 2 || offset < -(((slidesCount - 1) * slideWidth) + (slideWidth / 2))) {
    return;
  }
  tmpSlidesWrapperOffset = offset;
  slidesWrapper.style.marginLeft = `${offset}px`;
}


function updateBackgroundColor() {
  const slide = slides.item(currentSlide);
  const color = slide.style.getPropertyValue('--dominant-color-img');
  phoneContainer.style.setProperty('--bg-color', color);
}

function nextSong() {
  resetSongTime();
  currentSlide++;
  if (currentSlide >= slidesCount) {
    currentSlide = 0;
  }
  updateBackgroundColor();
  slidesWrapperOffset = (currentSlide * slideWidth) * -1;
  slidesWrapper.style.marginLeft = `${slidesWrapperOffset}px`;
}

function prevSong() {
  if (currentSongTime > 5) {
    resetSongTime();
    return;
  }
  resetSongTime();
  currentSlide--;
  if (currentSlide <= 0) {
    currentSlide = slidesCount - 1;
  }
  updateBackgroundColor();
  slidesWrapperOffset = (currentSlide * slideWidth) * -1;
  slidesWrapper.style.marginLeft = `${slidesWrapperOffset}px`;
}


function percent(val, full) {
  return val / full * 100;
}

function resetSongTime() {
  currentSongTime = 0;
  updateSongTime();
}

function updateSongTime() {
  const minutes = Math.floor(currentSongTime / 60);
  let seconds = currentSongTime - minutes * 60;
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  currentTime.innerText = `${minutes}:${seconds}`;
  updateBar();
}

function updateBar() {
  bar.style.setProperty('--progresVal', percent(currentSongTime, maxSongTime) + '%');
}

const timer = setInterval(() => {
  if (isMouseDownOnBar) {
    return;
  }
  currentSongTime++;
  if (currentSongTime > maxSongTime) {
    nextSong();
  }
  updateSongTime();
}, 1000);

[...slidesWrapper.querySelectorAll('img')].forEach(imgNode => {
  getDominantColor(imgNode, {
    downScaleFactor: 10,
    skipPixels: 10,
    colorsPaletteLength: 7,
    callback: (color) => {
      imgNode.parentNode.parentNode.style.setProperty('--dominant-color-img', `rgb(${color})`);
      updateBackgroundColor();
    },
  });
});
