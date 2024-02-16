// ChannelViewer.js for ModernActiveDesktop ChannelViewer
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const log = top.log || console.log;

const toolbars = document.getElementById("toolbars");
const menuBar = document.getElementById("menuBar");
const toolbar = document.getElementById("toolbar");
const addressBar = document.getElementById("addressBar");

const backButton = document.getElementById("back-button");
const forwardButton = document.getElementById("forward-button");
const refreshButton = document.getElementById("refresh-button");
const stopButton = document.getElementById("stop-button");
const homeButton = document.getElementById("home-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const printButton = document.getElementById("print-button");

const urlbar = document.getElementById("urlbar");

const fileMenuItems = document.querySelectorAll("#fileMenu .contextMenuItem");
const editMenuItems = document.querySelectorAll("#editMenu .contextMenuItem");
const viewMenuItems = document.querySelectorAll("#viewMenu .contextMenuItem");
const goMenuItems = document.querySelectorAll("#goMenu .contextMenuItem");
const favoritesMenuItems = document.querySelectorAll("#favoritesMenu .contextMenuItem");
const helpMenuItems = document.querySelectorAll("#helpMenu .contextMenuItem");

const iframe = document.getElementById("iframe");

let didFirstLoad = false;
let isCrossOrigin = madRunningMode !== 1; // Wallpaper Engine disables all cross-origin iframe restrictions
let doHistoryCounting = !isCrossOrigin;
let historyLength = 0;
let historyIndex = 0;
let historyForward = 0;
let historyUrls = [];
let didHistoryNav = true;

madDeskMover.menu = new MadMenu(menuBar, ['file', 'edit', 'view', 'go', 'favorites', 'help']);

fileMenuItems[0].addEventListener("click", function () { // New window button
    madOpenExternal("about:blank");
});

fileMenuItems[1].addEventListener("click", function () { // Open button
    madPrompt("Enter URL", function (url) {
        iframe.src = url;
    }, iframe.src);
});

fileMenuItems[2].addEventListener("click", function () { // Print button
    printIframe();
});

fileMenuItems[3].addEventListener("click", function () { // Close button
    madCloseWindow();
});

editMenuItems[0].addEventListener("click", function () { // Cut button
    if (isCrossOrigin) {
        madAlert("Sorry, but advanced features are unavailable for this webpage. Please consult the internet options.", null, "warning");
    } else {
        iframe.contentWindow.document.execCommand("cut");
    }
});

editMenuItems[1].addEventListener("click", function () { // Copy button
    if (isCrossOrigin) {
        madAlert("Sorry, but advanced features are unavailable for this webpage. Please consult the internet options.", null, "warning");
    } else {
        iframe.contentWindow.document.execCommand("copy");
    }
});

editMenuItems[2].addEventListener("click", function () { // Paste button
    if (isCrossOrigin) {
        madAlert("Sorry, but advanced features are unavailable for this webpage. Please consult the internet options.", null, "warning");
    } else {
        iframe.contentWindow.document.execCommand("paste");
    }
});

editMenuItems[3].addEventListener("click", function () { // Select all button
    if (isCrossOrigin) {
        madAlert("Sorry, but advanced features are unavailable for this webpage. Please consult the internet options.", null, "warning");
    } else {
        iframe.contentWindow.document.execCommand("selectAll");
    }
});

viewMenuItems[0].addEventListener("click", function () { // Toolbars button
    // TODO: add submenu support for libmandmenu
});

viewMenuItems[1].addEventListener("click", function () { // Stop button
    window.stop();
});

viewMenuItems[2].addEventListener("click", function () { // Refresh button
    refreshButton.click();
});

viewMenuItems[3].addEventListener("click", function () { // Source button
    if (isCrossOrigin) {
        madAlert("Sorry, but advanced features are unavailable for this webpage. Please consult the internet options.", null, "warning");
    } else {
        madOpenExternal("data:text/plain," + encodeURIComponent(iframe.contentDocument.documentElement.outerHTML));
    }
});

viewMenuItems[4].addEventListener("click", function () { // Full Screen button
    fullscreenButton.click();
});

viewMenuItems[5].addEventListener("click", function () { // Internet Options button
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const configWindow = madOpenWindow('apps/channelviewer/config.html', true, '400px', '435px', 'wnd', false, top, left, true, true, true);
    configWindow.windowElement.addEventListener('load', () => {
        configWindow.windowElement.contentWindow.targetDeskMover = madDeskMover;
    });
});

goMenuItems[0].addEventListener("click", function () { // Back button
    backButton.click();
});

goMenuItems[1].addEventListener("click", function () { // Forward button
    forwardButton.click();
});

goMenuItems[2].addEventListener("click", function () { // Home Page button
    homeButton.click();
});

goMenuItems[3].addEventListener("click", function () { // Search the Web button
    iframe.src = "https://www.google.com/"; // gonna add x-frame-bypass support later
});

favoritesMenuItems[0].addEventListener("click", function () { // Add to Favorites button
    madPrompt("Enter a name for this page", function (name) {
        // TODO: add favorites support (with json)
    }, iframe.contentDocument.title);
});

favoritesMenuItems[1].addEventListener("click", function () { // Organize Favorites button
    // some comment
});

helpMenuItems[0].addEventListener("click", function () { // About ChannelViewer button
    madOpenConfig("about");
});

backButton.addEventListener("click", function () {
    if (doHistoryCounting && historyIndex > 1) {
        historyIndex--;
        historyForward++;
        didHistoryNav = false;
    }
    history.back();
    changeHistoryButtonStatus();
});

forwardButton.addEventListener("click", function () {
    if (doHistoryCounting && historyForward > 0) {
        historyIndex++;
        historyForward--;
        didHistoryNav = false;
    }
    history.forward();
    changeHistoryButtonStatus();
});

refreshButton.addEventListener("click", function () {
    if (isCrossOrigin) {
        iframe.src = iframe.src;
    } else {
        didHistoryNav = false;
        iframe.contentWindow.location.reload();
    }
});

stopButton.addEventListener("click", function () {
    window.stop();
});

homeButton.addEventListener("click", function () {
    iframe.src = localStorage.madesktopChanViewHome || "https://www.ingan121.com/";
});

fullscreenButton.addEventListener("click", function () {
    if (madDeskMover.isFullscreen) {
        madExitFullscreen();
    } else {
        madEnterFullscreen(true);
    }
});

printButton.addEventListener("click", function () {
    printIframe();
});

iframe.addEventListener('load', function () {
    this.contentDocument.body.style.zoom = parent.scaleFactor;
    hookIframeSize(this);
});

urlbar.addEventListener('click', function () {
    if (madRunningMode === 1) {
        madPrompt("Enter URL", function (url) {
            iframe.src = url;
        }, iframe.src);
    } else {
        urlbar.select();
    }
});

urlbar.addEventListener('keyup', function (e) {
    if (e.key === "Enter") {
        iframe.src = urlbar.value;
    }
});

window.addEventListener('focus', function () {
    iframe.style.pointerEvents = "auto";
});

window.addEventListener('blur', function () {
    if (isCrossOrigin) {
        iframe.style.pointerEvents = "none";
    }
});

new MutationObserver(function (mutations) {
    handleWeirdError();
    iframe.contentDocument.body.style.zoom = parent.scaleFactor;
}).observe(
    document.body,
    { attributes: true, attributeFilter: ["style"] }
);

// innerWidth/Height hook
// Fixes some sites that are broken when scaled, such as YT
function hookIframeSize(iframe) {
    Object.defineProperties(iframe.contentWindow, {
        innerWidth: {
            get: function () {
                return iframe.clientWidth;
            }
        },
        innerHeight: {
            get: function () {
                return iframe.clientHeight;
            }
        }
    });

    // Also hook window.open as this doesn't work in WE
    // Try to use sysplug, and if unavailable, just prompt for URL copy
    if (madRunningMode !== 0) {
        iframe.contentWindow.open = function (url) {
            madOpenExternal(url);
        }
    }

    iframe.contentWindow.history.pushState = function () {
        if (doHistoryCounting) {
            historyLength = Math.max(historyLength, historyIndex + 1);
            historyIndex++;
            historyForward = 0;
            changeHistoryButtonStatus();
        }
        return window.history.pushState.apply(this, arguments);
    }

    iframe.contentDocument.addEventListener('click', e => {
        if (frameElement && iframe.contentDocument.activeElement && iframe.contentDocument.activeElement.href) {
            document.title = iframe.contentDocument.activeElement.href + " - ChannelViewer";
            urlbar.value = iframe.contentDocument.activeElement.href
        }
    })
    iframe.contentDocument.addEventListener('submit', e => {
        if (frameElement && iframe.contentDocument.activeElement && iframe.contentDocument.activeElement.form && iframe.contentDocument.activeElement.form.action) {
            let url = iframe.contentDocument.activeElement.form.action;
            if (iframe.contentDocument.activeElement.form.method !== 'post') {
                url = iframe.contentDocument.activeElement.form.action + '?' + new URLSearchParams(new FormData(iframe.contentDocument.activeElement.form))
            }
            document.title = url + " - ChannelViewer";
        }
    })
}

// I DON'T KNOW WHY BUT having a width of about 800px (unscaled) crashes Wallpaper Engine CEF when loading disney.com
function handleWeirdError() {
    if (madRunningMode === 1 && window.innerWidth * madScaleFactor > 750 && window.innerWidth * madScaleFactor < 850) {
        log("Setting width to 1024", "log", "ChannelViewer");
        madResizeTo(1024, 768);
    }
}

function changeAdvFeatures() {
    if (isCrossOrigin) {
        doHistoryCounting = false;
    }
    changeHistoryButtonStatus();
}

function changeHistoryButtonStatus() {
    if (doHistoryCounting) {
        if (historyIndex <= 1) {
            backButton.dataset.disabled = true;
        } else {
            delete backButton.dataset.disabled;
        }

        if (historyForward <= 0) {
            forwardButton.dataset.disabled = true;
        } else {
            delete forwardButton.dataset.disabled;
        }
    } else {
        if (didFirstLoad) {
            delete backButton.dataset.disabled;
            delete forwardButton.dataset.disabled;
        } else {
            backButton.dataset.disabled = true;
            forwardButton.dataset.disabled = true;
        }
    }
}

function updateTitle() {
    if (isCrossOrigin) {
        if (iframe.src.startsWith("about:") || iframe.src.startsWith("chrome:") || iframe.src.startsWith("data:")) {
            document.title = "ChannelViewer";
        } else {
            document.title = iframe.src + " - ChannelViewer";
        }
    } else {
        if (iframe.contentDocument.title) {
            document.title = iframe.contentDocument.title + " - ChannelViewer";
        } else {
            let url = iframe.contentDocument.location.href;
            if (url.startsWith("about:") || url.startsWith("chrome:") || url.startsWith("data:")) {
                document.title = "ChannelViewer";
            } else {
                document.title = url + " - ChannelViewer";
            }
        }
    }
}

function printIframe() {
    if (isCrossOrigin) {
        toolbars.style.display = "none";
        window.print();
        toolbars.style.display = "block";
    } else {
        iframe.contentWindow.print();
    }
}

const url = new URL(location.href);
if (url.searchParams.get("sb") !== null) {
    iframe.sandbox = "allow-modals allow-scripts";
}
let page = url.searchParams.get("page");
if (!page.startsWith('http') && !page.startsWith('about') && !page.startsWith('chrome') && !page.startsWith('data') && !page.startsWith('file') && !page.startsWith('ws') && !page.startsWith('wss') && !page.startsWith('blob') && !page.startsWith('javascript')) {
    page = "../../" + page;
}

window.addEventListener('load', function () {
    handleWeirdError();
    iframe.src = page || localStorage.madesktopChanViewHome || "about:blank";
    document.title = page ? page + " - ChannelViewer" : "ChannelViewer";
    urlbar.value = page;
});

iframe.addEventListener('load', function () {
    if (!iframe.contentDocument) {
        isCrossOrigin = true;
        changeAdvFeatures();
        updateTitle();
        if (didFirstLoad) {
            urlbar.value = "*" + iframe.src;
        }
        didFirstLoad = true;
        return;
    }

    isCrossOrigin = false;
    if (!didFirstLoad) {
        doHistoryCounting = true;
    }
    updateTitle();
    changeAdvFeatures();
    if (doHistoryCounting) {
        if (didHistoryNav) {
            historyLength = Math.max(historyLength, historyIndex + 1);
            historyIndex++;
            historyForward = 0;
        }
        didHistoryNav = true;
        log("History: " + historyIndex + " / " + historyLength + " / " + historyForward, "log", "ChannelViewer");
    }
    urlbar.value = iframe.contentWindow.location.href;
    changeHistoryButtonStatus();
    iframe.contentDocument.addEventListener('pointerdown', madBringToTop);
    didFirstLoad = true;
});

//iframe.contentWindow.onunload = function () {
    // TODO: add throbber
    //document.getElementById('loadingText').style.display = 'block';
//}