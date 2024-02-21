// ChannelViewer.js for ModernActiveDesktop ChannelViewer
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const log = top.log || console.log;

const schemeElement = document.getElementById("scheme");

const toolbars = document.getElementById("toolbars");
const menuBar = document.getElementById("menuBar");
const toolbar = document.getElementById("toolbar");
const addressBar = document.getElementById("addressBar");
const statusBar = document.getElementById("statusBar");

const backButton = document.getElementById("back-button");
const backExpandButton = document.getElementById("back-expand-button");
const forwardButton = document.getElementById("forward-button");
const forwardExpandButton = document.getElementById("forward-expand-button");
const refreshButton = document.getElementById("refresh-button");
const stopButton = document.getElementById("stop-button");
const homeButton = document.getElementById("home-button");
const favoritesButton = document.getElementById("favorites-button");
const channelsButton = document.getElementById("channels-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const printButton = document.getElementById("print-button");
const openButton = document.getElementById("open-button");

const urlbar = document.getElementById("urlbar");

const fileMenuItems = document.querySelectorAll("#fileMenu .contextMenuItem");
const editMenuItems = document.querySelectorAll("#editMenu .contextMenuItem");
const viewMenuItems = document.querySelectorAll("#viewMenu .contextMenuItem");
const goMenuItems = document.querySelectorAll("#goMenu .contextMenuItem");
const favoritesMenuItems = document.querySelectorAll("#favoritesMenu .contextMenuItem");
const helpMenuItems = document.querySelectorAll("#helpMenu .contextMenuItem");
const toolbarsMenuItems = document.querySelectorAll("#toolbarsMenu .contextMenuItem");
const explorerBarMenuItems = document.querySelectorAll("#explorerBarMenu .contextMenuItem");

const favoritesMenuBtn = document.getElementById("favoritesMenuBtn");
const favoritesMenuBg = document.getElementById("favoritesMenuBg");
const favoritesMenu = document.getElementById("favoritesMenu");

const historyMenuBg = document.getElementById("historyMenuBg");
const historyMenu = document.getElementById("historyMenu");

const throbber = document.getElementById("throbber");
const fullscreenThrobber = document.getElementById("windowBtnContainer");
const statusText = document.getElementById("statusText");
const statusZone = document.getElementById("zone");
const statusZoneText = document.getElementById("zoneText");
const resizeArea = document.getElementById("resizeArea");

const mainArea = document.getElementById("mainArea");
const sidebar = document.getElementById("sidebar");
const sidebarTitle = document.getElementById("sidebarTitleText");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const sidebarWindow = document.getElementById("sidebarWindow");

window.iframe = document.getElementById("iframe");

const madBase = parent.location.href.split('/').slice(0, -1).join('/') + '/';
const cvBase = madBase + 'apps/channelviewer/';

let title = "";
let favorites = JSON.parse(localStorage.madesktopChanViewFavorites || "[]");
let didFirstLoad = false;
let isCrossOrigin = madRunningMode !== 1; // Wallpaper Engine disables all cross-origin iframe restrictions
let historyLength = 0;
let historyIndex = 0;
let historyItems = [];
let didHistoryNav = true;
let saveTimer;
let preCrashUrl = '';
let pageSetStatusText = '';

madDeskMover.menu = new MadMenu(menuBar, ['file', 'edit', 'view', 'go', 'favorites', 'help'], ['toolbars', 'explorerBar']);

fileMenuItems[0].addEventListener("click", function () { // New window button
    madOpenExternal(localStorage.madesktopChanViewHome || "about:blank", false, "", false);
});

fileMenuItems[1].addEventListener("click", function () { // Open button
    madPrompt("Enter URL", function (url) {
        if (url === null) return;
        go(url);
    });
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

viewMenuItems[1].addEventListener("click", function () { // Status Bar button
    if (localStorage.madesktopChanViewHideStatusBar) {
        statusBar.style.display = "";
        viewMenuItems[1].classList.add("checkedItem");
        delete localStorage.madesktopChanViewHideStatusBar;
    } else {
        statusBar.style.display = "none";
        viewMenuItems[1].classList.remove("checkedItem");
        localStorage.madesktopChanViewHideStatusBar = true;
    }
});

viewMenuItems[3].addEventListener("click", function () { // Stop button
    window.stop();
});

viewMenuItems[4].addEventListener("click", function () { // Refresh button
    refreshButton.click();
});

viewMenuItems[5].addEventListener("click", function () { // Source button
    if (isCrossOrigin) {
        madAlert("Sorry, but advanced features are unavailable for this webpage. Please consult the internet options.", null, "warning");
    } else {
        madOpenExternal("data:text/plain," + encodeURIComponent(iframe.contentDocument.documentElement.outerHTML), false, "popup");
    }
});

viewMenuItems[6].addEventListener("click", function () { // Full Screen button
    fullscreenButton.click();
});

viewMenuItems[7].addEventListener("click", function () { // Internet Options button
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const configWindow = madOpenWindow('apps/inetcpl/general.html?currentPage=' + encodeURIComponent(historyItems[historyIndex - 1][0]), true, '400px', '427px', 'wnd', false, top, left, true, true, true);
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
    go("https://www.google.com/?igu=1");
});

favoritesMenuBtn.addEventListener("click", function () {
    const prevMenuItems = Array.from(favoritesMenu.querySelectorAll(".contextMenuItem")).slice(2);
    if (prevMenuItems.length > 0) {
        for (const item of prevMenuItems) {
            item.remove();
        }
    }
    let maxLen = 0;
    for (const favorite of favorites) {
        appendFavoriteItem(favorite);
        if ((favorite[1] || favorite[0]).length > maxLen) {
            maxLen = favorite[1].length;
        }
    }
    const menuItems = Array.from(favoritesMenu.querySelectorAll(".contextMenuItem")).slice(2);
    favoritesMenuBg.style.width = maxLen * 7 + "px";
    favoritesMenuBg.style.height = (menuItems.length + 2) * 20 + 9 + "px";
    if (menuItems.length === 0) {
        return;
    }
    for (const item of menuItems) {
        item.addEventListener("pointerover", function () {
            for (const item of menuItems) {
                delete item.dataset.active;
            }
            item.dataset.active = true;
        });
        item.addEventListener("pointerleave", function () {
            delete item.dataset.active;
        });
    }
});

favoritesMenuItems[0].addEventListener("click", function () { // Add to Favorites button
    madPrompt("Enter a name for this page", async function (name) {
        if (name === null) return;
        const iconBlob = await getFavicon(true);
        if (iconBlob) {
            const icon = await getDataUrl(iconBlob);
            favorites.push([iframe.contentWindow.location.href, name, icon]);
        } else {
            favorites.push([iframe.contentWindow.location.href, name]);
        }
        localStorage.madesktopChanViewFavorites = JSON.stringify(favorites);
    }, title, title);
});

favoritesMenuItems[1].addEventListener("click", function () { // Organize Favorites button
    // some comment
});

helpMenuItems[0].addEventListener("click", function () { // About ChannelViewer button
    madOpenConfig("about");
});

toolbarsMenuItems[0].addEventListener("click", function () { // Standard Buttons button
    if (localStorage.madesktopChanViewHideToolbar) {
        toolbar.style.display = "";
        toolbarsMenuItems[0].classList.add("checkedItem");
        delete localStorage.madesktopChanViewHideToolbar;
    } else {
        toolbar.style.display = "none";
        toolbarsMenuItems[0].classList.remove("checkedItem");
        localStorage.madesktopChanViewHideToolbar = true;
    }
});

toolbarsMenuItems[1].addEventListener("click", function () { // Address Bar button
    if (localStorage.madesktopChanViewHideAddressBar) {
        addressBar.style.display = "";
        toolbarsMenuItems[1].classList.add("checkedItem");
        delete localStorage.madesktopChanViewHideAddressBar;
    } else {
        addressBar.style.display = "none";
        toolbarsMenuItems[1].classList.remove("checkedItem");
        localStorage.madesktopChanViewHideAddressBar = true;
    }
});

toolbarsMenuItems[2].addEventListener("click", function () { // Labels on right button
    if (localStorage.madesktopChanViewLabels !== "right") {
        toolbar.classList.add("rightLabels");
        toolbar.classList.remove("bottomLabels");
        toolbarsMenuItems[2].classList.add("activeStyle");
        toolbarsMenuItems[3].classList.remove("activeStyle");
        toolbarsMenuItems[4].classList.remove("activeStyle");
        localStorage.madesktopChanViewLabels = "right";
    }
});

toolbarsMenuItems[3].addEventListener("click", function () { // Labels on bottom button
    if (localStorage.madesktopChanViewLabels !== "bottom") {
        toolbar.classList.remove("rightLabels");
        toolbar.classList.add("bottomLabels");
        toolbarsMenuItems[2].classList.remove("activeStyle");
        toolbarsMenuItems[3].classList.add("activeStyle");
        toolbarsMenuItems[4].classList.remove("activeStyle");
        localStorage.madesktopChanViewLabels = "bottom";
    }
});

toolbarsMenuItems[4].addEventListener("click", function () { // No labels button
    if (localStorage.madesktopChanViewLabels !== "none") {
        toolbar.classList.remove("rightLabels");
        toolbar.classList.remove("bottomLabels");
        toolbarsMenuItems[2].classList.remove("activeStyle");
        toolbarsMenuItems[3].classList.remove("activeStyle");
        toolbarsMenuItems[4].classList.add("activeStyle");
        localStorage.madesktopChanViewLabels = "none";
    }
});

explorerBarMenuItems[0].addEventListener("click", function () { // Favorites button
    //openSidebar("Favorites");
});

explorerBarMenuItems[1].addEventListener("click", function () { // Channels button
    openSidebar("Channels");
});

explorerBarMenuItems[2].addEventListener("click", function () { // None button
    closeSidebar();
});

backButton.addEventListener("click", function () {
    handleWeirdError();
    if (isCrossOrigin) {
        history.back();
    } else if (!backButton.dataset.disabled && historyIndex > 1) {
        historyIndex--;
        go(historyItems[historyIndex - 1][0], true);
    }
    changeHistoryButtonStatus();
});

forwardButton.addEventListener("click", function () {
    handleWeirdError();
    if (isCrossOrigin) {
        history.forward();
    } else if (!forwardButton.dataset.disabled && historyLength >= historyIndex) {
        historyIndex++;
        go(historyItems[historyIndex - 1][0], true);
    }
    changeHistoryButtonStatus();
});

for (const expandButton of [backExpandButton, forwardExpandButton]) {
    const parentButton = document.getElementById(expandButton.id.replace("-expand", ""));
    expandButton.addEventListener("pointerover", function () {
        if (!expandButton.dataset.disabled) {
            parentButton.dataset.hover = true;
        }
    });
    expandButton.addEventListener("pointerleave", function () {
        if (historyMenuBg.style.display !== "block" || historyMenuBg.dataset.currentParent !== parentButton.id) {
            delete parentButton.dataset.hover;
        }
    });
    expandButton.addEventListener("click", openHistoryMenu);
}

refreshButton.addEventListener("click", function () {
    handleWeirdError();
    if (isCrossOrigin) {
        iframe.src = iframe.src;
    } else if (preCrashUrl) {
        go(preCrashUrl, true);
    } else {
        didHistoryNav = false;
        iframe.contentWindow.location.reload();
    }
});

stopButton.addEventListener("click", function () {
    window.stop();
});

homeButton.addEventListener("click", function () {
    handleWeirdError();
    go(localStorage.madesktopChanViewHome || "https://www.ingan121.com/");
});

channelsButton.addEventListener("click", function () {
    if (mainArea.classList.contains("sidebarOpen") && sidebarTitle.textContent === "Channels") {
        closeSidebar();
    } else {
        openSidebar("Channels");
    }
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

openButton.addEventListener("click", function () {
    parent.openExternalExternally(historyItems[historyIndex - 1][0], false, "", true);
});

urlbar.addEventListener('click', function (event) {
    if (event.offsetX <= 24 * madScaleFactor) {
        if (isCrossOrigin) {
            madAlert("This page is from a different origin. Advanced features are not available for this page.", null, "info");
        } else if (iframe.contentDocument.head.dataset.forceLoaded) {
            madAlert("This page does not allow embedding normally, so it was forcefully loaded. Advanced features are available, but the page may not work properly, especially if it has complex scripts.", null, "warning");
        } else {
            madAlert("This page was loaded normally, and advanced features are available.", null, "info");
        }
        return;
    }
    if (madRunningMode === 1) {
        madPrompt("Enter URL", function (url) {
            if (url === null) return;
            go(url);
        }, "", urlbar.value);
    } else {
        urlbar.select();
    }
});

urlbar.addEventListener('keyup', function (e) {
    if (e.key === "Enter") {
        go(urlbar.value);
    }
});

sidebarCloseBtn.addEventListener('click', closeSidebar);

resizeArea.addEventListener('pointerdown', function (event) {
    if (event.button === 0) {
        parent.iframeClickEventCtrl(false);
        madDeskMover.isDown = true;
        madDeskMover.offset = [
            madDeskMover.windowElement.offsetWidth - event.clientX * madScaleFactor,
            madDeskMover.windowElement.offsetHeight - event.clientY * madScaleFactor
        ];
        madDeskMover.resizingMode = 'rightbottom';
        madDeskMover.windowElement.style.cursor = 'se-resize';
    }
});

if (localStorage.madesktopChanViewHideToolbar) {
    toolbar.style.display = "none";
    toolbarsMenuItems[0].classList.remove("checkedItem");
}

if (localStorage.madesktopChanViewHideAddressBar) {
    addressBar.style.display = "none";
    toolbarsMenuItems[1].classList.remove("checkedItem");
}

switch (localStorage.madesktopChanViewLabels) {
    case "right":
        toolbar.classList.add("rightLabels");
        toolbar.classList.remove("bottomLabels");
        toolbarsMenuItems[2].classList.add("activeStyle");
        toolbarsMenuItems[3].classList.remove("activeStyle");
        break;
    case "none":
        toolbar.classList.remove("bottomLabels");
        toolbarsMenuItems[3].classList.remove("activeStyle");
        toolbarsMenuItems[4].classList.add("activeStyle");
}

if (localStorage.madesktopChanViewHideStatusBar) {
    statusBar.style.display = "none";
    viewMenuItems[1].classList.remove("checkedItem");
}

if (localStorage.madesktopChanViewNoJs) {
    iframe.sandbox = "allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin";
}

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
    iframe.contentDocument.body.style.zoom = madScaleFactor;
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
        },
        status: {
            get: function () {
                return pageSetStatusText;
            },
            set: function (val) {
                pageSetStatusText = val;
                statusText.textContent = val;
            }
        }
    });

    // Also hook window.open as this doesn't work in WE
    if (localStorage.madesktopLinkOpenMode !== "0" || madRunningMode !== 0) {
        iframe.contentWindow.open = function (url, name, specs) {
            if (!url.startsWith("http")) {
                url = new URL(url, iframe.contentWindow.location.href).href;
            }
            const deskMover = madOpenExternal(url, false, specs);
            return deskMover.windowElement.contentDocument;
        }
    }

    // Pro tip: youareanidiot.cc works well with this
    // If you're stuck, quickly reload the wallpaper three times in a row to trigger the crash detection then get rid of it
    iframe.contentWindow.focus = madBringToTop;
    iframe.contentWindow.resizeTo = madResizeTo;
    iframe.contentWindow.moveTo = madMoveTo;
    iframe.contentWindow.close = madCloseWindow;

    iframe.contentWindow.history.pushState = function () {
        historyLength = Math.max(historyLength, historyIndex + 1);
        historyIndex++;
        let url = arguments[2];
        if (!url.startsWith("http")) {
            url = new URL(url, iframe.contentWindow.location.href).href;
        }
        historyItems[historyIndex - 1] = [url];
        changeHistoryButtonStatus();
        delayedSave();
        return window.history.pushState.apply(this, arguments);
    }

    try {
        // Listen for title changes
        new MutationObserver(function (mutations) {
            historyItems[historyIndex - 1][1] = iframe.contentDocument.title;
            updateTitle();
        }).observe(
            iframe.contentDocument.querySelector('title'),
            { subtree: true, characterData: true, childList: true }
        );
    } catch {
        // Will fail if the page doesn't have a title element
    }

    // Do this on pointerup instead of click, as click doesn't work with Google Search links
    // Probably because it uses something like event.stopPropagation()?
    iframe.contentDocument.addEventListener('pointerup', (event) => {
        if (event.button === 0 && iframe.contentDocument.activeElement && iframe.contentDocument.activeElement.href && !iframe.contentDocument.activeElement.href.startsWith("javascript:")) {
            let url = iframe.contentDocument.activeElement.href;
            if (!url.startsWith("http")) {
                url = new URL(url, iframe.contentWindow.location.href).href;
            }
            if (!url.startsWith("http")) { // non http/https links
                return;
            }
            switch (iframe.contentDocument.activeElement.target) {
                case "_blank":
                    madOpenExternal(url);
                    event.preventDefault();
                    break;
                case "_top":
                    go(url);
                    event.preventDefault();
                    break;
                default:
                    document.title = url + " - ChannelViewer";
                    urlbar.value = url;
                    // YT fix - it doesn't work well in single page mode
                    if (url.startsWith("https://www.youtube.com/")) {
                        forceLoad(url);
                    }
            }
        }
    });
    iframe.contentDocument.addEventListener('click', () => {
        if (iframe.contentDocument.activeElement.matches("input[type='text'], input[type='search'], input[type='url'], input[type='tel'], input[type='email'], input[type='password'], textarea")) {
            if (madRunningMode === 1) {
                madPrompt("Enter value", function (res) {
                    if (res === null) return;
                    iframe.contentDocument.activeElement.value = res;
                    iframe.contentDocument.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    iframe.contentDocument.activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                }, '', iframe.contentDocument.activeElement.value);
            }
        }
    });
    iframe.contentDocument.addEventListener('submit', e => {
        if (iframe.contentDocument.activeElement && iframe.contentDocument.activeElement.form && iframe.contentDocument.activeElement.form.action) {
            let url = iframe.contentDocument.activeElement.form.action;
            if (iframe.contentDocument.activeElement.form.method !== 'post') {
                url = iframe.contentDocument.activeElement.form.action + '?' + new URLSearchParams(new FormData(iframe.contentDocument.activeElement.form))
            }
            document.title = url + " - ChannelViewer";
        }
    });
    iframe.contentDocument.addEventListener('pointermove', (event) => {
        const hoverElement = iframe.contentDocument.elementFromPoint(event.clientX, event.clientY);
        if (hoverElement && hoverElement.tagName === "A" && hoverElement.href) {
            statusText.textContent = hoverElement.href;
        } else if (statusText.textContent !== "Done" && statusText.textContent !== pageSetStatusText) {
            statusText.textContent = pageSetStatusText;
        }
    });

    iframe.contentWindow.addEventListener('beforeunload', loadStart);
}

function go(url, noHistory) {
    handleWeirdError();
    if (noHistory) {
        didHistoryNav = false;
    }
    if (url.startsWith("about:") && !url.startsWith("about:blank")) {
        url = cvBase + "aboutpages/" + url.split(":")[1] + ".html";
    } else if (url.startsWith("channels-")) {
        url = madBase + url;
    } else if (!url.startsWith("http") && !url.startsWith("about") && !url.startsWith("chrome") && !url.startsWith("data") && !url.startsWith("file") && !url.startsWith("ws") && !url.startsWith("wss") && !url.startsWith("blob") && !url.startsWith("javascript")) {
        url = "https://" + url;
    }
    urlbar.value = url;
    iframe.removeAttribute("srcdoc");
    iframe.src = url;
    preCrashUrl = '';
}

function openHistoryMenu() {
    if (this.dataset.disabled) {
        return;
    }
    const parentButton = document.getElementById(this.id.replace("-expand", ""));
    historyMenuBg.dataset.currentParent = parentButton.id;
    let maxLen = 0;
    if (parentButton === backButton) {
        for (let i = historyIndex - 2; i >= 0; i--) {
            appendHistoryItem(historyItems[i]);
            if ((historyItems[i][1] || historyItems[i][0]).length > maxLen) {
                maxLen = historyItems[i][1].length;
            }
        }
    } else {
        for (let i = historyIndex; i < historyLength; i++) {
            appendHistoryItem(historyItems[i]);
            if ((historyItems[i][1].length || historyItems[i][0]) > maxLen) {
                maxLen = historyItems[i][1].length;
            }
        }
    }
    const menuItems = historyMenu.querySelectorAll(".contextMenuItem");
    if (menuItems.length === 0) {
        return;
    }
    // Yeah I know its not that accurate
    historyMenuBg.style.width = maxLen * 8 + "px";
    historyMenuBg.style.height = menuItems.length * 17 + "px";
    for (const item of menuItems) {
        item.addEventListener("pointerover", function () {
            for (const item of menuItems) {
                delete item.dataset.active;
            }
            item.dataset.active = true;
        });
        item.addEventListener("pointerleave", function () {
            delete item.dataset.active;
        });
    }

    switch (localStorage.madesktopCmAnimation) {
        case 'none':
            historyMenuBg.style.animation = 'none';
            break;
        case 'slide':
            historyMenuBg.style.animation = 'cmDropdown 0.25s linear';
            break;
        case 'fade':
            historyMenuBg.style.animation = 'fade 0.2s';
    }

    for (const item of menuItems) {
        delete item.dataset.active;
    }
    const rect = this.getBoundingClientRect();
    historyMenuBg.style.top = rect.bottom + "px";
    historyMenuBg.style.left = rect.left - parentButton.offsetWidth + "px";
    historyMenuBg.style.display = "block";
    this.dataset.active = true;
    parentButton.dataset.hover = true;
    historyMenuBg.focus();
    document.addEventListener('keydown', historyMenuNavigationHandler);
}

function appendHistoryItem(historyItem) {
    const item = document.createElement("div");
    item.classList.add("contextMenuItem");
    const p = document.createElement("p");
    p.textContent = historyItem[1] || historyItem[0];
    item.addEventListener("click", function () {
        historyIndex = historyItems.indexOf(historyItem) + 1;
        go(historyItem[0], true);
        closeHistoryMenu();
    });
    item.appendChild(p);
    historyMenu.appendChild(item);
}

function closeHistoryMenu() {
    historyMenuBg.style.display = "none";
    historyMenu.innerHTML = "";
    delete backButton.dataset.hover;
    delete backExpandButton.dataset.active;
    delete forwardButton.dataset.hover;
    delete forwardExpandButton.dataset.active;
    document.removeEventListener('keydown', historyMenuNavigationHandler);
}

historyMenuBg.addEventListener("focusout", closeHistoryMenu);

function historyMenuNavigationHandler(event) {
    if (historyMenuBg.style.display === "none") {
        return;
    }
    let menuItems = historyMenu.querySelectorAll(".contextMenuItem");
    let activeItem = historyMenu.querySelector(".contextMenuItem[data-active]");
    let activeItemIndex = Array.from(menuItems).indexOf(activeItem);
    switch (event.key) {
        case "Escape":
            closeHistoryMenu();
            break;
        case "ArrowUp":
            if (activeItem) {
                delete activeItem.dataset.active;
                if (activeItemIndex > 0) {
                    menuItems[activeItemIndex - 1].dataset.active = true;
                } else {
                    menuItems[menuItems.length - 1].dataset.active = true;
                }
            } else {
                menuItems[menuItems.length - 1].dataset.active = true;
            }
            break;
        case "ArrowDown":
            if (activeItem) {
                delete activeItem.dataset.active;
                if (activeItemIndex < menuItems.length - 1) {
                    menuItems[activeItemIndex + 1].dataset.active = true;
                } else {
                    menuItems[0].dataset.active = true;
                }
            } else {
                menuItems[0].dataset.active = true;
            }
            break;
        case "Enter":
            if (activeItem) {
                activeItem.click();
            } else {
                closeHistoryMenu();
            }
    }
}

function appendFavoriteItem(favorite) {
    const item = document.createElement("div");
    item.classList.add("contextMenuItem");
    item.classList.add("favoriteItem");
    const p = document.createElement("p");
    p.textContent = favorite[1];
    item.addEventListener("click", function () {
        go(favorite[0], true);
        favoritesMenuBg.blur();
    });
    item.appendChild(p);
    if (favorite[2]) {
        item.style.backgroundImage = "url(" + favorite[2] + ")";
    }
    favoritesMenu.appendChild(item);
}

function openSidebar(name) {
    mainArea.classList.add("sidebarOpen");
    sidebarTitle.textContent = name;
    sidebarWindow.src = cvBase + "sidebars/" + name + ".html";
    switch (name) {
        case "Channels":
            explorerBarMenuItems[0].classList.remove("activeStyle");
            explorerBarMenuItems[1].classList.add("activeStyle");
            explorerBarMenuItems[2].classList.remove("activeStyle");
    }
}

function closeSidebar() {
    mainArea.classList.remove("sidebarOpen");
    explorerBarMenuItems[0].classList.remove("activeStyle");
    explorerBarMenuItems[1].classList.remove("activeStyle");
    explorerBarMenuItems[2].classList.add("activeStyle");
}

// I DON'T KNOW WHY BUT having a width of about 800px (unscaled) crashes Wallpaper Engine CEF when loading disney.com
function handleWeirdError() {
    if (madRunningMode === 1 && window.innerWidth * madScaleFactor > 750 && window.innerWidth * madScaleFactor < 850) {
        log("Setting width to 1024", "log", "ChannelViewer");
        madResizeTo(1024, 768);
    }
}

function changeHistoryButtonStatus() {
    if (!isCrossOrigin) {
        if (historyIndex <= 1) {
            backButton.dataset.disabled = true;
            backExpandButton.dataset.disabled = true;
        } else {
            delete backButton.dataset.disabled;
            delete backExpandButton.dataset.disabled;
        }

        if (historyLength <= historyIndex) {
            forwardButton.dataset.disabled = true;
            forwardExpandButton.dataset.disabled = true;
        } else {
            delete forwardButton.dataset.disabled;
            delete forwardExpandButton.dataset.disabled;
        }
    } else {
        if (didFirstLoad) {
            delete backButton.dataset.disabled;
            delete forwardButton.dataset.disabled;
        } else {
            backButton.dataset.disabled = true;
            forwardButton.dataset.disabled = true;
        }
        backExpandButton.dataset.disabled = true;
        forwardExpandButton.dataset.disabled = true;
    }
}

function updateTitle() {
    if (isCrossOrigin) {
        document.title = "ChannelViewer";
    } else {
        if (iframe.contentDocument.title) {
            title = iframe.contentDocument.title;
            document.title = title + " - ChannelViewer";
        } else {
            let url = iframe.contentDocument.location.href;
            if (url.startsWith("about:") || url.startsWith("chrome:") || url.startsWith("data:")) {
                title = "";
                document.title = "ChannelViewer";
            } else {
                title = url;
                document.title = url + " - ChannelViewer";
            }
        }
    }
}

function printIframe() {
    if (isCrossOrigin) {
        toolbars.style.display = "none";
        statusBar.style.display = "none";
        iframe.style.boxShadow = "none";
        window.print();
        toolbars.style.display = "";
        statusBar.style.display = "";
        iframe.style.boxShadow = "";
    } else {
        iframe.contentWindow.print();
    }
}

async function getFavicon(asImage = false) {
    try {
        const loc = iframe.contentWindow.location.href;
        const doc = iframe.contentDocument;
        const url = new URL(loc);

        // Get the favicon from the page
        const iconElem = doc.querySelector("link[rel*='icon']") || doc.querySelector("link[rel*='shortcut icon']") || { href: url.origin + '/favicon.ico', notFound: true };
        let path = iconElem.href;
        log('Favicon path from page: ' + path);

        // Use a generic icon for local/MAD files (ChannelList) and data URLs
        if (loc.startsWith("file:///") || loc.startsWith("data:") || loc.startsWith(madBase)) {
            if (iconElem.notFound) {
                return null;
            } else {
                return path;
            }
        }

        // Check if the favicon exists
        const result = await fetchProxy(path, null, 0).then(response => {
            if (!response.ok) {
                log('Favicon not found, using a generic icon', 'log', 'ChannelViewer - getFavicon');
                path = null;
            } else if (asImage) {
                return response.blob();
            }
        });
        if (result) {
            return result;
        }
        return path;
    } catch (e) {
        log('Error getting favicon');
        console.log(e);
        return null;
    }
}

async function getDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function loadStart() {
    throbber.style.backgroundImage = "url(images/throbber.webp)";
    fullscreenThrobber.style.backgroundImage = "url(images/throbber26.webp)";
    statusText.textContent = "Opening page " + urlbar.value;
    if (!localStorage.madesktopChanViewNoSound) {
        madPlaySound("navStart");
    }
    statusZone.style.backgroundImage = "";
    statusZoneText.textContent = "Internet zone";
}

function loadFinish() {
    throbber.style.backgroundImage = "";
    fullscreenThrobber.style.backgroundImage = "";
    statusText.textContent = "Done";
    pageSetStatusText = "";
}

// based on x-frame-bypass
// https://github.com/niutech/x-frame-bypass
async function forceLoad(url) {
    log("Loading with X-Frame-Bypass: " + url, "log", "ChannelViewer");
    let data = await fetchProxy(url, null, 0).then(res => res.text()).catch(e => {
        iframe.removeAttribute("srcdoc");
        madAlert(`ChannelViewer cannot open the Internet site "${url}".<br>A connection with the server could not be established.`, null, "error");
        go("about:NavigationCanceled", true);
    });

    if (data) {
        iframe.srcdoc = data.replace(/<head([^>]*)>/i, `<head$1 data-force-loaded="true">
        <base href="${url}">
        <script>
            history.replaceState(null, "", "${url}");
        </script>`);
    }
}

async function fetchProxy(url, options, i) {
    const proxies = (options || {}).proxies || [
        '', // no proxy - will work fine in Wallpaper Engine or any environments with same-origin policy disabled
        localStorage.madesktopCorsProxy || 'https://api.codetabs.com/v1/proxy/?quest='
    ]
    try {
        const res = await fetch(proxies[i] + url, options);
        if (!res.ok)
            throw new Error(`${res.status} ${res.statusText}`);
        return res;
    } catch (error) {
        if (i === proxies.length - 1)
            throw error;
        return this.fetchProxy(url, options, i + 1);
    }
}

// Save it later, as some sites may crash Wallpaper Engine CEF upon loading
// Prevents the user from being stuck in a crash loop
function delayedSave() {
    if (madDeskMover.temp) {
        return;
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        const cvUrl = "apps/channelviewer/index.html?page=" + encodeURIComponent(preCrashUrl || iframe.contentWindow.location.href);
        history.replaceState(null, "", cvUrl);
        madDeskMover.config.src = cvUrl;
    }, 10000);
}

