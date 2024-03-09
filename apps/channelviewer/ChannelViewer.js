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
const grabbers = document.querySelectorAll(".grabber");

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
const goButton = document.getElementById("go-button");

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
const organizeFavItemStr = favoritesMenuItems[1].querySelector("mad-string");

const historyMenuBg = document.getElementById("historyMenuBg");
const historyMenu = document.getElementById("historyMenu");

const throbber = document.getElementById("throbber");
const fullscreenThrobber = document.getElementById("windowBtnContainer");
const statusText = document.getElementById("statusText");
const sslIndicator = document.getElementById("sslIndicator");
const statusZone = document.getElementById("zone");
const statusZoneText = document.getElementById("zoneText");

const windowRestoreButton = document.getElementById("windowRestoreBtn");
const windowCloseButton = document.getElementById("windowCloseBtn");

const mainArea = document.getElementById("mainArea");
const sidebar = document.getElementById("sidebar");
const sidebarTitle = document.getElementById("sidebarTitleText");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const sidebarWindow = document.getElementById("sidebarWindow");
const border = document.getElementById("border");

window.iframe = document.getElementById("iframe");

let madBase = parent.location.href.split('/').slice(0, -1).join('/') + '/';
if (parent === window) {
    madBase += '../../';
}
const cvBase = madBase + 'apps/channelviewer/';

let title = "";
window.favorites = JSON.parse(localStorage.madesktopChanViewFavorites || "[[\"https://www.ingan121.com/\",\"Ingan121's Webpage\"],[\"https://github.com/Ingan121/ModernActiveDesktop\",\"ModernActiveDesktop GitHub\"]]");
let didFirstLoad = false;
let isCrossOrigin = madRunningMode !== 1; // Wallpaper Engine disables all cross-origin iframe restrictions
let historyLength = 0;
let historyIndex = 0;
let historyItems = [];
let didHistoryNav = true;
let saveTimer;
let preCrashUrl = '';
let pageSetStatusText = '';
let loadedWithProxy = false;
let loading = false;
let favEditMode = false;
let baseStylesheet = '';
let themeStylesheet = '';
let loadToken = 0; // Used for canceling forceLoad if the user navigates before it's done

madDeskMover.menu = new MadMenu(menuBar, ['file', 'edit', 'view', 'go', 'favorites', 'help'], ['toolbars', 'explorerBar'], ['history']);

fileMenuItems[0].addEventListener("click", function () { // New window button
    madOpenExternal(localStorage.madesktopChanViewHome || "about:blank", false, "", false);
});

