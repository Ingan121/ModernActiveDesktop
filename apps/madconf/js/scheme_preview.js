// scheme_preview.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const schemeElement = document.getElementById("scheme");
const fontElement = document.getElementById("font");
const menuStyleElement = document.getElementById("menuStyle");
const container = document.getElementById("container");
const activeWindow = document.getElementById("activeWindow");

function changeColorScheme(scheme) {
    if (scheme === "98") {
        schemeElement.href = "data:text/css,";
    } else if (scheme === "custom") {
        schemeElement.href = localStorage.madesktopCustomColor;
    } else if (scheme.split('\n').length > 1) {
        const dataURL = `data:text/css,${encodeURIComponent(scheme)}`;
        schemeElement.href = dataURL;
    } else if (scheme === "sys") {
        if (localStorage.madesktopSysColorCache) {
            schemeElement.href = localStorage.madesktopSysColorCache;
        }

        fetch("http://localhost:3031/systemscheme")
            .then(response => response.text())
            .then(responseText => {
                const dataURL = `data:text/css,${encodeURIComponent(responseText)}`;
                schemeElement.href = dataURL;
            })
            .catch(error => {
                // Ignore it as SysPlug startup is slower than high priority WE startup
            })
    } else {
        schemeElement.href = `../../schemes/${scheme}.css`;
        setTimeout(resize, 100);
    }
    resize();
}

// Toggle between "Pixelated MS Sans Serif" and just sans-serif
function changeFont(isPixel) {
    if (isPixel) {
        fontElement.href = "../../css/nopixel.css";
    } else {
        fontElement.href = "";
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

document.body.style.zoom = parent.document.body.style.zoom || 1;
changeColorScheme(localStorage.madesktopColorScheme || "98");
changeFont(localStorage.madesktopNoPixelFonts);
changeMenuStyle(localStorage.madesktopMenuStyle);
if (localStorage.madesktopBgColor) {
    document.body.style.backgroundColor = localStorage.madesktopBgColor;
}

new MutationObserver(function(mutations) {
    document.body.style.zoom = parent.document.body.style.zoom || 1;
    resize();
}).observe(
    parent.document.body,
    { attributes: true, attributeFilter: ["style"] }
);

resize();
window.addEventListener("resize", resize);

function resize() {
    container.style.left = (frameElement.offsetWidth - activeWindow.offsetWidth - 10) / 2 + "px";
}