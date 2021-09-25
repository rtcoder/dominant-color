import { getDominantColor } from '../dist/dominant-color.js';

const dropArea = document.getElementById('drop-area');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropArea.classList.add('highlight');
}

function unhighlight(e) {
  dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  let dt = e.dataTransfer;
  let files = dt.files;

  handleFiles(files);
}

function handleFiles(files) {
  [...files].forEach(previewFile);
}

function previewFile(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function() {
    const [imgContainer, img] = createStructureWithImage(reader.result);
    document.getElementById('gallery').prepend(imgContainer);
    getDominantColor(img, {
      downScaleFactor: 10,
      skipPixels: 10,
      callback: (color) => {
        imgContainer.style.setProperty('--dominant-color', `rgb(${color})`);
      },
    });
  };
}

function createStructureWithImage(src) {
  const img = document.createElement('img');
  img.src = src;

  const image = document.createElement('div');
  image.classList.add('image');

  const imgContainer = document.createElement('div');
  imgContainer.classList.add('img-container');

  const imgColorContainer = document.createElement('div');
  imgColorContainer.classList.add('img-color-container');

  const circle = document.createElement('div');
  circle.classList.add('circle');

  const text = document.createTextNode('Dominant color');

  imgColorContainer.append(text);
  imgColorContainer.append(circle);
  image.append(img);
  imgContainer.append(image);
  imgContainer.append(imgColorContainer);

  return [imgContainer, img];
}
