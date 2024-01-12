'use strict';

let windowContainers = document.getElementsByClassName("windowContainer");
const bgHtmlContainer = document.getElementById("bgHtmlContainer");
const bgHtmlView = document.getElementById("bgHtmlView");
const bgVideoView = document.getElementById("bgVideo");
const schemeElement = document.getElementById("scheme");
const fontElement = document.getElementById("font");
const styleElement = document.getElementById("style");
const msgboxBg = document.getElementById("msgboxBg");
const msgbox = document.getElementById("msgbox");
const msgboxTitlebar = msgbox.getElementsByClassName("title-bar")[0];
const msgboxMessage = document.getElementById("msgbox-msg");
const msgboxIcon = document.getElementById("msgbox-icon");
const msgboxInput = document.getElementById("msgbox-input");
const msgboxCloseBtn = document.getElementById("msgbox-close");
const msgboxBtn1 = document.getElementById("msgbox-btn1");
const msgboxBtn2 = document.getElementById("msgbox-btn2");
const errorWnd = document.getElementById("errorWnd");
const mainMenuBg = document.getElementById("mainMenuBg");
const mainMenu = document.getElementById("mainMenu");
const mainMenuItems = mainMenu.getElementsByClassName("contextMenuItem");
const runningModeLabel = document.getElementById("runmode");
const simulatedModeLabel = document.getElementById("simmode");
const debugMenu = document.getElementById("debug");
const debugLogBtn = document.getElementById("debugLogBtn");
const toggleModeBtn = document.getElementById("toggleModeBtn");

const chord = new Audio("sounds/chord.wav");
const ding = new Audio("sounds/ding.wav");

const NO_SYSPLUG_ALERT = "System plugin is not running. Please make sure you have installed it properly. If you don't want to use it, please disable the system plugin integration option.";

let lastZIndex = localStorage.madesktopItemCount || 0;
let lastAoTZIndex = lastZIndex + 50000;
let isContextMenuOpen = false;
let activeWindow = 0;
let prevActiveWindow = 0;
let startupRan = false;

const WE = 1; // Wallpaper Engine
const LW = 2; // Lively Wallpaper
const BROWSER = 0; // None of the above
window.runningMode = BROWSER;
let origRunningMode = BROWSER;

window.scaleFactor = 1;
window.vWidth = window.innerWidth;
window.vHeight = window.innerHeight;

window.deskMovers = {};

let debugLog = false;

// Load configs
if (!localStorage.madesktopItemCount) {
    localStorage.madesktopItemCount = 1;
    localStorage.madesktopOpenWindows = "0";
}

if (localStorage.madesktopBgColor) document.body.style.backgroundColor = localStorage.madesktopBgColor;
changeBgType(localStorage.madesktopBgType || "image");
changeBgImgMode(localStorage.madesktopBgImgMode || "center");
if (localStorage.madesktopBgVideoMuted) bgVideoView.muted = true;
if (localStorage.madesktopBgHtmlSrc) bgHtmlView.src = localStorage.madesktopBgHtmlSrc;
if (localStorage.madesktopColorScheme) changeColorScheme(localStorage.madesktopColorScheme);
changeScale(localStorage.madesktopScaleFactor);
if (localStorage.madesktopDebugMode) activateDebugMode();
if (localStorage.madesktopDebugLog) toggleDebugLog();
changeFont(localStorage.madesktopNoPixelFonts);
changeCmAnimation(localStorage.madesktopCmAnimation || "slide");

deskMovers[0] = new DeskMover(windowContainers[0], "");
initSimpleMover(msgbox, msgboxTitlebar, [msgboxCloseBtn]);
initSimpleMover(debugMenu, debugMenu, debugMenu.querySelectorAll("a"));

