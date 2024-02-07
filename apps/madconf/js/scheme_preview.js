// scheme_preview.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const schemeElement = document.getElementById("scheme");
const menuStyleElement = document.getElementById("menuStyle");
const styleElement = document.getElementById("style");
const container = document.getElementById("container");
const inactiveWindow = document.getElementById("inactiveWindow");
const activeWindow = document.getElementById("activeWindow");
const msgbox = document.getElementById("msgbox");

function changeColorScheme(scheme) {
    if (scheme === "98") {
        schemeElement.href = "data:text/css,";
        processTheme();
    } else if (scheme === "custom") {
        schemeElement.href = localStorage.madesktopCustomColor;
        processTheme();
    } else if (scheme.split('\n').length > 1) {
        const dataURL = `data:text/css,${encodeURIComponent(scheme)}`;
        schemeElement.href = dataURL;
        processTheme();
    } else if (scheme === "sys") {
        if (localStorage.madesktopSysColorCache) {
            schemeElement.href = localStorage.madesktopSysColorCache;
        }

        fetch("http://localhost:3031/systemscheme")
            .then(response => response.text())
            .then(responseText => {
                const dataURL = `data:text/css,${encodeURIComponent(responseText)}`;
                schemeElement.href = dataURL;
                processTheme();
            })
            .catch(error => {
                // Ignore it as SysPlug startup is slower than high priority WE startup
            })
    } else {
        schemeElement.href = `../../schemes/${scheme}.css`;
    }
}

// Toggle between "Pixelated MS Sans Serif" and just sans-serif
function changeFont(isPixel) {
    if (isPixel) {
        document.documentElement.style.setProperty('--ui-font', 'sans-serif');
    } else {
        document.documentElement.style.removeProperty('--ui-font');
    }
}

// Change menu style
function changeMenuStyle(style) {
    if (!style) {
        menuStyleElement.href = "";
    } else {
        menuStyleElement.href = `../../css/flatmenu-${style}.css`;
    }
}

function processTheme() {
    styleElement.textContent = top.generateThemeSvgs(document.documentElement);
    resize();
}

document.body.style.zoom = parent.document.body.style.zoom || 1;

const url = new URLSearchParams(window.location.search);
if (url.has("scheme")) {
    changeColorScheme(url.get("scheme"));
} else {
    changeColorScheme(localStorage.madesktopColorScheme || "98");
}
changeFont(localStorage.madesktopNoPixelFonts);
changeMenuStyle(localStorage.madesktopMenuStyle);
if (localStorage.madesktopBgColor) {
    document.body.style.backgroundColor = localStorage.madesktopBgColor;
}

new MutationObserver(function (mutations) {
    document.body.style.zoom = parent.document.body.style.zoom || 1;
    resize();
}).observe(
    parent.document.body,
    { attributes: true, attributeFilter: ["style"] }
);

window.addEventListener("load", processTheme);
window.addEventListener("resize", processTheme);

function resize() {
    container.style.left = (frameElement.offsetWidth - (activeWindow.offsetLeft + activeWindow.offsetWidth - inactiveWindow.offsetLeft) - 2) / 2 + "px";
    container.style.top = (frameElement.offsetHeight - (msgbox.offsetTop + msgbox.offsetHeight - inactiveWindow.offsetTop) - 2) / 2 + "px";
}