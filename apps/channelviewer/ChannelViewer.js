// ChannelViewer.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const iframe = document.getElementById("iframe");
const container = document.getElementById("container");

iframe.addEventListener('load', function () {
    this.contentDocument.body.style.zoom = parent.scaleFactor;
    hookIframeSize(this);
});

new MutationObserver(function (mutations) {
    iframe.contentDocument.body.style.zoom = parent.scaleFactor;
}).observe(
    document.body,
    { attributes: true, attributeFilter: ["style"] }
);

if (madDeskMover.isFullscreen) {
    document.body.dataset.fullscreen = true;
}

// innerWidth/Height hook
// Fixes some sites that are broken when scaled, such as YT
function hookIframeSize(iframe) {
    Object.defineProperty(iframe.contentWindow, "innerWidth", {
        get: function () {
            return iframe.clientWidth;
        }
    });
    Object.defineProperty(iframe.contentWindow, "innerHeight", {
        get: function () {
            return iframe.clientHeight;
        }
    });

    // Also hook window.open as this doesn't work in WE
    // Try to use sysplug, and if unavailable, just prompt for URL copy
    if (madRunningMode !== 0) {
        iframe.contentWindow.open = function (url) {
            madOpenExternal(url);
        }
    }
}

const url = new URL(location.href);
if (url.searchParams.get("sb") !== null) {
    iframe.sandbox = "allow-modals allow-scripts";
}
let page = url.searchParams.get("page");
if (!page.startsWith('http')) {
    page = "../../" + page;
}
iframe.src = page || "data:text/plain,Nothing loaded!";
iframe.contentWindow.onunload = function () {
    // TODO: add throbber
    //document.getElementById('loadingText').style.display = 'block';
}