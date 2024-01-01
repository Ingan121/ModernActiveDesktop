let windowContainers = document.getElementsByClassName("windowContainer");
const bgHtmlContainer = document.getElementById("bgHtmlContainer");
const bgHtmlView = document.getElementById("bgHtmlView");
const bgVideoView = document.getElementById("bgVideo");
const schemeElement = document.getElementById("scheme");
const styleElement = document.getElementById("style");
const msgboxBg = document.getElementById("msgboxBg");
const msgbox = document.getElementById("msgbox");
const msgboxTitlebar = msgbox.getElementsByClassName("title-bar")[0];
const msgboxMessage = document.getElementById("msgbox-msg");
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
const debugLogBtn = document.getElementById("debugLogBtn");
const toggleModeBtn = document.getElementById("toggleModeBtn");

const chord = new Audio("sounds/chord.wav");
const ding = new Audio("sounds/ding.wav");
const startup = new Audio("sounds/The Microsoft Sound.wav");

const WINDOW_PLACEHOLDER = "data:text/html,<meta charset='utf-8'><body style='background-color: white'>⮡ Click this button to configure</body>";
const NO_SYSPLUG_ALERT = "System plugin is not running. Please make sure you have installed it properly. If you don't want to use it, please disable the system plugin integration option.";

let lastZIndex = localStorage.madesktopItemCount || 0;
let isContextMenuOpen = false;

const WE = 1; // Wallpaper Engine
const LW = 2; // Lively Wallpaper
const BROWSER = 0; // None of the above
let runningMode = BROWSER, origRunningMode = BROWSER;

let scaleFactor = 1;
let vWidth = window.innerWidth;
let vHeight = window.innerHeight;

let debugLog = false;

// Load configs
if (localStorage.madesktopBgColor) document.body.style.backgroundColor = localStorage.madesktopBgColor;
changeBgType(localStorage.madesktopBgType || "image");
changeBgImgMode(localStorage.madesktopBgImgMode || "center");
if (localStorage.madesktopBgVideoMuted) bgVideoView.muted = true;
if (localStorage.madesktopBgHtmlSrc) bgHtmlView.src = localStorage.madesktopBgHtmlSrc;
if (localStorage.madesktopColorScheme) changeColorScheme(localStorage.madesktopColorScheme);
changeScale(localStorage.madesktopScaleFactor);
if (localStorage.madesktopDebugMode) activateDebugMode();

initDeskMover(0);
initSimpleMover(msgbox, msgboxTitlebar, [msgboxCloseBtn]);

// Migrate old config
if (localStorage.madesktopNonADStyle) {
    for (let i = 0; i < localStorage.madesktopItemCount; i++) localStorage.setItem("madesktopItemStyle" + (i || ""), "nonad");
    localStorage.removeItem("madesktopNonADStyle");
    location.reload();
    throw new Error("Refreshing...");
}

if (localStorage.madesktopItemCount) {
    if (localStorage.madesktopItemCount > 1) {
        for (let i = 0; i < localStorage.madesktopItemCount - 1; i++) createNewDeskItem();
    }
} else {
    localStorage.madesktopItemCount = 1;
}

if ((localStorage.madesktopLastVer || "").startsWith("2.") && localStorage.madesktopLastVer != "2.4") { // Update from 2.x
    openWindow("Updated.md");
} else if (localStorage.madesktopLastVer != "2.4") { // First run or update from 1.x
    openWindow("README.md");
}
localStorage.madesktopLastVer = "2.4";

if (localStorage.madesktopItemVisible == "false") windowContainers[0].style.display = "none";

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
    if (event.ctrlKey && event.shiftKey && event.code == 'KeyY') activateDebugMode();
});

// Main context menu things (only for browser uses)
window.addEventListener('contextmenu', function (event) {
    if (isContextMenuOpen) return;
    mainMenuBg.style.left = event.clientX + "px";
    mainMenuBg.style.top = event.clientY + "px";
    mainMenuBg.style.display = "block";
    setTimeout(function () {
        document.addEventListener('click', closeMainMenu);
        iframeClickEventCtrl(false);
    }, 100);
    isContextMenuOpen = true;
    event.preventDefault();
}, false);

for (let i = 0; i < mainMenuItems.length; i++) {
    const elem = mainMenuItems[i];
    elem.onmouseover = function () {
        elem.getElementsByTagName('u')[0].style.borderBottomColor = 'var(--hilight-text)';
    }
    elem.onmouseout = function () {
        elem.getElementsByTagName('u')[0].style.borderBottomColor = 'var(--window-text)';
    }
}

mainMenuItems[0].addEventListener('click', openWindow); // New button

mainMenuItems[1].addEventListener('click', function() { // Properties button
    openWindow("config.html", false, "388px", "168px");
});

msgboxBg.addEventListener('click', flashDialog);

