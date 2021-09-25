import { getDominantColor } from '../../../dist/dominant-color.js';

let currentVolume = 1;
const songs = [];
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
let isPlay = false;
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
const titleDiv = musicAppContainer.querySelector('.title');
const authorDiv = musicAppContainer.querySelector('.author');
const statusDiv = musicAppContainer.querySelector('.status');
const songTimeDiv = musicAppContainer.querySelector('.length');
const volumeDiv = musicAppContainer.querySelector('.volume');
sliderContainer.addEventListener('mousedown', mouseDownOnSlide);
bar.addEventListener('mousedown', mouseDownOnBar);
window.addEventListener('mouseup', mouseUp);
window.addEventListener('mouseleave', mouseUp);
window.addEventListener('mousemove', mouseMove);

musicAppContainer.querySelector('.next').addEventListener('click', nextSong);
musicAppContainer.querySelector('.prev').addEventListener('click', prevSong);
playPause.addEventListener('click', playOrPause);
repeatBtn.addEventListener('click', toggleRepeat);
volumeDiv.addEventListener('click', toggleVolume);

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

  for (let i = start; i <= end; i += interval) {
    const h1 = (h + i) % range;
    const l1 = 100 - l;
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

function maxSongTime() {
  const { duration } = songs[currentSlide].sound;
  return isNaN(duration) ? 0 : parseInt(duration);
}

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
  currentSongTime = parseInt((percentVal / 100) * maxSongTime());
  updateSongTime();
}

function mouseDownOnSlide(e) {
  const { pageX } = e;
  mousePosOnSlideStartX = pageX;
  mousePosOnSlideCurrentX = pageX;
  isMouseDownOnSlide = true;
  slidesWrapper.style.transitionDuration = '0s';
}

function mouseUpOnSlide() {
  if (!isMouseDownOnSlide || mousePosOnSlideCurrentX === mousePosOnSlideStartX) {
    return;
  }
  resetMousePosition();
  isMouseDownOnSlide = false;
  slidesWrapper.style.transitionDuration = '0.4s';
  const oldSlide = currentSlide;
  currentSlide = Math.round((tmpSlidesWrapperOffset / slideWidth) * -1);
  updateBackgroundColor();
  updateTitleAndAuthor();
  if (oldSlide !== currentSlide) {
    resetSongTime();
    songs.forEach(song => {
      song.sound.currentTime = 0;
      song.sound.pause();
    });
    if (isPlay) {
      songs[currentSlide].sound.play();
    }
    const minutes = Math.floor(maxSongTime() / 60);
    let seconds = maxSongTime() - minutes * 60;
    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    songTimeDiv.innerText = `${minutes}:${seconds}`;
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
  updateTitleAndAuthor();
  updateBackgroundColor();
  slidesWrapperOffset = (currentSlide * slideWidth) * -1;
  slidesWrapper.style.marginLeft = `${slidesWrapperOffset}px`;
  songs.forEach(song => {
    song.sound.currentTime = 0;
    song.sound.pause();
  });
  if (isPlay) {
    songs[currentSlide].sound.play();
  }
  const minutes = Math.floor(maxSongTime() / 60);
  let seconds = maxSongTime() - minutes * 60;
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  songTimeDiv.innerText = `${minutes}:${seconds}`;
}

function prevSong() {
  if (currentSongTime > 5) {
    resetSongTime();
    return;
  }
  resetSongTime();
  currentSlide--;
  if (currentSlide < 0) {
    currentSlide = slidesCount - 1;
  }
  updateTitleAndAuthor();
  updateBackgroundColor();
  slidesWrapperOffset = (currentSlide * slideWidth) * -1;
  slidesWrapper.style.marginLeft = `${slidesWrapperOffset}px`;
  songs.forEach(song => {
    song.sound.currentTime = 0;
    song.sound.pause();
  });
  if (isPlay) {
    songs[currentSlide].sound.play();
  }
  const minutes = Math.floor(maxSongTime() / 60);
  let seconds = maxSongTime() - minutes * 60;
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  songTimeDiv.innerText = `${minutes}:${seconds}`;

}

function playOrPause() {
  isPlay = !isPlay;

  playPause.classList.remove('play');
  playPause.classList.remove('pause');
  if (isPlay) {
    runTimer();
    playPause.classList.add('play');
    statusDiv.innerHTML = '';
    songs[currentSlide].sound.play();
  } else {
    stopTimer();
    playPause.classList.add('pause');
    statusDiv.innerHTML = 'Paused';
    songs[currentSlide].sound.pause();
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

  songs[currentSlide].sound.currentTime = currentSongTime;
  updateProgressVal();
}

function updateProgressVal() {
  bar.style.setProperty('--progresVal', percent(currentSongTime, maxSongTime()) + '%');
}

function toggleVolume() {
  currentVolume = !currentVolume ? 1 : 0;
  songs.forEach(song => {
    song.sound.volume = currentVolume;
  });
  volumeDiv.classList.remove('on', 'off');
  if (currentVolume) {
    volumeDiv.classList.add('on');
  } else {
    volumeDiv.classList.add('off');
  }
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
    if (currentSongTime > maxSongTime()) {
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

function updateTitleAndAuthor() {
  titleDiv.innerHTML = songs[currentSlide].name;
  authorDiv.innerHTML = songs[currentSlide].author;
}

fetch('./json/tracks.json')
  .then(res => res.json())
  .then(jsonArr => {
    jsonArr.forEach(track => {
      const sound = new Audio(track.audio);
      songs.push({
        name: track.name,
        author: track.author,
        sound,
      });
    });
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
      callback: (color) => {
        imgNode.parentNode.parentNode.style.setProperty('--dominant-color-img', `rgb(${color})`);
        updateBackgroundColor();
        updateTitleAndAuthor();
        const minutes = Math.floor(maxSongTime() / 60);
        let seconds = maxSongTime() - minutes * 60;
        if (seconds < 10) {
          seconds = `0${seconds}`;
        }
        songTimeDiv.innerText = `${minutes}:${seconds}`;
      },
    });
  });
});

