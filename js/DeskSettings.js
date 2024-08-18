// DeskSettings.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// This is the main MAD JavaScript file

// #region Constants and variables
let windowContainers = document.getElementsByClassName("windowContainer");
const windowOutline = document.getElementById("windowOutline");
const bgHtmlContainer = document.getElementById("bgHtmlContainer");
const bgHtmlView = document.getElementById("bgHtmlView");
const bgVideoView = document.getElementById("bgVideo");
const schemeElement = document.getElementById("scheme");
const menuStyleElement = document.getElementById("menuStyle");
const styleElement = document.getElementById("style");
const msgboxBg = document.getElementById("msgboxBg");
const msgbox = document.getElementById("msgbox");
const msgboxTitlebar = msgbox.getElementsByClassName("title-bar")[0];
const msgboxMessage = document.getElementById("msgbox-msg");
const msgboxIcon = document.getElementById("msgbox-icon");
window.msgboxInput = document.getElementById("msgbox-input");
const msgboxCloseBtn = document.getElementById("msgbox-close");
const msgboxBtn1 = document.getElementById("msgbox-btn1");
const msgboxBtn2 = document.getElementById("msgbox-btn2");
const osk = document.getElementById("osk");
const oskTitlebar = osk.getElementsByClassName("title-bar")[0];
const oskWindow = document.getElementById("oskWindow");
const miniPickerBase = document.getElementsByClassName("miniPicker")[0];
const errorWnd = document.getElementById("errorWnd");
const mainMenuBg = document.getElementById("mainMenuBg");
const mainMenu = document.getElementById("mainMenu");
const mainMenuItems = mainMenu.getElementsByClassName("contextMenuItem");
const runningModeLabel = document.getElementById("runmode");
const simulatedModeLabel = document.getElementById("simmode");
const kbdSupportLabel = document.getElementById("kbdsupport");
const debugMenu = document.getElementById("debug");
const jsRunBtn = document.getElementById("jsRunBtn");
const debugLogBtn = document.getElementById("debugLogBtn");

const soundScheme = {};

const isWin10 = navigator.userAgent.includes('Windows NT 10.0');

let lastZIndex = parseInt(localStorage.madesktopItemCount) || 0;
let lastAoTZIndex = lastZIndex + 50000;
let isContextMenuOpen = false;
let openedMenu = null;
let openedMenuCloseFunc = null;
let startupRan = false;
let flashInterval;

let activeWindow = 0;
const activeWindowHistory = [0];

const WE = 1; // Wallpaper Engine
const LW = 2; // Lively Wallpaper
const BROWSER = 0; // None of the above
window.runningMode = BROWSER;
let origRunningMode = BROWSER;
window.kbdSupport = 1; // 1 = Keyboard supported, 0 = Keyboard supported with prompt(), -1 = Keyboard not supported

window.scaleFactor = "1";
window.vWidth = window.innerWidth;
window.vHeight = window.innerHeight;

window.deskMovers = {};
window.visDeskMover = null;
window.confDeskMover = null;

let msgboxLoopDetector = null;
let msgboxLoopCount = 0;

let debugLog = false;
// #endregion

// #region Initialization
if (parent !== window) {
    // Running MAD inside MAD will cause unexpected behavior
    throw new Error("Refusing to load inside an iframe");
}

// Load configs
if (!localStorage.madesktopItemCount) {
    localStorage.madesktopItemCount = 1;
    localStorage.madesktopOpenWindows = "0";
}

if (!isWin10) {
    delete localStorage.sysplugIntegration;
}

if (localStorage.madesktopBgColor) {
    document.documentElement.style.backgroundColor = localStorage.madesktopBgColor;
}
if (localStorage.madesktopBgPattern) {
    document.documentElement.style.backgroundImage = `url('${genPatternImage(base64ToPattern(localStorage.madesktopBgPattern))}')`;
}
changeBgType(localStorage.madesktopBgType || "image");
changeBgImgMode(localStorage.madesktopBgImgMode || "center");
if (localStorage.madesktopBgVideoMuted) bgVideoView.muted = true;
changeColorScheme(localStorage.madesktopColorScheme || "98");
changeAeroColor(localStorage.madesktopAeroColor);
changeAeroGlass(localStorage.madesktopAeroNoGlass);
changeWinAnim(localStorage.madesktopNoWinAnim);
changeScale(localStorage.madesktopScaleFactor);
if (localStorage.madesktopDebugMode) activateDebugMode();
if (localStorage.madesktopDebugLog) toggleDebugLog();
changeFont(localStorage.madesktopNoPixelFonts);
changeCmAnimation(localStorage.madesktopCmAnimation || "slide");
changeCmShadow(localStorage.madesktopCmShadow);
changeWinShadow(localStorage.madesktopNoWinShadow);
changeMenuStyle(localStorage.madesktopMenuStyle);
changeSoundScheme(localStorage.madesktopSoundScheme || "98");

deskMovers[0] = new DeskMover(windowContainers[0], "");
initSimpleMover(msgbox, msgboxTitlebar, [msgboxCloseBtn]);
initSimpleMover(osk, oskTitlebar, []);
if (localStorage.madesktopChanViewTopMargin || localStorage.madesktopChanViewRightMargin) {
    debugMenu.style.top = localStorage.madesktopChanViewTopMargin || "0";
    debugMenu.style.right = localStorage.madesktopChanViewRightMargin || "0";
}
initSimpleMover(debugMenu, debugMenu, debugMenu.querySelectorAll("a"));

if (typeof wallpaperOnVideoEnded === "function") { // Check if running in Wallpaper Engine
    runningMode = WE;
    if (parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) >= 100) {
        kbdSupport = -1;
        window.alert = window.confirm = window.prompt = () => {};
    } else {
        kbdSupport = 0;
    }
} else if (location.href.startsWith("localfolder://")) { // Check if running in Lively Wallpaper
    runningMode = LW;
}
kbdSupportLabel.textContent = kbdSupport;

