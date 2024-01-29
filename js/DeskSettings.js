// DeskSettings.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

let windowContainers = document.getElementsByClassName("windowContainer");
const bgHtmlContainer = document.getElementById("bgHtmlContainer");
const bgHtmlView = document.getElementById("bgHtmlView");
const bgVideoView = document.getElementById("bgVideo");
const schemeElement = document.getElementById("scheme");
const fontElement = document.getElementById("font");
const menuStyleElement = document.getElementById("menuStyle");
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

const soundScheme = {};

const isWin10 = navigator.userAgent.includes('Windows NT 10.0');
const NO_SYSPLUG_ALERT = "System plugin is not running. Please make sure you have installed it properly. If you don't want to use it, please disable the system plugin integration option.";

let lastZIndex = parseInt(localStorage.madesktopItemCount) || 0;
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
window.visDeskMover = null;

let debugLog = false;

// Load configs
if (!localStorage.madesktopItemCount) {
    localStorage.madesktopItemCount = 1;
    localStorage.madesktopOpenWindows = "0";
}

if (!isWin10) {
    delete localStorage.sysplugIntegration;
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
changeMenuStyle(localStorage.madesktopMenuStyle);
changeSoundScheme(localStorage.madesktopSoundScheme || "98");

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

if (localStorage.madesktopLastVer) {
    if (!localStorage.madesktopLastVer.startsWith("3.1")) { // Update from 3.0 and below
        localStorage.removeItem("madesktopHideWelcome");
        localStorage.removeItem("madesktopCheckedChanges");
        localStorage.removeItem("madesktopCheckedConfigs");
        openWindow("placeholder.html");

        if (localStorage.madesktopColorScheme === "xpcss4mad") {
            localStorage.madesktopMenuStyle = "mbcm";
            changeMenuStyle(localStorage.madesktopMenuStyle);
        }
        startup();
    }

    if (localStorage.madesktopLastVer !== "3.1.2" && localStorage.sysplugIntegration) { // Update from 3.1.1 and below
        madAlert("System plugin has been updated, and it needs a reinstall. Please update it with the setup guide.", function () {
            openWindow("SysplugSetupGuide.md", true);
        });
        delete localStorage.sysplugIntegration;
    }
} else { // First run
    openWindow("placeholder.html");
    startup();
}
localStorage.madesktopLastVer = "3.1.2";

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

mainMenuItems[0].addEventListener('click', () => { // New button
    closeMainMenu();
    openWindow();
});

mainMenuItems[1].addEventListener('click', () => { // Properties button
    closeMainMenu();
    openWindow("apps/madconf/background.html", true);
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
        if (properties.audioprocessing) {
            if (properties.audioprocessing.value) {
                delete localStorage.madesktopVisUnavailable;
                if (!visDeskMover) {
                    openWindow("apps/visualizer/index.html", false, "480px", "380px", "wnd", false, "200px", "500px");
                }
            } else {
                localStorage.madesktopVisUnavailable = true;
                if (visDeskMover) {
                    visDeskMover.closeWindow();
                }
            }
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

    announce("scheme-updated");
}

function announce(type) {
    try {
        bgHtmlView.contentWindow.postMessage({ type }, "*");
    } catch {
        // page did not load yet
    }
    for (let i = 0; i < windowContainers.length; i++) {
        try {
            const iframe = windowContainers[i].getElementsByClassName("windowElement")[0];
            iframe.contentWindow.postMessage({ type }, "*");
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

// Change menu style
function changeMenuStyle(style) {
    if (!style) {
        menuStyleElement.href = "";
    } else {
        menuStyleElement.href = `css/flatmenu-${style}.css`;
    }
    announce("scheme-updated");
}

// Change sound scheme
function changeSoundScheme(scheme) {
    switch (scheme) {
        case '3':
            soundScheme.startup = new Audio("sounds/95/tada.wav");
            soundScheme.question = new Audio("sounds/95/chord.wav");
            soundScheme.error = new Audio("sounds/95/chord.wav");
            soundScheme.warning = new Audio("sounds/95/chord.wav");
            soundScheme.info = new Audio("sounds/95/ding.wav");
            soundScheme.modal = new Audio("sounds/95/ding.wav");
            break;
        case '95':
            soundScheme.startup = new Audio("sounds/95/The Microsoft Sound.wav");
            soundScheme.question = new Audio("sounds/95/chord.wav");
            soundScheme.error = new Audio("sounds/95/chord.wav");
            soundScheme.warning = new Audio("sounds/95/chord.wav");
            soundScheme.info = new Audio("sounds/95/ding.wav");
            soundScheme.modal = new Audio("sounds/95/ding.wav");
            break;
        case 'nt4':
            soundScheme.startup = new Audio("sounds/NT4/Windows NT Logon Sound.wav");
            soundScheme.question = new Audio("sounds/95/chord.wav");
            soundScheme.error = new Audio("sounds/95/chord.wav");
            soundScheme.warning = new Audio("sounds/95/chord.wav");
            soundScheme.info = new Audio("sounds/95/ding.wav");
            soundScheme.modal = new Audio("sounds/95/ding.wav");
            break;
        case '98':
            soundScheme.startup = new Audio("sounds/The Microsoft Sound.wav");
            soundScheme.question = new Audio("sounds/chord.wav");
            soundScheme.error = new Audio("sounds/chord.wav");
            soundScheme.warning = new Audio("sounds/chord.wav");
            soundScheme.info = new Audio("sounds/ding.wav");
            soundScheme.modal = new Audio("sounds/ding.wav");
            break;
        case '2k':
            soundScheme.startup = new Audio("sounds/2000/Windows Logon Sound.wav");
            soundScheme.question = new Audio("sounds/chord.wav");
            soundScheme.error = new Audio("sounds/chord.wav");
            soundScheme.warning = new Audio("sounds/chord.wav");
            soundScheme.info = new Audio("sounds/ding.wav");
            soundScheme.modal = new Audio("sounds/ding.wav");
            break;
        case 'xp':
            soundScheme.startup = new Audio("sounds/XP/Windows XP Startup.wav");
            soundScheme.question = new Audio("sounds/XP/Windows XP Exclamation.wav");
            soundScheme.error = new Audio("sounds/XP/Windows XP Critical Stop.wav");
            soundScheme.warning = new Audio("sounds/XP/Windows XP Exclamation.wav");
            soundScheme.info = new Audio("sounds/XP/Windows XP Error.wav");
            soundScheme.modal = new Audio("sounds/XP/Windows XP Ding.wav");
            break;
        case 'vista':
            soundScheme.startup = new Audio("sounds/Aero/Windows Logon Sound.wav"); // enable real startup sound :D
            soundScheme.question = new Audio("sounds/Aero/Windows Exclamation.wav");
            soundScheme.error = new Audio("sounds/Aero/Windows Critical Stop.wav");
            soundScheme.warning = new Audio("sounds/Aero/Windows Exclamation.wav");
            soundScheme.info = new Audio("sounds/Aero/Windows Error.wav");
            soundScheme.modal = new Audio("sounds/Aero/Windows Ding.wav");
            break;
        case '7':
            soundScheme.startup = new Audio("sounds/Aero/startup.wav");
            soundScheme.question = new Audio("sounds/Aero/Windows Exclamation.wav");
            soundScheme.error = new Audio("sounds/Aero/Windows Critical Stop.wav");
            soundScheme.warning = new Audio("sounds/Aero/Windows Exclamation.wav");
            soundScheme.info = new Audio("sounds/Aero/Windows Error.wav");
            soundScheme.modal = new Audio("sounds/Aero/Windows Ding.wav");
            break;
        case '8':
            soundScheme.startup = new Audio("sounds/Aero/startup.wav");
			// idk why but WE uploader somehow hates these specific files so I converted these to flac
            soundScheme.question = new Audio("sounds/8/Windows Background.flac");
            soundScheme.error = new Audio("sounds/8/Windows Foreground.flac");
            soundScheme.warning = new Audio("sounds/8/Windows Background.flac");
            soundScheme.info = new Audio("sounds/8/Windows Background.flac");
            soundScheme.modal = new Audio("sounds/8/Windows Background.flac");
            break;
        case '10':
            soundScheme.startup = new Audio("sounds/Aero/startup.wav");
            soundScheme.question = new Audio("sounds/10/Windows Background.wav");
            soundScheme.error = new Audio("sounds/10/Windows Foreground.wav");
            soundScheme.warning = new Audio("sounds/10/Windows Background.wav");
            soundScheme.info = new Audio("sounds/10/Windows Background.wav");
            soundScheme.modal = new Audio("sounds/10/Windows Background.wav");
            break;
        case '11':
            soundScheme.startup = new Audio("sounds/11/startup.wav");
            soundScheme.question = new Audio("sounds/11/Windows Background.wav");
            soundScheme.error = new Audio("sounds/11/Windows Foreground.wav");
            soundScheme.warning = new Audio("sounds/11/Windows Background.wav");
            soundScheme.info = new Audio("sounds/11/Windows Background.wav");
            soundScheme.modal = new Audio("sounds/11/Windows Background.wav");
            break;
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

// https://stackoverflow.com/a/44134328
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Convert rgb, rgba, hsl, 3/4/8 digit hex to 6 digit hex
function normalizeColor(color) {
    color = color.trim(color).replace("#", "");
    if (color === "silver") {
        color = "#c0c0c0";
    } else if (color === "navy") {
        color = "#000080";
    } else if (color.startsWith("hsl")) {
        color = hslToHex(...color.substring(4, color.length - 1).split(",").map(function(c) {
            return parseFloat(c);
        }));
    } else if (color.startsWith("rgb")) {
        color = rgbToHex(color);
    } else if (color.length === 6 || color.length === 8) {
        color = "#" + color.slice(0, 6);
    } else if (color.length === 3 || color.length === 4) {
        color = "#" + color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    } else {
        // css color names other than those in minified 98.css are not supported yet
        throw new Error("Invalid color");
    }
    log(color);
    return color;
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
    log(hex);
    if (!hex.includes('#') || hex.length !== 7) {
        hex = normalizeColor(hex);
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
    const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
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
function createNewDeskItem(numStr, openDoc, temp, width, height, style, centered, top, left, aot, unresizable) {
    const newContainer = windowContainers[0].cloneNode(true);
    document.body.appendChild(newContainer);
    windowContainers = document.getElementsByClassName("windowContainer");
    const deskMover = new DeskMover(newContainer, numStr, openDoc, temp, width, height, style, false, centered, top, left, aot, unresizable);
    deskMovers[numStr] = deskMover;
    return deskMover;
}

// Create a new AD item, initialize, and increase the saved window count
function openWindow(openDoc, temp, width, height, style, centered, top, left, aot, unresizable) {
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
        deskMover = createNewDeskItem(localStorage.madesktopItemCount, openDoc, temp, width, height, style || "wnd", centered, top, left, aot, unresizable);
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
        if (!deskMovers[num].config.title) {
            deskMovers[num].windowTitleText.textContent = mutations[0].target.innerText;
        }
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
    if (!deskMovers[num]) {
        return;
    }
    num = parseInt(num);

    delete deskMovers[num].windowContainer.dataset.inactive;
    deskMovers[num].windowTitlebar.classList.remove("inactive");

    if (num !== activeWindow) {
        prevActiveWindow = activeWindow;
        activeWindow = num;
    }

    if (!localStorage.madesktopNoDeactivate && deskMovers[num]) {
        deskMovers[num].config.active = true;
    }

    for (const i in deskMovers) {
        if (parseInt(i) !== num) {
            if (localStorage.madesktopNoDeactivate) {
                delete deskMovers[i].windowContainer.dataset.inactive;
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
    log({x, y});
    const extraTitleHeight = parseInt(getComputedStyle(windowContainers[0]).getPropertyValue('--extra-title-height'));
    const extraBorderSize = parseInt(getComputedStyle(windowContainers[0]).getPropertyValue('--extra-border-size'));
    x = parseInt(x);
    y = parseInt(y);
    if (isWindowInPosition(x, y)) {
        return cascadeWindow(x + 4 + extraBorderSize, y + 24 + extraTitleHeight + extraBorderSize);
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

function adjustAllElements(extraTitleHeight, extraBorderSize, extraBorderBottom) {
    log({extraTitleHeight, extraBorderSize, extraBorderBottom});
    for (const i in deskMovers) {
        deskMovers[i].adjustElements(extraTitleHeight, extraBorderSize, extraBorderBottom);
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
    playSound(icon);

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
    playSound("question");

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
    playSound("modal");
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
        soundScheme[sound].currentTime = 0;
        soundScheme[sound].play();
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
        .windowMenuBg { height: 85px; }`;
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
        playSound("startup");

        if (!localStorage.madesktopHideWelcome) {
            setTimeout(function () {
                openWindow("apps/welcome/index.html", true, "476px", "322px", "wnd", true, undefined, undefined, false, true);
            }, 5000);
        }
    } else {
        if (!localStorage.madesktopHideWelcome) {
            openWindow("apps/welcome/index.html", true, "476px", "322px", "wnd", true, undefined, undefined, false, true);
        }
    }
    startupRan = true;
}

document.getElementById("location").textContent = location.href;
if (runningMode === WE) {
    runningModeLabel.textContent = "Wallpaper Engine";
    // Dummy listener to make Wallpaper Engine recognize MAD supporting audio visualization
    window.wallpaperRegisterAudioListener(() => {});
} else {
    startup();
    if (location.href.startsWith("file:///") && runningMode === BROWSER) {
        madAlert("You are running ModernActiveDesktop as a local file. Please use a web server to host it for full functionality.", null, "warning");
    }
}
origRunningMode = runningMode;

window.addEventListener('load', function () {
    try {
        document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
    } catch {
        document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
    }

    document.dispatchEvent(new Event("mouseup")); // Re-calculate title bar height after loading scheme css
});

// Initialization complete
errorWnd.style.display = "none";