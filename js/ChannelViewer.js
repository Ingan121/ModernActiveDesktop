const bgHtmlView = document.getElementById("bgHtml");
const iframe = document.getElementById("iframe");
const container = document.getElementById("container");
const schemeElement = document.getElementById("scheme");
let scaleFactor = 1;

// Load configs
if (localStorage.madesktopBgColor) document.body.style.backgroundColor = localStorage.madesktopBgColor;
changeBgType(localStorage.madesktopBgType || "color");
changeBgImgMode(localStorage.madesktopBgImgMode || "center");
if (localStorage.madesktopBgHtmlSrc) bgHtmlView.src = localStorage.madesktopBgHtmlSrc;
if (localStorage.madesktopColorScheme) changeColorScheme(localStorage.madesktopColorScheme);
if (localStorage.madesktopChanViewLeftMargin) container.style.marginLeft = localStorage.madesktopChanViewLeftMargin;
if (localStorage.madesktopChanViewRightMargin) container.style.marginRight = localStorage.madesktopChanViewRightMargin;
changeScale(localStorage.madesktopScaleFactor);


// Change the scale on load
bgHtmlView.addEventListener('load', function () {
    this.contentDocument.body.style.zoom = scaleFactor;
    hookIframeSize(this);
});

iframe.addEventListener('load', function () {
    this.contentDocument.body.style.zoom = scaleFactor;
    hookIframeSize(this);
});

// Detect WE config change
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.bgtype) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                changeBgType(properties.bgtype.value);
                localStorage.madesktopBgType = properties.bgtype.value;
            }
        }
        if (properties.bgcolor) {
            changeBgColor(parseWallEngColorProp(properties.bgcolor.value));
        }
        if (properties.bgimg) {
            if (properties.bgimg.value) {
                const path = "file:///" + properties.bgimg.value;
                document.body.style.backgroundImage = "url('" + path + "')";
                localStorage.madesktopBgImg = path;
            } else {
                document.body.style.backgroundImage = 'none';
                localStorage.removeItem('madesktopBgImg');
            }
        }
        if (properties.bgimgmode) {
            changeBgImgMode(properties.bgimgmode.value);
            localStorage.madesktopBgImgMode = properties.bgimgmode.value;
        }
        if (properties.bgvideo) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                if (properties.bgvideo.value) {
                    localStorage.madesktopBgVideo = "file:///" + properties.bgvideo.value;
                } else {
                    localStorage.removeItem('madesktopBgVideo');
                }
            }
        }
        if (properties.bgvideomute) {
            if (!properties.leftmargin) { // Ignore if this is a startup event
                if (properties.bgvideomute.value) {
                    localStorage.madesktopBgVideoMuted = true;
                } else {
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
                alert("Please close ChannelViewer first then try again.");
            }
        }
        if (properties.leftmargin) {
            const str = isNaN(properties.leftmargin.value) ? properties.leftmargin.value : properties.leftmargin.value + 'px';
            container.style.marginLeft = str;
            localStorage.madesktopChanViewLeftMargin = str;
        }
        if (properties.rightmargin) {
            const str = isNaN(properties.rightmargin.value) ? properties.rightmargin.value : properties.rightmargin.value + 'px';
            container.style.marginRight = str;
            localStorage.madesktopChanViewRightMargin = str;
        }
        if (properties.sysplugintegration) {
            if (!properties.bgcolor) { // Ignore if this is a startup event
                if (properties.sysplugintegration.value) {
                    localStorage.sysplugIntegration = true;
                    location.href = 'index.html';
                } else {
                    localStorage.removeItem("sysplugIntegration");
                    if (localStorage.madesktopColorScheme == "sys") localStorage.removeItem("madesktopColorScheme");
                }
            }
        }
        if (properties.openwith) {
            if (!properties.bgcolor) { // Ignore if this is a startup event
                // This should never happen
                location.href = 'index.html';
            }
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
                        location.href = 'index.html';
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
            bgHtmlView.style.display = "none";
            break;
        case 'image':
            loadBgImgConf();
            bgHtmlView.style.display = "none";
            break;
        case 'video':
            document.body.style.backgroundImage = "none";
            bgHtmlView.style.display = "none";
            break;
        case 'web':
            document.body.style.backgroundImage = "none";
            bgHtmlView.style.display = "block";
            break;
    }
}

function changeBgColor(str) {
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
    document.body.style.zoom = scaleFactor;
    updateIframeScale();
    console.log({scaleFactor, dpi: 96 * scaleFactor});
}

// Change the scaleFactor of all iframes
function updateIframeScale() {
    try {
        bgHtmlView.contentDocument.body.style.zoom = scaleFactor;
    } catch {
        // page did not load yet
    }
    try {
        iframe.contentDocument.body.style.zoom = scaleFactor;
    } catch {
        // page did not load yet
        // it works on external webpages thanks to the new WE iframe policy
    }
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

// Just for debugging
function debug() {
    eval(prompt("실행할 자바스크립트 코드를 입력하십시오. (디버깅용)"));
    function loadEruda() { // Load Eruda devtools (but Chrome DevTools is better)
        const script = document.createElement('script');
        script.src="https://cdn.jsdelivr.net/npm/eruda";
        document.body.appendChild(script);
        script.onload = function () {
            eruda.init();
        };
    }
}

const url = new URL(location.href);
if (url.searchParams.get("sb") !== null) iframe.sandbox = "allow-modals allow-scripts";
iframe.src = url.searchParams.get("page") || "data:text/plain,Nothing loaded!";
iframe.contentWindow.onunload = function () {
    document.getElementById('loadingText').style.display = 'block';
}

// Initialization complete
document.getElementById("errorWnd").style.display = "none";