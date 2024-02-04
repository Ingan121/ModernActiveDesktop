// config.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const defaultRadBtn = document.getElementById('radDefault');
const schemeRadBtn = document.getElementById('radScheme');
const customRadBtn = document.getElementById('radCustom');
const followAlbumArtChkBox = document.getElementById('followAlbumArtChkBox');

const customColors = document.getElementById("customColors");
const colorPickers = document.querySelectorAll(".colorPicker");
const bgColorPicker = document.getElementById("bgColorPicker");
const bgColorPickerColor = bgColorPicker.querySelector(".colorPicker-color");
const barColorPicker = document.getElementById("barColorPicker");
const barColorPickerColor = barColorPicker.querySelector(".colorPicker-color");
const barColorPickerLabel = document.getElementById("barColorPickerLabel");
const topColorPicker = document.getElementById("topColorPicker");
const topColorPickerColor = topColorPicker.querySelector(".colorPicker-color");
const topColorPickerLabel = document.getElementById("topColorPickerLabel");

const albumArtChkBox = document.getElementById("albumArtChkBox");
const dimAlbumArtChkBox = document.getElementById("dimAlbumArtChkBox");

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

function changeColor(color) {
    openColorPickerColor.style.backgroundColor = color;
}

defaultRadBtn.addEventListener("click", () => {
    bgColorPickerColor.style.backgroundColor = "#000000";
    barColorPickerColor.style.backgroundColor = "#a4eb0c";
    topColorPickerColor.style.backgroundColor = "#dfeaf7";
    bgColorPicker.disabled = true;
    barColorPicker.disabled = true;
    topColorPicker.disabled = true;
    customColors.classList.add("disabled");
});

schemeRadBtn.addEventListener("click", () => {
    bgColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
    barColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--hilight');
    topColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-text');
    bgColorPicker.disabled = true;
    barColorPicker.disabled = true;
    topColorPicker.disabled = true;
    customColors.classList.add("disabled");
});

customRadBtn.addEventListener("click", () => {
    bgColorPicker.disabled = false;
    if (!localStorage.madesktopVisOnlyAlbumArt) {
        barColorPicker.disabled = false;
        topColorPicker.disabled = false;
    }
    customColors.classList.remove("disabled");
});

albumArtChkBox.addEventListener("change", () => {
    if (albumArtChkBox.checked) {
        dimAlbumArtChkBox.disabled = false;
    } else {
        dimAlbumArtChkBox.disabled = true;
    }
});

window.apply = function () {
    if (defaultRadBtn.checked) {
        delete localStorage.madesktopVisBgColor;
        delete localStorage.madesktopVisBarColor;
        delete localStorage.madesktopVisTopColor;
        delete localStorage.madesktopVisUseSchemeColors;
    } else if (schemeRadBtn.checked) {
        localStorage.madesktopVisUseSchemeColors = true;
    } else {
        localStorage.madesktopVisBgColor = bgColorPickerColor.style.backgroundColor;
        localStorage.madesktopVisBarColor = barColorPickerColor.style.backgroundColor;
        localStorage.madesktopVisTopColor = topColorPickerColor.style.backgroundColor;
        delete localStorage.madesktopVisUseSchemeColors;
    }

    if (followAlbumArtChkBox.checked) {
        localStorage.madesktopVisFollowAlbumArt = true;
    } else {
        delete localStorage.madesktopVisFollowAlbumArt;
    }
    if (albumArtChkBox.checked) {
        localStorage.madesktopVisShowAlbumArt = true;
    } else {
        delete localStorage.madesktopVisShowAlbumArt;
    }
    if (dimAlbumArtChkBox.checked) {
        localStorage.madesktopVisDimAlbumArt = true;
    } else {
        delete localStorage.madesktopVisDimAlbumArt;
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

if (localStorage.madesktopVisUseSchemeColors) {
    schemeRadBtn.checked = true;
} else if (localStorage.madesktopVisBgColor) {
    customRadBtn.checked = true;
    bgColorPickerColor.style.backgroundColor = localStorage.madesktopVisBgColor;
    barColorPickerColor.style.backgroundColor = localStorage.madesktopVisBarColor;
    topColorPickerColor.style.backgroundColor = localStorage.madesktopVisTopColor;
    bgColorPicker.disabled = false;
    barColorPicker.disabled = false;
    topColorPicker.disabled = false;
    customColors.classList.remove("disabled");
}

if (localStorage.madesktopVisFollowAlbumArt) {
    followAlbumArtChkBox.checked = true;
}

if (localStorage.madesktopVisShowAlbumArt) {
    albumArtChkBox.checked = true;
    dimAlbumArtChkBox.disabled = false;
}

if (localStorage.madesktopVisDimAlbumArt) {
    dimAlbumArtChkBox.checked = true;
}

if (localStorage.madesktopVisOnlyAlbumArt) {
    albumArtChkBox.disabled = true;
    dimAlbumArtChkBox.disabled = true;
    barColorPicker.disabled = true;
    topColorPicker.disabled = true;
    barColorPickerLabel.classList.add("disabled");
    topColorPickerLabel.classList.add("disabled");
}

window.addEventListener('load', () => {
    if (localStorage.madesktopVisUseSchemeColors) {
        bgColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
        barColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--hilight');
        topColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-text');
    }
});

madSetIcon(false);