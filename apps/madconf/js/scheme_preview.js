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

const inactiveTitle = inactiveWindow.getElementsByClassName("title-bar")[0];
const activeTitle = activeWindow.getElementsByClassName("title-bar")[0];
const captionButtons = document.querySelectorAll(".window-button");
const menu = document.getElementsByClassName("menu")[0];
const textarea = document.getElementsByTagName("textarea")[0];
const scrollBarOverlay = document.getElementById("scrollBarOverlay");
const msgboxTitle = msgbox.getElementsByClassName("title-bar")[0];
const buttonFace = document.getElementById("msgbox-btn1");

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

function changeAeroColor(color) {
    document.documentElement.style.setProperty('--title-accent', color || '#4580c4');
}

function changeAeroGlass(noGlass) {
    if (noGlass) {
        document.body.dataset.noGlass = true;
    } else {
        delete document.body.dataset.noGlass;
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
if (localStorage.madesktopAeroColor) {
    changeAeroColor(localStorage.madesktopAeroColor);
}
changeAeroGlass(localStorage.madesktopAeroNoGlass);
textarea.value = madGetString("MADCONF_PREVIEW_WINDOW_TEXT");

new MutationObserver(function (mutations) {
    document.body.style.zoom = parent.document.body.style.zoom || 1;
    resize();
}).observe(
    parent.document.body,
    { attributes: true, attributeFilter: ["style"] }
);

window.addEventListener("load", processTheme);
window.addEventListener("resize", processTheme);

document.addEventListener("pointerdown", function () {
    parent.madBringToTop();
});

document.addEventListener("click", function () {
    parent.changeItemSelection("background");
});

inactiveWindow.addEventListener("click", function (event) {
    parent.changeItemSelection("inactive-border");
    event.stopPropagation();
});

inactiveTitle.addEventListener("click", function (event) {
    parent.changeItemSelection("inactive-title");
    event.stopPropagation();
});

activeWindow.addEventListener("click", function (event) {
    parent.changeItemSelection("active-border");
    event.stopPropagation();
});

activeTitle.addEventListener("click", function (event) {
    parent.changeItemSelection("active-title");
    event.stopPropagation();
});

msgboxTitle.addEventListener("click", function (event) {
    parent.changeItemSelection("active-title");
    event.stopPropagation();
});

captionButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
        parent.changeItemSelection("caption-buttons");
        event.stopPropagation();
    });
});

menu.addEventListener("click", function (event) {
    if (menuStyleElement.getAttribute("href").includes("mb")) {
        parent.changeItemSelection("menu-bar");
    } else {
        parent.changeItemSelection("menu");
    }
    event.stopPropagation();
});

textarea.addEventListener("click", function (event) {
    parent.changeItemSelection("window");
    event.stopPropagation();
});

scrollBarOverlay.addEventListener("click", function (event) {
    parent.changeItemSelection("scrollbar");
    event.stopPropagation();
});

msgbox.addEventListener("click", function (event) {
    parent.changeItemSelection("message-box");
    event.stopPropagation();
});

buttonFace.addEventListener("click", function (event) {
    parent.changeItemSelection("button-face");
    event.stopPropagation();
});

function resize() {
    container.style.left = (frameElement.offsetWidth - (activeWindow.offsetLeft + activeWindow.offsetWidth - inactiveWindow.offsetLeft) - 2) / 2 + "px";
    container.style.top = (frameElement.offsetHeight - (msgbox.offsetTop + msgbox.offsetHeight - inactiveWindow.offsetTop) - 2) / 2 + "px";
}