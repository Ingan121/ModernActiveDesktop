// pattern.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

if (parent === window) {
    alert("This page is not meant to be opened directly. Please open it from ModernActiveDesktop.");
} else if (!frameElement) {
    alert("MADConf is being cross-origin restricted. Please run ModernActiveDesktop with a web server.");
}

const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const editPatternBtn = document.getElementById("editPatternBtn");
const patternChooser = document.getElementById("patternChooser");
const patternPreview = document.getElementById("patternPreview");

const defaultPatterns = {
    "locid:MADCONF_PATTERN_BRICKS": "u1+uXbp16vU",
    "locid:MADCONF_PATTERN_BUTTONS": "qn3GR8Z/vlU",
    "locid:MADCONF_PATTERN_CARGO_NET": "eDETh+HIjB4",
    "locid:MADCONF_PATTERN_CIRCUITS": "UimEQpQpQoQ",
    "locid:MADCONF_PATTERN_COBBLESTONES": "KESSq9ZsOBA",
    "locid:MADCONF_PATTERN_COLOSSEUM": "ggEBAatVqlU",
    "locid:MADCONF_PATTERN_DAISIES": "HozY/b8bMXg",
    "locid:MADCONF_PATTERN_DIZZY": "PgfhBz5ww3A",
    "locid:MADCONF_PATTERN_FIELD_EFFECT": "VlmmmmWVaqk",
    "locid:MADCONF_PATTERN_KEY": "/gL6irqivoA",
    "locid:MADCONF_PATTERN_LIVE_WIRE": "7+8O/v7+4O8",
    "locid:MADCONF_PATTERN_PLAID": "8PDw8KpVqlU",
    "locid:MADCONF_PATTERN_ROUNDER": "15Mo1yiT1dc",
    "locid:MADCONF_PATTERN_SCALES": "4SolklWYPvc",
    "locid:MADCONF_PATTERN_STONE": "rk3v/whNrk0",
    "locid:MADCONF_PATTERN_THATCHES": "+HQiR48XInE",
    "locid:MADCONF_PATTERN_TILE": "RYIBAAGCRao",
    "locid:MADCONF_PATTERN_TRIANGLES": "hwcGBAD358c",
    "locid:MADCONF_PATTERN_WAFFLES_REVENGE": "TZoIVe+aTZo"
};

let userPatterns = {};
let patternData = '';

if (!localStorage.madesktopUserPatterns) {
    localStorage.madesktopUserPatterns = JSON.stringify(defaultPatterns);
}

loadPatterns();

if (localStorage.madesktopBgPattern) {
    patternPreview.style.backgroundImage = `url(${genPatternImage(base64ToPattern(localStorage.madesktopBgPattern))})`;
    patternData = localStorage.madesktopBgPattern;
    editPatternBtn.disabled = false;
}
if (localStorage.madesktopBgColor) {
    patternPreview.style.backgroundColor = localStorage.madesktopBgColor;
}

patternChooser.children[0].addEventListener("click", function () {
    for (const child of patternChooser.children) {
        child.classList.remove("selected");
    }
    this.classList.add("selected");
    patternPreview.style.backgroundImage = 'none';
    patternData = '';
    editPatternBtn.disabled = true;
});

okBtn.addEventListener("click", function () {
    callback(patternData);
    madCloseWindow();
});

cancelBtn.addEventListener("click", madCloseWindow);

editPatternBtn.addEventListener("click", function () {
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 40 + 'px';
    const options = { left, top, width: '378px', height: localStorage.madesktopDebugMode ? '260px' : '234px', aot: true };
    const patternWindow = madOpenWindow('apps/madconf/pattern_editor.html', true, options);
    patternWindow.windowElement.addEventListener('load', () => {
        const index = patternChooser.querySelector('.selected').dataset.index;
        patternWindow.windowElement.contentWindow.setPattern(parseInt(index));
        patternWindow.windowElement.contentWindow.callback = patternCallback;
    });
});

window.patternCallback = function (pattern) {
    const prevSelectedIndex = patternChooser.querySelector('.selected').dataset.index;
    loadPatterns();
    if (!pattern) {
        patternChooser.querySelector('[data-index="' + prevSelectedIndex + '"]').click();
        return;
    }
    patternChooser.querySelector('.selected')?.classList.remove("selected");
    patternData = pattern;
    patternPreview.style.backgroundImage = `url(${genPatternImage(base64ToPattern(pattern))})`;
    for (const option of patternChooser.children) {
        if (option.dataset.pattern === pattern) {
            option.classList.add("selected");
            scrollIntoView(option);
            break;
        }
    }
};

function loadPatterns() {
    for (let i = patternChooser.children.length - 1; i > 0; i--) {
        patternChooser.children[i].remove();
    }
    userPatterns = JSON.parse(localStorage.madesktopUserPatterns);
    const sortedPatternNames = Object.keys(userPatterns).sort((a, b) => {
        if (a.startsWith("locid:")) {
            a = madGetString(a.substring(6));
        }
        if (b.startsWith("locid:")) {
            b = madGetString(b.substring(6));
        }
        return a.localeCompare(b);
    });
    for (const pattern of sortedPatternNames) {
        const option = document.createElement("li");
        option.dataset.pattern = userPatterns[pattern];
        option.dataset.index = Object.keys(userPatterns).indexOf(pattern);
        if (pattern.startsWith("locid:")) {
            option.innerHTML = `<span><mad-string data-locid="${pattern.substring(6)}"></mad-string></span>`;
        } else {
            option.innerHTML = `<span>${pattern}</span>`;
        }
        option.addEventListener("click", function () {
            for (const child of patternChooser.children) {
                child.classList.remove("selected");
            }
            this.classList.add("selected");
            patternPreview.style.backgroundImage = `url(${genPatternImage(base64ToPattern(this.dataset.pattern))})`;
            patternData = this.dataset.pattern;
            editPatternBtn.disabled = false;
        });
        patternChooser.appendChild(option);
        if (localStorage.madesktopBgPattern === option.dataset.pattern) {
            patternChooser.querySelector(".selected")?.classList.remove("selected");
            option.classList.add("selected");
            scrollIntoView(option);
        }
    }
}