// Migrate old configs
if (localStorage.madesktopNonADStyle) {
    for (let i = 0; i < localStorage.madesktopItemCount; i++) localStorage.setItem("madesktopItemStyle" + (i || ""), "nonad");
    delete localStorage.madesktopNonADStyle;
    location.reload();
    throw new Error("Refreshing...");
}
// Convert destryoedItems to openWindows
// Only save open windows instead of all destroyed windows
if (localStorage.madesktopDestroyedItems) {
    let openWindows = [0];
    for (let i = 1; i < localStorage.madesktopItemCount; i++) {
        if (!localStorage.madesktopDestroyedItems.includes(`|${i}|`)) {
            openWindows.push(i);
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
    delete localStorage.madesktopDestroyedItems;
} else if (!localStorage.madesktopOpenWindows) {
    let openWindows = [0];
    for (let i = 1; i < localStorage.madesktopItemCount; i++) {
        openWindows.push(i);
    }
    localStorage.madesktopOpenWindows = openWindows;
}
delete localStorage.madesktopLastCustomScale;
delete localStorage.madesktopPrevOWConfigRequest;
if (localStorage.madesktopBgImg) {
    if (localStorage.madesktopBgImg.startsWith("wallpapers/") && localStorage.madesktopBgImg.endsWith(".bmp")) {
        localStorage.madesktopBgImg = localStorage.madesktopBgImg.replace(".bmp", ".png");
        loadBgImgConf();
    }
}
// Mistake that I made in previous versions
if (localStorage.madesktopCustomColor) {
    if (localStorage.madesktopCustomColor.includes("--menu-highlight")) {
        localStorage.madesktopCustomColor = localStorage.madesktopCustomColor.replace("--menu-highlight", "--menu-hilight");
        changeColorScheme("custom");
    }
}

if (localStorage.madesktopItemCount > 1) {
    // Check if the deskitem we're trying to initialize is open or not
    // Skip for deskitem 0 (the ChannelBar) - this design is to maintain backwards compatibility with old versions
    // which supported only one deskitem
    for (const i of localStorage.madesktopOpenWindows.split(',').slice(1)) {
        createNewDeskItem(i.toString());
    }
}

if (localStorage.madesktopLastVer) {
    if (!localStorage.madesktopLastVer.startsWith("3.3")) { // Update from 3.1 and below
        delete localStorage.madesktopHideWelcome;
        delete localStorage.madesktopCheckedChanges;
        delete localStorage.madesktopCheckedConfigs;
        openWindow("placeholder.html");

        if (localStorage.madesktopColorScheme === "xpcss4mad" && localStorage.madesktopLastVer.startsWith("3.0")) {
            // 3.0 didn't have the menu style option but the XP theme had a hardcoded menu style
            localStorage.madesktopMenuStyle = "mbcm";
            changeMenuStyle(localStorage.madesktopMenuStyle);
        }
        startup();
    }

    if (localStorage.madesktopLastVer !== "3.3.0" && localStorage.sysplugIntegration) { // Update from 3.2.1 and below
        madAlert("locid:MAD_MSG_SYSPLUG_UPDATED", function () {
            openWindow("SysplugSetupGuide.md", true);
        });
        delete localStorage.sysplugIntegration;
    }
} else { // First run
    openWindow("placeholder.html");
    startup();

    if (runningMode === BROWSER) {
        localStorage.madesktopChanViewLeftMargin = "0";
        localStorage.madesktopChanViewBottomMargin = "0";
    }
}
localStorage.madesktopLastVer = "3.3.0";

if (localStorage.madesktopItemVisible === "false") {
    windowContainers[0].style.display = "none";
}
// #endregion

// #region Event listeners
// Change the scale on load
bgHtmlView.addEventListener('load', function () {
    this.contentDocument.body.style.zoom = scaleFactor;
    hookIframeSize(bgHtmlView);
    bgHtmlView.contentDocument.addEventListener("contextmenu", openMainMenu, false);
});
oskWindow.addEventListener('load', function () {
    this.contentDocument.body.style.zoom = scaleFactor;
    hookIframeSize(oskWindow);
});

// #region Main context menu things (only for browser use)
window.addEventListener('contextmenu', openMainMenu, false);

for (const elem of mainMenuItems) {
    elem.onmouseover = () => {
        for (const item of mainMenuItems) {
            delete item.dataset.active;
        }
        elem.dataset.active = true;
    }
    elem.onmouseleave = () => {
        delete elem.dataset.active;
    }
}

mainMenuBg.addEventListener('focusout', closeMainMenu);

mainMenuBg.addEventListener('animationend', function () {
    this.style.pointerEvents = "";
});

mainMenuItems[0].addEventListener('click', () => { // New button
    closeMainMenu();
    openWindow();
});

mainMenuItems[1].addEventListener('click', () => { // Properties button
    closeMainMenu();
    openConfig();
});

function openMainMenu (event) {
    if (isContextMenuOpen) return;
    mainMenuBg.style.pointerEvents = "none";
    mainMenuBg.style.left = event.clientX / window.scaleFactor + "px";
    mainMenuBg.style.top = event.clientY / window.scaleFactor + "px";
    mainMenuBg.style.display = "block";
    const width0 = getTextWidth(mainMenuItems[0].textContent);
    const width1 = getTextWidth(mainMenuItems[1].textContent);
    const width = Math.max(width0, width1);
    mainMenuBg.style.width = `calc(${width}px + 4em)`;
    mainMenu.style.width = `calc(${width}px + 4em - 2px)`;
    mainMenuBg.style.height = mainMenuItems[0].offsetHeight * 2 + "px";

    iframeClickEventCtrl(false);
    isContextMenuOpen = true;
    event.preventDefault();
    mainMenuBg.focus();
    openedMenu = mainMenuBg;
    document.addEventListener("keydown", menuNavigationHandler);
}

function closeMainMenu() {
    mainMenuBg.style.display = "none";
    isContextMenuOpen = false;
    openedMenu = null;
    document.removeEventListener("keydown", menuNavigationHandler);
}
// #endregion

msgboxBg.addEventListener('click', flashDialog);

msgbox.addEventListener('click', preventDefault);
osk.addEventListener('click', preventDefault);

window.addEventListener('resize', function () {
    changeScale(scaleFactor);
});

// Detect WPE config change
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        log(properties);

        let isStartup = false;
        if (properties.schemecolor) {
            // Proper startup detection for Wallpaper Engine
            startup();

            // Only apply limited values on startup
            isStartup = true;
        }

        if (properties.bgcolor && !isStartup && localStorage.madesktopBgWeColor !== properties.bgcolor.value) {
            changeBgColor(parseWallEngColorProp(properties.bgcolor.value));
            localStorage.madesktopBgWeColor = properties.bgcolor.value;
        }
        if (properties.bgimg) {
            if (properties.bgimg.value) {
                const path = "file:///" + properties.bgimg.value;
                document.body.style.backgroundImage = "url('" + path + "')";
                localStorage.madesktopBgWeImg = path;
                if (!isStartup) {
                    changeBgType("image");
                    localStorage.madesktopBgImg = path;
                    localStorage.madesktopBgType = "image";
                }
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
                const path = "file:///" + properties.bgvideo.value;
                localStorage.madesktopBgVideo = path;
                if (!isStartup) {
                    changeBgType("video");
                    bgVideoView.src = path;
                    document.body.style.backgroundImage = "none";
                    delete localStorage.madesktopBgImg;
                    localStorage.madesktopBgType = "video";
                }
            } else {
                if (localStorage.madesktopBgType === "video") {
                    changeBgType("image");
                    localStorage.madesktopBgType = "image";
                }
                bgVideoView.src = "";
                delete localStorage.madesktopBgVideo;
            }
        }
        if (properties.additem && !isStartup) {
            openWindow();
        }
        if (properties.openproperties && !isStartup) {
            openConfig();
        }
        if (properties.audioprocessing) {
            if (properties.audioprocessing.value) {
                delete localStorage.madesktopVisUnavailable;
                if (!visDeskMover && !isStartup) {
                    openWindow("apps/visualizer/index.html", false, {
                        width: "480px",
                        height: "380px",
                        top: "200px",
                        left: "500px"
                    });
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
    wallpaperPropertyListener.applyUserProperties({ [name]: { value: val } });
}

function livelyAudioListener(audioArray) {}

function livelyCurrentTrack(data) {
    if (window.visDeskMover) {
        const visWindow = window.visDeskMover.windowElement.contentWindow;
        const obj = JSON.parse(data);
        //when no track is playing its null
        if (obj !== null) {
            visWindow.wallpaperMediaPropertiesListener({
                title: obj["Title"],
                subTitle: obj["Subtitle"],
                artist: obj["Artist"],
                albumTitle: obj["AlbumTitle"],
                albumArtist: obj["AlbumArtist"],
                genres: obj["Genres"].join(",")
            });
            visWindow.wallpaperMediaThumbnailListener({
                thumbnail: "data:image/png;base64," + obj["Thumbnail"] ?? ""
            });
        } else {
            visWindow.wallpaperMediaPropertiesListener({
                title: null
            });
            visWindow.wallpaperMediaThumbnailListener({
                thumbnail: "data:image/png;base64,"
            });
        }
    }
}
// #endregion

// #region Functions
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
            if (localStorage.madesktopBgHtmlSrc) {
                bgHtmlView.src = localStorage.madesktopBgHtmlSrc;
            }
            break;
    }
}

function changeBgColor(str) {
    log(str);
    document.documentElement.style.backgroundColor = str;
    localStorage.madesktopBgColor = str;
}

function loadBgImgConf() {
    if (localStorage.madesktopBgImg) {
        if (localStorage.madesktopBgImg.startsWith("file:///") || // Set in WPE
            localStorage.madesktopBgImg.startsWith("wallpapers/")) // Built-in wallpapers set in madconf
        {
            document.body.style.backgroundImage = "url('" + localStorage.madesktopBgImg + "')";
        } else { // Custom image set in madconf
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
}

// Generate pattern image from pattern
/* pattern: [
    [first row],
    [second row],
    ...
    [eighth row],
    1: black, 0: transparent
] */
function genPatternImage(pattern, colorRetrievingTarget = document.documentElement) {
    const canvas = genPatternImage.canvas || (genPatternImage.canvas = document.createElement("canvas"));
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    const patternColor = getComputedStyle(colorRetrievingTarget).getPropertyValue('--window-text');
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            ctx.fillStyle = pattern[i][j] ? patternColor : "transparent";
            ctx.fillRect(j, i, 1, 1);
        }
    }
    return canvas.toDataURL();
}

// Convert pattern to base64 (direct pattern binary to base64 conversion)
function patternToBase64(pattern) {
    if (pattern.length !== 8) {
        throw new Error("Pattern must be 8x8");
    }
    const hex = new Uint8Array(8);
    let i = 0;
    for (const row of pattern) {
        for (let j = 0; j < 8; j++) {
            hex[i] = hex[i] | (row[j] << (7 - j));
        }
        i++;
    }
    return btoa(String.fromCharCode(...hex)).replaceAll("=", "");
}

// Convert base64 to pattern
function base64ToPattern(base64) {
    try {
        const hex = atob(base64);
        const pattern = [];
        for (let i = 0; i < 8; i++) {
            pattern.push([]);
            for (let j = 0; j < 8; j++) {
                pattern[i].push((hex.charCodeAt(i) >> (7 - j)) & 1);
            }
        }
        return pattern;
    } catch (error) {
        // Don't let trivial stuff break the whole thing
        console.error(error);
        return base64ToPattern("AAAAAAAAAAA");
    }
}

function announce(type) {
    try {
        bgHtmlView.contentWindow.postMessage({ type }, "*");
        oskWindow.contentWindow.postMessage({ type }, "*");
    } catch {
        // page did not load yet
    }
    for (let i = 0; i < windowContainers.length; i++) {
        try {
            const iframe = windowContainers[i].getElementsByClassName("windowElement")[0];
            iframe.contentWindow.postMessage({ type }, "*");
        } catch {
            // page did not load yet
        }
    }
}

function changeColorScheme(scheme) {
    if (scheme === "98") {
        schemeElement.href = "data:text/css,";
        delete localStorage.madesktopCustomColor;
        delete localStorage.madesktopSysColorCache;
        processTheme();
    } else if (scheme === "custom") {
        schemeElement.href = localStorage.madesktopCustomColor;
        delete localStorage.madesktopSysColorCache;
        processTheme();
    } else if (scheme.split('\n').length > 1) {
        const dataURL = `data:text/css,${encodeURIComponent(scheme)}`;
        schemeElement.href = dataURL;
        localStorage.madesktopCustomColor = dataURL;
        delete localStorage.madesktopSysColorCache;
        processTheme();
    } else if (scheme === "sys") {
        if (localStorage.madesktopSysColorCache) {
            schemeElement.href = localStorage.madesktopSysColorCache;
            processTheme();
        }

        madSysPlug.getSystemScheme()
            .then(responseText => {
                const dataURL = `data:text/css,${encodeURIComponent(responseText)}`;
                schemeElement.href = dataURL;
                localStorage.madesktopSysColorCache = dataURL; // Cache it as SysPlug startup is slower than high priority WPE startup
                processTheme();
            })
            .catch(error => {
                // Ignore it as SysPlug startup is slower than high priority WPE startup
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
}

function changeAeroColor(color) {
    if (localStorage.madesktopColorScheme === "7css4mad") {
        document.documentElement.style.setProperty('--title-accent', color || '#4580c4');
    }
}

function changeAeroGlass(noGlass) {
    if (localStorage.madesktopColorScheme === "7css4mad") {
        if (noGlass) {
            document.body.dataset.noGlass = true;
        } else {
            delete document.body.dataset.noGlass;
        }
    } else {
        delete document.body.dataset.noGlass;
    }
}

function changeWinAnim(noAnim) {
    if (localStorage.madesktopColorScheme === "7css4mad") {
        if (noAnim) {
            document.body.dataset.noAnim = true;
        } else {
            delete document.body.dataset.noAnim;
        }
    } else {
        delete document.body.dataset.noAnim;
    }
}

// Change the scaling factor
function changeScale(scale) {
    scaleFactor = scale || 1;
    vWidth = window.innerWidth / scaleFactor;
    vHeight = window.innerHeight / scaleFactor;
    document.body.style.zoom = scaleFactor;
    updateIframeScale();
    document.dispatchEvent(new Event("pointerup")); // Move all deskitems inside the visible area
    log({scaleFactor, vWidth, vHeight, dpi: 96 * scaleFactor});
}

// Toggle between "Pixelated MS Sans Serif" and just sans-serif
function changeFont(isPixel) {
    if (isPixel) {
        document.documentElement.style.setProperty('--ui-font', 'sans-serif');
    } else {
        document.documentElement.style.removeProperty('--ui-font');
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
            mainMenuBg.style.animation = "cmDropdownright 0.25s linear";
    }
    for (const i in deskMovers) {
        deskMovers[i].changeCmAnimation(type);
    }
}

// Change context menu shadow
function changeCmShadow(isShadow) {
    if (isShadow) {
        document.body.dataset.cmShadow = true;
    } else {
        delete document.body.dataset.cmShadow;
    }
}

// Change window shadow
function changeWinShadow(isNoShadow) {
    if (isNoShadow) {
        document.body.dataset.noWinShadow = true;
    } else {
        delete document.body.dataset.noWinShadow;
    }
}

// Change menu style
function changeMenuStyle(style) {
    if (!style) {
        menuStyleElement.href = "";
    } else {
        menuStyleElement.href = `css/flatmenu-${style}.css`;
    }
}

// Change underline style
function changeUnderline(show) {
    if (show) {
        delete document.body.dataset.noUnderline;
    } else {
        document.body.dataset.noUnderline = true;
    }
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
            soundScheme.navStart = new Audio("sounds/start.wav");
            break;
        case '95':
            soundScheme.startup = new Audio("sounds/95/The Microsoft Sound.wav");
            soundScheme.question = new Audio("sounds/95/chord.wav");
            soundScheme.error = new Audio("sounds/95/chord.wav");
            soundScheme.warning = new Audio("sounds/95/chord.wav");
            soundScheme.info = new Audio("sounds/95/ding.wav");
            soundScheme.modal = new Audio("sounds/95/ding.wav");
            soundScheme.navStart = new Audio("sounds/start.wav");
            break;
        case 'nt4':
            soundScheme.startup = new Audio("sounds/NT4/Windows NT Logon Sound.wav");
            soundScheme.question = new Audio("sounds/95/chord.wav");
            soundScheme.error = new Audio("sounds/95/chord.wav");
            soundScheme.warning = new Audio("sounds/95/chord.wav");
            soundScheme.info = new Audio("sounds/95/ding.wav");
            soundScheme.modal = new Audio("sounds/95/ding.wav");
            soundScheme.navStart = new Audio("sounds/start.wav");
            break;
        case '98':
            soundScheme.startup = new Audio("sounds/The Microsoft Sound.wav");
            soundScheme.question = new Audio("sounds/chord.wav");
            soundScheme.error = new Audio("sounds/chord.wav");
            soundScheme.warning = new Audio("sounds/chord.wav");
            soundScheme.info = new Audio("sounds/ding.wav");
            soundScheme.modal = new Audio("sounds/ding.wav");
            soundScheme.navStart = new Audio("sounds/start.wav");
            break;
        case '2k':
            soundScheme.startup = new Audio("sounds/2000/Windows Logon Sound.wav");
            soundScheme.question = new Audio("sounds/chord.wav");
            soundScheme.error = new Audio("sounds/chord.wav");
            soundScheme.warning = new Audio("sounds/chord.wav");
            soundScheme.info = new Audio("sounds/ding.wav");
            soundScheme.modal = new Audio("sounds/ding.wav");
            soundScheme.navStart = new Audio("sounds/start.wav");
            break;
        case 'xp':
            soundScheme.startup = new Audio("sounds/XP/Windows XP Startup.wav");
            soundScheme.question = new Audio("sounds/XP/Windows XP Exclamation.wav");
            soundScheme.error = new Audio("sounds/XP/Windows XP Critical Stop.wav");
            soundScheme.warning = new Audio("sounds/XP/Windows XP Exclamation.wav");
            soundScheme.info = new Audio("sounds/XP/Windows XP Error.wav");
            soundScheme.modal = new Audio("sounds/XP/Windows XP Ding.wav");
            soundScheme.navStart = new Audio("sounds/XP/Windows XP Start.wav");
            break;
        case 'vista':
            soundScheme.startup = new Audio("sounds/Aero/Windows Logon Sound.wav"); // enable real startup sound :D
            soundScheme.question = new Audio("sounds/Aero/Windows Exclamation.wav");
            soundScheme.error = new Audio("sounds/Aero/Windows Critical Stop.wav");
            soundScheme.warning = new Audio("sounds/Aero/Windows Exclamation.wav");
            soundScheme.info = new Audio("sounds/Aero/Windows Error.wav");
            soundScheme.modal = new Audio("sounds/Aero/Windows Ding.wav");
            soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
            break;
        case '7':
            soundScheme.startup = new Audio("sounds/Aero/startup.wav");
            soundScheme.question = new Audio("sounds/Aero/Windows Exclamation.wav");
            soundScheme.error = new Audio("sounds/Aero/Windows Critical Stop.wav");
            soundScheme.warning = new Audio("sounds/Aero/Windows Exclamation.wav");
            soundScheme.info = new Audio("sounds/Aero/Windows Error.wav");
            soundScheme.modal = new Audio("sounds/Aero/Windows Ding.wav");
            soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
            break;
        case '8':
            soundScheme.startup = new Audio("sounds/Aero/startup.wav");
            // idk why but WPE uploader somehow hates these specific files so I converted these to flac
            soundScheme.question = new Audio("sounds/8/Windows Background.flac");
            soundScheme.error = new Audio("sounds/8/Windows Foreground.flac");
            soundScheme.warning = new Audio("sounds/8/Windows Background.flac");
            soundScheme.info = new Audio("sounds/8/Windows Background.flac");
            soundScheme.modal = new Audio("sounds/8/Windows Background.flac");
            soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
            break;
        case '10':
            soundScheme.startup = new Audio("sounds/Aero/startup.wav");
            soundScheme.question = new Audio("sounds/10/Windows Background.wav");
            soundScheme.error = new Audio("sounds/10/Windows Foreground.wav");
            soundScheme.warning = new Audio("sounds/10/Windows Background.wav");
            soundScheme.info = new Audio("sounds/10/Windows Background.wav");
            soundScheme.modal = new Audio("sounds/10/Windows Background.wav");
            soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
            break;
        case '11':
            soundScheme.startup = new Audio("sounds/11/startup.wav");
            soundScheme.question = new Audio("sounds/11/Windows Background.wav");
            soundScheme.error = new Audio("sounds/11/Windows Foreground.wav");
            soundScheme.warning = new Audio("sounds/11/Windows Background.wav");
            soundScheme.info = new Audio("sounds/11/Windows Background.wav");
            soundScheme.modal = new Audio("sounds/11/Windows Background.wav");
            soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
            break;
    }
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

// http://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
function isDarkColor(color) {
    if (!color.startsWith("#") || color.length !== 7) {
        color = parent.normalizeColor(color);
    }

    const c = color.substring(2);  // strip " #"
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >>  8) & 0xff;  // extract green
    const b = (rgb >>  0) & 0xff;  // extract blue

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    if (luma < 50) {
        return true;
    }
    return false;
}

function processTheme() {
    styleElement.textContent = generateThemeSvgs();
    if (localStorage.madesktopBgPattern) {
        document.documentElement.style.backgroundImage = `url('${genPatternImage(base64ToPattern(localStorage.madesktopBgPattern))}')`;
    }
}

function generateThemeSvgs(targetElement = document.documentElement) {
    const buttonFace = getComputedStyle(targetElement).getPropertyValue('--button-face');
    const buttonDkShadow = getComputedStyle(targetElement).getPropertyValue('--button-dk-shadow');
    const buttonHilight = getComputedStyle(targetElement).getPropertyValue('--button-hilight');
    const buttonLight = getComputedStyle(targetElement).getPropertyValue('--button-light');
    const buttonShadow = getComputedStyle(targetElement).getPropertyValue('--button-shadow');
    const buttonText = getComputedStyle(targetElement).getPropertyValue('--button-text');
    const windowColor = getComputedStyle(targetElement).getPropertyValue('--window');

    const scrollUp = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 6H7V7H6V8H5V9H4V10H11V9H10V8H9V7H8V6Z" fill="${buttonText}"/></svg>`;
    const scrollDown = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 6H4V7H5V8H6V9H7V10H8V9H9V8H10V7H11V6Z" fill="${buttonText}"/></svg>`;
    const scrollLeft = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6 4H8V5H7V6H6V7H5V8H6V9H7V10H8V11H9V4Z" fill="${buttonText}"/></svg>`;
    const scrollRight = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10 4H6V11H7V10H8V9H9V8H10V7H9V6H8V5H7V4Z" fill="${buttonText}"/></svg>`;
    const scrollTrack = `<svg width="2" height="2" viewBox="0 0 2 2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H0V1H1V2H2V1H1V0Z" fill="${buttonFace}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M2 0H1V1H0V2H1V1H2V0Z" fill="${buttonHilight}"/></svg>`;
    const radioBorder = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 0H4V1H2V2H1V4H0V8H1V10H2V8H1V4H2V2H4V1H8V2H10V1H8V0Z" fill="${buttonShadow}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1H4V2H2V3V4H1V8H2V9H3V8H2V4H3V3H4V2H8V3H10V2H8V1Z" fill="${buttonDkShadow}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9 3H10V4H9V3ZM10 8V4H11V8H10ZM8 10V9H9V8H10V9V10H8ZM4 10V11H8V10H4ZM4 10V9H2V10H4Z" fill="${buttonLight}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 2H10V4H11V8H10V10H8V11H4V10H2V11H4V12H8V11H10V10H11V8H12V4H11V2Z" fill="${buttonHilight}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4 2H8V3H9V4H10V8H9V9H8V10H4V9H3V8H2V4H3V3H4V2Z" fill="${windowColor}"/></svg>`;
    const radioBorderDisabled = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 0H4V1H2V2H1V4H0V8H1V10H2V8H1V4H2V2H4V1H8V2H10V1H8V0Z" fill="${buttonShadow}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1H4V2H2V3V4H1V8H2V9H3V8H2V4H3V3H4V2H8V3H10V2H8V1Z" fill="${buttonDkShadow}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9 3H10V4H9V3ZM10 8V4H11V8H10ZM8 10V9H9V8H10V9V10H8ZM4 10V11H8V10H4ZM4 10V9H2V10H4Z" fill="${buttonLight}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 2H10V4H11V8H10V10H8V11H4V10H2V11H4V12H8V11H10V10H11V8H12V4H11V2Z" fill="${buttonHilight}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4 2H8V3H9V4H10V8H9V9H8V10H4V9H3V8H2V4H3V3H4V2Z" fill="${buttonFace}"/></svg>`;
    const radioDot = `<svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3 0H1V1H0V2V3H1V4H3V3H4V2V1H3V0Z" fill="${buttonText}"/></svg>`;
    const radioDotDisabled = `<svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3 0H1V1H0V2V3H1V4H3V3H4V2V1H3V0Z" fill="${buttonShadow}"/></svg>`;
    const checkmark = `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V5H1V6H2V7H3V6H4V5H5V4H6V3H7V0Z" fill="${buttonText}"/></svg>`;
    const checkmarkDisabled = `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V5H1V6H2V7H3V6H4V5H5V4H6V3H7V0Z" fill="${buttonShadow}"/></svg>`;
    const indicatorThumb = `<svg width="11" height="21" viewBox="0 0 11 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0V16H2V18H4V20H5V19H3V17H1V1H10V0Z" fill="${buttonHilight}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 1V16H2V17H3V18H4V19H6V18H7V17H8V16H9V1Z" fill="${buttonFace}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9 1H10V16H8V18H6V20H5V19H7V17H9Z" fill="${buttonShadow}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10 0H11V16H9V18H7V20H5V21H6V19H8V17H10Z" fill="${buttonDkShadow}"/></svg>`;
    const seekHandle = `<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 13 15" width="13" height="15">
        <rect fill="${buttonHilight}" x="0" y="0" width="11" height="1"/>
        <rect fill="${buttonHilight}" x="0" y="1" width="1" height="12"/>
        <rect fill="${buttonFace}" x="1" y="1" width="10" height="2"/>
        <rect fill="${buttonFace}" x="1" y="3" width="1" height="8"/>
        <rect fill="${buttonFace}" x="1" y="11" width="10" height="2"/>
        <rect fill="${buttonFace}" x="1" y="3" width="1" height="8"/>
        <rect fill="${buttonFace}" x="10" y="3" width="1" height="8"/>
        <rect fill="${buttonShadow}" x="2" y="3" width="8" height="1"/>
        <rect fill="${buttonShadow}" x="2" y="4" width="1" height="7"/>
        <rect fill="${buttonHilight}" x="3" y="4" width="7" height="1"/>
        <rect fill="${buttonDkShadow}" x="6" y="4" width="1" height="1"/>
        <rect fill="${buttonHilight}" x="3" y="10" width="7" height="1"/>
        <rect fill="${buttonDkShadow}" x="6" y="10" width="1" height="1"/>
        <rect fill="${buttonFace}" x="11" y="0" width="1" height="1"/>
        <rect fill="${buttonShadow}" x="11" y="1" width="1" height="13"/>
        <rect fill="${buttonShadow}" x="0" y="13" width="11" height="1"/>
        <rect fill="${buttonDkShadow}" x="0" y="14" width="13" height="1"/>
        <rect fill="${buttonDkShadow}" x="12" y="0" width="1" height="14"/></svg>`;
    const resizeArea = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 12 12" shape-rendering="crispEdges">
        <path stroke="${buttonHilight}" d="M11 0h1M10 1h1M9 2h1M8 3h1M7 4h1M11 4h1M6 5h1M10 5h1M5 6h1M9 6h1M4 7h1M8 7h1M3 8h1M7 8h1M11 8h1M2 9h1M6 9h1M10 9h1M1 10h1M5 10h1M9 10h1M0 11h1M4 11h1M8 11h1" />
        <path stroke="${buttonShadow}" d="M11 1h1M10 2h2M9 3h2M8 4h2M7 5h2M11 5h1M6 6h2M10 6h2M5 7h2M9 7h2M4 8h2M8 8h2M3 9h2M7 9h2M11 9h1M2 10h2M6 10h2M10 10h2M1 11h2M5 11h2M9 11h2" /></svg>`;
    const checkers = `<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 2 2" width="2" height="2">
        <rect fill="${buttonHilight}" x="0" y="0" width="1" height="1"/>
        <rect fill="transparent" x="1" y="0" width="1" height="1"/>
        <rect fill="${buttonHilight}" x="1" y="1" width="1" height="1"/>
        <rect fill="transparent" x="0" y="1" width="1" height="1"/></svg>`;

    const css = `
    :root {
        --scroll-up: url("data:image/svg+xml,${encodeURIComponent(scrollUp)}");
        --scroll-down: url("data:image/svg+xml,${encodeURIComponent(scrollDown)}");
        --scroll-left: url("data:image/svg+xml,${encodeURIComponent(scrollLeft)}");
        --scroll-right: url("data:image/svg+xml,${encodeURIComponent(scrollRight)}");
        --scroll-track: url("data:image/svg+xml,${encodeURIComponent(scrollTrack)}");
        --radio-border: url("data:image/svg+xml,${encodeURIComponent(radioBorder)}");
        --radio-border-disabled: url("data:image/svg+xml,${encodeURIComponent(radioBorderDisabled)}");
        --radio-dot: url("data:image/svg+xml,${encodeURIComponent(radioDot)}");
        --radio-dot-disabled: url("data:image/svg+xml,${encodeURIComponent(radioDotDisabled)}");
        --checkmark: url("data:image/svg+xml,${encodeURIComponent(checkmark)}");
        --checkmark-disabled: url("data:image/svg+xml,${encodeURIComponent(checkmarkDisabled)}");
        --indicator-thumb: url("data:image/svg+xml,${encodeURIComponent(indicatorThumb)}");
        --seek-handle: url("data:image/svg+xml,${encodeURIComponent(seekHandle)}");
        --resize-area: url("data:image/svg+xml,${encodeURIComponent(resizeArea)}");
        --checkers: url("data:image/svg+xml,${encodeURIComponent(checkers)}");
    }`;
    return css;
}

// Convert WPE color format to #rrggbb
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
function createNewDeskItem(numStr, openDoc, temp, options) {
    const newContainer = windowContainers[0].cloneNode(true);
    document.body.appendChild(newContainer);
    windowContainers = document.getElementsByClassName("windowContainer");
    const deskMover = new DeskMover(newContainer, numStr, openDoc, temp, options);
    deskMovers[numStr] = deskMover;
    return deskMover;
}

// Create a new AD item, initialize, and increase the saved window count
function openWindow(openDoc, temp, optionsOrWidth, height, style, centered, top, left, aot, unresizable, noIcon) {
    if (!temp) {
        localStorage.madesktopOpenWindows += `,${localStorage.madesktopItemCount}`;
    }
    let options = optionsOrWidth;
    if (typeof optionsOrWidth === "string") {
        // Old way of calling openWindow
        options = {
            width: optionsOrWidth,
            height,
            style,
            centered,
            top,
            left,
            aot,
            unresizable,
            noIcon
        };
    }
    let deskMover = createNewDeskItem(localStorage.madesktopItemCount, openDoc, temp, options);
    activateWindow(localStorage.madesktopItemCount);
    localStorage.madesktopItemCount++;
    return deskMover;
}

function openConfig(page) {
    if (window.confDeskMover) {
        if (page && window.confDeskMover.config.src !== `apps/madconf/${page}.html`) {
            window.confDeskMover.locReplace(`apps/madconf/${page}.html`);
        }
        window.confDeskMover.bringToTop();
    } else {
        openWindow(`apps/madconf/${page || 'background'}.html`, true);
    }
}

function openExternal(url, fullscreen, specs = "", temp = true, noExternal = false) {
    if ((localStorage.madesktopLinkOpenMode || "1") !== "1" && temp && !specs && !url.startsWith("data:") && !noExternal) {
        openExternalExternally(url, fullscreen && !localStorage.madesktopChanViewNoAutoFullscrn);
        return null;
    }
    // GitHub doesn't work well in ChannelViewer unless running in Wallpaper Engine
    if (runningMode === BROWSER && url.includes("github.com/") && temp && !noExternal) {
        openExternalExternally(url);
        return null;
    }

    if (specs) {
        specs = "&" + specs.replaceAll(" ", "").replaceAll(",", "&");
    }
    let deskMover = openWindow('apps/channelviewer/index.html?page=' + encodeURIComponent(url) + specs, temp, "1024px", "768px");
    if (deskMover && fullscreen && !localStorage.madesktopChanViewNoAutoFullscrn) {
        deskMover.windowElement.contentWindow.addEventListener("load", function () {
            deskMover.enterFullscreen(true);
        });
    }
    return deskMover;
}

async function openExternalExternally(url, fullscreen, noInternal = false) {
    if (runningMode === BROWSER && (!localStorage.madesktopLinkOpenMode || localStorage.madesktopLinkOpenMode === "0")) {
        window.open(url, "_blank");
    } else if (localStorage.sysplugIntegration) {
        const headers = {};
        if (fullscreen) {
            headers["X-Fullscreen"] = "true";
        }
        if (localStorage.madesktopLinkOpenMode === "2") {
            headers["X-Use-ChannelViewer"] = "true";
        }
        try {
            const response = await madSysPlug.openExternal(url, headers);
            if (response !== "OK") {
                await madAlert(madGetString("UI_MSG_SYSPLUG_ERROR", response), null, "error");
                copyPrompt(url);
            }
        } catch {
            await madAlert(madGetString("UI_MSG_NO_SYSPLUG"), null, "warning");
            copyPrompt(url);
        }
    } else {
        copyPrompt(url);
    }

    function copyPrompt(url) {
        if (!noInternal) {
            openExternal(url, fullscreen, "", true, true);
        } else if (kbdSupport === -1 || prompt(madGetString("MAD_MSG_LINK_COPY_PROMPT"), url)) {
            const tmp = document.createElement("textarea");
            document.body.appendChild(tmp);
            tmp.value = url;
            tmp.select();
            document.execCommand('copy');
            document.body.removeChild(tmp);
            if (kbdSupport === -1) {
                madAlert(madGetString("MAD_MSG_LINK_COPIED"), null, "info");
            }
        }
    }
}

// Required as mouse movements over iframes are not detectable in the parent document
function iframeClickEventCtrl(clickable) {
    const caller = getCaller();
    log(clickable ? "clickable" : "unclickable", "debug", caller + " -> iframeClickEventCtrl");
    const value = clickable ? "auto" : "none";
    bgHtmlView.style.pointerEvents = value;
    oskWindow.style.pointerEvents = value;
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
            if (deskMovers[i].isFullscreen) {
                if (deskMovers[i].isFullscreenWithMargins) {
                    deskMovers[i].windowElement.style.width = window.vWidth - parseInt(localStorage.madesktopChanViewLeftMargin || "75px") - parseInt(localStorage.madesktopChanViewRightMargin || "0") + "px";
                    deskMovers[i].windowElement.style.height = window.vHeight - parseInt(localStorage.madesktopChanViewTopMargin || "0") - parseInt(localStorage.madesktopChanViewBottomMargin || "48px") + "px";
                } else {
                    deskMovers[i].windowElement.style.width = window.vWidth + "px";
                    deskMovers[i].windowElement.style.height = window.vHeight + "px";
                }
            }
        } catch {
            // page did not load yet
            // it works on external webpages thanks to the new WPE iframe policy
        }
    }
}

// innerWidth/Height hook
// Fixes some sites that are broken when scaled, such as YT
function hookIframeSize(iframe, num) {
    Object.defineProperties(iframe.contentWindow, {
        innerWidth: {
            get: function () {
                if (typeof num !== "undefined" && deskMovers[num].config.unscaled) {
                    return iframe.clientWidth * scaleFactor;
                }
                return iframe.clientWidth;
            }
        },
        innerHeight: {
            get: function () {
                if (typeof num !== "undefined" && deskMovers[num].config.unscaled) {
                    return iframe.clientHeight * scaleFactor;
                }
                return iframe.clientHeight;
            }
        }
    });

    // Also hook window.open as this doesn't work in WPE
    if (localStorage.madesktopLinkOpenMode !== "0" || runningMode !== BROWSER) {
        iframe.contentWindow.open = function (url, name, specs) {
            const deskMover = openExternal(url, false, specs);
            if (deskMover) {
                return deskMover.windowElement.contentWindow;
            }
        }
    }

    iframe.contentWindow.close = function () {
        deskMovers[num].closeWindow();
    }

    // Listen for title changes
    new MutationObserver(function (mutations) {
        if (!deskMovers[num].config.title) {
            deskMovers[num].windowTitleText.textContent = mutations[0].target.innerText;
        }
    }).observe(
        iframe.contentDocument.querySelector('title'),
        { subtree: true, characterData: true, childList: true }
    );

    iframe.contentDocument.addEventListener('click', (event) => {
        if (!iframe.contentDocument) {
            // Window was closed (Firefox specific, doesn't happen in Chromium)
            return;
        }
        const hoverElement = iframe.contentDocument.elementFromPoint(event.clientX, event.clientY);
        if (iframe.contentDocument.activeElement && iframe.contentDocument.activeElement.href &&
            (iframe.contentDocument.activeElement.target === "_blank" && hoverElement === iframe.contentDocument.activeElement) ||
            iframe.contentDocument.activeElement.target === "_cv")
        {
            openExternal(iframe.contentDocument.activeElement.href);
            event.preventDefault();
        }
    });
}

// Save current window z-order
function saveZOrder() {
    let zOrders = [];
    for (const i in deskMovers) {
        zOrders.push([i, deskMovers[i].windowContainer.style.zIndex]);
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
        activeWindow = 0; // Prevent errors
        return;
    }
    num = parseInt(num);

    delete deskMovers[num].windowContainer.dataset.inactive;
    deskMovers[num].windowTitlebar.classList.remove("inactive");

    if (num !== activeWindow) {
        activeWindowHistory.push(activeWindow);
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
    const extraTitleHeight = parseInt(getComputedStyle(msgbox).getPropertyValue('--extra-title-height'));
    const extraBorderSize = parseInt(getComputedStyle(msgbox).getPropertyValue('--extra-border-size'));
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
                return 'images/mad16.png';
            } else {
                return path;
            }
        }

        // Check if the favicon exists
        await fetch(path).then(response => {
            if (!response.ok) {
                log('Favicon not found, using a generic icon', 'log', 'getFavicon');
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
    if (elem.style.animationName === "none") return;
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
async function madAlert(msg, callback, icon = "info") {
    return new Promise(resolve => {
        playSound(icon);

        if (msg.startsWith("locid:")) {
            msg = `<mad-string data-locid="${msg.slice(6)}"></mad-string>`;
        }
        msgboxMessage.innerHTML = msg;
        msgboxIcon.style.display = "block";
        msgboxIcon.src = `images/${icon}.png`;
        msgboxBtn2.style.display = "none";
        msgboxInput.style.display = "none";
        osk.style.display = "none";

        document.addEventListener('keypress', keypress);
        document.addEventListener('keyup', keyup);
        msgboxBtn1.addEventListener('click', close);
        msgboxCloseBtn.addEventListener('click', close);

        showDialog();

        function keypress(event) {
            if (event.key === "Enter") {
                close();
            }
        }
        function keyup(event) {
            if (event.key === "Escape") {
                close();
            }
        }
        function close() {
            hideDialog();
            document.removeEventListener('keypress', keypress);
            document.removeEventListener('keyup', keyup);
            msgboxBtn1.removeEventListener('click', close);
            msgboxCloseBtn.removeEventListener('click', close);
            deskMovers[activeWindow].windowTitlebar.classList.remove("inactive");
            if (callback) callback();
            resolve();
        }
    });
}

async function madConfirm(msg, callback) {
    return new Promise(resolve => {
        playSound("question");

        msgboxMessage.innerHTML = msg;
        msgboxIcon.style.display = "block";
        msgboxIcon.src = "images/question.png";
        msgboxBtn2.style.display = "block";
        msgboxInput.style.display = "none";
        osk.style.display = "none";

        document.addEventListener('keypress', keypress);
        document.addEventListener('keyup', keyup);
        msgboxBtn1.addEventListener('click', ok);
        msgboxBtn2.addEventListener('click', close);
        msgboxCloseBtn.addEventListener('click', close);

        showDialog();

        function keypress(event) {
            // Handle enter in keypress to prevent this from being triggered along with the context menu enter key
            if (event.key === "Enter") {
                ok();
            }
        }
        function keyup(event) {
            // Aaand escape cannot be handled in keypress so it's here
            if (event.key === "Escape") {
                close();
            }
        }
        function ok() {
            removeEvents();
            if (callback) callback(true);
            resolve(true);
        }
        function close() {
            removeEvents();
            if (callback) callback(false);
            resolve(false);
        }
        function removeEvents() {
            hideDialog();
            document.removeEventListener('keypress', keypress);
            document.removeEventListener('keyup', keyup);
            msgboxBtn1.removeEventListener('click', ok);
            msgboxBtn2.removeEventListener('click', close);
            msgboxCloseBtn.removeEventListener('click', close);
            deskMovers[activeWindow].windowTitlebar.classList.remove("inactive");
        }
    });
}

async function madPrompt(msg, callback, hint = "", text = "") {
    return new Promise(async resolve => {
        if (kbdSupport === 0) { // Wallpaper Engine normally does not support keyboard input
            const res = prompt(msg, text);
            callback(res);
            resolve(res);
            return;
        }

        msgboxMessage.innerHTML = msg;
        msgboxIcon.style.display = "none";
        msgboxBtn2.style.display = "block";
        msgboxInput.style.display = "block";
        msgboxInput.placeholder = hint;
        msgboxInput.value = text;

        if (hint.length > 50 || text.length > 50) {
            msgboxInput.style.width = "500px";
        } else {
            msgboxInput.style.width = "100%";
        }

        document.addEventListener('keypress', keypress);
        document.addEventListener('keyup', keyup);
        msgboxInput.addEventListener('click', focus);
        msgboxBtn1.addEventListener('click', ok);
        msgboxBtn2.addEventListener('click', close);
        msgboxCloseBtn.addEventListener('click', close);

        showDialog();
        msgboxInput.focus();
        if (kbdSupport === -1) {
            // WPE 2.5 broke the native JS alert/confirm/prompt,
            // locking the wallpaper until the user reloads the wallpaper from the WPE UI
            // (can't even close the dialog)
            // If the system plugin is available, use that for receiving input
            // Otherwise, use the on-screen keyboard
            if (!await madSysPlug.beginInput()) {
                if (!oskWindow.src) {
                    oskWindow.src = "apps/osk/index.html";
                }
                oskWindow.contentDocument.body.style.zoom = scaleFactor;
                osk.style.display = "block";
                osk.style.left = (vWidth - osk.offsetWidth - parseInt(localStorage.madesktopChanViewRightMargin) - 100) + "px";
                osk.style.top = (vHeight - osk.offsetHeight - parseInt(localStorage.madesktopChanViewBottomMargin) - 50) + "px";
            }
        }

        function keypress(event) {
            if (event.key === "Enter") {
                ok();
            }
        }
        function keyup(event) {
            if (event.key === "Escape") {
                close();
            }
        }
        function focus() {
            if (kbdSupport === -1) {
                madSysPlug.focusInput();
            }
        }
        function ok() {
            removeEvents();
            if (callback) callback(msgboxInput.value);
            resolve(msgboxInput.value);
        }
        function close() {
            removeEvents();
            if (callback) callback(null);
            resolve(null);
        }
        function removeEvents() {
            hideDialog();
            document.removeEventListener('keypress', keypress);
            document.removeEventListener('keyup', keyup);
            madSysPlug.endInput();
            msgboxInput.removeEventListener('click', focus);
            msgboxBtn1.removeEventListener('click', ok);
            msgboxBtn2.removeEventListener('click', close);
            msgboxCloseBtn.removeEventListener('click', close);
            deskMovers[activeWindow].windowTitlebar.classList.remove("inactive");
        }
    });
}

function preventDefault(event) {
    event.preventDefault();
    event.stopPropagation();
}

function showDialog() {
    if (msgboxLoopCount++ > 5) {
        return;
    }
    msgboxLoopDetector = setTimeout(function () {
        clearTimeout(msgboxLoopDetector);
        msgboxLoopCount = 0;
    }, 5000);

    const winOpenAnim = getComputedStyle(msgbox).getPropertyValue('--win-open-anim');
    if (winOpenAnim && !localStorage.madesktopNoWinAnim) {
        msgbox.style.animation = `0.22s ${winOpenAnim} linear`;
        msgbox.addEventListener('animationend', function () {
            msgbox.style.animation = "";
        }, { once: true });
    }

    if (!localStorage.madesktopNoDeactivate) {
        deskMovers[activeWindow].windowTitlebar.classList.add("inactive");
    }
    msgboxBg.style.display = "block";
    msgbox.style.top = (vHeight - msgbox.offsetHeight) / 2 + "px";
    msgbox.style.left = (vWidth - msgbox.offsetWidth) / 2 + "px";
    msgboxBtn1.focus();
}

function hideDialog() {
    const winCloseAnim = getComputedStyle(msgbox).getPropertyValue('--win-close-anim');
    if (winCloseAnim && !localStorage.madesktopNoWinAnim) {
        msgbox.style.animation = `0.2s ${winCloseAnim} linear`;
        msgbox.addEventListener('animationend', function () {
            if (msgbox.style.animationName !== winCloseAnim.trim()) {
                return;
            }
            msgbox.style.animation = "";
            msgboxBg.style.display = "none";
        }, { once: true });
    } else {
        msgboxBg.style.display = "none";
    }
    osk.style.display = "none";
}

function flashDialog() {
    playSound("modal");
    clearInterval(flashInterval);
    let cnt = 1;
    flashInterval = setInterval(function () {
        if (cnt === 18) {
            clearInterval(flashInterval);
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

function menuNavigationHandler(event) {
    if (!openedMenu) {
        return;
    }
    let menuItems;
    if (localStorage.madesktopDebugMode) {
        menuItems = openedMenu.querySelectorAll('.contextMenuItem:not([data-hidden])');
    } else {
        menuItems = openedMenu.querySelectorAll('.contextMenuItem:not([data-hidden]):not(.debug)');
    }
    const activeItem = openedMenu.querySelector('.contextMenuItem[data-active]');
    const activeItemIndex = Array.from(menuItems).indexOf(activeItem);
    switch (event.key) {
        case "Escape":
            isContextMenuOpen = false;
            if (openedMenuCloseFunc) {
                openedMenuCloseFunc(true);
                openedMenu.querySelector('.contextMenuItem').dataset.active = true;
            } else {
                openedMenu.blur();
            }
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
        case "ArrowLeft":
            if (openedMenu.classList.contains('confMenuBg')) {
                openedMenuCloseFunc(true);
                openedMenu.querySelector('.contextMenuItem').dataset.active = true;
            }
            break;
        case "ArrowRight":
            if (activeItem && activeItem.querySelector('.submenuMark')) {
                activeItem.click();
                openedMenu.querySelector('.contextMenuItem').dataset.active = true;
            }
            break;
        case "Enter":
            if (activeItem) {
                activeItem.click();
                if (openedMenu) {
                    openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                }
            } else {
                isContextMenuOpen = false;
                if (openedMenuCloseFunc) {
                    openedMenuCloseFunc(true);
                } else {
                    openedMenu.blur();
                }
            }
            break;
        default:
            const shortcutsKeys = openedMenu.getElementsByTagName('u');
            for (const shortcutKey of shortcutsKeys) {
                if (event.key === shortcutKey.textContent.toLowerCase()) {
                    for (const item of menuItems) {
                        delete item.dataset.active;
                    }
                    shortcutKey.parentElement.click();
                    if (openedMenu) {
                        openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                    }
                    return;
                }
            }
    }
    event.preventDefault();
    event.stopPropagation();
}

function playSound(sound) {
    if ((sound !== "navStart" && !localStorage.madesktopAlertSndMuted) ||
        (sound === "navStart" && !localStorage.madesktopChanViewNoSound))
    {
        soundScheme[sound].currentTime = 0;
        soundScheme[sound].play();
    }
}

function reset(res) {
    if (typeof res === "undefined" || res) {
        madConfirm(madGetString("MAD_CONFIRM_RESET"), function (res) {
            if (res) {
                location.replace("confmgr.html?action=reset");
            }
        });
    }
}

function getCaller() {
    const stack = new Error().stack;
    if (stack.includes("at ")) {
        return stack.split('\n')[3].trim().slice(3).split(' ')[0];
    } else {
        // Safari is weird
        return stack.split('\n')[2].split('@')[0];
    }
}

function log(str, level, caller) {
    if (debugLog) {
        if (!caller) {
            caller = getCaller();
        }
        if (typeof str === "object") {
            str = JSON.stringify(str);
        }
        console[level || 'log'](caller + ": " + str);
    }
}

// Just for debugging
function debug(event) {
    madPrompt(madGetString("UI_PROMPT_RUNJS"), function (res) {
        eval(res);
    });
    event.preventDefault();
}

function activateDebugMode() {
    document.body.dataset.debugMode = true;
    debugMenu.style.top = localStorage.madesktopChanViewTopMargin || "0";
    debugMenu.style.right = localStorage.madesktopChanViewRightMargin || "0";
    debugMenu.style.left = "auto";
    for (const i in deskMovers) {
        deskMovers[i].windowTitlebar.classList.remove("noIcon");
    }
    localStorage.madesktopDebugMode = true;
}

function deactivateDebugMode() {
    delete document.body.dataset.debugMode;
    delete localStorage.madesktopDebugMode;
    if (debugLog) toggleDebugLog();
    if (runningMode !== origRunningMode) {
        runningMode = origRunningMode;
        simulatedModeLabel.textContent = "";
    }
}

function toggleDebugLog() {
    debugLog = !debugLog;
    debugLogBtn.locId = debugLog ? "MAD_DEBUG_DISABLE_LOGGING" : "MAD_DEBUG_ENABLE_LOGGING";
    if (debugLog) {
        localStorage.madesktopDebugLog = true;
    } else {
        delete localStorage.madesktopDebugLog;
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

function toggleKbdSupport() {
    kbdSupport = [1, -1, 0][kbdSupport + 1];
    kbdSupportLabel.textContent = kbdSupport;
}

function showErrors() {
    errorWnd.style.display = "block";
}

function startup() {
    if (startupRan) {
        return;
    }

    if (!localStorage.madesktopStartSndMuted) {
        playSound("startup");

        if (!localStorage.madesktopHideWelcome) {
            setTimeout(showWelcome, 5000);
        }
    } else {
        if (!localStorage.madesktopHideWelcome) {
            showWelcome();
        }
    }
    startupRan = true;
}

function showWelcome() {
    const options = {
        width: "476px",
        height: "322px",
        centered: true,
        unresizable: true
    };
    openWindow("apps/welcome/index.html", true, options);
}
// #endregion

// #region Final initialization
document.getElementById("location").textContent = location.href;
if (runningMode === WE) {
    runningModeLabel.textContent = "Wallpaper Engine";
    // Dummy listener to make Wallpaper Engine recognize MAD supporting audio visualization
    window.wallpaperRegisterAudioListener(() => {});
} else {
    if (runningMode === LW) {
        runningModeLabel.textContent = "Lively Wallpaper";
    } else {
        // Konami code easter egg
        // Obviously a 98.js / jspaint reference
        const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a", "Enter"];
        let konamiStack = 0;
        document.addEventListener('keydown', function (event) {
            if (event.key === konamiCode[konamiStack++]) {
                if (event.key === "Enter") {
                    openExternal("https://youareanidiot.cc/lol.html", false, "resizable=no,width=357,height=330,forceLoad=yes", true, true);
                }
            } else {
                konamiStack = 0;
            }
        }); 
    }
    startup();
    if (location.href.startsWith("file:///") && runningMode === BROWSER) {
        // Not really localizable cuz AJAX fails when running as a local file due to CORS
        madAlert("You are running ModernActiveDesktop as a local file. Please use a web server to host it for full functionality.", null, "warning");
    }
}
origRunningMode = runningMode;

window.addEventListener('load', function () {
    processTheme();
    try {
        document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
    } catch {
        document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
    }
    adjustAllElements();

    if (runningMode === WE) {
        setTimeout(function () {
            if (visDeskMover) {
                visDeskMover.windowElement.contentWindow.setupListeners();
            }
        }, 1000);
    }
});

// Prevent scrolling when a partly off-screen deskMover gets focus, its iframe loads, etc.
document.addEventListener('scroll', function () {
    document.documentElement.scrollTo(0, 0);
});

// Initialization complete
jsRunBtn.addEventListener('click', debug);
document.body.dataset.initComplete = true;

// Crash detection
localStorage.madesktopFailCount = ++localStorage.madesktopFailCount || 1;
setTimeout(function () {
    delete localStorage.madesktopFailCount;
}, 10000);
// #endregion