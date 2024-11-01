// config.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

let fonts = [
    "Pixelated MS Sans Serif",
    "Fixedsys Excelsior"
];

const customColors = document.getElementById("customColors");
const colorPickers = document.querySelectorAll(".colorPicker");
const bgColorPicker = document.getElementById("backgroundColorPicker");
const bgColorPickerColor = bgColorPicker.querySelector(".colorPicker-color");

const fontSelector = document.getElementById("fontSelector");
const outlineModeChkBox = document.getElementById("outlineModeChkBox");

const resetBtn = document.getElementById("resetBtn");
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

let openColorPickerColor = null;

const configColors = {};

function init() {
    configColors.main = window.targetDeskMover.config.clockMainColor || "#008080";
    configColors.light = window.targetDeskMover.config.clockLightColor || "#00ffff";
    configColors.hilight = window.targetDeskMover.config.clockHilightColor || "#ffffff";
    configColors.shadow = window.targetDeskMover.config.clockShadowColor || "#a0a0a0";
    configColors.dkShadow = window.targetDeskMover.config.clockDkShadowColor || "#000000";
    configColors.background = window.targetDeskMover.config.clockBackgroundColor || getComputedStyle(document.documentElement).getPropertyValue('--button-face');

    for (const colorPicker of colorPickers) {
        const colorPickerColor = colorPicker.querySelector(".colorPicker-color");
        colorPickerColor.style.backgroundColor = configColors[colorPicker.id.replace('ColorPicker', '')];
        if (window.targetDeskMover.config.clockDigital) {
            colorPicker.disabled = true;
            colorPicker.parentElement.classList.add("disabled");
        } else {
            colorPicker.addEventListener("click", function () {
                openColorPickerColor = colorPickerColor;
                madOpenMiniColorPicker(this, this.querySelector(".colorPicker-color").style.backgroundColor, changeColor, colorPicker.id !== "backgroundColorPicker");
            });
        }
    }

    if (window.targetDeskMover.config.clockDigital) {
        fontSelector.disabled = false;
        outlineModeChkBox.disabled = false;
    }

    FontDetective.each(font => {
        const option = document.createElement("option");
        option.textContent = font.name;
        option.value = font.name;
        fontSelector.appendChild(option);
        fonts.push(font.name);
    });

    fontSelector.options[0].textContent = window.targetDeskMover.config.clockFont || "Microsoft Sans Serif";

    if (window.targetDeskMover.config.clockNoOutline) {
        outlineModeChkBox.checked = false;
    }

    if (!window.targetDeskMover.config.clockBackgroundColor) {
        const buttonFace = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
        bgColorPickerColor.style.backgroundColor = buttonFace;
        configColors.background = buttonFace;
    }

    madResizeTo(null, document.documentElement.offsetHeight / madScaleFactor);
}

function changeColor(color) {
    openColorPickerColor.style.backgroundColor = color;
    configColors[openColorPickerColor.parentElement.id.replace('ColorPicker', '')] = color;
}

resetBtn.addEventListener("click", () => {
    madConfirm(madGetString("CLOCKCONF_CONFIRM_RESET"), function (res) {
        if (res) {
            delete window.targetDeskMover.config.clockMainColor;
            delete window.targetDeskMover.config.clockLightColor;
            delete window.targetDeskMover.config.clockHilightColor;
            delete window.targetDeskMover.config.clockShadowColor;
            delete window.targetDeskMover.config.clockDkShadowColor;
            delete window.targetDeskMover.config.clockBackgroundColor;
            delete window.targetDeskMover.config.clockFont;
            delete window.targetDeskMover.config.clockNoOutline;
            window.targetDeskMover.windowElement.contentWindow.location.reload();
            madCloseWindow();
        }
    });
});

window.apply = function () {
    window.targetDeskMover.config.clockMainColor = configColors.main;
    window.targetDeskMover.config.clockLightColor = configColors.light;
    window.targetDeskMover.config.clockHilightColor = configColors.hilight;
    window.targetDeskMover.config.clockShadowColor = configColors.shadow;
    window.targetDeskMover.config.clockDkShadowColor = configColors.dkShadow;
    window.targetDeskMover.config.clockBackgroundColor = configColors.background;
    window.targetDeskMover.config.clockFont = fontSelector.value;

    if (!outlineModeChkBox.checked) {
        window.targetDeskMover.config.clockNoOutline = true;
    } else {
        delete window.targetDeskMover.config.clockNoOutline;
    }
    window.targetDeskMover.windowElement.contentWindow.configChanged(configColors);
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

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});