function init() {
    const url = new URL(location.href);
    if (url.searchParams.get("sb") !== null) {
        iframe.sandbox = "allow-modals allow-scripts";
    }
    let page = url.searchParams.get("page");
    if (!page) {
        return null;
    }
    if (!page.startsWith('http') && !page.startsWith('about') && !page.startsWith('chrome') && !page.startsWith('data') && !page.startsWith('file') && !page.startsWith('ws') && !page.startsWith('wss') && !page.startsWith('blob') && !page.startsWith('javascript')) {
        page = "../../" + page;
    }
    // Parse window.open third argument converted to query string (in DeskSettings.js:openExternal)
    const width = url.searchParams.get("width") || url.searchParams.get("innerWidth");
    if (width) {
        madResizeTo(width, null);
    }
    const height = url.searchParams.get("height") || url.searchParams.get("innerHeight");
    if (height) {
        madResizeTo(null, height);
    }
    const left = url.searchParams.get("left") || url.searchParams.get("screenX");
    let top = url.searchParams.get("top") || url.searchParams.get("screenY");
    if (left && top) {
        const padding = parseInt(getComputedStyle(iframe).padding) * 2;
        madMoveTo(left + padding, top + padding);
    }
    const popup = !!width || !!height || !!left || !!top || url.searchParams.get("popup") !== null;
    if (popup) {
        toolbars.style.display = "none";
        statusBar.style.display = "none";
    }
    return page;
}

