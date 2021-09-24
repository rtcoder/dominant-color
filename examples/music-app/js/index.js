import { getDominantColor } from '../../../lib/dominant-color.js';

let timer = null;
let mousePosOnSlideStartX = 0;
let mousePosOnSlideCurrentX = 0;
let isMouseDownOnSlide = false;
let isMouseDownOnBar = false;
let slidesWrapperOffset = 0;
let tmpSlidesWrapperOffset = 0;
const slideWidth = 278;
let currentSlide = 0;
let currentSongTime = 0;
const maxSongTime = 132;
let isPlay = true;
const repeatOptions = {
  NONE: 0,
  ONE: 1,
  ALL: 2,
};
let repeatSong = repeatOptions.NONE;
const musicAppContainer = document.querySelector('.music-app-example');
const phoneContainer = musicAppContainer.querySelector('.phone-container');
const sliderContainer = musicAppContainer.querySelector('.slides-container');
const slidesWrapper = sliderContainer.querySelector('.slides');
let slides = slidesWrapper.querySelectorAll('.slide');
let slidesCount = [...slides].length;
const currentTime = musicAppContainer.querySelector('.time');
const bar = musicAppContainer.querySelector('.bar');
const playPause = musicAppContainer.querySelector('.play-pause');
const repeatBtn = musicAppContainer.querySelector('.repeat');
sliderContainer.addEventListener('mousedown', mouseDownOnSlide);
bar.addEventListener('mousedown', mouseDownOnBar);
window.addEventListener('mouseup', mouseUp);
window.addEventListener('mouseleave', mouseUp);
window.addEventListener('mousemove', mouseMove);

musicAppContainer.querySelector('.next').addEventListener('click', nextSong);
musicAppContainer.querySelector('.prev').addEventListener('click', prevSong);
playPause.addEventListener('click', playOrPause);
repeatBtn.addEventListener('click', toggleRepeat);

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
  setBarPos(e);
}

function mouseUpOnBar() {
  if (!isMouseDownOnBar) {
    return;
  }
  isMouseDownOnBar = false;
  resetMousePosition();
}

function mouseMoveOnBar(e) {
  if (!isMouseDownOnBar) {
    return;
  }
  setBarPos(e);
}

function setBarPos(e) {
  const { pageX } = e;
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
}

function setOffset() {
  const offset = slidesWrapperOffset + (mousePosOnSlideCurrentX - mousePosOnSlideStartX);
  if (offset > slideWidth / 2 || offset < -(((slidesCount - 1) * slideWidth) + (slideWidth / 2))) {
    return;
  }
  tmpSlidesWrapperOffset = offset;
  slidesWrapper.style.marginLeft = `${offset}px`;
}

function updateBackgroundColor() {
  const slide = slides.item(currentSlide);
  const color = slide.style.getPropertyValue('--dominant-color-img');
  phoneContainer.style.setProperty('--app-dominant-color', color);
  const hsl = RGBToHSL(color);
  const triadColors = triadColor(hsl);
  phoneContainer.style.setProperty('--app-triad-color-1', triadColors[1]);
  phoneContainer.style.setProperty('--app-triad-color-2', triadColors[2]);
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

function playOrPause() {
  isPlay = !isPlay;

  playPause.classList.remove('play');
  playPause.classList.remove('pause');
  if (isPlay) {
    runTimer();
    playPause.classList.add('play');
  } else {
    stopTimer();
    playPause.classList.add('pause');
  }
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
  update();
}

function update() {
  bar.style.setProperty('--progresVal', percent(currentSongTime, maxSongTime) + '%');
}

function toggleRepeat() {
  if (repeatSong === repeatOptions.NONE) {
    repeatSong = repeatOptions.ONE;
  } else if (repeatSong === repeatOptions.ONE) {
    repeatSong = repeatOptions.ALL;
  } else if (repeatSong === repeatOptions.ALL) {
    repeatSong = repeatOptions.NONE;
  }

  repeatBtn.classList.remove('none');
  repeatBtn.classList.remove('one');
  repeatBtn.classList.remove('all');
  switch (repeatSong) {
    case repeatOptions.NONE:
      repeatBtn.classList.add('none');
      break;
    case repeatOptions.ONE:
      repeatBtn.classList.add('one');
      break;
    case repeatOptions.ALL:
      repeatBtn.classList.add('all');
      break;
  }
}

function runTimer() {
  if (timer !== null) {
    return;
  }
  timer = setInterval(() => {
    if (isMouseDownOnBar) {
      return;
    }
    currentSongTime++;
    if (currentSongTime > maxSongTime) {
      switch (repeatSong) {
        case repeatOptions.NONE:
          if (currentSlide >= slidesCount - 1) {
            nextSong();
            playOrPause();
          } else {
            nextSong();
          }
          break;
        case repeatOptions.ONE:
          resetSongTime();
          break;
        case repeatOptions.ALL:
          nextSong();
          break;
      }
    }
    updateSongTime();
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}


fetch('./json/tracks.json')
  .then(res => res.json())
  .then(jsonArr => {
    const html = jsonArr.map(json => {
      return `
            <div class='slide'>
              <div class='image'>
                <img src='${json.cover}' alt=''>
              </div>
            </div>
`;
    }).join('');
    slidesWrapper.innerHTML = html;
    slides = slidesWrapper.querySelectorAll('.slide');
    slidesCount = [...slides].length;
  }).then(() => {

  [...slidesWrapper.querySelectorAll('img')].forEach(imgNode => {
    getDominantColor(imgNode, {
      downScaleFactor: 1,
      skipPixels: 1,
      paletteWithCountOfOccurrences: true,
      callback: (color,pallete) => {
        console.log({color,pallete})
        imgNode.parentNode.parentNode.style.setProperty('--dominant-color-img', `rgb(${color})`);
        // updateBackgroundColor();
      },
    });
  });
});

runTimer();
