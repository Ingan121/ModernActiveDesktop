// libmad.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

(function () {
    if (!frameElement) {
        // minimal MAD APIs fallback for non-MAD environments (or in cross-origin restricted mode)
        const noop = () => {};
        window.madDeskMover = {
            config: {
                src: location.href
            },
            isFullscreen: false
        };
        Object.defineProperties(window.madDeskMover.config, {
            xPos: {
                get: function () {
                    return window.screenX;
                }
            },
            yPos: {
                get: function () {
                    return window.screenY;
                }
            },
            width: {
                get: function () {
                    return window.outerWidth;
                }
            },
            height: {
                get: function () {
                    return window.outerHeight;
                }
            } 
        });

        window.madScaleFactor = 1;
        window.madRunningMode = 0;
        window.madOpenWindow = function (url, temp, optionsOrWidth = {}, heightArg, style, centeredArg, topArg, leftArg) {
            if (url.startsWith("apps/")) {
                url = "../../" + url;
            } else if (!url.endsWith(".html")) {
                url = "../../docs/index.html?src=" + url;
                optionsOrWidth = {
                    width: optionsOrWidth.width || 800,
                    height: optionsOrWidth.height || 600,
                    top: optionsOrWidth.top || 200,
                    left: optionsOrWidth.left || 250
                }
            }
            const width = optionsOrWidth.width || optionsOrWidth;
            const height = optionsOrWidth.height || heightArg;
            const centered = optionsOrWidth.centered || centeredArg;
            const top = centered ? (screen.availHeight - parseInt(height)) / 2 : (optionsOrWidth.top || topArg);
            const left = centered ? (screen.availWidth - parseInt(width)) / 2 : (optionsOrWidth.left || leftArg);
            let specs = "";
            if (width) {
                specs += `width=${width},`;
            }
            if (height) {
                specs += `height=${height},`;
            }
            if (top) {
                specs += `top=${top},`;
            }
            if (left) {
                specs += `left=${left},`;
            }
            const newWnd = window.open(url, "_blank", specs);
            return {
                windowElement: {
                    contentWindow: newWnd,
                    addEventListener: newWnd.addEventListener.bind(newWnd),
                }
            }
        }
        window.madOpenConfig = function (page) {
            if (page === "about") {
                madOpenWindow(`apps/madconf/about.html`, false, 398, 423, "wnd", false, 200, 250);
            } else if (parent === window) {
                alert("This page cannot be opened when not running in ModernActiveDesktop. Please open it from ModernActiveDesktop.");
            } else {
                alert("This page cannot be opened when cross-origin restricted. Please run ModernActiveDesktop with a web server.");
            }
        }
        window.madOpenExternal = function (url) {
            window.open(url, "_blank");
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
        window.madAlert = async function (msg, callback, icon) {
            return new Promise((resolve) => {
                alert(msg);
                if (callback) {
                    callback();
                }
                resolve();
            });
        }
        window.madConfirm = async function (msg, callback) {
            return new Promise((resolve) => {
                const result = confirm(msg);
                if (callback) {
                    callback(result);
                }
                resolve(result);
            });
        }
        window.madPrompt = async function (msg, callback, hint, text) {
            return new Promise((resolve) => {
                const result = prompt(msg, text);
                if (callback) {
                    callback(result);
                }
                resolve(result);
            });
        }
        window.madAnnounce = function (type) {
            window.postMessage({ type }, "*");
            if (window.opener) {
                window.opener.postMessage({ type }, "*");
            }
        }
        window.madCloseWindow = window.close;
        window.madResizeTo = window.resizeTo;
        window.madMoveTo = window.moveTo;
        window.madBringToTop = window.focus;

        window.madEnterFullscreen = function () {
            window.madDeskMover.isFullscreen = true;
            document.body.dataset.fullscreen = true;
            document.documentElement.requestFullscreen();
        }
        window.madExitFullscreen = function () {
            window.madDeskMover.isFullscreen = false;
            delete document.body.dataset.fullscreen;
            document.exitFullscreen();
        }

        window.madSetIcon = noop;
        window.madSetResizeArea = noop;
        window.madSetResizable = noop;
        window.madChangeWndStyle = noop;
        window.madOpenMiniColorPicker = noop;
        window.madOpenColorPicker = noop;
        window.madPlaySound = noop;
        window.madExtendMoveTarget = noop;
        return;
    }

    const parentStyleElement = top.document.getElementById("style");
    const parentSchemeElement = top.document.getElementById("scheme");
    const parentMenuStyleElement = top.document.getElementById("menuStyle");
    const schemeElement = document.getElementById("scheme");
    const menuStyleElement = document.getElementById("menuStyle");
    const styleElement = document.getElementById("style");
    const deskMoverNum = frameElement.dataset.num || 0;
    const deskMover = top.deskMovers[deskMoverNum];
    const config = deskMover.config;

    applyScheme(true);
    applyMargins();

    window.addEventListener("message", (event) => {
        switch (event.data.type) {
            case "scheme-updated":
                applyScheme();
                break;
            case "sysplug-option-changed":
                applyMargins();
                break;
        }
    });

    function applyScheme(startup) {
        if (schemeElement && !startup) { // Do this on onload instead of startup, as non-dataurl schemes loads slowly
            processTheme();
        }
        schemeElement.href = parentSchemeElement.href;

        if (localStorage.madesktopNoPixelFonts) {
            document.documentElement.style.setProperty('--ui-font', 'sans-serif');
        } else {
            document.documentElement.style.removeProperty('--ui-font');
        }

        if (menuStyleElement) {
            const menuConfig = localStorage.madesktopMenuStyle;
            if (menuConfig) {
                menuStyleElement.href = parentMenuStyleElement.href;
                if (menuConfig.includes("mb") || localStorage.madesktopColorScheme === "7css4mad") {
                    document.body.dataset.noSunkenMenus = true;
                } else {
                    delete document.body.dataset.noSunkenMenus;
                }
            } else {
                menuStyleElement.href = "";
                if (localStorage.madesktopColorScheme === "7css4mad") {
                    document.body.dataset.noSunkenMenus = true;
                } else {
                    delete document.body.dataset.noSunkenMenus;
                }
            }
        }

        if (localStorage.madesktopCmAnimation === "fade") {
            document.body.dataset.cmFade = true;
        } else {
            delete document.body.dataset.cmFade;
        }

        if (localStorage.madesktopCmShadow) {
            document.body.dataset.cmShadow = true;
        } else {
            delete document.body.dataset.cmShadow;
        }

        try {
            document.documentElement.style.setProperty('--hilight-inverted', top.invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
        } catch {
            document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
        }

        changeUnderline(!localStorage.madesktopHideUnderline);

        if (window.osguiCompatRequired && localStorage.madesktopColorScheme === "7css4mad") {
            if (localStorage.madesktopAeroColor) {
                changeAeroColor(localStorage.madesktopAeroColor);
            }
            changeAeroGlass(localStorage.madesktopAeroNoGlass);
        }
        changeWinShadow(localStorage.madesktopNoWinShadow);
    }

    function applyMargins() {
        document.documentElement.style.setProperty('--mad-margin-top', parseInt(localStorage.madesktopChanViewTopMargin || 0) + 'px');
        document.documentElement.style.setProperty('--mad-margin-left', parseInt(localStorage.madesktopChanViewLeftMargin || 75) + 'px');
        document.documentElement.style.setProperty('--mad-margin-right', parseInt(localStorage.madesktopChanViewRightMargin || 0) + 'px');
        document.documentElement.style.setProperty('--mad-margin-bottom', parseInt(localStorage.madesktopChanViewBottomMargin || 48) + 'px');
    }

    if (styleElement) {
        window.addEventListener("load", processTheme);
    }

    function processTheme() {
        styleElement.textContent = parentStyleElement.textContent;

        if (top.isDarkColor(getComputedStyle(top.document.documentElement).getPropertyValue('--button-face'))) {
            if (window.osguiCompatRequired) {
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

        if (window.osguiCompatRequired) {
            setTimeout(() => {
                applyCSSProperties(renderThemeGraphics(getComputedStyle(document.body)), { element: document.body });
            }, 100);
        }

        try {
            document.documentElement.style.setProperty('--hilight-inverted', top.invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
        } catch {
            document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
        }
    }

    function changeAeroColor(color) {
        document.documentElement.style.setProperty('--title-accent', color || '#4580c4');
    }
    
    function changeAeroGlass(noGlass) {
        if (noGlass) {
            document.body.dataset.noGlass = true;
        } else {
            delete document.body.dataset.noGlass;
        }
    }

    function changeUnderline(show) {
        if (show) {
            delete document.body.dataset.noUnderline;
        } else {
            document.body.dataset.noUnderline = true;
        }
    }

    function changeWinShadow(isNoShadow) {
        if (isNoShadow) {
            document.body.dataset.noWinShadow = true;
        } else {
            delete document.body.dataset.noWinShadow;
        }
    }

    Object.defineProperties(window, {
        madScaleFactor: {
            get: function () {
                if (config.unscaled) {
                    return 1;
                } else {
                    return parseFloat(top.scaleFactor);
                }
            }
        },
        madRunningMode: {
            get: function () {
                return top.runningMode;
            }
        }
    });

    // jspaint stuff
    window.systemHooks = {
        setWallpaperTiled: (canvas) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = function () {
                    top.changeBgType("image");
                    top.changeBgImgMode("grid");
                    localStorage.madesktopBgType = "image";
                    localStorage.madesktopBgImgMode = "grid";
                    const b64str = reader.result.split(";base64,")[1];
                    top.document.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
                    localStorage.madesktopBgImg = b64str;
                };
                reader.readAsDataURL(blob);
            });
        },
        setWallpaperCentered: (canvas) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = function () {
                    top.changeBgType("image");
                    top.changeBgImgMode("center");
                    localStorage.madesktopBgType = "image";
                    localStorage.madesktopBgImgMode = "center";
                    const b64str = reader.result.split(";base64,")[1];
                    top.document.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
                    localStorage.madesktopBgImg = b64str;
                };
                reader.readAsDataURL(blob);
            });
        }
    };

    // custom dropdown
    class MadSelect extends HTMLElement {
        constructor() {
            super();
            this.selectedIndexReal = 0;

            Object.defineProperties(this, {
                options: {
                    get: function () {
                        return this.querySelectorAll("option");
                    }
                },
                selectedIndex: {
                    get: function () {
                        return this.selectedIndexReal;
                    },
                    set: function (value) {
                        if (isNaN(value)) {
                            return;
                        }
                        this.selectedIndexReal = parseInt(value);
                        for (const option of this.options) {
                            option.selected = false;
                        }
                        this.options[this.selectedIndexReal].selected = true;
                        this.label.textContent = this.options[this.selectedIndexReal].textContent;
                    }
                },
                value: {
                    get: function () {
                        return this.options[this.selectedIndex].value;
                    },
                    set: function (value) {
                        for (const option of this.options) {
                            if (option.value === value) {
                                this.selectedIndex = Array.from(this.options).indexOf(option);
                                this.label.textContent = option.textContent;
                                return;
                            }
                        }
                        this.label.textContent = this.options[this.selectedIndex].textContent;
                    }
                },
                disabled: {
                    get: function () {
                        return this.dataset.disabled;
                    },
                    set: function (value) {
                        if (value) {
                            this.dataset.disabled = true;
                        } else {
                            delete this.dataset.disabled;
                        }
                    }
                }
            });
        }
        
        connectedCallback() {
            const scrollBarSize = parseInt(getComputedStyle(document.body).getPropertyValue("--scrollbar-size"));
            this.label = document.createElement("span");
            this.label.classList.add("label");
            this.style.minWidth = 30 + scrollBarSize + "px";
            let maxWidth = 0;

            for (const option of this.options) {
                if (option.selected) {
                    this.selectedIndex = Array.from(this.options).indexOf(option);
                }

                const width = getTextWidth(option.textContent.trim(), "11px " + getComputedStyle(document.documentElement).getPropertyValue("--ui-font"));
                if (width > maxWidth) {
                    maxWidth = width;
                }

                new MutationObserver((mutations) => {
                    if (this.value === option.value) {
                        this.label.textContent = option.textContent;
                    }
                }).observe(
                    option,
                    { characterData: false, attributes: false, childList: true, subtree: false }
                )
            }
            this.style.minWidth = maxWidth + 20 + scrollBarSize + "px";

            if (this.getAttribute('disabled') !== null) {
                this.dataset.disabled = true;
            }
            
            this.label.textContent = this.options[this.selectedIndex].textContent;
            this.insertAdjacentElement("afterbegin", this.label);

            this.addEventListener("click", () => {
                if (!this.disabled) {
                    deskMover.openDropdown(this);
                }
            });

            window.addEventListener("message", (event) => {
                if (event.data.type === "language-ready") {
                    this.label.textContent = this.options[this.selectedIndex].textContent;
                }
            });
        }
    }
    customElements.define("mad-select", MadSelect);

    // expose MAD APIs
    window.madDeskMover = deskMover;
    window.madOpenWindow = top.openWindow;
    window.madOpenConfig = top.openConfig;
    window.madOpenExternal = top.openExternal;

    window.madBringToTop = deskMover.bringToTop.bind(deskMover);
    window.madOpenDropdown = deskMover.openDropdown.bind(deskMover);
    window.madOpenMiniColorPicker = deskMover.openMiniColorPicker.bind(deskMover);
    window.madOpenColorPicker = deskMover.openColorPicker.bind(deskMover);
    window.madLocReplace = deskMover.locReplace.bind(deskMover);
    window.madResizeTo = deskMover.resizeTo.bind(deskMover);
    window.madMoveTo = deskMover.moveTo.bind(deskMover);
    window.madSetIcon = deskMover.setIcon.bind(deskMover);
    window.madChangeWndStyle = deskMover.changeWndStyle.bind(deskMover);
    window.madExtendMoveTarget = deskMover.extendMoveTarget.bind(deskMover);
    window.madEnterFullscreen = deskMover.enterFullscreen.bind(deskMover);
    window.madExitFullscreen = deskMover.exitFullscreen.bind(deskMover);
    window.madSetResizeArea = deskMover.setResizeArea.bind(deskMover);
    window.madSetResizable = deskMover.toggleResizable.bind(deskMover);
    window.madCloseWindow = deskMover.closeWindow.bind(deskMover);

    window.madAlert = top.madAlert;
    window.madConfirm = top.madConfirm;
    window.madPrompt = top.madPrompt;
    window.madPlaySound = top.playSound;
    window.madAnnounce = top.announce;
})();

/**
  * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
  * 
  * @param {String} text The text to be rendered.
  * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
  * 
  * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
  */
function getTextWidth(text, font = getComputedStyle(document.documentElement).getPropertyValue("--menu-font")) {
    // re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}