fileMenuItems[1].addEventListener("click", function () { // Open button
    madPrompt(madGetString("CV_PROMPT_ENTER_URL"), function (url) {
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
        madAlert(madGetString("CV_MSG_NO_ADV"), null, "warning");
    } else {
        iframe.contentWindow.document.execCommand("cut");
    }
});

editMenuItems[1].addEventListener("click", function () { // Copy button
    if (isCrossOrigin) {
        madAlert(madGetString("CV_MSG_NO_ADV"), null, "warning");
    } else {
        iframe.contentWindow.document.execCommand("copy");
    }
});

editMenuItems[2].addEventListener("click", function () { // Select all button
    if (isCrossOrigin) {
        madAlert(madGetString("CV_MSG_NO_ADV"), null, "warning");
    } else {
        iframe.contentWindow.document.execCommand("selectAll");
    }
});

viewMenuItems[1].addEventListener("click", function () { // Status Bar button
    if (localStorage.madesktopChanViewHideStatusBar) {
        statusBar.style.display = "";
        viewMenuItems[1].classList.add("checkedItem");
        madSetResizeArea(true);
        delete localStorage.madesktopChanViewHideStatusBar;
    } else {
        statusBar.style.display = "none";
        viewMenuItems[1].classList.remove("checkedItem");
        madSetResizeArea(false);
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
        madAlert(madGetString("CV_MSG_NO_ADV"), null, "warning");
    } else {
        madOpenExternal("about:srcview?page=" + encodeURIComponent(getCurrentUrl(true)), false, "popup");
    }
});

viewMenuItems[6].addEventListener("click", function () { // Run JavaScript Code button
    if (isCrossOrigin) {
        madAlert(madGetString("CV_MSG_NO_ADV"), null, "warning");
    } else {
        madPrompt(madGetString("UI_PROMPT_RUNJS"), function (code) {
            if (code === null) return;
            iframe.contentWindow.eval(code);
        });
    }
});

viewMenuItems[7].addEventListener("click", function () { // Full Screen button
    fullscreenButton.click();
});

viewMenuItems[8].addEventListener("click", function () { // Internet Options button
    openInetcpl();
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

favoritesMenuBg.addEventListener("beforemenuopen", function () {
    favEditMode = false;
    organizeFavItemStr.locId = "CV_FAVORITES_MENUITEM_EDITITEM";
    const prevMenuItems = Array.from(favoritesMenu.querySelectorAll(".contextMenuItem")).slice(2);
    if (prevMenuItems.length > 0) {
        for (const item of prevMenuItems) {
            item.remove();
        }
    }
    for (const favorite of favorites) {
        appendFavoriteItem(favorite);
    }
    const menuItems = Array.from(favoritesMenu.querySelectorAll(".contextMenuItem")).slice(2);
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
    madPrompt(madGetString("CV_PROMPT_FAV_ADD"), async function (name) {
        if (name === null) return;
        const iconBlob = await getFavicon(true);
        if (iconBlob) {
            const icon = await getDataUrl(iconBlob);
            if (icon.startsWith("data:image/")) {
                favorites.push([getCurrentUrl(), name, icon]);
            } else {
                favorites.push([getCurrentUrl(), name]);
            }
        } else {
            favorites.push([getCurrentUrl(), name]);
        }
        localStorage.madesktopChanViewFavorites = JSON.stringify(favorites);
        if (mainArea.classList.contains("sidebarOpen") && sidebarTitle.locId === "CV_SIDEBAR_FAVORITES") {
            openSidebar("Favorites");
        }
    }, title, title);
});

favoritesMenuItems[1].addEventListener("click", function () { // Organize Favorites button
    if (favEditMode) {
        favoritesMenuBg.blur();
    } else {
        organizeFavItemStr.locId = "CV_FAVORITES_MENUITEM_EDITITEM_CLICKED";
        favEditMode = true;
    }
});

helpMenuItems[0].addEventListener("click", function () { // About ChannelViewer button
    madOpenConfig("about");
});

toolbarsMenuItems[0].addEventListener("click", function () { // Standard Buttons button
    if (localStorage.madesktopChanViewHideToolbar) {
        delete localStorage.madesktopChanViewHideToolbar;
    } else {
        localStorage.madesktopChanViewHideToolbar = true;
    }
    reorderToolbars();
});

toolbarsMenuItems[1].addEventListener("click", function () { // Address Bar button
    if (localStorage.madesktopChanViewHideAddressBar) {
        delete localStorage.madesktopChanViewHideAddressBar;
    } else {
        localStorage.madesktopChanViewHideAddressBar = true;
    }
    reorderToolbars();
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

toolbarsMenuItems[5].addEventListener("click", function () { // Lock the Toolbars button
    if (localStorage.madesktopChanViewLockToolbars) {
        toolbars.classList.remove("locked");
        toolbarsMenuItems[5].classList.remove("checkedItem");
        delete localStorage.madesktopChanViewLockToolbars;
    } else {
        toolbars.classList.add("locked");
        toolbarsMenuItems[5].classList.add("checkedItem");
        localStorage.madesktopChanViewLockToolbars = true;
    }
});

toolbarsMenuItems[6].addEventListener("click", function () { // Go Button button
    if (localStorage.madesktopChanViewShowGoButton) {
        goButton.style.display = "none";
        toolbarsMenuItems[6].classList.remove("checkedItem");
        delete localStorage.madesktopChanViewShowGoButton;
    } else {
        goButton.style.display = "block";
        toolbarsMenuItems[6].classList.add("checkedItem");
        localStorage.madesktopChanViewShowGoButton = true;
    }
});

historyMenuBg.addEventListener("aftermenuclose", function () {
    historyMenu.innerHTML = "";
    delete backButton.dataset.hover;
    delete backExpandButton.dataset.active;
    delete forwardButton.dataset.hover;
    delete forwardExpandButton.dataset.active;
});

explorerBarMenuItems[0].addEventListener("click", function () { // Favorites button
    openSidebar("Favorites");
});

explorerBarMenuItems[1].addEventListener("click", function () { // Channels button
    openSidebar("Channels");
});

explorerBarMenuItems[2].addEventListener("click", function () { // None button
    closeSidebar();
});

backButton.addEventListener("click", function () {
    if (isCrossOrigin) {
        history.back();
    } else if (!backButton.dataset.disabled && historyIndex > 1) {
        historyIndex--;
        go(historyItems[historyIndex - 1][0], true);
    }
    changeHistoryButtonStatus();
});

forwardButton.addEventListener("click", function () {
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
    expandButton.addEventListener("click", function () {
        if (this.dataset.disabled) {
            return;
        }
        const parentButton = document.getElementById(this.id.replace("-expand", ""));
        historyMenuBg.dataset.currentParent = parentButton.id;
        if (parentButton === backButton) {
            for (let i = historyIndex - 2; i >= 0; i--) {
                appendHistoryItem(historyItems[i]);
            }
        } else {
            for (let i = historyIndex; i < historyLength; i++) {
                appendHistoryItem(historyItems[i]);
            }
        }
        const menuItems = historyMenu.querySelectorAll(".contextMenuItem");
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

        this.dataset.active = true;
        parentButton.dataset.hover = true;
        const rect = this.getBoundingClientRect();
        madDeskMover.menu.openMenu('history', { x: rect.left - parentButton.offsetWidth, y: rect.bottom, dropdown: true });
    });
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
    go(localStorage.madesktopChanViewHome || "https://www.ingan121.com/");
});

favoritesButton.addEventListener("click", function () {
    if (mainArea.classList.contains("sidebarOpen") && sidebarTitle.locId === "CV_SIDEBAR_FAVORITES") {
        closeSidebar();
    } else {
        openSidebar("Favorites");
    }
});

channelsButton.addEventListener("click", function () {
    if (mainArea.classList.contains("sidebarOpen") && sidebarTitle.locId === "CV_SIDEBAR_CHANNELS") {
        closeSidebar();
    } else {
        openSidebar("Channels");
    }
});

fullscreenButton.addEventListener("click", function () {
    if (madDeskMover.isFullscreen) {
        madExitFullscreen();
        delete fullscreenButton.dataset.enabled;
    } else {
        madEnterFullscreen(true);
        fullscreenButton.dataset.enabled = true;
    }
});

printButton.addEventListener("click", function () {
    printIframe();
});

openButton.addEventListener("click", function () {
    parent.openExternalExternally(getCurrentUrl(true), false, true);
});

urlbar.addEventListener('click', function (event) {
    // Urlbar icon click
    if (event.offsetX <= 24 * madScaleFactor) {
        if (loading) {
            madAlert(madGetString("CV_MSG_OPENTYPE_LOADING"), null, "info");
        } else if (isCrossOrigin) {
            madAlert(madGetString("CV_MSG_OPENTYPE_CROSSORIGIN"));
        } else if (iframe.contentDocument.head.dataset.forceLoaded) {
            if (loadedWithProxy) {
                madAlert(madGetString("CV_MSG_OPENTYPE_PROXIED"), null, "warning");
            } else if (madRunningMode !== 1) {
                madAlert(madGetString("CV_MSG_OPENTYPE_FORCELOADED"), null, "warning");
            } else {
                madAlert(madGetString("CV_MSG_OPENTYPE_FORCELOADED_WE"), null, "warning");
            }
        } else {
            madAlert(madGetString("CV_MSG_OPENTYPE_NORMAL"));
        }
        return;
    }
    if (madRunningMode === 1) {
        madPrompt(madGetString("CV_PROMPT_ENTER_URL"), function (url) {
            if (url === null) return;
            if (goButton.style.display !== "block") {
                go(url);
            } else {
                urlbar.value = url;
            }
        }, "", urlbar.value);
    }
});

urlbar.addEventListener('focus', function () {
    if (madRunningMode !== 1) {
        urlbar.select();
    }
});

urlbar.addEventListener('keyup', function (e) {
    if (e.key === "Enter") {
        go(urlbar.value);
    }
});

urlbar.addEventListener('contextmenu', function (event) {
    event.stopPropagation();
});

goButton.addEventListener('click', function () {
    go(urlbar.value);
});

sidebarCloseBtn.addEventListener('click', closeSidebar);

windowRestoreButton.addEventListener('click', function () {
    madExitFullscreen();
    delete fullscreenButton.dataset.enabled;
});

windowCloseButton.addEventListener('click', function () {
    madCloseWindow();
});

toolbars.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    madDeskMover.menu.openMenu('toolbars', { x: event.clientX / madScaleFactor, y: event.clientY / madScaleFactor });
});

sslIndicator.addEventListener('click', function () {
    if (this.dataset.secure) {
        madAlert(madGetString("CV_MSG_SSL_SECURE"));
    }
});

reorderToolbars();

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
} else {
    madSetResizeArea(true);
}

updateSandboxFlags();

if (localStorage.madesktopChanViewSidebarWidth) {
    document.documentElement.style.setProperty("--sidebar-width", localStorage.madesktopChanViewSidebarWidth);
}

if (localStorage.madesktopChanViewLockToolbars) {
    toolbars.classList.add("locked");
    toolbarsMenuItems[5].classList.add("checkedItem");
}

if (localStorage.madesktopChanViewShowGoButton) {
    goButton.style.display = "block";
    toolbarsMenuItems[6].classList.add("checkedItem");
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
    iframe.contentDocument.body.style.zoom = madScaleFactor;
    sidebarWindow.contentDocument.body.style.zoom = madScaleFactor;
}).observe(
    document.body,
    { attributes: true, attributeFilter: ["style"] }
);

function reorderToolbars() {
    const order = (localStorage.madesktopChanViewToolbarOrder || "menuBar,toolbar,addressBar").split(",");
    const hidden = [];

    if (localStorage.madesktopChanViewHideToolbar) {
        toolbar.style.display = "none";
        toolbarsMenuItems[0].classList.remove("checkedItem");
        hidden.push("toolbar");
    } else {
        toolbar.style.display = "";
        toolbarsMenuItems[0].classList.add("checkedItem");
    }

    if (localStorage.madesktopChanViewHideAddressBar) {
        addressBar.style.display = "none";
        toolbarsMenuItems[1].classList.remove("checkedItem");
        hidden.push("addressBar");
    } else {
        addressBar.style.display = "";
        toolbarsMenuItems[1].classList.add("checkedItem");
    }

    const visible = order.filter((id) => !hidden.includes(id));
    for (const toolbarId of visible) {
        toolbars.appendChild(document.getElementById(toolbarId));
    }
    // Put hidden toolbars at the bottom, to make sure the throbber is at the right place
    // and the Aero theme's top toolbar gradient works correctly
    for (const toolbarId of hidden) {
        toolbars.appendChild(document.getElementById(toolbarId));
    }
    toolbars.children[0].appendChild(throbber);
}

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
    Object.defineProperties(iframe.contentWindow.screen, {
        width: {
            get: function () {
                return parent.vWidth;
            }
        },
        height: {
            get: function () {
                return parent.vHeight;
            }
        }
    });

    // Also hook window.open as this doesn't work in WE
    if (localStorage.madesktopLinkOpenMode !== "0" || madRunningMode !== 0) {
        iframe.contentWindow.open = function (url, name, specs) {
            if (!url.startsWith("http")) {
                url = new URL(url, getCurrentUrl(true)).href;
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

    iframe.contentWindow.resizeBy = function (x, y) {
        const width = parseInt(madDeskMover.config.width) + x;
        const height = parseInt(madDeskMover.config.height) + y;
        madResizeTo(width, height);
    }
    iframe.contentWindow.moveBy = function (x, y) {
        const left = parseInt(madDeskMover.config.xPos) + x;
        const top = parseInt(madDeskMover.config.yPos) + y;
        madMoveTo(left, top);
    }

    iframe.contentWindow.history.pushState = function () {
        historyLength = Math.max(historyLength, historyIndex + 1);
        historyIndex++;
        let url = arguments[2];
        if (!url.startsWith("http")) {
            url = new URL(url, getCurrentUrl(true)).href;
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

    iframe.contentDocument.addEventListener('pointerdown', ensuerBaseUrl);

    // Do this on pointerup instead of click, as click doesn't work with Google Search links
    // Probably because it uses something like event.stopPropagation()?
    iframe.contentDocument.addEventListener('pointerup', (event) => {
        const activeElement = iframe.contentDocument.activeElement;
        if (event.button === 0 && activeElement && activeElement.href && !activeElement.href.startsWith("javascript:")) {
            let url = activeElement.href;
            if (!url.startsWith("http")) {
                url = new URL(url, getCurrentUrl(true)).href;
            }
            if (!url.startsWith("http")) { // non http/https links
                return;
            }
            switch (activeElement.target) {
                case "_blank":
                    madOpenExternal(url);
                    break;
                case "_top":
                    go(url);
                    break;
                default:
                    document.title = url + " - ChannelViewer";
                    urlbar.value = url;
                    if (madRunningMode !== 1 && !localStorage.madesktopChanViewNoForceLoad &&
                        !url.startsWith("about:blank") && !url.startsWith("data:") && new URL(url).origin !== location.origin)
                    {
                        forceLoad(url);
                        return;
                    }
                    // YT fix - it doesn't work well in single page mode
                    if (url.startsWith("https://www.youtube.com/")) {
                        forceLoad(url);
                    }
            }
        }
    });
    iframe.contentDocument.addEventListener('click', (event) => {
        const activeElement = iframe.contentDocument.activeElement;
        // We need to handle preventDefault() here tho
        if (activeElement && activeElement.href && !activeElement.href.startsWith("javascript:")) {
            let url = activeElement.href;
            if (!url.startsWith("http")) {
                url = new URL(url, getCurrentUrl(true)).href;
            }
            if (!url.startsWith("http")) { // non http/https links
                return;
            }
            switch (activeElement.target) {
                // Blank and top are already prevented by the sandbox
                case "_blank":
                case "_top":
                    return;
                default:
                    if (madRunningMode !== 1 && !localStorage.madesktopChanViewNoForceLoad &&
                        !url.startsWith("about:blank") && !url.startsWith("data:") && new URL(url).origin !== location.origin)
                    {
                        event.preventDefault();
                        return;
                    }
                    // YT fix - it doesn't work well in single page mode
                    // due to it checking the origin header in ajax requests
                    if (url.startsWith("https://www.youtube.com/")) {
                        event.preventDefault();
                    }
            }
        }
        if (activeElement.matches("input[type='text'], input[type='search'], input[type='url'], input[type='tel'], input[type='email'], input[type='password'], textarea")) {
            if (madRunningMode === 1) {
                madPrompt(madGetString("UI_PROMPT_ENTER_VALUE"), function (res) {
                    if (res === null) return;
                    activeElement.value = res;
                    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                }, '', activeElement.value);
            } else if (loadedWithProxy && activeElement.matches("input[type='password']")) {
                madAlert(madGetString("CV_MSG_PROXY_INSECURE"), function () {
                    activeElement.focus();
                }, "warning");
            }
        } else if (activeElement.tagName === "SELECT") {
            madOpenDropdown(activeElement, iframe);
        }
    });
    iframe.contentWindow.addEventListener('submit', (event) => {
        if (iframe.contentDocument.activeElement && iframe.contentDocument.activeElement.form && iframe.contentDocument.activeElement.form.action) {
            let url = iframe.contentDocument.activeElement.form.getAttribute("action") || "";
            if (iframe.contentDocument.activeElement.form.method !== 'post') {
                url += '?' + new URLSearchParams(new FormData(iframe.contentDocument.activeElement.form))
            }
            if (!url.startsWith("http")) {
                url = new URL(url, getCurrentUrl(true)).href;
            }
            document.title = url + " - ChannelViewer";
            if (madRunningMode !== 1 && !localStorage.madesktopChanViewNoForceLoad &&
                !url.startsWith("about:blank") && !url.startsWith("data:") && new URL(url).origin !== location.origin)
            {
                event.preventDefault();
                event.stopPropagation();
                forceLoad(url);
                return;
            }
        }
    });
    iframe.contentDocument.addEventListener('pointermove', (event) => {
        const hoverElement = iframe.contentDocument.elementFromPoint(event.clientX, event.clientY);
        if (!loading) {
            if (hoverElement && hoverElement.tagName === "A" && hoverElement.href) {
                statusText.textContent = hoverElement.href;
            } else if (statusText.textContent !== madGetString("CV_STATUS_DONE") && statusText.textContent !== pageSetStatusText) {
                statusText.textContent = pageSetStatusText;
            }
        }
    });
    iframe.addEventListener('pointerleave', () => {
        if (statusText.textContent !== madGetString("CV_STATUS_DONE") && statusText.textContent !== pageSetStatusText) {
            statusText.textContent = pageSetStatusText;
        }
    });

    iframe.contentWindow.addEventListener('beforeunload', loadStart);
}

function go(url, noHistory, forceForceLoad = false) {
    if (url.startsWith("javascript:")) {
        if (isCrossOrigin) {
            location.href = url;
        } else {
            iframe.contentWindow.location = url;
        }
        return;
    }
    if (noHistory) {
        didHistoryNav = false;
    }
    url = expandUrl(url);
    if (!url.startsWith("http") && !url.startsWith("about") && !url.startsWith("chrome") && !url.startsWith("data") && !url.startsWith("file") && !url.startsWith("ws") && !url.startsWith("wss") && !url.startsWith("blob") && !url.startsWith("javascript")) {
        url = "https://" + url;
    }
    urlbar.value = url;
    handleWeirdError();
    loadToken = 0;
    if (forceForceLoad || (madRunningMode !== 1 && !localStorage.madesktopChanViewNoForceLoad &&
        !url.startsWith("about:blank") && !url.startsWith("data:") && new URL(url).origin !== location.origin))
    {
        forceLoad(url);
    } else {
        iframe.removeAttribute("srcdoc");
        iframe.src = url;
    }
    preCrashUrl = '';
    loadStart();
}

function expandUrl(url) {
    if (url.startsWith("about:") && !url.startsWith("about:blank")) {
        const urlObj = new URL(url);
        url = cvBase + "aboutpages/" + urlObj.pathname + ".html" + urlObj.search + urlObj.hash;
    } else if (url.startsWith("channels-")) {
        url = madBase + url;
    }
    return url;
}

function getCurrentUrl(expand) {
    const url = isCrossOrigin ? iframe.src : historyItems[historyIndex - 1][0];
    return expand ? expandUrl(url) : url;
}

function appendHistoryItem(historyItem) {
    const item = document.createElement("div");
    item.classList.add("contextMenuItem");
    const p = document.createElement("p");
    p.textContent = historyItem[1] || historyItem[0];
    item.addEventListener("click", function () {
        historyIndex = historyItems.indexOf(historyItem) + 1;
        go(historyItem[0], true);
        historyMenuBg.blur();
    });
    item.appendChild(p);
    historyMenu.appendChild(item);
}

function appendFavoriteItem(favorite) {
    const item = document.createElement("div");
    item.classList.add("contextMenuItem");
    item.classList.add("favoriteItem");
    const img = document.createElement("img");
    img.classList.add("favoriteItemImage");
    img.src = favorite[2] || "images/icon.png";
    item.appendChild(img);
    const p = document.createElement("p");
    p.textContent = favorite[1];
    item.addEventListener("click", function () {
        if (favEditMode) {
            madPrompt(madGetString("CV_PROMPT_FAV_EDIT"), function (name) {
                if (name === null) return;
                if (name === "!url") {
                    madPrompt(madGetString("CV_PROMPT_FAV_EDIT_URL"), function (url) {
                        if (url === null) return;
                        favorite[0] = url;
                        localStorage.madesktopChanViewFavorites = JSON.stringify(favorites);
                        if (mainArea.classList.contains("sidebarOpen") && sidebarTitle.locId === "CV_SIDEBAR_FAVORITES") {
                            openSidebar("Favorites");
                        }
                    }, favorite[0], favorite[0]);
                } else if (name === "") {
                    favorites.splice(favorites.indexOf(favorite), 1);
                } else {
                    favorite[1] = name;
                }
                localStorage.madesktopChanViewFavorites = JSON.stringify(favorites);
                if (mainArea.classList.contains("sidebarOpen") && sidebarTitle.locId === "CV_SIDEBAR_FAVORITES") {
                    openSidebar("Favorites");
                }
            }, favorite[1], favorite[1]);
        } else {
            go(favorite[0], true);
        }
        favoritesMenuBg.blur();
    });
    item.appendChild(p);
    favoritesMenu.appendChild(item);
}

function openSidebar(name) {
    mainArea.classList.add("sidebarOpen");
    sidebarTitle.locId = "CV_SIDEBAR_" + name.toUpperCase();
    sidebarWindow.src = cvBase + "sidebars/" + name + ".html";
    switch (name) {
        case "Channels":
            explorerBarMenuItems[0].classList.remove("activeStyle");
            explorerBarMenuItems[1].classList.add("activeStyle");
            explorerBarMenuItems[2].classList.remove("activeStyle");
            channelsButton.dataset.enabled = true;
            delete favoritesButton.dataset.enabled;
            break;
        case "Favorites":
            explorerBarMenuItems[0].classList.add("activeStyle");
            explorerBarMenuItems[1].classList.remove("activeStyle");
            explorerBarMenuItems[2].classList.remove("activeStyle");
            delete channelsButton.dataset.enabled;
            favoritesButton.dataset.enabled = true;
    }
}

function closeSidebar() {
    mainArea.classList.remove("sidebarOpen");
    explorerBarMenuItems[0].classList.remove("activeStyle");
    explorerBarMenuItems[1].classList.remove("activeStyle");
    explorerBarMenuItems[2].classList.add("activeStyle");
    delete channelsButton.dataset.enabled;
    delete favoritesButton.dataset.enabled;
}

// I DON'T KNOW WHY BUT having a width of about 800px (unscaled) crashes Wallpaper Engine CEF when loading disney.com
function handleWeirdError() {
    if (madRunningMode === 1) {
        if (urlbar.value.includes("disney.com/") || iframe.contentWindow.location.href.includes("disney.com/")) {
            if (iframe.offsetWidth * madScaleFactor > 750 && iframe.offsetWidth * madScaleFactor < 850) {
                log("Setting width to 1024", "log", "ChannelViewer");
                let sidebarWidth = 0;
                if (mainArea.classList.contains("sidebarOpen")) {
                    sidebarWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'));
                }
                madResizeTo(1024 + sidebarWidth, 768);
            }
        }
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
        sidebar.style.display = "none";
        iframe.style.width = "100%";
        iframe.style.boxShadow = "none";
        window.print();
        toolbars.style.display = "";
        statusBar.style.display = "";
        sidebar.style.display = "";
        iframe.style.width = "";
        iframe.style.boxShadow = "";
    } else {
        iframe.contentWindow.print();
    }
}

async function getFavicon(asImage = false) {
    if (isCrossOrigin) {
        return null;
    }
    try {
        const loc = getCurrentUrl(true);
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
        const result = await fetchProxy(path).then(response => {
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

function updateSandboxFlags() {
    let flags = "allow-forms allow-modals allow-pointer-lock allow-popups-to-escape-sandbox allow-presentation allow-same-origin";
    if (!localStorage.madesktopChanViewNoJs) {
        flags += " allow-scripts";
    }
    if (localStorage.madesktopLinkOpenMode === "0" && madRunningMode === 0) {
        flags += " allow-popups";
    }
    iframe.sandbox = flags;
}

// Only for non-MAD usage
function openExternalExternally(url) {
    window.open(url, "_blank");
}

function openInetcpl(connectionPage = false) {
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const options = {
        left, top, width: '400px', height: '371px',
        aot: true, unresizable: true, noIcon: true
    };
    let page = 'apps/inetcpl/general.html?currentPage=';
    if (connectionPage && madRunningMode !== 1) {
        page = 'apps/inetcpl/connection.html?currentPage=';
    }
    madOpenWindow(page + encodeURIComponent(getCurrentUrl()), true, options);
}

function loadStart() {
    if (loading) {
        return;
    }
    loading = true;
    throbber.dataset.busy = true;
    fullscreenThrobber.dataset.busy = true;
    statusText.textContent = madGetString("CV_STATUS_OPENING", urlbar.value);
    madPlaySound("navStart");
    statusZone.style.backgroundImage = "";
    statusZoneText.locId = "CV_ZONE_INTERNET"
}

function loadFinish() {
    loading = false;
    delete throbber.dataset.busy;
    delete fullscreenThrobber.dataset.busy;
    statusText.textContent = madGetString("CV_STATUS_DONE");
    pageSetStatusText = "";
}

// based on x-frame-bypass
// https://github.com/niutech/x-frame-bypass
async function forceLoad(url) {
    log("Loading with X-Frame-Bypass: " + url, "log", "ChannelViewer");
    loadStart();
    if (url.match("https://www\.google\.co.*/url\\?q=.*")) {
        url = new URL(url).searchParams.get("q");
    }
    let loadTokenPrivate = Math.random();
    loadToken = loadTokenPrivate;
    let data = await fetchProxy(url).then(res => res.text()).catch(e => {
        // Check if window is not closed
        if (loadToken !== 0) {
            iframe.removeAttribute("srcdoc");
            madAlert(madGetString("CV_MSG_LOAD_ERROR", url), null, "error");
            go("about:NavigationCanceled");
        }
    });
    if (loadToken !== loadTokenPrivate) {
        log("ForceLoad canceled", "log", "ChannelViewer");
        return;
    }

    if (data) {
        let replacedString = `<head$1 data-force-loaded="true">
        <base href="${url}">`;
        if (madRunningMode === 1) {
            replacedString += `<script>
            history.replaceState(null, "", "${url}");
            </script>`;
        }
        let html = data.replace(/<head([^>]*)>/i, replacedString);
        // Disable scripts for Google Search (if ForceLoaded)
        if (url.startsWith("https://www.google.co")) {
            html = html.replace(/<script/g, "<!--script").replace(/<\/script>/g, "</script-->");
        }
        iframe.srcdoc = html;
        urlbar.value = url;
    }
}

async function fetchProxy(url, options) {
    loadedWithProxy = false;
    const proxy = localStorage.madesktopCorsProxy || 'https://api.codetabs.com/v1/proxy/?quest=';
    if (!options && madRunningMode === 1) {
        options = {
            headers: {
                /* Otherwise GitHub blob pages will return a JSON file */
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
            }
        };
    }
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            throw new Error(`${res.status} ${res.statusText}`);
        }
        return res;
    } catch (error) {
        if (madRunningMode !== 1) {
            loadedWithProxy = true;
            if (proxy.includes('?')) {
                return fetch(proxy + encodeURIComponent(url), options);
            } else {
                return fetch(proxy + url, options);
            }
        } else {
            throw error;
        }
    }
}

function iframeClickEventCtrl(clickable) {
    if (clickable) {
        iframe.style.pointerEvents = "auto";
        sidebarWindow.style.pointerEvents = "auto";
    } else {
        iframe.style.pointerEvents = "none";
        sidebarWindow.style.pointerEvents = "none";
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
        const url = getCurrentUrl();
        const cvUrl = "apps/channelviewer/index.html?page=" + encodeURIComponent(preCrashUrl || url);
        madDeskMover.config.src = cvUrl;
    }, 10000);
}

async function fetchStyle() {
    if (!baseStylesheet || localStorage.madesktopDebugMode) {
        baseStylesheet = await fetch(`stylesheets/98.css`).then(res => res.text());
    }
    switch (localStorage.madesktopColorScheme) {
        case "xpcss4mad":
        case "7css4mad":
            themeStylesheet = await fetch(`stylesheets/${localStorage.madesktopColorScheme}.css`).then(res => res.text());
            break;
        default:
            themeStylesheet = "";
    }
}

// Some single page sites (e.g. GitHub) delete the base tag on navigation
function ensuerBaseUrl() {
    if (!isCrossOrigin && iframe.contentDocument.head.dataset.forceLoaded) {
        if (iframe.contentDocument.baseURI !== iframe.contentDocument.location.href) {
            const base = iframe.contentDocument.createElement("base");
            base.href = iframe.contentDocument.location.href;
            iframe.contentDocument.head.appendChild(base);
        }
    }
}

function injectStyle() {
    if (!isCrossOrigin && !localStorage.madesktopChanViewNoInjectStyle) {
        const colors = ['active-border', 'active-title', 'app-workspace', 'background', 'button-alternate-face', 'button-dk-shadow', 'button-face', 'button-hilight', 'button-light', 'button-shadow', 'button-text', 'gradient-active-title', 'gradient-inactive-title', 'gray-text', 'hilight', 'hilight-text', 'hot-tracking-color', 'inactive-border', 'inactive-title', 'inactive-title-text', 'info-text', 'info-window', 'menu', 'menu-bar', 'menu-hilight', 'menu-text', 'scrollbar', 'title-text', 'window', 'window-frame', 'window-text', 'ui-font'];

        let schemeElement = iframe.contentDocument.getElementById("madChanView-scheme");
        if (!schemeElement) {
            schemeElement = document.createElement("style");
            schemeElement.id = "madChanView-scheme";
            iframe.contentDocument.head.insertBefore(schemeElement, iframe.contentDocument.head.firstChild);
        }
        schemeElement.textContent = ":root {";
        for (const color of colors) {
            schemeElement.textContent += `--${color}: ` + getComputedStyle(document.documentElement).getPropertyValue(`--${color}`) + ";";
        }
        schemeElement.textContent += "}";

        let svgStyleElement = iframe.contentDocument.getElementById("madChanView-svgStyle");
        if (!svgStyleElement) {
            svgStyleElement = document.createElement("style");
            svgStyleElement.id = "madChanView-svgStyle";
            iframe.contentDocument.head.insertBefore(svgStyleElement, iframe.contentDocument.head.firstChild);
        }
        const parentStyleElement = parent.document.getElementById("style");
        svgStyleElement.textContent = parentStyleElement.textContent;

        let styleElement = iframe.contentDocument.getElementById("madChanView-style");
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = "madChanView-style";
            iframe.contentDocument.head.insertBefore(styleElement, iframe.contentDocument.head.firstChild);
        }
        let baseStylesheetLocal = baseStylesheet;
        if (iframe.contentDocument.body.bgColor) {
            baseStylesheetLocal = baseStylesheetLocal.replace("body/*not-if-bgcolor*/", "null");
        }
        if (iframe.contentDocument.body.text) {
            baseStylesheetLocal = baseStylesheetLocal.replace("body/*not-if-text*/", "null");
        }
        if (iframe.contentDocument.body.link) {
            baseStylesheetLocal = baseStylesheetLocal.replace("a/*not-if-link*/", "null");
        }
        styleElement.textContent = baseStylesheetLocal + themeStylesheet;
    }
}

// Main logic
function init() {
    const url = new URL(location.href);
    let page = url.searchParams.get("page");
    if (!page) {
        return { page: null, doForceLoad: false };
    }
    if (!page.startsWith('http') && !page.startsWith('about') && !page.startsWith('chrome') && !page.startsWith('data') && !page.startsWith('file') && !page.startsWith('ws') && !page.startsWith('wss') && !page.startsWith('blob') && !page.startsWith('javascript')) {
        page = madBase + page;
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
    const resizable = url.searchParams.get("resizable");
    if (resizable === "no" || resizable === "0") {
        madSetResizable(false);
    }
    const popup = !!width || !!height || !!left || !!top || !!resizable || url.searchParams.get("popup") !== null;
    if (popup) {
        toolbars.style.display = "none";
        statusBar.style.display = "none";
        madSetResizeArea(false);
    }
    const doForceLoad = url.searchParams.get("forceLoad");
    return { page, doForceLoad };
}

window.addEventListener('load', async function () {
    let { page, doForceLoad } = init();
    document.title = page ? page + " - ChannelViewer" : "ChannelViewer";
    urlbar.value = page;
    await fetchStyle();

    if (localStorage.madesktopFailCount > 2) {
        preCrashUrl = page;
        iframe.srcdoc = "ModernActiveDesktop has detected repeated crashes. To prevent further crashes, ChannelViewer has stopped loading the page for now.<br>Please consider closing some ChannelViewers if this persists. Refresh the page to load it anyway.";
    } else {
        go(page || localStorage.madesktopChanViewHome || "about:blank", false, doForceLoad);
    }
});

window.addEventListener("message", async (event) => {
    switch (event.data.type) {
        case "scheme-updated":
            await fetchStyle();
            injectStyle();
            if (mainArea.classList.contains("sidebarOpen")) {
                sidebarWindow.contentDocument.getElementById("scheme").href = schemeElement.href;
            }
            break;
        case "inet-option-changed":
            updateSandboxFlags();
    }
});

madDeskMover.beforeClose = function () {
    loadToken = 0;
};

sidebarWindow.addEventListener('load', function () {
    sidebarWindow.contentDocument.body.style.zoom = madScaleFactor;
    const sidebarSchemeElement = sidebarWindow.contentDocument.getElementById("scheme");
    if (sidebarSchemeElement) {
        sidebarSchemeElement.href = schemeElement.href;
    }
});

// Sidebar resizing
{
    let offset = 0, isDown = false;

    border.addEventListener('pointerdown', function (event) {
        iframeClickEventCtrl(false);
        isDown = true;
        offset = border.offsetLeft - Math.ceil(event.clientX / madScaleFactor);
        if (localStorage.madesktopOutlineMode) {
            border.style.opacity = 1;
        }
    }, true);

    document.addEventListener('pointerup', function () {
        iframeClickEventCtrl(true);
        isDown = false;
        if (localStorage.madesktopOutlineMode && border.style.opacity !== '') {
            document.documentElement.style.setProperty('--sidebar-width', border.offsetLeft + 'px');
        }
        localStorage.madesktopChanViewSidebarWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width');
        border.style.opacity = '';
    }, true);

    document.addEventListener('pointermove', function (event) {
        if (isDown) {
            if (localStorage.madesktopOutlineMode) {
                border.style.left = (Math.ceil(event.clientX / madScaleFactor) + offset) + 'px'
            } else {
                document.documentElement.style.setProperty('--sidebar-width', (Math.ceil(event.clientX / madScaleFactor) + offset) + 'px');
                border.style.left = '';
            }
        }
    }, true);
}

// Toolbar reordering
{
    let downGrabber = -1;
    for (const grabber of grabbers) {
        grabber.addEventListener('pointerdown', function (event) {
            iframeClickEventCtrl(false);
            downGrabber = Array.from(grabbers).indexOf(this);
        }, true);

        document.addEventListener('pointerup', function () {
            iframeClickEventCtrl(true);
            if (downGrabber !== -1) {
                localStorage.madesktopChanViewToolbarOrder = Array.from(toolbars.children).map(el => el.id).join(',');
                downGrabber = -1;
            }
        }, true);
    }

    const toolbarOrder = [menuBar, toolbar, addressBar];
    for (const toolbar of toolbarOrder) {
        toolbar.addEventListener('pointerenter', function () {
            if (downGrabber !== -1) {
                const toolbarIndex = Array.from(toolbars.children).indexOf(toolbar);
                switch (toolbarIndex) {
                    case 0:
                        toolbars.insertBefore(toolbarOrder[downGrabber], toolbar);
                        break;
                    case 1:
                        if (toolbars.children[2] === toolbarOrder[downGrabber]) {
                            toolbars.insertBefore(toolbarOrder[downGrabber], toolbar);
                        } else {
                            toolbars.insertBefore(toolbarOrder[downGrabber], toolbars.children[2]);
                        }
                        break;
                    case 2:
                        toolbars.appendChild(toolbarOrder[downGrabber]);
                }
                toolbars.children[0].appendChild(throbber);
            }
        });
    }

    document.addEventListener('pointerleave', function () {
        downGrabber = -1;
    });
}

// iframe load event
iframe.addEventListener('load', function () {
    if (!iframe.contentDocument) {
        isCrossOrigin = true;
        changeHistoryButtonStatus();
        updateTitle();
        madSetIcon('images/html.png');
        urlbar.value = iframe.src;
        didFirstLoad = true;
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
    if (didHistoryNav || !didFirstLoad) {
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
        statusZoneText.locId = "CV_ZONE_LOCAL";
    }
    if (urlbar.value.startsWith("https://") && !loadedWithProxy) {
        sslIndicator.dataset.secure = true;
    } else {
        delete sslIndicator.dataset.secure;
    }
    loadToken = 0;
    historyItems[historyIndex - 1] = [urlbar.value, title];
    historyItems = historyItems.slice(0, historyLength);
    hookIframeSize(this);
    changeHistoryButtonStatus();
    injectStyle();
    iframe.contentDocument.addEventListener('pointerdown', madBringToTop);
    didFirstLoad = true;
    loadFinish();
    delayedSave();
});
