let windowContainers = document.getElementsByClassName("windowContainer");
const bgHtmlContainer = document.getElementById("bgHtmlContainer");
const bgHtmlView = document.getElementById("bgHtmlView");
const bgVideoView = document.getElementById("bgVideo");
const schemeElement = document.getElementById("scheme");

const chord = new Audio("sounds/chord.wav");
const ding = new Audio("sounds/ding.wav");
const startup = new Audio("sounds/The Microsoft Sound.wav");

const WINDOW_PLACEHOLDER = "data:text/html,<body style='background-color: white'>⮡ Click this button to configure</body>";
const NO_SYSPLUG_ALERT = "System plugin is not running. Please make sure you have installed it properly. If you don't want to use it, please disable the system plugin integration option.";

let lastZIndex = 0;

let scaleFactor = 1;
let vWidth = window.innerWidth;
let vHeight = window.innerHeight;

// Load configs
if (localStorage.madesktopBgColor) document.body.style.backgroundColor = localStorage.madesktopBgColor;
changeBgType(localStorage.madesktopBgType || "color");
changeBgImgMode(localStorage.madesktopBgImgMode || "center");
if (localStorage.madesktopBgVideoMuted) bgVideoView.muted = true;
if (localStorage.madesktopBgHtmlSrc) bgHtmlView.src = localStorage.madesktopBgHtmlSrc;
if (localStorage.madesktopColorScheme) changeColorScheme(localStorage.madesktopColorScheme);
changeScale(localStorage.madesktopScaleFactor);
const useNonADStyle = localStorage.madesktopNonADStyle; // non-ActiveDesktop styling

initDeskMover(0);

if (localStorage.madesktopItemCount) {
    if (localStorage.madesktopItemCount > 1) {
        for (let i = 0; i < localStorage.madesktopItemCount - 1; i++) createNewDeskItem();
    }
} else {
    localStorage.madesktopItemCount = 1;
}

if (localStorage.madesktopLastVer == "2.0") { // Update from 2.0
    createNewDeskItem("Updated.md");
    localStorage.madesktopItemCount++;
} else if (localStorage.madesktopLastVer != "2.1") { // First run or update from 1.x
    createNewDeskItem("README.md");
    localStorage.madesktopItemCount++;
}
localStorage.madesktopLastVer = "2.1";

if (localStorage.madesktopItemVisible == "false") windowContainers[0].style.display = "none";

// Change the scale on load
bgHtmlView.addEventListener('load', function () {
    this.contentDocument.body.style.zoom = scaleFactor;
});

if (typeof wallpaperOnVideoEnded !== "function") { // Check if not running in Wallpaper Engine
    bgHtmlContainer.style.display = "none";
    document.getElementById("newbtn").style.display = "block";
}

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
                if (localStorage.madesktopItemVisible == "false") {
                    windowContainers[0].style.display = "block";
                    localStorage.removeItem("madesktopItemVisible");
                } else {
                    createNewDeskItem();
                    localStorage.madesktopItemCount++;
                }
            }
        }
        if (properties.nonadstyle) {
            if (properties.nonadstyle.value) localStorage.madesktopNonADStyle = true;
            else localStorage.removeItem("madesktopNonADStyle");
            if (!properties.bgcolor) location.reload();
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
                            alert("An error occurred!\nSystem plugin response: " + responseText);
                        }
                    })
                    .catch(error => {
                        alert(NO_SYSPLUG_ALERT);
                        createNewDeskItem("SysplugSetupGuide.md", true);
                        localStorage.madesktopItemCount++;
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
                                alert("An error occurred!\nSystem plugin response: " + responseText);
                            }
                        })
                        .catch(error => {
                            alert(NO_SYSPLUG_ALERT);
                            createNewDeskItem("SysplugSetupGuide.md", true);
                            localStorage.madesktopItemCount++;
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
                if (confirm("If you want to reset all the configurations completely, please cancel now, click the big red Reset button below first, then click this button again and continue.")) {
                    if (confirm("This will remove every configuration changes of ModernActiveDesktop you made. Are you sure you want to continue?")) {
                        localStorage.clear();
                        alert("Reset complete. The wallpaper will now reload.");
                        location.reload(true);
                    }
                }
            }
        }
    }
};

function changeBgType(type) {
    switch(type) {
        case 'color':
            document.body.style.backgroundImage = "none";
            bgHtmlContainer.style.display = "none";
            bgVideoView.style.display = "none";
            bgVideoView.src = "";
            break;
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
    console.log({scaleFactor, vWidth, vHeight, dpi: 96 * scaleFactor});
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
function createNewDeskItem(openDoc, temp) {
    const newContainer = windowContainers[0].cloneNode(true);
    document.body.appendChild(newContainer);
    windowContainers = document.getElementsByClassName("windowContainer");
    initDeskMover(windowContainers.length - 1, openDoc, temp);
}

// Required as mouse movements over iframes are not detectable in the parent document
function iframeClickEventCtrl(clickable) {
    const value = clickable ? "auto" : "none";
    bgHtmlView.style.pointerEvents = value;
    for (let i = 0; i < windowContainers.length; i++)
        windowContainers[i].style.pointerEvents = value;
}

// Change the scaleFactor of all iframes
function updateIframeScale() {
    try {
        bgHtmlView.contentDocument.body.style.zoom = scaleFactor;
    } catch {
        // page did not load yet
    }
    for (let i = 0; i < windowContainers.length; i++) {
        try {
            windowContainers[i].getElementsByClassName("windowElement")[0].contentDocument.body.style.zoom = scaleFactor;
        } catch {
            // attempting to do this on destroyed deskitems
            // or page did not load yet
            // it works on external webpages thanks to the new WE iframe policy
        }
    }
}

// Just for debugging
function debug() {
    eval(prompt("Enter JavaScript code to run. (for debugging)"));
    function loadEruda() { // Load Eruda devtools (but Chrome DevTools is better)
        const script = document.createElement('script');
        script.src="https://cdn.jsdelivr.net/npm/eruda";
        document.body.appendChild(script);
        script.onload = function () {
            eruda.init();
        };
    }
}

// Initialization complete
document.getElementById("errorWnd").style.display = "none";