// config.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const textboxes = document.querySelectorAll("input[type='text'], input[type='number']");

const defaultRadBtn = document.getElementById('radDefault');
const schemeRadBtn = document.getElementById('radScheme');
const customRadBtn = document.getElementById('radCustom');
const followAlbumArtChkBox = document.getElementById('followAlbumArtChkBox');
const showClientEdgeChkBox = document.getElementById('showClientEdgeChkBox');

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

const noProcessingRadBtn = document.getElementById("radNoProcessing");
const reverseRadBtn = document.getElementById("radReverse");
const combineRadBtn = document.getElementById("radCombine");

const fixedBarsChkBox = document.getElementById("fixedBarsChkBox");
const barWidthInput = document.getElementById("barWidthInput");
const decSpeedLabel = document.getElementById("decSpeedLabel");
const decSpeedInput = document.getElementById("decSpeedInput");

const primaryScaleLabel = document.getElementById("primaryScaleLabel");
const primaryScaleInput = document.getElementById("primaryScaleInput");
const diffScaleLabel = document.getElementById("diffScaleLabel");
const diffScaleInput = document.getElementById("diffScaleInput");
const diffScaleInfo = document.getElementById("diffScaleInfo");

const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

let openColorPickerColor = null;

for (const colorPicker of colorPickers) {
    colorPicker.addEventListener("click", function () {
        openColorPickerColor = this.querySelector(".colorPicker-color");
        madOpenMiniColorPicker(this, this.querySelector(".colorPicker-color").style.backgroundColor, changeColor, colorPicker.id !== "bgColorPicker");
    });
}

for (const textbox of textboxes) {
    textbox.addEventListener("click", async function () {
        if (madKbdSupport !== 1) {
            if (madSysPlug.inputStatus) {
                madSysPlug.focusInput();
            } else if (!await madSysPlug.beginInput()) {
                const msg = textbox.placeholder ? "UI_PROMPT_ENTER_VALUE_RESETTABLE" : "UI_PROMPT_ENTER_VALUE";
                const res = await madPrompt(madGetString(msg), null, textbox.placeholder, textbox.value);
                if (res === null) return;
                if (res === '') {
                    textbox.value = textbox.placeholder;
                } else {
                    textbox.value = res;
                }
                textbox.dispatchEvent(new Event('change'));
            }
        }
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

fixedBarsChkBox.addEventListener("change", () => {
    if (fixedBarsChkBox.checked) {
        barWidthInput.disabled = false;
    } else {
        barWidthInput.value = 6;
        barWidthInput.disabled = true;
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
    if (showClientEdgeChkBox.checked) {
        delete localStorage.madesktopVisNoClientEdge;
    } else {
        localStorage.madesktopVisNoClientEdge = true;
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

    if (noProcessingRadBtn.checked) {
        localStorage.madesktopVisChannelSeparation = 1;
    } else if (reverseRadBtn.checked) {
        localStorage.madesktopVisChannelSeparation = 2;
    } else {
        localStorage.madesktopVisChannelSeparation = 3;
    }

    if (fixedBarsChkBox.checked) {
        localStorage.madesktopVisBarWidth = barWidthInput.value;
    } else {
        delete localStorage.madesktopVisBarWidth;
    }

    localStorage.madesktopVisDecSpeed = decSpeedInput.value;
    localStorage.madesktopVisPrimaryScale = primaryScaleInput.value;
    localStorage.madesktopVisDiffScale = diffScaleInput.value;
    top.visDeskMover.windowElement.contentWindow.configChanged();
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
if (localStorage.madesktopVisNoClientEdge) {
    showClientEdgeChkBox.checked = false;
}
if (localStorage.madesktopVisShowAlbumArt) {
    albumArtChkBox.checked = true;
    dimAlbumArtChkBox.disabled = false;
}
if (localStorage.madesktopVisDimAlbumArt) {
    dimAlbumArtChkBox.checked = true;
}

if (localStorage.madesktopVisChannelSeparation) {
    switch (parseInt(localStorage.madesktopVisChannelSeparation)) {
        case 1:
            noProcessingRadBtn.checked = true;
            break;
        case 2:
            reverseRadBtn.checked = true;
            break;
        case 3:
            combineRadBtn.checked = true;
            break;
    }
}

if (localStorage.madesktopVisBarWidth) {
    fixedBarsChkBox.checked = true;
    barWidthInput.value = localStorage.madesktopVisBarWidth;
    barWidthInput.disabled = false;
}
if (localStorage.madesktopVisDecSpeed) {
    decSpeedInput.value = localStorage.madesktopVisDecSpeed;
}
if (localStorage.madesktopVisPrimaryScale) {
    primaryScaleInput.value = localStorage.madesktopVisPrimaryScale;
}
if (localStorage.madesktopVisDiffScale) {
    diffScaleInput.value = localStorage.madesktopVisDiffScale;
}

if (localStorage.madesktopVisOnlyAlbumArt) {
    albumArtChkBox.disabled = true;
    dimAlbumArtChkBox.disabled = true;
    barColorPicker.disabled = true;
    topColorPicker.disabled = true;
    barColorPickerLabel.classList.add("disabled");
    topColorPickerLabel.classList.add("disabled");
    noProcessingRadBtn.disabled = true;
    reverseRadBtn.disabled = true;
    combineRadBtn.disabled = true;
    fixedBarsChkBox.disabled = true;
    barWidthInput.disabled = true;
    decSpeedLabel.classList.add("disabled");
    decSpeedInput.disabled = true;
    primaryScaleLabel.classList.add("disabled");
    primaryScaleInput.disabled = true;
    diffScaleLabel.classList.add("disabled");
    diffScaleInput.disabled = true;
    diffScaleInfo.classList.add("disabled");
}

window.addEventListener('load', () => {
    if (localStorage.madesktopVisUseSchemeColors) {
        bgColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
        barColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--hilight');
        topColorPickerColor.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-text');
    }
    madResizeTo(null, document.documentElement.offsetHeight);
});

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});