window.addEventListener("message", (event) => {
    if (event.data.type === "scheme-updated" && mainArea.classList.contains("sidebarOpen")) {
        sidebarWindow.contentDocument.getElementById("scheme").href = schemeElement.href;
    }
});

window.addEventListener('load', function () {
    handleWeirdError();
    let page = init();
    document.title = page ? page + " - ChannelViewer" : "ChannelViewer";
    urlbar.value = page;

    if (localStorage.madesktopFailCount > 2) {
        preCrashUrl = page;
        iframe.srcdoc = "ModernActiveDesktop has detected repeated crashes. To prevent further crashes, ChannelViewer has stopped loading the page for now.<br>Please consider closing some ChannelViewers if this persists. Refresh the page to load it anyway.";
    } else {
        iframe.src = page || localStorage.madesktopChanViewHome || "about:blank";
        loadStart();
    }
});

sidebarWindow.addEventListener('load', function () {
    sidebarWindow.contentDocument.getElementById("scheme").href = schemeElement.href;
});

iframe.addEventListener('load', function () {
    if (!iframe.contentDocument) {
        isCrossOrigin = true;
        updateTitle();
        madSetIcon('images/html.png');
        urlbar.value = iframe.src;
        didFirstLoad = true;
        if (!localStorage.madesktopChanViewNoSound) {
            madPlaySound("navStart");
        }
        loadFinish();
        return;
    }

    if (madRunningMode === 1) {
        if (iframe.contentWindow.location.href === "chrome-error://chromewebdata/") {
            iframe.contentWindow.location.replace("about:srcdoc");
            if (urlbar.value.startsWith("https://www.google.co") && !urlbar.value.includes("igu=1")) {
                const queryStart = new URL(urlbar.value).search ? "&" : "?";
                go(urlbar.value + queryStart + "igu=1", true);
            } else {
                forceLoad(urlbar.value);
            }
            return;
        }
    }
    if (iframe.contentWindow.location.href === "about:srcdoc" && !iframe.srcdoc) {
        return;
    }

    isCrossOrigin = false;
    this.contentDocument.body.style.zoom = madScaleFactor;
    updateTitle();
    if (localStorage.madesktopChanViewShowFavicon) {
        getFavicon().then(favicon => {
            if (favicon) {
                urlbar.style.backgroundImage = `url(${favicon})`;
            } else {
                urlbar.style.backgroundImage = '';
            }
        });
    } else {
        urlbar.style.backgroundImage = '';
    }
    if (didHistoryNav) {
        historyLength = historyIndex + 1;
        historyIndex++;
    }
    didHistoryNav = true;
    log("History: " + historyIndex + " / " + historyLength, "log", "ChannelViewer");

    const url = iframe.contentWindow.location.href;
    if (url !== "about:srcdoc") {
        if (url.startsWith(cvBase + "aboutpages/")) {
            urlbar.value = "about:" + url.split("/").pop().replace(".html", "");
        } else {
            urlbar.value = url;
        }
    }
    if (url.startsWith(madBase)) {
        statusZone.style.backgroundImage = "url(images/zone_local.png)";
        statusZoneText.textContent = "My Computer";
    }
    historyItems[historyIndex - 1] = [urlbar.value, title];
    historyItems = historyItems.slice(0, historyLength);
    hookIframeSize(this);
    changeHistoryButtonStatus();
    iframe.contentDocument.addEventListener('pointerdown', madBringToTop);
    didFirstLoad = true;
    loadFinish();
    delayedSave();
});
