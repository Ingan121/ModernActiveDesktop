// wp_preview.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

window.bgHtmlContainer = document.getElementById("bgHtmlContainer");
window.bgHtmlView = document.getElementById("bgHtmlView");
window.bgVideoView = document.getElementById("bgVideo");
window.bgType = localStorage.madesktopBgType || "image";
window.bgImgMode = localStorage.madesktopBgImgMode || "center";
let bgSize = "auto";

let scale = parent.document.body.style.zoom || 1;
document.documentElement.style.backgroundSize = `${8 * scale}px ${8 * scale}px`;
document.body.style.zoom = scale * 0.0625

changeBgType(bgType);
changeBgImgMode(bgImgMode);
if (localStorage.madesktopBgColor) {
    document.documentElement.style.backgroundColor = localStorage.madesktopBgColor;
}
if (localStorage.madesktopBgPattern) {
    document.documentElement.style.backgroundImage = `url('${genPatternImage(base64ToPattern(localStorage.madesktopBgPattern))}')`;
}
if (localStorage.madesktopBgHtmlSrc) {
    bgHtmlView.src = localStorage.madesktopBgHtmlSrc;
}
document.getElementById("scheme").href = parent.parent.document.getElementById("scheme").href;

bgHtmlView.addEventListener("load", function () {
    if (bgHtmlView.contentDocument) {
        bgHtmlView.contentDocument.body.style.zoom = scale * 0.0625;
    }
});

new MutationObserver(function (mutations) {
    scale = parent.document.body.style.zoom || 1;
    document.documentElement.style.backgroundSize = `${8 * scale}px ${8 * scale}px`;
    document.body.style.zoom = scale * 0.0625;
    bgHtmlView.contentWindow.document.body.style.zoom = scale * 0.0625;
}).observe(
    parent.document.body,
    { attributes: true, attributeFilter: ["style"] }
);

function changeBgType(type) {
    switch(type) {
        case 'image':
            loadBgImgConf();
            bgHtmlContainer.style.display = "none";
            bgVideoView.style.display = "none";
            bgVideoView.src = "";
            break;
        case 'video':
            document.body.style.backgroundImage = "none";
            bgHtmlContainer.style.display = "none";
            bgVideoView.style.display = "block";
            bgVideoView.src = localStorage.madesktopBgVideo;
            break;
        case 'web':
            document.body.style.backgroundImage = "none";
            bgHtmlContainer.style.display = "block";
            bgVideoView.style.display = "none";
            bgVideoView.src = "";
            break;
    }
    window.bgType = type;
}

function loadBgImgConf() {
    if (localStorage.madesktopBgImg) {
        if (localStorage.madesktopBgImg.startsWith("file:///")) { // Set in WPE
            document.body.style.backgroundImage = "url('" + localStorage.madesktopBgImg + "')";
        } else if (localStorage.madesktopBgImg.startsWith("wallpapers/")) { // Built-in wallpapers set in madconf
            document.body.style.backgroundImage = "url('../../" + localStorage.madesktopBgImg + "')";
        } else {
            document.body.style.backgroundImage = "url('data:image/png;base64," + localStorage.madesktopBgImg + "')"; // Set in madconf
        }
        updateImageSize();
    } else {
        document.body.style.backgroundImage = "none";
    }
}

function updateImageSize() {
    // Setting image size explicitly is required for the image to be scaled down correctly
    if (document.body.style.backgroundImage && (bgImgMode == "center" || bgImgMode == "grid")) {
        const image = new Image();
        image.onload = function () {
            bgSize = image.width + "px " + image.height + "px";
            document.body.style.backgroundSize = bgSize;
        }
        image.src = document.body.style.backgroundImage.slice(5, -2);
    }
}

function changeBgImgMode(value) {
    switch (value) {
        case "center": // Center
            document.body.style.backgroundSize = bgSize;
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
        case "grid": // Tile
            document.body.style.backgroundSize = bgSize;
            document.body.style.backgroundRepeat = "repeat";
            document.body.style.backgroundPosition = "left top";
            break;
        case "horizfit": // Fit
            document.body.style.backgroundSize = "contain";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
        case "vertfit": // Fill
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
        case "scale": // Stretch
            document.body.style.backgroundSize = "100% 100%";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
    }
    window.bgImgMode = value;
    updateImageSize();
}