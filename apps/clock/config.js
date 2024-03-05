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
const bgColorPicker = document.getElementById("backgroundColorPicker");
const bgColorPickerColor = bgColorPicker.querySelector(".colorPicker-color");

const fontSelector = document.getElementById("fontSelector");
const outlineModeChkBox = document.getElementById("outlineModeChkBox");

const resetBtn = document.getElementById("resetBtn");
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

let openColorPickerColor = null;

const configColors = {
    main: localStorage.madesktopClockMainColor || "#008080",
    light: localStorage.madesktopClockLightColor || "#00ffff",
    hilight: localStorage.madesktopClockHilightColor || "#ffffff",
    shadow: localStorage.madesktopClockShadowColor || "#a0a0a0",
    dkShadow: localStorage.madesktopClockDkShadowColor || "#000000",
    background: localStorage.madesktopClockBackgroundColor || getComputedStyle(document.documentElement).getPropertyValue('--button-face')
};

for (const colorPicker of colorPickers) {
    const colorPickerColor = colorPicker.querySelector(".colorPicker-color");
    colorPickerColor.style.backgroundColor = configColors[colorPicker.id.replace('ColorPicker', '')];
    if (localStorage.madesktopClockDigital) {
        colorPicker.disabled = true;
        colorPicker.parentElement.classList.add("disabled");
    } else {
        colorPicker.addEventListener("click", function () {
            openColorPickerColor = colorPickerColor;
            madOpenMiniColorPicker(this, this.querySelector(".colorPicker-color").style.backgroundColor, function (color) {
                changeColor(color);
            });
        });
    }
}

if (localStorage.madesktopClockDigital) {
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

fontSelector.options[0].textContent = localStorage.madesktopClockFont || "Microsoft Sans Serif";

function changeColor(color) {
    openColorPickerColor.style.backgroundColor = color;
    configColors[openColorPickerColor.parentElement.id.replace('ColorPicker', '')] = color;
}

resetBtn.addEventListener("click", () => {
    madConfirm(madGetString("CLOCKCONF_CONFIRM_RESET"), function (res) {
        if (res) {
            delete localStorage.madesktopClockMainColor;
            delete localStorage.madesktopClockLightColor;
            delete localStorage.madesktopClockHilightColor;
            delete localStorage.madesktopClockShadowColor;
            delete localStorage.madesktopClockDkShadowColor;
            delete localStorage.madesktopClockBackgroundColor;
            delete localStorage.madesktopClockFont;
            delete localStorage.madesktopClockNoOutline;
            window.targetDeskMover.windowElement.contentWindow.location.reload();
            madCloseWindow();
        }
    });
});

window.apply = function () {
    localStorage.madesktopClockMainColor = configColors.main;
    localStorage.madesktopClockLightColor = configColors.light;
    localStorage.madesktopClockHilightColor = configColors.hilight;
    localStorage.madesktopClockShadowColor = configColors.shadow;
    localStorage.madesktopClockDkShadowColor = configColors.dkShadow;
    localStorage.madesktopClockBackgroundColor = configColors.background;
    localStorage.madesktopClockFont = fontSelector.value;

    if (!outlineModeChkBox.checked) {
        localStorage.madesktopClockNoOutline = true;
    } else {
        delete localStorage.madesktopClockNoOutline;
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

if (localStorage.madesktopClockNoOutline) {
    outlineModeChkBox.checked = false;
}

window.addEventListener('load', () => {
    if (!localStorage.madesktopClockBackgroundColor) {
        const buttonFace = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
        bgColorPickerColor.style.backgroundColor = buttonFace;
        configColors.background = buttonFace;
    }

    madResizeTo(null, document.documentElement.offsetHeight);
});

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});