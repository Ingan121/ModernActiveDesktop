// libmad.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

(function () {
    if (!frameElement) {
        // minimal MAD APIs fallback for non-MAD environments (or in cross-origin restricted mode)
        const noop = () => {};
        window.madScaleFactor = 1;
        window.madRunningMode = 0;
        window.madOpenWindow = function (url, temp, width, height, style) {
            if (url.startsWith("apps/")) {
                url = "../../" + url;
            }
            window.open(url, "_blank", `width=${width},height=${height}`);
        }
        window.madOpenConfig = function (page) {
            madOpenWindow(`apps/madconf/${page}.html`, false, 398, 423);
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
        window.madResizeTo = window.resizeTo;
        window.madMoveTo = window.moveTo;
        window.madBringToTop = window.focus;

        window.madSetIcon = noop;
        window.madChangeWndStyle = noop;
        window.madOpenMiniColorPicker = noop;
        window.madOpenColorPicker = noop;
        window.madPlaySound = noop;
        window.madExtendMoveTarget = noop;
        return;
    }

    const parentStyleElement = parent.document.getElementById("style");
    const parentSchemeElement = parent.document.getElementById("scheme");
    const parentMenuStyleElement = parent.document.getElementById("menuStyle");
    const schemeElement = document.getElementById("scheme");
    const menuStyleElement = document.getElementById("menuStyle");
    const styleElement = document.getElementById("style");
    const deskMoverNum = frameElement.dataset.num || 0;
    const deskMover = parent.deskMovers[deskMoverNum];
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
            } else {
                menuStyleElement.href = "";
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
            document.documentElement.style.setProperty('--hilight-inverted', parent.invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
        } catch {
            document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
        }

        if (window.osguiCompatRequired && localStorage.madesktopColorScheme === "7css4mad") {
            if (localStorage.madesktopAeroColor) {
                changeAeroColor(localStorage.madesktopAeroColor);
            }
            changeAeroGlass(localStorage.madesktopAeroNoGlass);
        }
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

        if (parent.isDarkColor(getComputedStyle(parent.document.documentElement).getPropertyValue('--button-face'))) {
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
            applyCSSProperties(renderThemeGraphics(getComputedStyle(document.body)), { element: document.body });
        }

        try {
            document.documentElement.style.setProperty('--hilight-inverted', parent.invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
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

    Object.defineProperties(window, {
        madScaleFactor: {
            get: function () {
                if (config.unscaled) {
                    return 1;
                } else {
                    return parseFloat(parent.scaleFactor);
                }
            }
        },
        madRunningMode: {
            get: function () {
                return parent.runningMode;
            }
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
                        this.selectedIndexReal = value;
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
        }
    }
    customElements.define("mad-select", MadSelect);

    // expose MAD APIs
    window.madDeskMover = deskMover;
    window.madOpenWindow = parent.openWindow;
    window.madOpenConfig = parent.openConfig;

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
    window.madCloseWindow = deskMover.closeWindow.bind(deskMover);

    window.madAlert = parent.madAlert;
    window.madConfirm = parent.madConfirm;
    window.madPrompt = parent.madPrompt;
    window.madPlaySound = parent.playSound;
})();