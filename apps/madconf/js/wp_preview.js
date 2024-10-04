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
document.body.style.backgroundImage = top.document.body.style.backgroundImage;
if (localStorage.madesktopBgColor) {
    document.documentElement.style.backgroundColor = localStorage.madesktopBgColor;
}
if (localStorage.madesktopBgPattern) {
    document.documentElement.style.backgroundImage = `url('${genPatternImage(base64ToPattern(localStorage.madesktopBgPattern), top.document.documentElement)}')`;
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
    try {
        bgHtmlView.contentWindow.document.body.style.zoom = scale * 0.0625;
    } catch {
        // page did not load yet
    }
}).observe(
    parent.document.body,
    { attributes: true, attributeFilter: ["style"] }
);

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