msgbox.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation()
});

window.addEventListener('resize', function () {
    changeScale(scaleFactor);
});

// Detect WE config change
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        console.log(properties);
        if (properties.bgtype) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                changeBgType(properties.bgtype.value);
                localStorage.madesktopBgType = properties.bgtype.value;
            }
        }
        if (properties.bgcolor) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                changeBgColor(parseWallEngColorProp(properties.bgcolor.value));
            }
        }
        if (properties.bgimg) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                if (properties.bgimg.value) {
                    const path = "file:///" + properties.bgimg.value;
                    document.body.style.backgroundImage = "url('" + path + "')";
                    localStorage.madesktopBgImg = path;
                } else {
                    document.body.style.backgroundImage = 'none';
                    localStorage.removeItem('madesktopBgImg');
                }
            }
        }
        if (properties.bgimgmode) {
            changeBgImgMode(properties.bgimgmode.value);
            localStorage.madesktopBgImgMode = properties.bgimgmode.value;
        }
        if (properties.bgvideo) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                if (properties.bgvideo.value) {
                    const path = "file:///" + properties.bgvideo.value;
                    bgVideoView.src = path;
                    localStorage.madesktopBgVideo = path;
                } else {
                    bgVideoView.src = "";
                    localStorage.removeItem('madesktopBgVideo');
                }
            }
        }
        if (properties.bgvideomute) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                if (properties.bgvideomute.value) {
                    bgVideoView.muted = true;
                    localStorage.madesktopBgVideoMuted = true;
                } else {
                    bgVideoView.muted = false;
                    localStorage.removeItem('madesktopBgVideoMuted');
                }
            }
        }
        if (properties.bghtmlurl) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                const url = properties.bghtmlurl.value || "bghtml/index.html";
                if (url == "index.html") return; // This could cause untended behaviors
                bgHtmlView.src = url;
                localStorage.madesktopBgHtmlSrc = url;
            }
        }
        if (properties.additem) {
            if (!properties.bgcolor) { // Ignore if this is a startup event
                openWindow();
            }
        }
        if (properties.leftmargin) {
            const str = isNaN(properties.leftmargin.value) ? properties.leftmargin.value : properties.leftmargin.value + 'px';
            localStorage.madesktopChanViewLeftMargin = str;
        }
        if (properties.rightmargin) {
            const str = isNaN(properties.rightmargin.value) ? properties.rightmargin.value : properties.rightmargin.value + 'px';
            localStorage.madesktopChanViewRightMargin = str;
        }
        if (properties.playstartsnd) {
            if (properties.playstartsnd.value) startup.play();
            else {
                startup.pause();
                startup.currentTime = 0;
            }
        }
        if (properties.sysplugintegration) {
            if (!properties.bgcolor) { // Ignore if this is a startup event
                if (properties.sysplugintegration.value) {
                    localStorage.sysplugIntegration = true;

                    fetch("http://localhost:3031/connecttest")
                    .then(response => response.text())
                    .then(responseText => {
                        if (responseText != "OK") {
                            madAlert("An error occurred!\nSystem plugin response: " + responseText);
                        }
                    })
                    .catch(error => {
                        madAlert(NO_SYSPLUG_ALERT, function() {
                            openWindow("SysplugSetupGuide.md", true);
                        });
                    })
                } else {
                    localStorage.removeItem("sysplugIntegration");
                    if (localStorage.madesktopColorScheme == "sys") localStorage.removeItem("madesktopColorScheme");
                }
            }
        }
        if (properties.openwith) {
            if (!properties.bgcolor) { // Ignore if this is a startup event
                if (localStorage.madesktopPrevOWConfigRequest != properties.openwith.value) {
                    fetch("http://localhost:3031/config", { method: "POST", body: `{"openWith": ${properties.openwith.value}}` })
                        .then(response => response.text())
                        .then(responseText => {
                            if (responseText != "OK") {
                                madAlert("An error occurred!\nSystem plugin response: " + responseText);
                            }
                        })
                        .catch(error => {
                            madAlert(NO_SYSPLUG_ALERT, function() {
                                openWindow("SysplugSetupGuide.md", true);
                            });
                        });
                }
            }
            localStorage.madesktopPrevOWConfigRequest = properties.openwith.value;
        }
        if (properties.colorscheme || properties.colorscheme2) {
            const value = localStorage.sysplugIntegration ? properties.colorscheme.value : properties.colorscheme2.value;
            changeColorScheme(value);
            if (!properties.leftmargin) changeBgColor("var(--background)"); // Don't change the background color if this is a startup event
            localStorage.madesktopColorScheme = value;
        }
        if (properties.scale) {
            if (!properties.bgcolor) { // Ignore if this is a startup event
                const value = properties.scale.value;
                changeScale(value == "custom" ? localStorage.madesktopLastCustomScale : properties.scale.value);
                localStorage.madesktopScaleFactor = scaleFactor;
            }
        }
        if (properties.customscale) {
            if (!properties.bgcolor) { // Ignore if this is a startup event
                changeScale(properties.customscale.value / 100);
                localStorage.madesktopScaleFactor = scaleFactor;
                localStorage.madesktopLastCustomScale = scaleFactor;
            }
        }
        if (properties.reset) {
            if (!properties.bgcolor) { // Ignore if this is a startup event
                madConfirm("If you want to reset all the configurations completely, first click the big red Reset button below, then click OK.", reset);
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
            openWindow("config.html", false, "388px", "168px");
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
    console.log(str);
    document.body.style.backgroundColor = str;
    localStorage.madesktopBgColor = str;
}

function loadBgImgConf() {
    if (localStorage.madesktopBgImg) {
        if (localStorage.madesktopBgImg.startsWith("file:///")) document.body.style.backgroundImage = "url('" + localStorage.madesktopBgImg + "')"; // Set in WE
        else document.body.style.backgroundImage = "url('data:image/png;base64," + localStorage.madesktopBgImg + "')"; // Set in config.html
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
    if (scheme == "98") schemeElement.href = "data:text/css,";
    else if (scheme != "sys") schemeElement.href = `schemes/${scheme}.css`;
    else {
        if (localStorage.madesktopSysColorCache) schemeElement.href = localStorage.madesktopSysColorCache;

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
    if (debugLog) console.log({scaleFactor, vWidth, vHeight, dpi: 96 * scaleFactor});
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

// Create a new ActiveDesktop item and initialize it
function createNewDeskItem(openDoc, temp, width, height) {
    const newContainer = windowContainers[0].cloneNode(true);
    document.body.appendChild(newContainer);
    windowContainers = document.getElementsByClassName("windowContainer");
    initDeskMover(windowContainers.length - 1, openDoc, temp, width, height);
}

// Create a new AD item, initialize, and increase the saved window count
function openWindow(openDoc, temp, width, height) {
    if (localStorage.madesktopItemVisible == "false" && !(typeof openDoc === "string" || openDoc instanceof String)) {
        windowContainers[0].style.display = "block";
        localStorage.removeItem("madesktopItemVisible");
    } else {
        if (localStorage.madesktopItemVisible == "false") {
            windowContainers[0].style.display = "block";
            createNewDeskItem(openDoc, temp, width, height);
            windowContainers[0].style.display = "none";
        } else createNewDeskItem(openDoc, temp, width, height);
        localStorage.madesktopItemCount++;
    }
}

function closeMainMenu() {
    mainMenuBg.style.display = "none";
    document.removeEventListener('click', closeMainMenu);
    isContextMenuOpen = false;
}

// Required as mouse movements over iframes are not detectable in the parent document
function iframeClickEventCtrl(clickable) {
    if (debugLog) console.log(clickable ? "clickable" : "unclickable")
    const value = clickable ? "auto" : "none";
    bgHtmlView.style.pointerEvents = value;
    for (let i = 0; i < windowContainers.length; i++)
        windowContainers[i].style.pointerEvents = value;
}

// Change the scaleFactor of all iframes
function updateIframeScale() {
    try {
        bgHtmlView.contentDocument.body.style.zoom = scaleFactor;
        bgHtmlView.contentWindow.dispatchEvent(new Event("resize"));
    } catch {
        // page did not load yet
    }
    for (let i = 0; i < windowContainers.length; i++) {
        try {
			if (!localStorage.getItem("madesktopItemUnscaled" + (i || ""))) {
                const iframe = windowContainers[i].getElementsByClassName("windowElement")[0];
                iframe.contentDocument.body.style.zoom = scaleFactor;
                iframe.contentWindow.dispatchEvent(new Event("resize"));
            }
        } catch {
            // attempting to do this on destroyed deskitems
            // or page did not load yet
            // it works on external webpages thanks to the new WE iframe policy
        }
    }
}

// innerWidth/Height hook
// Fixes some sites that are broken when scaled, such as YT
function hookIframeSize(iframe, num) {
    Object.defineProperty(iframe.contentWindow, "innerWidth", {
        get: function () {
            if (typeof num != "undefined" && localStorage.getItem("madesktopItemUnscaled" + (num || "")))
                return iframe.clientWidth * scaleFactor;
            return iframe.clientWidth;
        }
    });
    Object.defineProperty(iframe.contentWindow, "innerHeight", {
        get: function () {
            if (typeof num != "undefined" && localStorage.getItem("madesktopItemUnscaled" + (num || "")))
                return iframe.clientHeight * scaleFactor;
            return iframe.clientHeight;
        }
    });

    // Also hook window.open as this doesn't work in WE
    // Try to use sysplug, and if unavailable, just prompt for URL copy
    if (runningMode != BROWSER) {
        iframe.contentWindow.open = function (url) {
            if (localStorage.sysplugIntegration) {
                fetch("http://localhost:3031/open", { method: "POST", body: url })
                    .then(response => response.text())
                    .then(responseText => {
                        if (responseText != "OK") {
                        alert("An error occured!\nSystem plugin response: " + responseText);
                        copyPrompt(url);
                        }
                    })
                    .catch(error => {
                        alert("System plugin is not running. Please make sure you have installed it properly.");
                        copyPrompt(url);
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
    }
}

// Save current window z-order
function saveZOrder() {
    let zOrders = [];
    for (let i = 0; i < windowContainers.length; i++)
        if (windowContainers[i].childElementCount) zOrders[zOrders.length] = [i, windowContainers[i].style.zIndex];
    
    zOrders.sort(function(a, b) {
        if (+a[1] > +b[1]) return 1;
        else if (+a[1] == +b[1]) return 0;
        else return -1;
    });
    
    for (let i = 0; i < zOrders.length; i++)
        localStorage.setItem("madesktopItemZIndex" + (zOrders[i][0] || ""), i);
    
    if (debugLog) console.log(zOrders);
}

// Lively Wallpaper doesn't work well with alert/confirm/prompt, so replace these with custom ones
function madAlert(msg, callback) {
    msgboxMessage.textContent = msg;
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
        if (callback) callback();
        document.removeEventListener('keyup', keyup);
        msgboxBtn1.removeEventListener('click', close);
        msgboxCloseBtn.removeEventListener('click', close);
    }
}

function madConfirm(msg, callback) {
    msgboxMessage.textContent = msg;
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
        if (callback) callback(true);
        removeEvents();
    }
    function close() {
        msgboxBg.style.display = "none";
        if (callback) callback(false);
        removeEvents();
    }
    function removeEvents() {
        document.removeEventListener('keyup', keyup);
        msgboxBtn1.removeEventListener('click', ok);
        msgboxBtn2.removeEventListener('click', close);
        msgboxCloseBtn.removeEventListener('click', close);
    }
}

function madPrompt(msg, callback, hint, text) {
    if (runningMode == WE) { // Wallpaper Engine normally does not support keyboard input
        callback(prompt(msg, text));
        return;
    }
    
    msgboxMessage.textContent = msg;
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
        if (callback) callback(msgboxInput.value);
        removeEvents();
    }
    function close() {
        msgboxBg.style.display = "none";
        if (callback) callback(null);
        removeEvents();
    }
    function removeEvents() {
        document.removeEventListener('keyup', keyup);
        msgboxBtn1.removeEventListener('click', ok);
        msgboxInput.removeEventListener('keyup', ok);
        msgboxBtn2.removeEventListener('click', close);
        msgboxCloseBtn.removeEventListener('click', close);
    }
}

function showDialog() {
    msgboxBg.style.display = "block";
    msgbox.style.top = vHeight / 2 - msgbox.offsetHeight / 2 + "px";
    msgbox.style.left = vWidth / 2 - msgbox.offsetWidth / 2 + "px";
}

function flashDialog() {
    ding.play();
    let cnt = 1;
    let interval = setInterval(function () {
        if (cnt == 18) clearInterval(interval);
        if (cnt % 2) msgboxTitlebar.classList.add("inactive");
        else msgboxTitlebar.classList.remove("inactive");
        cnt++;
    }, 60);
}

function reset(res) {
    if (typeof res === "undefined" || res)
    madConfirm("This will remove every configuration changes of ModernActiveDesktop you made. Are you sure you want to continue?", function (res) {
        if (res) {
            localStorage.clear();
            location.reload(true);
            throw new Error("Refreshing...");
        }
    });
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
    localStorage.madesktopDebugMode = true;
}

function deactivateDebugMode() {
    styleElement.textContent = "";
    localStorage.removeItem("madesktopDebugMode");
    if (debugLog) toggleDebugLog();
    if (runningMode != origRunningMode) {
        runningMode = origRunningMode;
        simulatedModeLabel.textContent = "";
    }
}

function toggleDebugLog() {
    debugLog = !debugLog;
    debugLogBtn.textContent = debugLog ? "Disable debug logging" : "Enable debug logging";
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
    if (runningMode == origRunningMode) simulatedModeLabel.textContent = "";
}

function showErrors() {
    document.getElementById("errorMsg").style.display = "none";
    errorWnd.style.animation = "none";
    errorWnd.style.paddingTop = "8px";
    errorWnd.style.display = "block";
}

// Initialization complete
document.getElementById("location").textContent = location.href;
if (runningMode == WE) runningModeLabel.textContent = "Wallpaper Engine";
origRunningMode = runningMode;
errorWnd.style.display = "none";