// Migrate old configs
if (localStorage.madesktopNonADStyle) {
    for (let i = 0; i < localStorage.madesktopItemCount; i++) localStorage.setItem("madesktopItemStyle" + (i || ""), "nonad");
    localStorage.removeItem("madesktopNonADStyle");
    location.reload();
    throw new Error("Refreshing...");
}
// Convert destryoedItems to openWindows
// Only save open windows instead of all destroyed windows
if (localStorage.madesktopDestroyedItems) {
    let openWindows = [0];
    for (let i = 1; i < localStorage.madesktopItemCount; i++) {
        if (!localStorage.madesktopDestroyedItems.includes(`|${i}|`)) {
            openWindows[openWindows.length] = i;
        } else {
            // Clean up configs of destroyed deskitems
            localStorage.removeItem(`madesktopItemWidth${i}`);
            localStorage.removeItem(`madesktopItemHeight${i}`);
            localStorage.removeItem(`madesktopItemXPos${i}`);
            localStorage.removeItem(`madesktopItemYPos${i}`);
            localStorage.removeItem(`madesktopItemSrc${i}`);
            localStorage.removeItem(`madesktopItemStyle${i}`);
            localStorage.removeItem(`madesktopItemUnscaled${i}`);
            localStorage.removeItem(`madesktopItemTitle${i}`);
            localStorage.removeItem(`madesktopItemZIndex${i}`);
            localStorage.removeItem(`madesktopItemActive${i}`);
        }
    }
    localStorage.madesktopOpenWindows = openWindows;
    localStorage.removeItem("madesktopDestroyedItems");
} else if (!localStorage.madesktopOpenWindows) {
    let openWindows = [0];
    for (let i = 1; i < localStorage.madesktopItemCount; i++) {
        openWindows[openWindows.length] = i;
    }
    localStorage.madesktopOpenWindows = openWindows;
}
localStorage.removeItem("madesktopLastCustomScale");

if (localStorage.madesktopItemCount > 1) {
    // Check if the deskitem we're trying to initialize is open or not
    // Skip for deskitem 0 (the ChannelBar) - this design is to maintain backwards compatibility with old versions
    // which supported only one deskitem
    for (const i of localStorage.madesktopOpenWindows.split(',').slice(1)) {
        createNewDeskItem(i.toString());
    }
}

if (localStorage.madesktopLastVer !== "3.0") { // First run or update from previous versions
    localStorage.removeItem("madesktopHideWelcome");
    localStorage.removeItem("madesktopCheckedChanges");
    localStorage.removeItem("madesktopCheckedConfigs");
    startup();
}
localStorage.madesktopLastVer = "3.0";

if (localStorage.madesktopItemVisible === "false") {
    windowContainers[0].style.display = "none";
}

// Change the scale on load
bgHtmlView.addEventListener('load', function () {
    this.contentDocument.body.style.zoom = scaleFactor;
    hookIframeSize(bgHtmlView);
});

if (typeof wallpaperOnVideoEnded === "function") { // Check if running in Wallpaper Engine
    runningMode = WE;
}

// Press Ctrl+Shift+Y to activate the debug mode
// Wont work in WE so enter !debugmode in the Change URL window
document.addEventListener('keypress', function(event) {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyY') activateDebugMode();
});

// Main context menu things (only for browser uses)
window.addEventListener('contextmenu', function (event) {
    if (isContextMenuOpen) return;
    mainMenuBg.style.left = event.clientX + "px";
    mainMenuBg.style.top = event.clientY + "px";
    mainMenuBg.style.display = "block";
    iframeClickEventCtrl(false);
    isContextMenuOpen = true;
    event.preventDefault();
    mainMenuBg.focus();
}, false);

mainMenuBg.addEventListener('focusout', closeMainMenu);

mainMenuItems[0].addEventListener('click', openWindow); // New button

mainMenuItems[1].addEventListener('click', function () { // Properties button
    openWindow("apps/madconf/background.html", true)
});

msgboxBg.addEventListener('click', flashDialog);

msgbox.addEventListener('click', preventDefault);

window.addEventListener('resize', function () {
    changeScale(scaleFactor);
});

