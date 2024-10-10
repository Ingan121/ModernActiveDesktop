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
const albumArtSizeArea = document.getElementById("albumArtSizeArea");
const albumArtSizeSelector = document.getElementById("albumArtSizeSelector");

const fixedBarsChkBox = document.getElementById("fixedBarsChkBox");
const barWidthInput = document.getElementById("barWidthInput");
const decSpeedLabel = document.getElementById("decSpeedLabel");
const decSpeedInput = document.getElementById("decSpeedInput");

const primaryScaleLabel = document.getElementById("primaryScaleLabel");
const primaryScaleInput = document.getElementById("primaryScaleInput");
const diffScaleLabel = document.getElementById("diffScaleLabel");
const diffScaleInput = document.getElementById("diffScaleInput");
const diffScaleInfo = document.getElementById("diffScaleInfo");

const titleOptSelector = document.getElementById("titleOptSelector");
const chanSepArea = document.getElementById("chanSepArea");
const chanSepSelector = document.getElementById("chanSepSelector");
const showClientEdgeChkBox = document.getElementById('showClientEdgeChkBox');
const fsMarginChkBox = document.getElementById("fsMarginChkBox");

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
                const res = await madPrompt(madGetString(msg), null, textbox.placeholder, textbox.value, true);
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
        albumArtSizeArea.classList.remove("disabled");
        albumArtSizeSelector.disabled = false;
    } else {
        dimAlbumArtChkBox.disabled = true;
        albumArtSizeArea.classList.add("disabled");
        albumArtSizeSelector.disabled = true;
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
    localStorage.madesktopVisAlbumArtSize = albumArtSizeSelector.value;

    if (fixedBarsChkBox.checked) {
        localStorage.madesktopVisBarWidth = barWidthInput.value;
    } else {
        delete localStorage.madesktopVisBarWidth;
    }

    localStorage.madesktopVisDecSpeed = decSpeedInput.value;
    localStorage.madesktopVisPrimaryScale = primaryScaleInput.value;
    localStorage.madesktopVisDiffScale = diffScaleInput.value;

    localStorage.madesktopVisTitleMode = titleOptSelector.value;
    switch (chanSepSelector.value) {
        case "noProcessing":
            localStorage.madesktopVisChannelSeparation = 1;
            break;
        case "reverse":
            localStorage.madesktopVisChannelSeparation = 2;
            break;
        case "combine":
            localStorage.madesktopVisChannelSeparation = 3;
            break;
    }
    if (showClientEdgeChkBox.checked) {
        delete localStorage.madesktopVisNoClientEdge;
    } else {
        localStorage.madesktopVisNoClientEdge = true;
    }
    if (fsMarginChkBox.checked) {
        delete localStorage.madesktopVisNoFsMargin;
    } else {
        localStorage.madesktopVisNoFsMargin = true;
    }

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

// Colors / Custom colors fieldset
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

// Album art fieldset
if (localStorage.madesktopVisFollowAlbumArt) {
    followAlbumArtChkBox.checked = true;
}
if (localStorage.madesktopVisShowAlbumArt) {
    albumArtChkBox.checked = true;
    dimAlbumArtChkBox.disabled = false;
    albumArtSizeArea.classList.remove("disabled");
    albumArtSizeSelector.disabled = false;
}
if (localStorage.madesktopVisDimAlbumArt) {
    dimAlbumArtChkBox.checked = true;
}
if (localStorage.madesktopVisAlbumArtSize) {
    albumArtSizeSelector.value = localStorage.madesktopVisAlbumArtSize;
}

// Visualizer fieldset
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

// Miscellanous fieldset
if (localStorage.madesktopVisTitleMode) {
    titleOptSelector.value = localStorage.madesktopVisTitleMode;
}
if (localStorage.madesktopVisChannelSeparation) {
    switch (parseInt(localStorage.madesktopVisChannelSeparation)) {
        case 1:
            chanSepSelector.value = "noProcessing";
            break;
        default:
            chanSepSelector.value = "reverse";
            break;
        case 3:
            chanSepSelector.value = "combine";
            break;
    }
}
if (localStorage.madesktopVisNoClientEdge) {
    showClientEdgeChkBox.checked = false;
}
if (localStorage.madesktopVisNoFsMargin) {
    fsMarginChkBox.checked = false;
}

if (localStorage.madesktopVisOnlyAlbumArt) {
    albumArtChkBox.disabled = true;
    dimAlbumArtChkBox.disabled = true;
    barColorPicker.disabled = true;
    topColorPicker.disabled = true;
    barColorPickerLabel.classList.add("disabled");
    topColorPickerLabel.classList.add("disabled");
    fixedBarsChkBox.disabled = true;
    barWidthInput.disabled = true;
    decSpeedLabel.classList.add("disabled");
    decSpeedInput.disabled = true;
    primaryScaleLabel.classList.add("disabled");
    primaryScaleInput.disabled = true;
    diffScaleLabel.classList.add("disabled");
    diffScaleInput.disabled = true;
    diffScaleInfo.classList.add("disabled");
    chanSepArea.classList.add("disabled");
    chanSepSelector.disabled = true;
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