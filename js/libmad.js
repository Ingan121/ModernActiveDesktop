// libmad.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// This script is a collection of functions that are used by the built-in
//   apps of ModernActiveDesktop that are run in the iframe of DeskMovers.
// This script implements the following:
//  - MAD APIs for easier access of the MAD and DeskMover functions.
//  - Custom dropdown element for more design flexibility.
//  - JS Paint systemHooks for setting wallpaper.
//  - Apply the main theme and styles to the iframe.
// This script also provides a fallback for non-MAD environments or in
//   cross-origin restricted mode so that the apps can still run to some extent.
// Dependencies: functions.js (required by the custom dropdown and theme functions)

(function () {
    if (!frameElement || // Not running in iframe, or running in cross-origin restricted mode
        !top.madMainWindow // Top window is not MAD (SecurityError if cross-origin but should not reach here in that case)
    ) {
        setupFallback();
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

    window.log = top.log;

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
            document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
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
        new MutationObserver((mutations) => {
            styleElement.textContent = parentStyleElement.textContent;
        }).observe(
            parentStyleElement,
            { characterData: false, attributes: false, childList: true, subtree: false }
        );
        window.addEventListener("load", processTheme);
    }

    function processTheme() {
        styleElement.textContent = parentStyleElement.textContent;

        if (isDarkColor(getComputedStyle(top.document.documentElement).getPropertyValue('--button-face'))) {
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
            document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
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
                if (config.unscaled || top.isIframeAutoScaled || navigator.userAgent.includes("Firefox")) {
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
        },
        madKbdSupport: {
            get: function () {
                return top.kbdSupport;
            }
        }
    });

    // jspaint stuff
    window.systemHooks = {
        setWallpaperTiled: (canvas) => {
            canvas.toBlob((blob) => {
                top.changeBgType("image", false);
                top.changeBgImgMode("grid");
                localStorage.madesktopBgType = "image";
                localStorage.madesktopBgImgMode = "grid";
                top.document.body.style.backgroundImage = "url('" + URL.createObjectURL(blob) + "')";
                madIdb.setItem("bgImg", blob);
            });
        },
        setWallpaperCentered: (canvas) => {
            canvas.toBlob((blob) => {
                top.changeBgType("image", false);
                top.changeBgImgMode("center");
                localStorage.madesktopBgType = "image";
                localStorage.madesktopBgImgMode = "center";
                top.document.body.style.backgroundImage = "url('" + URL.createObjectURL(blob) + "')";
                madIdb.setItem("bgImg", blob);
            });
        }
    };

    if (top !== parent || // Running in a nested iframe (e.g. ChannelViewer sidebar)
        frameElement.id === "bgHtmlView" || // Running as bgHtmlView (in madMainWindow or wp_preview)
        frameElement.dataset.num === undefined // Running in a non-DeskMover iframe
    ) {
        setupFallback();
        return; // Below requires the DeskMover interface
    }

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
            this.label = document.createElement("span");
            this.label.classList.add("label");

            for (const option of this.options) {
                if (option.selected) {
                    this.selectedIndex = Array.from(this.options).indexOf(option);
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
                    this.adjustMinWidth();
                }
            });

            window.addEventListener("load", this.adjustMinWidth.bind(this));
        }

        adjustMinWidth() {
            const scrollBarSize = parseInt(getComputedStyle(document.body).getPropertyValue("--scrollbar-size"));
            let maxWidth = 0;
            for (const option of this.options) {
                const width = getTextWidth(option.textContent.trim(), "11px " + getComputedStyle(document.documentElement).getPropertyValue("--ui-font"));
                if (width > maxWidth) {
                    maxWidth = width;
                }
            }
            this.style.minWidth = maxWidth + 20 + scrollBarSize + "px";
        }
    }
    customElements.define("mad-select", MadSelect);

    // expose MAD APIs
    window.madIdb = top.madIdb;
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

    // minimal MAD APIs fallback for running without the DeskMover interface
    function setupFallback() {
        const madStillAvailable = !!frameElement && top.madMainWindow;

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

        if (madStillAvailable) {
            window.madIdb = top.madIdb;
            window.madOpenWindow = top.openWindow;
            window.madOpenConfig = top.openConfig;
            window.madOpenExternal = top.openExternal;
            window.madAlert = top.madAlert;
            window.madConfirm = top.madConfirm;
            window.madPrompt = top.madPrompt;
            window.madPlaySound = top.playSound;
            window.madAnnounce = top.announce;
        } else {
            window.madScaleFactor = 1;
            window.madRunningMode = 0;
            window.madKbdSupport = 1;

            // window.madIdb: include DeskSettings.js if you need it in non-MAD environments
            window.log = function (str, level, caller) {
                if (!caller) {
                    caller = getCaller();
                }
                if (typeof str === "object") {
                    str = JSON.stringify(str);
                }
                console[level || 'log'](caller + ": " + str);
            }
            window.madOpenWindow = function (url, temp, optionsOrWidth = {}, heightArg, style, centeredArg, topArg, leftArg) {
                if (url.startsWith("apps/") && location.href.includes("/apps/")) {
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
            window.madPlaySound = noop;
        }

        window.madOpenDropdown = function (elem) {
            return;
        }
        window.madLocReplace = function (url) {
            if (url.startsWith("apps/") && location.href.includes("/apps/")) {
                url = "../../" + url;
            }
            location.replace(url);
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
        window.madExtendMoveTarget = noop;

        window.madFallbackMode = true;
    }
})();