// Detect WE config change
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        log(properties);

        if (properties.bgcolor && properties.bgvideo) {
            // Proper startup detection for Wallpaper Engine
            // Otherwise entering and leaving ChannelViewer etc will trigger this
            startup();

            // Do not apply WE configs if this is a startup event
            return;
        }

        if (properties.bgcolor) {
            changeBgColor(parseWallEngColorProp(properties.bgcolor.value));
        }
        if (properties.bgimg) {
            if (properties.bgimg.value) {
                changeBgType("image");
                const path = "file:///" + properties.bgimg.value;
                document.body.style.backgroundImage = "url('" + path + "')";
                localStorage.madesktopBgImg = path;
                localStorage.madesktopBgWeImg = path;
                localStorage.madesktopBgType = "image";
            } else {
                if (localStorage.madesktopBgWeImg === localStorage.madesktopBgImg) {
                    document.body.style.backgroundImage = 'none';
                    delete localStorage.madesktopBgImg;
                }
                delete localStorage.madesktopBgWeImg;
            }
        }
        if (properties.bgvideo) {
            if (properties.bgvideo.value) {
                changeBgType("video");
                const path = "file:///" + properties.bgvideo.value;
                bgVideoView.src = path;
                document.body.style.backgroundImage = "none";
                delete localStorage.madesktopBgImg;
                localStorage.madesktopBgVideo = path;
                localStorage.madesktopBgType = "video";
            } else {
                changeBgType("image");
                bgVideoView.src = "";
                delete localStorage.madesktopBgVideo;
                localStorage.madesktopBgType = "image";
            }
        }
        if (properties.additem) {
            openWindow();
        }
        if (properties.openproperties) {
            openWindow("apps/madconf/background.html", true);
        }
    }
};

function livelyPropertyListener(name, val) {
    switch (name) {
        case "bgcolor":
            // Only this is called on startup
            runningMode = LW;
            runningModeLabel.textContent = "Lively Wallpaper";
            origRunningMode = runningMode;
            simulatedModeLabel.textContent = "";
            changeBgColor(val);
            break;
        case "properties":
            openWindow("apps/madconf/background.html", true);
            break;
        default:
            wallpaperPropertyListener.applyUserProperties({ [name]: { value: val } });
    }
}

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
}

function changeBgColor(str) {
    log(str);
    document.body.style.backgroundColor = str;
    localStorage.madesktopBgColor = str;
}

function loadBgImgConf() {
    if (localStorage.madesktopBgImg) {
        if (localStorage.madesktopBgImg.startsWith("file:///") || // Set in WE
            localStorage.madesktopBgImg.startsWith("wallpapers/")) // Built-in wallpapers set in madconf
        {
            document.body.style.backgroundImage = "url('" + localStorage.madesktopBgImg + "')";
        } else {
            document.body.style.backgroundImage = "url('data:image/png;base64," + localStorage.madesktopBgImg + "')"; // Set in madconf
        }
    } else {
        document.body.style.backgroundImage = "none";
    }
}

