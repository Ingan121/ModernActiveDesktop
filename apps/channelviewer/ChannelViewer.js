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
const backExpandButton = document.getElementById("back-expand-button");
const forwardButton = document.getElementById("forward-button");
const forwardExpandButton = document.getElementById("forward-expand-button");
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
const toolbarsMenuItems = document.querySelectorAll("#toolbarsMenu .contextMenuItem");

const historyMenuBg = document.getElementById("historyMenuBg");
const historyMenu = document.getElementById("historyMenu");

const iframe = document.getElementById("iframe");

let title = "";
let didFirstLoad = false;
let isCrossOrigin = madRunningMode !== 1; // Wallpaper Engine disables all cross-origin iframe restrictions
let doHistoryCounting = !isCrossOrigin;
let historyLength = 0;
let historyIndex = 0;
let historyItems = [];
let didHistoryNav = true;
let saveTimer;

madDeskMover.menu = new MadMenu(menuBar, ['file', 'edit', 'view', 'go', 'favorites', 'help'], ['toolbars']);

fileMenuItems[0].addEventListener("click", function () { // New window button
    madOpenExternal("about:blank");
});

fileMenuItems[1].addEventListener("click", function () { // Open button
    madPrompt("Enter URL", function (url) {
        if (url === null) return;
        iframe.src = url;
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
        madOpenExternal("data:text/plain," + encodeURIComponent(iframe.contentDocument.documentElement.outerHTML), false, "popup");
    }
});

viewMenuItems[4].addEventListener("click", function () { // Full Screen button
    fullscreenButton.click();
});

viewMenuItems[5].addEventListener("click", function () { // Internet Options button
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const configWindow = madOpenWindow('apps/inetcpl/general.html', true, '400px', '435px', 'wnd', false, top, left, true, true, true);
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
    go("https://www.google.com/");
});

favoritesMenuItems[0].addEventListener("click", function () { // Add to Favorites button
    madPrompt("Enter a name for this page", function (name) {
        // TODO: add favorites support (with json)
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

backButton.addEventListener("click", function () {
    handleWeirdError();
    if (!backButton.dataset.disabled && doHistoryCounting && historyIndex > 1) {
        historyIndex--;
        go(historyItems[historyIndex - 1][0], true);
    }
    changeHistoryButtonStatus();
});

forwardButton.addEventListener("click", function () {
    handleWeirdError();
    if (!forwardButton.dataset.disabled && doHistoryCounting && historyLength >= historyIndex) {
        historyIndex++;
        go(historyItems[historyIndex - 1][0], true);
    }
    changeHistoryButtonStatus();
});

for (const expandButton of [backExpandButton, forwardExpandButton]) {
    const parentButton = document.getElementById(expandButton.id.replace("-expand", ""));
    expandButton.addEventListener("mouseover", function () {
        if (!expandButton.dataset.disabled) {
            parentButton.dataset.hover = true;
        }
    });
    expandButton.addEventListener("mouseleave", function () {
        if (historyMenuBg.style.display !== "block") {
            delete parentButton.dataset.hover;
        }
    });
    expandButton.addEventListener("click", function () {
        if (expandButton.dataset.disabled) {
            return;
        }
        for (const historyItem of historyItems) {
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
        const menuItems = historyMenu.querySelectorAll(".contextMenuItem");
        if (menuItems.length === 0) {
            return;
        }
        historyMenuBg.style.height = menuItems.length * 17 + "px";
        for (const item of menuItems) {
            item.addEventListener("mouseover", function () {
                for (const item of menuItems) {
                    delete item.dataset.active;
                }
                item.dataset.active = true;
            });
            item.addEventListener("mouseleave", function () {
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
        const rect = expandButton.getBoundingClientRect();
        historyMenuBg.style.top = rect.bottom + "px";
        historyMenuBg.style.left = rect.left - backButton.offsetWidth + "px";
        historyMenuBg.style.display = "block";
        expandButton.dataset.active = true;
        parentButton.dataset.hover = true;
        historyMenuBg.focus();
        document.addEventListener('keydown', historyMenuNavigationHandler);
    });
}

refreshButton.addEventListener("click", function () {
    handleWeirdError();
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
    handleWeirdError();
    go(localStorage.madesktopChanViewHome || "https://www.ingan121.com/");
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

urlbar.addEventListener('click', function (event) {
    if (event.offsetX <= 24 * madScaleFactor) {
        if (isCrossOrigin) {
            madAlert("This page is from a different origin. Advanced features are not available for this page.", null, "info");
        } else if (iframe.srcdoc) {
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

if (localStorage.madesktopChanViewHideToolbar) {
    toolbar.style.display = "none";
    toolbarsMenuItems[0].classList.remove("checkedItem");
}

if (localStorage.madesktopChanViewHideAddressBar) {
    addressBar.style.display = "none";
    toolbarsMenuItems[1].classList.remove("checkedItem");
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
        iframe.contentWindow.open = function (url, name, specs) {
            madOpenExternal(url, false, specs);
        }
    }

    iframe.contentWindow.history.pushState = function () {
        if (doHistoryCounting) {
            historyLength = Math.max(historyLength, historyIndex + 1);
            historyIndex++;
            historyItems[historyIndex - 1] = [arguments[2]];
            changeHistoryButtonStatus();
        }
        return window.history.pushState.apply(this, arguments);
    }

    iframe.contentDocument.addEventListener('click', e => {
        if (iframe.contentDocument.activeElement && iframe.contentDocument.activeElement.href) {
            document.title = iframe.contentDocument.activeElement.href + " - ChannelViewer";
            urlbar.value = iframe.contentDocument.activeElement.href;
        } else if (iframe.contentDocument.activeElement.matches("input[type='text'], input[type='search'], input[type='url'], input[type='tel'], input[type='email'], input[type='password'], textarea")) {
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
}

function go(url, noHistory) {
    handleWeirdError();
    if (noHistory) {
        didHistoryNav = false;
    }
    urlbar.value = url;
    iframe.removeAttribute("srcdoc");
    iframe.src = url;

    // Save it later, as some sites may crash Wallpaper Engine CEF upon loading
    // Prevents the user from being stuck in a crash loop
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        madDeskMover.config.src = "apps/channelviewer/index.html?page=" + encodeURIComponent(url);
    }, 10000);
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
        window.print();
        toolbars.style.display = "block";
    } else {
        iframe.contentWindow.print();
    }
}

async function getFavicon() {
    // well IE4-6 didn't put favicon neither in the title bar nor in the address bar
    // TODO: make this optional
    return 'images/html.png';
    try {
        const madBase = location.href.split('/').slice(0, -1).join('/') + '/';
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
                return 'images/html.png';
            } else {
                return path;
            }
        }

        // Check if the favicon exists
        await fetch(path).then(response => {
            if (!response.ok) {
                log('Favicon not found, using a generic icon', 'log', 'ChannelViewer - getFavicon');
                path = 'images/html.png';
            }
        });
        return path;
    } catch (e) {
        log('Error getting favicon');
        console.log(e);
        return 'images/html.png';
    }
}

// based on x-frame-bypass
// https://github.com/niutech/x-frame-bypass
async function forceLoad(url) {
    log("Loading with X-Frame-Bypass: " + url, "log", "ChannelViewer");
    let data = await fetchProxy(url, null, 0).then(res => res.text()).catch(e => {
        iframe.removeAttribute("srcdoc");
        didHistoryNav = false;
        iframe.src = "ieres/NavigationCanceled.html";
    });

    if (data) {
        iframe.srcdoc = data.replace(/<head([^>]*)>/i, `<head$1>
        <base href="${url}">
        <script>
            history.replaceState(null, "", "${url}");
        </script>`);
    }
}

async function fetchProxy(url, options, i) {
    const proxies = (options || {}).proxies || [
        '', // no proxy - will work fine in Wallpaper Engine or any environments with same-origin policy disabled
        'https://api.codetabs.com/v1/proxy/?quest='
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

function init() {
    const url = new URL(location.href);
    if (url.searchParams.get("sb") !== null) {
        iframe.sandbox = "allow-modals allow-scripts";
    }
    const page = url.searchParams.get("page");
    if (!page) {
        return null;
    }
    if (!page.startsWith('http') && !page.startsWith('about') && !page.startsWith('chrome') && !page.startsWith('data') && !page.startsWith('file') && !page.startsWith('ws') && !page.startsWith('wss') && !page.startsWith('blob') && !page.startsWith('javascript')) {
        page = "../../" + page;
    }
    // Parse window.open third argument converted to query string (in DeskSettings.js)
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
        madMoveTo(left, top);
    }
    const popup = !!width || !!height || !!left || !!top || url.searchParams.get("popup") !== null;
    if (popup) {
        toolbars.style.display = "none";
    }
    return page;
}

window.addEventListener('load', function () {
    handleWeirdError();
    let page = init();
    iframe.src = page || localStorage.madesktopChanViewHome || "about:blank";
    document.title = page ? page + " - ChannelViewer" : "ChannelViewer";
    urlbar.value = page;
});

iframe.addEventListener('load', function () {
    if (!iframe.contentDocument) {
        isCrossOrigin = true;
        changeAdvFeatures();
        updateTitle();
        madSetIcon('images/html.png');
        urlbar.value = "*" + iframe.src;
        didFirstLoad = true;
        return;
    }

    if (madRunningMode === 1) {
        if (iframe.contentWindow.location.href === "chrome-error://chromewebdata/") {
            iframe.contentWindow.location.replace("about:srcdoc");
            forceLoad(urlbar.value);
            return;
        }
    }
    if (iframe.contentWindow.location.href === "about:srcdoc" && !iframe.srcdoc) {
        return;
    }

    isCrossOrigin = false;
    if (!didFirstLoad) {
        doHistoryCounting = true;
    }
    this.contentDocument.body.style.zoom = parent.scaleFactor;
    updateTitle();
    changeAdvFeatures();
    getFavicon().then(icon => {
        madSetIcon(icon);
    });
    if (doHistoryCounting) {
        if (didHistoryNav) {
            historyLength = historyIndex + 1;
            historyIndex++;
        }
        didHistoryNav = true;
        log("History: " + historyIndex + " / " + historyLength, "log", "ChannelViewer");
    }
    if (iframe.contentWindow.location.href !== "about:srcdoc") {
        urlbar.value = iframe.contentWindow.location.href;
    }
    historyItems[historyIndex - 1] = [urlbar.value, title];
    historyItems = historyItems.slice(0, historyLength);
    hookIframeSize(this);
    changeHistoryButtonStatus();
    iframe.contentDocument.addEventListener('pointerdown', madBringToTop);
    didFirstLoad = true;
});

//iframe.contentWindow.onunload = function () {
    // TODO: add throbber
    //document.getElementById('loadingText').style.display = 'block';
//}