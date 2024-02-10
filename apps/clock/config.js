// config.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License

'use strict';

let fonts = [
    "Pixelated MS Sans Serif",
    "Fixedsys Excelsior"
];

const customColors = document.getElementById("customColors");
const colorPickers = document.querySelectorAll(".colorPicker");

const fontSelector = document.getElementById("fontSelector");
const bgColorPicker = document.getElementById("bgColorPicker");
const bgColorPickerColor = bgColorPicker.querySelector(".colorPicker-color");
// const barColorPicker = document.getElementById("barColorPicker");
// const barColorPickerColor = barColorPicker.querySelector(".colorPicker-color");
// const barColorPickerLabel = document.getElementById("barColorPickerLabel");
// const topColorPicker = document.getElementById("topColorPicker");
// const topColorPickerColor = topColorPicker.querySelector(".colorPicker-color");
// const topColorPickerLabel = document.getElementById("topColorPickerLabel");

const outlineModeChkBox = document.getElementById("outlineModeChkBox");

const resetBtn = document.getElementById("resetBtn");
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

let openColorPickerColor = null;

for (const colorPicker of colorPickers) {
    colorPicker.addEventListener("click", function () {
        openColorPickerColor = this.querySelector(".colorPicker-color");
        madOpenMiniColorPicker(this, this.querySelector(".colorPicker-color").style.backgroundColor, function (color) {
            changeColor(color);
        });
    });
}

FontDetective.each(font => {
    const option = document.createElement("option");
    option.textContent = font.name;
    option.value = font.name;
    fontSelector.appendChild(option);
    fonts.push(font.name);
});

function changeColor(color) {
    openColorPickerColor.style.backgroundColor = color;
}

window.apply = function () {
    if (!outlineModeChkBox.checked) {
        localStorage.madesktopClockNoOutline = true;
    } else {
        delete localStorage.madesktopClockNoOutline;
    }
    window.targetDeskMover.windowElement.contentWindow.configChanged();
}

okBtn.addEventListener("click", () => {
    window.apply();
    madCloseWindow();
});

cancelBtn.addEventListener("click", () => {
    madCloseWindow();
});

applyBtn.addEventListener("click", () => {
    window.apply();
});

if (localStorage.madesktopClockNoOutline) {
    outlineModeChkBox.checked = false;
}

window.addEventListener('load', () => {
    bgColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
    madResizeTo(null, document.documentElement.offsetHeight);
});

madSetIcon(false);