function changeBgImgMode(value) {
    switch (value) {
        case "center": // Center
            document.body.style.backgroundSize = "auto";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
        case "grid": // Tile
            document.body.style.backgroundSize = "auto";
            document.body.style.backgroundRepeat = "repeat";
            document.body.style.backgroundPosition = "left top";
            break;
        case "horizfit": // Fit horizontally
            document.body.style.backgroundSize = "contain";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
        case "vertfit": // Fit vertically
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
}

function changeColorScheme(scheme) {
    if (scheme === "98") {
        schemeElement.href = "data:text/css,";
        delete localStorage.madesktopCustomColor;
        delete localStorage.madesktopSysColorCache;
    } else if (scheme === "custom") {
        schemeElement.href = localStorage.madesktopCustomColor;
        delete localStorage.madesktopSysColorCache;
    } else if (scheme.split('\n').length > 1) {
        const dataURL = `data:text/css,${encodeURIComponent(scheme)}`;
        schemeElement.href = dataURL;
        localStorage.madesktopCustomColor = dataURL;
        delete localStorage.madesktopSysColorCache;
    } else if (scheme === "sys") {
        if (localStorage.madesktopSysColorCache) {
            schemeElement.href = localStorage.madesktopSysColorCache;
        }

        fetch("http://localhost:3031/systemscheme")
            .then(response => response.text())
            .then(responseText => {
                const dataURL = `data:text/css,${encodeURIComponent(responseText)}`;
                schemeElement.href = dataURL;
                localStorage.madesktopSysColorCache = dataURL; // Cache it as SysPlug startup is slower than high priority WE startup
            })
            .catch(error => {
                // Ignore it as SysPlug startup is slower than high priority WE startup
            })

        delete localStorage.madesktopCustomColor;
    } else {
        schemeElement.href = `schemes/${scheme}.css`;
        delete localStorage.madesktopCustomColor;
        delete localStorage.madesktopSysColorCache;
    }
    
    try {
        document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
    } catch {
        document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
    }

    try {
        bgHtmlView.contentWindow.postMessage({ type: "scheme-updated" }, "*");
    } catch {
        // page did not load yet
    }
    for (let i = 0; i < windowContainers.length; i++) {
        try {
            const iframe = windowContainers[i].getElementsByClassName("windowElement")[0];
            iframe.contentWindow.postMessage({ type: "scheme-updated" }, "*");
        } catch {
            // attempting to do this on destroyed deskitems
            // or page did not load yet
        }
    }
}

// Change the scaling factor
function changeScale(scale) {
    scaleFactor = scale || 1;
    vWidth = window.innerWidth / scaleFactor;
    vHeight = window.innerHeight / scaleFactor;
    document.body.style.zoom = scaleFactor;
    updateIframeScale();
    document.dispatchEvent(new Event("mouseup")); // Move all deskitems inside the visible area
    log({scaleFactor, vWidth, vHeight, dpi: 96 * scaleFactor});
}

// Toggle between "Pixelated MS Sans Serif" and just sans-serif
function changeFont(isPixel) {
    if (isPixel) {
        fontElement.href = "css/nopixel.css";
    } else {
        fontElement.href = "";
    }
}

// Change context menu animation
function changeCmAnimation(type) {
    switch(type) {
        case "none":
            mainMenuBg.style.animation = "none";
            break;
        case "fade":
            mainMenuBg.style.animation = "fade 0.2s";
            break;
        case "slide":
            mainMenuBg.style.animation = "cmDropdown 0.25s linear";
    }
    for (const i in deskMovers) {
        deskMovers[i].changeCmAnimation(type);
    }
}

// Change the 'open with' option of the system plugin, by sending a POST request to the system plugin
function updateSysplugOpenOpt(option) {
    fetch("http://localhost:3031/config", { method: "POST", body: `{"openWith": ${option}}` })
        .catch(error => {
            madAlert("Failed to change the open option because system plugin is not running. Please install it first then try again.", function () {
                openWindow("SysplugSetupGuide.md", true);
            }, "warning");
        });
}

// Find the cursor position inside an element
function findPos(elem) {
    let curleft = 0, curtop = 0;
    if (elem.offsetParent) {
        do {
            curleft += elem.offsetLeft;
            curtop += elem.offsetTop;
        } while (elem = elem.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

// Convert rgb(red, green, blue) to #rrggbb
function rgbToHex(rgbType) {
    const rgb = rgbType.replace(/[^%,.\d]/g, "").split(",");

    for (let x = 0; x < 3; x++) {
        if (rgb[x].indexOf("%") > -1) rgb[x] = Math.round(parseFloat(rgb[x]) * 2.55); 
    }

    const toHex = function(string) {
        string = parseInt(string, 10).toString(16);
        string = (string.length === 1) ? "0" + string : string;

        return string;
    };

    const r = toHex(rgb[0]);
    const g = toHex(rgb[1]);
    const b = toHex(rgb[2]);

    const hexType = "#" + r + g + b;

    return hexType;
}

// Convert WE color format to #rrggbb
function parseWallEngColorProp(value) {
    let customColor = value.split(' ');
    customColor = customColor.map(function(c) {
        return Math.ceil(c * 255);
    });
    return rgbToHex('rgb(' + customColor + ')');
}

// https://stackoverflow.com/a/35970186
function invertColor(hex) {
    if (hex.indexOf(' ') === 0) {
        hex = hex.slice(1);
    }
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

// Create a new ActiveDesktop item and initialize it
function createNewDeskItem(numStr, openDoc, temp, width, height, style, centered, top, left) {
    const newContainer = windowContainers[0].cloneNode(true);
    document.body.appendChild(newContainer);
    windowContainers = document.getElementsByClassName("windowContainer");
    const deskMover = new DeskMover(newContainer, numStr, openDoc, temp, width, height, style, false, centered, top, left);
    deskMovers[numStr] = deskMover;
    return deskMover;
}

// Create a new AD item, initialize, and increase the saved window count
function openWindow(openDoc, temp, width, height, style, centered, top, left) {
    let deskMover;
    if (localStorage.madesktopItemVisible === "false" && !(typeof openDoc === "string" || openDoc instanceof String)) {
        windowContainers[0].style.display = "block";
        localStorage.removeItem("madesktopItemVisible");
        activateWindow(0);
        deskMover = deskMovers[0];
    } else {
        if (!temp) {
            localStorage.madesktopOpenWindows += `,${localStorage.madesktopItemCount}`;
        }
        if (localStorage.madesktopItemVisible === "false") {
            windowContainers[0].style.display = "block";
            deskMover = createNewDeskItem(localStorage.madesktopItemCount, openDoc, temp, width, height, style || (openDoc ? "wnd" : "ad"), centered, top, left);
            windowContainers[0].style.display = "none";
        } else {
            deskMover = createNewDeskItem(localStorage.madesktopItemCount, openDoc, temp, width, height, style || (openDoc ? "wnd" : "ad"), centered, top, left);
        }
        activateWindow(localStorage.madesktopItemCount);
        localStorage.madesktopItemCount++;
    }
    return deskMover;
}

function closeMainMenu() {
    mainMenuBg.style.display = "none";
    isContextMenuOpen = false;
}

// Required as mouse movements over iframes are not detectable in the parent document
function iframeClickEventCtrl(clickable) {
    log(clickable ? "clickable" : "unclickable", "debug", new Error().stack.split('\n')[2].trim().slice(3).split(' ')[0] + " -> iframeClickEventCtrl");
    const value = clickable ? "auto" : "none";
    bgHtmlView.style.pointerEvents = value;
    for (let i = 0; i < windowContainers.length; i++) {
        windowContainers[i].style.pointerEvents = value;
    }
}

// Change the scaleFactor of all iframes
function updateIframeScale() {
    try {
        bgHtmlView.contentDocument.body.style.zoom = scaleFactor;
        bgHtmlView.contentWindow.dispatchEvent(new Event("resize"));
    } catch {
        // page did not load yet
    }
    for (const i in deskMovers) {
        try {
            if (!deskMovers[i].config.unscaled) {
                const iframe = deskMovers[i].windowElement;
                iframe.contentDocument.body.style.zoom = scaleFactor;
                iframe.contentWindow.dispatchEvent(new Event("resize"));
            }
        } catch {
            // page did not load yet
            // it works on external webpages thanks to the new WE iframe policy
        }
    }
}

// innerWidth/Height hook
// Fixes some sites that are broken when scaled, such as YT
function hookIframeSize(iframe, num) {
    Object.defineProperty(iframe.contentWindow, "innerWidth", {
        get: function () {
            if (typeof num !== "undefined" && deskMovers[num].config.unscaled) {
                return iframe.clientWidth * scaleFactor;
            }
            return iframe.clientWidth;
        }
    });
    Object.defineProperty(iframe.contentWindow, "innerHeight", {
        get: function () {
            if (typeof num !== "undefined" && deskMovers[num].config.unscaled) {
                return iframe.clientHeight * scaleFactor;
            }
            return iframe.clientHeight;
        }
    });

    // Also hook window.open as this doesn't work in WE
    // Try to use sysplug, and if unavailable, just prompt for URL copy
    if (runningMode !== BROWSER) {
        iframe.contentWindow.open = function (url) {
            if (localStorage.sysplugIntegration) {
                fetch("http://localhost:3031/open", { method: "POST", body: url })
                    .then(response => response.text())
                    .then(responseText => {
                        if (responseText !== "OK") {
                            madAlert("An error occured!\nSystem plugin response: " + responseText, function () {
                                copyPrompt(url);
                            }, "error");
                        }
                    })
                    .catch(error => {
                        madAlert("System plugin is not running. Please make sure you have installed it properly.", function () {
                            copyPrompt(url);
                        }, "warning");
                    });
            } else copyPrompt(url);
        
            function copyPrompt(url) {
                if (prompt("Paste this URL in the browser's address bar. Click OK to copy.", url)) {
                const tmp = document.createElement("textarea");
                document.body.appendChild(tmp);
                tmp.value = url;
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
                }
            }
        }

        iframe.contentWindow.close = function () {
            deskMovers[num].closeWindow();
        }
    }

    // Listen for title changes
    new MutationObserver(function(mutations) {
        deskMovers[num].windowTitleText.textContent = mutations[0].target.innerText;
    }).observe(
        iframe.contentDocument.querySelector('title'),
        { subtree: true, characterData: true, childList: true }
    );
}

// Save current window z-order
function saveZOrder() {
    let zOrders = [];
    for (const i in deskMovers) {
        zOrders[zOrders.length] = [i, deskMovers[i].windowContainer.style.zIndex];
    }
    
    zOrders.sort(function(a, b) {
        if (+a[1] > +b[1]) return 1;
        else if (+a[1] === +b[1]) return 0;
        else return -1;
    });
    
    for (let i = 0; i < zOrders.length; i++) {
        deskMovers[zOrders[i][0]].config.zIndex = i;
    }
    
    log(zOrders);
}

function activateWindow(num = activeWindow || 0) {
    log(num);
    delete deskMovers[num].windowContainer.dataset.inactive;
    deskMovers[num].windowTitlebar.classList.remove("inactive");

    if (num !== activeWindow) {
        prevActiveWindow = activeWindow;
        activeWindow = num;
    }

    if (!localStorage.madesktopNoDeactivate) {
        deskMovers[num].config.active = true;
    }

    for (const i in deskMovers) {
        if (i !== num) {
            if (localStorage.madesktopNoDeactivate) {
                delete deskMovers[num].windowContainer.dataset.inactive;
                deskMovers[i].windowTitlebar.classList.remove("inactive");
            } else {
                deskMovers[i].windowContainer.dataset.inactive = true;
                deskMovers[i].windowTitlebar.classList.add("inactive");
                deskMovers[i].config.active = false;
            }
        }
    }
}

// Prevent windows from being created in the same position
function cascadeWindow(x, y) {
    const extraTitleHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--extra-title-height'));
    const extraBorderWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--extra-border-width'));
    x = parseInt(x);
    y = parseInt(y);
    if (isWindowInPosition(x, y)) {
        return cascadeWindow(x + 4 + extraBorderWidth, y + 24 + extraTitleHeight);
    } else {
        return [x + "px", y + "px"];
    }
}

function isWindowInPosition(x, y) {
    if (typeof x === "number") {
        x = x + "px";
    }
    if (typeof y === "number") {
        y = y + "px";
    }
    for (const i in deskMovers) {
        if (deskMovers[i].config.xPos === x && deskMovers[i].config.yPos === y) {
            return true;
        }
    }
    return false;
}

async function getFavicon(iframe) {
    try {
        const madBase = location.href.split('/').slice(0, -1).join('/') + '/';
        const loc = iframe.contentWindow.location.href;
        const doc = iframe.contentDocument;
        const url = new URL(loc);

        // Get the favicon from the page
        const iconElem = doc.querySelector("link[rel*='icon']") || doc.querySelector("link[rel*='shortcut icon']") || { href: url.origin + '/favicon.ico', notFound: true };
        let path = iconElem.href;
        log('Favicon path from page: ' + path);

        // Use the MAD icon for local/MAD files and data URLs
        if (loc.startsWith("file:///") || loc.startsWith("data:") || loc.startsWith(madBase)) {
            if (iconElem.notFound) {
                return 'icon.ico';
            } else {
                return path;
            }
        }
        
        // Check if the favicon exists
        await fetch(path).then(response => {
            if (!response.ok) {
                log('Favicon not found, using generic icon', 'log', 'getFavicon');
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

function adjustAllElements(extraTitleHeight, extraBorderWidth, extraBorderHeight) {
    log({extraTitleHeight, extraBorderWidth, extraBorderHeight});
    for (const i in deskMovers) {
        deskMovers[i].adjustElements(extraTitleHeight, extraBorderWidth, extraBorderHeight);
    }
}

async function flashElement(elem, isContextMenu) {
    if (isContextMenu) {
        elem.dataset.active = true;
        await asyncTimeout(100);
        delete elem.dataset.active;
        await asyncTimeout(100);
        elem.dataset.active = true;
        await asyncTimeout(100);
        delete elem.dataset.active;
    } else {
        elem.style.animation = "flash 0.5s linear";
        await asyncTimeout(500);
        elem.style.animation = "";
    }
    return;
}

async function waitForAnim(elem) {
    if (elem.style.animation.includes("none")) return;
    return new Promise(resolve => {
        elem.addEventListener('animationend', function () {
            resolve();
        });
    });
}

async function asyncTimeout(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// Lively Wallpaper doesn't work well with alert/confirm/prompt, so replace these with custom ones
function madAlert(msg, callback, icon = "info") {
    if (icon === "warning" || icon === "error") {
        playSound("chord");
    } else {
        playSound("ding");
    }

    msgboxMessage.innerHTML = msg;
    msgboxIcon.style.display = "block";
    msgboxIcon.src = `images/${icon}.png`;
    msgboxBtn2.style.display = "none";
    msgboxInput.style.display = "none";
    
    document.addEventListener('keyup', keyup);
    msgboxBtn1.addEventListener('click', close);
    msgboxCloseBtn.addEventListener('click', close);
    
    showDialog();
    
    function keyup(event) {
        switch (event.key) {
            case "Enter": case "Escape":
                close();
        }
    }
    function close() {
        msgboxBg.style.display = "none";
        document.removeEventListener('keyup', keyup);
        msgboxBtn1.removeEventListener('click', close);
        msgboxCloseBtn.removeEventListener('click', close);
        deskMovers[activeWindow].windowTitlebar.classList.remove("inactive");
        if (callback) callback();
    }
}

function madConfirm(msg, callback) {
    playSound("chord");

    msgboxMessage.innerHTML = msg;
    msgboxIcon.style.display = "block";
    msgboxIcon.src = "images/question.png";
    msgboxBtn2.style.display = "block";
    msgboxInput.style.display = "none";
    
    document.addEventListener('keyup', keyup);
    msgboxBtn1.addEventListener('click', ok);
    msgboxBtn2.addEventListener('click', close);
    msgboxCloseBtn.addEventListener('click', close);
    
    showDialog();
    
    function keyup(event) {
        switch (event.key) {
            case "Enter":
                ok();
                break;
            case "Escape":
                close();
        }
    }
    function ok() {
        msgboxBg.style.display = "none";
        removeEvents();
        if (callback) callback(true);
    }
    function close() {
        msgboxBg.style.display = "none";
        removeEvents();
        if (callback) callback(false);
    }
    function removeEvents() {
        document.removeEventListener('keyup', keyup);
        msgboxBtn1.removeEventListener('click', ok);
        msgboxBtn2.removeEventListener('click', close);
        msgboxCloseBtn.removeEventListener('click', close);
        deskMovers[activeWindow].windowTitlebar.classList.remove("inactive");
    }
}

function madPrompt(msg, callback, hint, text) {
    if (runningMode === WE) { // Wallpaper Engine normally does not support keyboard input
        callback(prompt(msg, text));
        return;
    }
    
    msgboxMessage.innerHTML = msg;
    msgboxIcon.style.display = "none";
    msgboxBtn2.style.display = "block";
    msgboxInput.style.display = "block";
    msgboxInput.placeholder = hint || "";
    msgboxInput.value = text || "";
    
    document.addEventListener('keyup', keyup);
    msgboxBtn1.addEventListener('click', ok);
    msgboxBtn2.addEventListener('click', close);
    msgboxCloseBtn.addEventListener('click', close);
    
    showDialog();
    msgboxInput.focus();
    
    function keyup(event) {
        switch (event.key) {
            case "Enter":
                ok();
                break;
            case "Escape":
                close();
        }
    }
    function ok() {
        msgboxBg.style.display = "none";
        removeEvents();
        if (callback) callback(msgboxInput.value);
    }
    function close() {
        msgboxBg.style.display = "none";
        removeEvents();
        if (callback) callback(null);
    }
    function removeEvents() {
        document.removeEventListener('keyup', keyup);
        msgboxBtn1.removeEventListener('click', ok);
        msgboxInput.removeEventListener('keyup', ok);
        msgboxBtn2.removeEventListener('click', close);
        msgboxCloseBtn.removeEventListener('click', close);
        deskMovers[activeWindow].windowTitlebar.classList.remove("inactive");
    }
}

function preventDefault(event) {
    event.preventDefault();
    event.stopPropagation();
}

function showDialog() {
    if (!localStorage.madesktopNoDeactivate) {
        deskMovers[activeWindow].windowTitlebar.classList.add("inactive");
    }
    msgboxBg.style.display = "block";
    msgbox.style.top = (vHeight - msgbox.offsetHeight) / 2 + "px";
    msgbox.style.left = (vWidth - msgbox.offsetWidth) / 2 + "px";
    msgboxBtn1.focus();
}

function flashDialog() {
    playSound("ding");
    let cnt = 1;
    let interval = setInterval(function () {
        if (cnt === 18) {
            clearInterval(interval);
        }
        if (cnt % 2) {
            msgbox.dataset.inactive = true;
            msgboxTitlebar.classList.add("inactive");
        } else {
            delete msgbox.dataset.inactive;
            msgboxTitlebar.classList.remove("inactive");
        }
        cnt++;
    }, 60);
}

function playSound(sound) {
    if (!localStorage.madesktopAlertSndMuted) {
        switch (sound) {
            case "chord":
                chord.currentTime = 0;
                chord.play();
                break;
            case "ding":
                ding.currentTime = 0;
                ding.play();
                break;
        }
    }
}

function reset(res) {
    if (typeof res === "undefined" || res) {
        let msg = "This will remove every configuration change of ModernActiveDesktop you made. Are you sure you want to continue?";
        if (runningMode === WE) {
            msg += "<br>Do note that this won't reset the Wallpaper Engine properties panel, and you will need to unload and reload a video wallpaper if you have one set.";
        }
        madConfirm(msg, function (res) {
            if (res) {
                localStorage.clear();
                location.reload(true);
                throw new Error("Refreshing...");
            }
        });
    }
}

function log(str, level, caller = new Error().stack.split('\n')[2].trim().slice(3).split(' ')[0]) {
    if (debugLog) {
        if (typeof str === "object") {
            str = JSON.stringify(str);
        }
        console[level || 'log'](caller + ": " + str);
    }
}

// Just for debugging
function debug() {
    madPrompt("Enter JavaScript code to run.", function (res) {
        eval(res);
    });
    function loadEruda() { // Load Eruda devtools (but Chrome DevTools is better)
        const script = document.createElement('script');
        script.src="https://cdn.jsdelivr.net/npm/eruda";
        document.body.appendChild(script);
        script.onload = function () {
            eruda.init();
        };
    }
}

function activateDebugMode() {
    if (styleElement.textContent.length) return;
    styleElement.textContent = `
        .debug { display: block; }
        .contextMenuBg { height: 85px; }`;
    debugMenu.style.top = 0;
    debugMenu.style.right = 0;
    debugMenu.style.left = "auto";
    localStorage.madesktopDebugMode = true;
}

function deactivateDebugMode() {
    styleElement.textContent = "";
    localStorage.removeItem("madesktopDebugMode");
    if (debugLog) toggleDebugLog();
    if (runningMode !== origRunningMode) {
        runningMode = origRunningMode;
        simulatedModeLabel.textContent = "";
    }
}

function toggleDebugLog() {
    debugLog = !debugLog;
    debugLogBtn.textContent = debugLog ? "Disable debug logging" : "Enable debug logging";
    if (debugLog) {
        localStorage.madesktopDebugLog = true;
    } else {
        localStorage.removeItem("madesktopDebugLog");
    }
}

function toggleRunningMode() {
    switch (runningMode) {
        case BROWSER:
            runningMode = WE;
            simulatedModeLabel.textContent = ", simulating Wallpaper Engine behavior"
            break;
        
        case WE:
            runningMode = LW;
            simulatedModeLabel.textContent = ", simulating Lively Wallpaper behavior"
            break;
        
        case LW:
            runningMode = BROWSER;
            simulatedModeLabel.textContent = ", simulating browser behavior"
            break;
    }
    if (runningMode === origRunningMode) simulatedModeLabel.textContent = "";
}

function showErrors() {
    document.getElementById("errorMsg").style.display = "none";
    errorWnd.style.animation = "none";
    errorWnd.style.paddingTop = "8px";
    errorWnd.style.display = "block";
}

function startup() {
    if (startupRan) {
        return;
    }

    if (!localStorage.madesktopStartSndMuted) {
        new Audio("sounds/The Microsoft Sound.wav").play();

        if (!localStorage.madesktopHideWelcome) {
            setTimeout(function () {
                openWindow("apps/welcome/index.html", true, "476px", "322px", "wnd", true);
            }, 5000);
        }
    } else {
        if (!localStorage.madesktopHideWelcome) {
            openWindow("apps/welcome/index.html", true, "476px", "322px", "wnd", true);
        }
    }
    startupRan = true;
}

document.getElementById("location").textContent = location.href;
if (runningMode === WE) {
    runningModeLabel.textContent = "Wallpaper Engine";
} else {
    startup();
    if (location.href.startsWith("file:///") && runningMode === BROWSER) {
        madAlert("You are running ModernActiveDesktop as a local file. Please use a web server to host it for full functionality.", null, "warning");
    }
}
origRunningMode = runningMode;

window.addEventListener('load', function () {
    document.dispatchEvent(new Event("mouseup")); // Re-calculate title bar height after loading scheme css
});

// Initialization complete
errorWnd.style.display = "none";