'use strict';

(function () {
    if (!frameElement) {
        window.madScaleFactor = 1;
        window.madRunningMode = 0;
        window.madOpenWindow = function (url, temp, width, height, style) {
            if (url.startsWith("apps/")) {
                url = "../../" + url;
            }
            window.open(url, "_blank", `width=${width},height=${height}`);
        }
        window.madOpenDropdown = function (elem) {
            return;
        }
        window.madLocReplace = function (url) {
            if (url.startsWith("apps/")) {
                url = "../../" + url;
            }
            location.replace(url);
        }
        window.madAlert = function (msg, callback, icon) {
            alert(msg);
            if (callback) {
                callback();
            }
        }
        window.madConfirm = function (msg, callback) {
            const result = confirm(msg);
            if (callback) {
                callback(result);
            }
        }
        window.madPrompt = function (msg, callback, hint, text) {
            const result = prompt(msg, text);
            if (callback) {
                callback(result);
            }
        }
        window.madCloseWindow = window.close;
        return;
    }

    const parentSchemeElement = parent.document.getElementById("scheme");
    const parentMenuStyleElement = parent.document.getElementById("menuStyle");
    const parentFontElement = parent.document.getElementById("font");
    const schemeElement = document.getElementById("scheme");
    const fontElement = document.getElementById("font");
    const menuStyleElement = document.getElementById("menuStyle");
    const styleElement = document.getElementById("style");
    const deskMoverNum = frameElement.dataset.num || 0;
    const deskMover = parent.deskMovers[deskMoverNum];
    const config = deskMover.config;

    applyScheme(true);

    window.addEventListener("message", (event) => {
        if (event.data.type === "scheme-updated") {
            applyScheme();
        }
    });

    function applyScheme(startup) {
        if (styleElement && window.osguiCompatRequired) {
            if (parentSchemeElement.href !== "data:text/css,") {
                // OS-GUI Compatibility
                styleElement.textContent = `:root {
                    --ActiveBorder: var(--active-border);
                    --ActiveTitle: var(--active-title);
                    --AppWorkspace: var(--app-workspace);
                    --Background: var(--background);
                    --ButtonAlternateFace: var(--button-alternate-face);
                    --ButtonDkShadow: var(--button-dk-shadow);
                    --ButtonFace: var(--button-face);
                    --ButtonHilight: var(--button-hilight);
                    --ButtonLight: var(--button-light);
                    --ButtonShadow: var(--button-shadow);
                    --ButtonText: var(--button-text);
                    --GradientActiveTitle: var(--gradient-active-title);
                    --GradientInactiveTitle: var(--gradient-inactive-title);
                    --GrayText: var(--gray-text);
                    --Hilight: var(--hilight);
                    --HilightText: var(--hilight-text);
                    --HotTrackingColor: var(--hot-tracking-color);
                    --InactiveBorder: var(--inactive-border);
                    --InactiveTitle: var(--inactive-title);
                    --InactiveTitleText: var(--inactive-title-text);
                    --InfoText: var(--info-text);
                    --InfoWindow: var(--info-window);
                    --Menu: var(--menu);
                    --MenuText: var(--menu-text);
                    --Scrollbar: var(--scrollbar);
                    --TitleText: var(--title-text);
                    --Window: var(--window);
                    --WindowFrame: var(--window-frame);
                    --WindowText: var(--window-text);
                }`;
                // jspaint dark theme stuff
                if (!startup) { // Do this on onload instead, as non-dataurl schemes loads slowly
                    if (parentSchemeElement.href.startsWith("file:///")) {
                        // Well these load slower, so let's just use the light theme on theme change as current two css themes are light ones
                    } else {
                        processJSPaintDarkTheme();
                    }
                }
            } else {
                styleElement.textContent = "";
            }
        }
        schemeElement.href = parentSchemeElement.href;

        if (fontElement) {
            if (localStorage.madesktopNoPixelFonts) {
                fontElement.href = parentFontElement.href;
            } else {
                fontElement.href = "";
            }
        }

        if (menuStyleElement) {
            const menuConfig = localStorage.madesktopMenuStyle;
            if (menuConfig) {
                menuStyleElement.href = parentMenuStyleElement.href;
            } else {
                menuStyleElement.href = "";
            }
        }

        try {
            document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
        } catch {
            document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
        }
    }

    if (styleElement && window.osguiCompatRequired) {
        window.onload = processJSPaintDarkTheme;
    }

    function processJSPaintDarkTheme() {
        if (isDarkColor(getComputedStyle(parent.document.documentElement).getPropertyValue('--button-face'))) {
            styleElement.textContent += `
                .tool-icon {
                    background-image: url("images/dark/tools.png");
                    background-repeat: no-repeat;
                    background-position: calc(-16px * var(--icon-index)) 0;
                }
                .tool-icon.use-svg {
                    background-image: url("images/dark/tools.svg");
                    background-position: calc(-16px * (var(--icon-index) * 2 + 1)) -16px;
                }
            `;
        }
    }
    
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

    // http://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
    function isDarkColor(color) {
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

    Object.defineProperty(window, "madScaleFactor", {
        get: function () {
            if (config.unscaled) {
                return 1;
            } else {
                return parseFloat(parent.scaleFactor);
            }
        }
    });

    Object.defineProperty(window, "madRunningMode", {
        get: function () {
            return parent.runningMode;
        }
    });

    // jspaint stuff
    window.systemHooks = {
        setWallpaperTiled: (canvas) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = function () {
                    parent.changeBgType("image");
                    parent.changeBgImgMode("grid");
                    localStorage.madesktopBgType = "image";
                    localStorage.madesktopBgImgMode = "grid";
                    const b64str = reader.result.split(";base64,")[1];
                    parent.document.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
                    localStorage.madesktopBgImg = b64str;
                };
                reader.readAsDataURL(blob);
            });
        },
        setWallpaperCentered: (canvas) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = function () {
                    parent.changeBgType("image");
                    parent.changeBgImgMode("center");
                    localStorage.madesktopBgType = "image";
                    localStorage.madesktopBgImgMode = "center";
                    const b64str = reader.result.split(";base64,")[1];
                    parent.document.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
                    localStorage.madesktopBgImg = b64str;
                };
                reader.readAsDataURL(blob);
            });
        }
    };

    // expose MAD APIs
    window.madDeskMover = deskMover;
    window.madOpenWindow = parent.openWindow;

    window.madOpenDropdown = deskMover.openDropdown.bind(deskMover);
    window.madOpenColorPicker = deskMover.openColorPicker.bind(deskMover);
    window.madLocReplace = deskMover.locReplace.bind(deskMover);
    window.madResizeTo = deskMover.resizeTo.bind(deskMover);
    window.madMoveTo = deskMover.moveTo.bind(deskMover);
    window.madSetIcon = deskMover.setIcon.bind(deskMover);
    window.madChangeWndStyle = deskMover.changeWndStyle.bind(deskMover);
    window.madCloseWindow = deskMover.closeWindow.bind(deskMover);

    window.madAlert = parent.madAlert;
    window.madConfirm = parent.madConfirm;
    window.madPrompt = parent.madPrompt;
    window.madPlaySound = parent.playSound;
})();