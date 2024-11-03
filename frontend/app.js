import { CanvasManager } from './assets/canvas.js';

const ApiUrl = 'http://127.0.0.1:8000/api';
let canvasManager;
let currentImage = null;

document.addEventListener('DOMContentLoaded', function () {
  canvasManager = new CanvasManager('editor-canvas');
  initializeEventListeners();
  initializeColorPicker();
  initializeRectangleSpecs();
  fetchImages();
});

function initializeEventListeners() {
    document.getElementById('upload-image').addEventListener('change', handleImageUpload);
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

window.drawRectangle = function(x, y, width, height) {
  if (canvasManager) {
      canvasManager.addRectangle(
          parseInt(x),
          parseInt(y),
          parseInt(width),
          parseInt(height),
          getCurrentColor()
      );
  }
};



function handleImageUpload(e) {
    const img = new Image();
    img.onload = function () {
        currentImage = img;
        canvasManager.setBackgroundImage(img);
    };
    img.src = URL.createObjectURL(e.target.files[0]);
}

function handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === 'z') {
        undoLastRectangle();
    }
}

window.clearRectangles = function() {
    canvasManager.clearRectangles();
};

window.undoLastRectangle = function() {
  canvasManager.undoLastRectangle();
};

function initializeColorPicker() {
  const colorInput = document.getElementById('rect-color');
  const redInput = document.getElementById('red');
  const greenInput = document.getElementById('green');
  const blueInput = document.getElementById('blue');
  const alphaInput = document.getElementById('alpha');
  const previewBox = document.getElementById('color-preview-box');

  colorInput.addEventListener('input', function(e) {
      const color = e.target.value;
      const r = parseInt(color.substr(1,2), 16);
      const g = parseInt(color.substr(3,2), 16);
      const b = parseInt(color.substr(5,2), 16);
      
      redInput.value = r;
      greenInput.value = g;
      blueInput.value = b;
      updateColorPreview();
      updateSelectedRectangle();
  });

  [redInput, greenInput, blueInput, alphaInput].forEach(input => {
      input.addEventListener('input',() =>{
        updateColorPreview();
        updateSelectedRectangle();
      });
  });

  [redInput, greenInput, blueInput].forEach(input => {
      input.addEventListener('change', function() {
          const value = parseInt(this.value);
          this.value = Math.min(255, Math.max(0, value || 0));
          updateColorPreview();
          updateSelectedRectangle();
      });
  });

  alphaInput.addEventListener('change', function() {
      const value = parseInt(this.value);
      this.value = Math.min(100, Math.max(0, value || 0));
      updateColorPreview();
      updateSelectedRectangle();
  });
}

function updateColorPreview() {
  const previewBox = document.getElementById('color-preview-box');
  const rgba = getCurrentColor();
  previewBox.style.backgroundColor = rgba;
}

function getCurrentColor() {
  const red = document.getElementById('red').value;
  const green = document.getElementById('green').value;
  const blue = document.getElementById('blue').value;
  const alpha = document.getElementById('alpha').value / 100;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

window.greyScale = function() {
    if (!currentImage) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasManager.canvas.width;
    tempCanvas.height = canvasManager.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(canvasManager.canvas, 0, 0);
    let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = avg;
    }

    tempCtx.putImageData(imageData, 0, 0);
    
    const newImg = new Image();
    newImg.onload = function() {
        currentImage = newImg;
        canvasManager.setBackgroundImage(newImg);
    };
    newImg.src = tempCanvas.toDataURL();
};

window.saveImage = function() {
    if (canvasManager.rectangles.length == 0 && canvasManager.backgroundImage == undefined){
        canvasManager.showFeedback('No image to save', 'red');
    }else{
        console.log("Saving image");
        canvasManager.canvas.toBlob(function (blob) {
            const formData = new FormData();
            formData.append("name", "edited_image.png");
            formData.append('image', blob, 'edited_image.png');
            
            fetch(`${ApiUrl}/images/`, {
                method: 'POST',
                body: formData,
            })
            .then(response => response.json())
            .then(() => fetchImages())
            .catch(error => console.error('Error:', error));
        });
    }
};

async function fetchImages() {
    fetch(`${ApiUrl}/images/`)
        .then(response => response.json())
        .then(data => updateImageList(data))
        .catch(error => console.error('Error:', error));
}

function updateImageList(images) {
    const listBox = document.getElementById('image-list');
    listBox.innerHTML = '';
    images = images.reverse();
    images.forEach(image => {
        const imgElement = document.createElement('img');
        imgElement.src = image.image;
        imgElement.alt = image.name;
        imgElement.onclick = () => loadImage(image.image);
        listBox.appendChild(imgElement);
    });
}

function loadImage(src) {
    const img = new Image();
    img.onload = function() {
        currentImage = img;
        canvasManager.setBackgroundImage(img);
    };
    img.src = src;
}

function initializeRectangleSpecs() {
  const inputs = ['x-pos', 'y-pos', 'rect-width', 'rect-height', 'red', 'green', 'blue', 'alpha'];
  inputs.forEach(id => {
      const input = document.getElementById(id);
      input.addEventListener('input', updateSelectedRectangle);
      input.addEventListener('change', updateSelectedRectangle);
  });

}

function updateSelectedRectangle() {
  if (!canvasManager) return;
  
  const x = parseInt(document.getElementById('x-pos').value);
  const y = parseInt(document.getElementById('y-pos').value);
  const width = parseInt(document.getElementById('rect-width').value);
  const height = parseInt(document.getElementById('rect-height').value);
  const color = getCurrentColor();

  canvasManager.updateSelectedRectangle({
      x, y, width, height, color
  });
}