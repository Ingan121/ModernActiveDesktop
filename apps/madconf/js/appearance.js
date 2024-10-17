// appearance.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

let scheme = {};
let fonts = [
    "Pixelated MS Sans Serif",
    "Fixedsys Excelsior"
];
let savedSchemes = JSON.parse(localStorage.madesktopSavedSchemes || "{}");

main();

async function main() {
    scheme = parseCssScheme(await getSchemeText());
    let schemeName = madGetString("MADCONF_SCHEME_CLASSIC") + " (98)";
    const parentSchemeElement = parent.document.getElementById("style");
    const preview = document.getElementById("schemePreview");
    const schemeSelector = document.getElementById("schemeSelector");
    const saveAsBtn = document.getElementById("saveAsBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const selector = document.getElementById("selector");
    const options = selector.options;
    const colorPickers = document.querySelectorAll(".colorPicker");
    const colorPickerWrap = document.getElementById("firstColorWrap");
    const colorPicker = document.getElementById("firstColor");
    const colorPickerColor = colorPicker.querySelector(".colorPicker-color");
    const itemSizeWrap = document.getElementById("itemSizeWrap");
    const itemSize = document.getElementById("itemSize");
    const itemSizeUp = document.getElementById("itemSizeUp");
    const itemSizeDown = document.getElementById("itemSizeDown");
    const secondColorPickerWrap = document.getElementById("secondColorWrap");
    const secondColorPicker = document.getElementById("secondColor");
    const secondColorPickerColor = secondColorPicker.querySelector(".colorPicker-color");
    const textColorPickerWrap = document.getElementById("textColorWrap");
    const textColorPicker = document.getElementById("textColor");
    const textColorPickerColor = textColorPicker.querySelector(".colorPicker-color");
    const fontSelector = document.getElementById("fontSelector");
    const fontSizeWrap = document.getElementById("fontSizeWrap");
    const fontSize = document.getElementById("fontSize");
    const boldToggle = document.getElementById("boldToggle");
    const italicToggle = document.getElementById("italicToggle");
    const flatMenuChkBox = document.getElementById("flatMenuChkBox");
    const flatMenuSelector = document.getElementById("flatMenuSelector");
    const enableAnimationsChkBox = document.getElementById("enableAnimationsChkBox");
    const animationSelector = document.getElementById("animationSelector");
    const shadowChkBox = document.getElementById("shadowChkBox");
    const winShadowChkBox = document.getElementById("winShadowChkBox");
    const outlineModeChkBox = document.getElementById("outlineModeChkBox");
    const underlineChkBox = document.getElementById("underlineChkBox");
    const transparencyChkBox = document.getElementById("transparencyChkBox");
    const animChkBox = document.getElementById("animChkBox");
    const effectsBtn = document.getElementById("effectsBtn");

    const itemMappings = {
        'button-face': {
            second: 'button-alternate-face',
            text: 'button-text'
        },
        'button-hilight': {
            second: 'button-light'
        },
        'button-shadow': {
            second: 'button-dk-shadow'
        },
        'active-title': {
            second: 'gradient-active-title',
            text: 'title-text',
            itemSize: 'extra-title-height',
            font: 'caption-font'
        },
        'inactive-title': {
            second: 'gradient-inactive-title',
            text: 'inactive-title-text',
            itemSize: 'extra-title-height',
            font: 'caption-font'
        },
        'active-border': {
            itemSize: 'extra-border-size'
        },
        'inactive-border': {
            itemSize: 'extra-border-size'
        },
        'caption-buttons': {
            noFirst: true,
            itemSize: 'extra-title-height'
        },
        'menu': {
            text: 'menu-text',
            itemSize: 'menu-height',
            font: 'menu-font'
        },
        'menu-bar': {
            second: 'menu-hilight',
            text: 'menu-text',
            itemSize: 'menu-height',
            font: 'menu-font'
        },
        'message-box': {
            noFirst: true,
            font: 'message-font'
        },
        'palette-title': {
            noFirst: true,
            itemSize: 'palette-title-height',
            font: 'sm-caption-font'
        },
        'scrollbar': {
            itemSize: 'scrollbar-size'
        },
        'hilight': {
            second: 'hilight-text'
        },
        'info-window': {
            text: 'info-text',
            font: 'status-font'
        },
        'user-interface': {
            noFirst: true,
            fontFamily: 'ui-font'
        },
        'window': {
            second: 'window-frame',
            text: 'window-text'
        }
    };

    for (const savedScheme in savedSchemes) {
        const option = document.createElement("option");
        option.textContent = savedScheme;
        option.value = savedScheme;
        option.dataset.userSaved = true;
        schemeSelector.insertBefore(option, schemeSelector.options[1]);
    }

    let openColorPicker = null;

    colorPickerColor.style.backgroundColor = localStorage.madesktopBgColor || scheme[options[selector.selectedIndex].value];

    schemeSelector.addEventListener("change", async function () {
        if (schemeSelector.selectedIndex === 0) {
            deleteBtn.disabled = true;
            return;
        } else if (schemeSelector.options[schemeSelector.selectedIndex].dataset.userSaved) {
            scheme = savedSchemes[schemeSelector.value];
            deleteBtn.disabled = false;
        } else if (schemeSelector.value === "sys") {
            scheme = parseCssScheme(await madSysPlug.getSystemScheme());
            deleteBtn.disabled = true;
        } else if (schemeSelector.value === "import") {
            try {
                await importScheme();
            } catch {
                schemeSelector.selectedIndex = 0;
            }
            deleteBtn.disabled = true;
            return;
        } else {
            scheme = parseCssScheme(await getSchemeText(`../../schemes/${schemeSelector.value}.css`));
            deleteBtn.disabled = true;
        }
        schemeName = schemeSelector.options[schemeSelector.selectedIndex].textContent.trim();

        if (schemeSelector.options[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.value = "background";
            selector.disabled = true;
            preview.style.pointerEvents = "none";
        } else {
            selector.disabled = false;
            preview.style.pointerEvents = "auto";
        }

        switch (scheme["flat-menus"]) {
            case "mbcm":
                flatMenuChkBox.checked = true;
                flatMenuSelector.disabled = false;
                flatMenuSelector.selectedIndex = 2;
                break;
            case "cm":
                flatMenuChkBox.checked = true;
                flatMenuSelector.disabled = false;
                flatMenuSelector.selectedIndex = 1;
                break;
            case "mb":
                flatMenuChkBox.checked = true;
                flatMenuSelector.disabled = false;
                flatMenuSelector.selectedIndex = 0;
                break;
            default:
                flatMenuChkBox.checked = false;
                flatMenuSelector.disabled = true;
        }

        if (scheme["menu-animation"] === "fade") {
            enableAnimationsChkBox.checked = true;
            animationSelector.selectedIndex = 1;
            animationSelector.disabled = false;
        } else if (scheme["menu-animation"] === "none") {
            enableAnimationsChkBox.checked = false;
            animationSelector.disabled = true;
        } else {
            enableAnimationsChkBox.checked = true;
            animationSelector.selectedIndex = 0;
            animationSelector.disabled = false;
        }

        if (scheme["menu-shadow"] === "true") {
            shadowChkBox.checked = true;
        } else {
            shadowChkBox.checked = false;
        }

        if (scheme["supports-win-shadow"] === "true") {
            winShadowChkBox.disabled = false;
            winShadowChkBox.checked = true;
        } else {
            winShadowChkBox.disabled = true;
            winShadowChkBox.checked = false;
        }

        if (scheme["win-open-anim"] && scheme["win-close-anim"]) {
            animChkBox.disabled = false;
            animChkBox.checked = true;
        } else {
            animChkBox.disabled = true;
            animChkBox.checked = false;
        }

        applyPreview();
        selector.dispatchEvent(new Event("change"));
        if (scheme["supports-colorization"]) {
            secondColorPickerWrap.classList.remove("disabled");
            secondColorPicker.disabled = false;
            secondColorPickerColor.style.backgroundColor = "#4580c4";
            transparencyChkBox.disabled = false;
            transparencyChkBox.checked = true;
        } else {
            transparencyChkBox.disabled = true;
            transparencyChkBox.checked = false;
        }
    });

    saveAsBtn.addEventListener("click", function () {
        if (schemeSelector.options[schemeSelector.selectedIndex].dataset.inconfigurable) {
            const msg = madGetString(schemeSelector.value === "sys" ? "MADCONF_CONFIRM_SCHEME_SAVE_SYSTEM" : "MADCONF_CONFIRM_SCHEME_SAVE_CSS");
            madConfirm(msg, function (res) {
                if (res) {
                    saveScheme();
                }
            });
        } else {
            saveScheme();
        }
    });

    function saveScheme() {
        madPrompt(madGetString("MADCONF_PROMPT_SCHEME_SAVE"), function (res) {
            switch (res) {
                case null:
                    return;
                case "":
                    madAlert(madGetString("MADCONF_MSG_SCHEME_NAME_EMPTY"), null, "error");
                    return;
                case "!copycss":
                    copyText(generateCssScheme(scheme, true));
                    madAlert(madGetString("MADCONF_MSG_COPYCSS"), null, "info");
                    return;
                case "!copyjson":
                    copyText(JSON.stringify(scheme));
                    madAlert(madGetString("MADCONF_MSG_COPYJSON"), null, "info");
                    return;
            }
            if (savedSchemes[res]) {
                madConfirm(madGetString("MADCONF_CONFIRM_SCHEME_OVERWRITE"), function (res2) {
                    if (res2) {
                        savedSchemes[res] = scheme;
                        localStorage.madesktopSavedSchemes = JSON.stringify(savedSchemes);
                        schemeName = res;
                        schemeSelector.options[0].textContent = schemeName;
                        localStorage.madesktopLastSchemeName = schemeName;
                    }
                });
                return;
            }
            savedSchemes[res] = scheme;
            const option = document.createElement("option");
            option.textContent = res;
            option.value = res;
            option.dataset.userSaved = true;
            schemeSelector.insertBefore(option, schemeSelector.options[1]);
            schemeSelector.value = res;
            schemeSelector.dispatchEvent(new Event("change"));
            localStorage.madesktopSavedSchemes = JSON.stringify(savedSchemes);
            schemeName = res;
            schemeSelector.options[0].textContent = schemeName;
            localStorage.madesktopLastSchemeName = schemeName;
        }, '', schemeName);
    }

    deleteBtn.addEventListener("click", function () {
        delete savedSchemes[schemeName];
        schemeSelector.options[schemeSelector.selectedIndex].remove();
        localStorage.madesktopSavedSchemes = JSON.stringify(savedSchemes);
        schemeSelector.selectedIndex = 0;
        schemeSelector.options[0].textContent = madGetString("MADCONF_CURRENT_SCHEME");
        delete localStorage.madesktopLastSchemeName;
        deleteBtn.disabled = true;
    });

    selector.addEventListener("change", function () {
        const option = selector.value;
        colorPickerColor.style.backgroundColor = scheme[option];
        if (itemMappings[option]) {
            if (itemMappings[option].noFirst) {
                colorPickerWrap.classList.add("disabled");
                colorPicker.disabled = true;
            } else {
                colorPickerWrap.classList.remove("disabled");
                colorPicker.disabled = false;
            }
            if (itemMappings[option].second) {
                secondColorPickerWrap.classList.remove("disabled");
                secondColorPicker.disabled = false;
                secondColorPickerColor.style.backgroundColor = scheme[itemMappings[option].second];
            } else {
                secondColorPickerWrap.classList.add("disabled");
                secondColorPickerWrap.disabled = true;
            }
            if (itemMappings[option].text) {
                textColorPickerWrap.classList.remove("disabled");
                textColorPicker.disabled = false;
                textColorPickerColor.style.backgroundColor = scheme[itemMappings[option].text];
            } else {
                textColorPickerWrap.classList.add("disabled");
                textColorPicker.disabled = true;
            }
            if (itemMappings[option].itemSize) {
                itemSizeWrap.classList.remove("disabled");
                itemSize.disabled = false;
                itemSizeUp.disabled = false;
                itemSizeDown.disabled = false;
                let itemSizeValue = parseInt(scheme[itemMappings[option].itemSize]);
                if (itemMappings[option].itemSize === "extra-title-height") {
                    itemSizeValue += 20;
                }
                itemSize.value = itemSizeValue;
            } else {
                itemSize.value = '';
                itemSizeWrap.classList.add("disabled");
                itemSize.disabled = true;
                itemSizeUp.disabled = true;
                itemSizeDown.disabled = true;
            }
            if (itemMappings[option].font) {
                fontSelector.disabled = false;
                fontSizeWrap.classList.remove("disabled");
                fontSize.disabled = false;
                boldToggle.disabled = false;
                italicToggle.disabled = false;
                const fontInfo = getFontInfo(getComputedStyle(preview.contentDocument.documentElement).getPropertyValue(`--${itemMappings[option].font}`));
                fontSelector.value = fontInfo.primaryFamily;
                fontSelector.label.textContent = fontInfo.primaryFamily;
                fontSize.value = parseInt(fontInfo.size);
                fontSize.dataset.fullValue = fontInfo.size;
                if (fontInfo.bold) {
                    boldToggle.dataset.active = true;
                } else {
                    delete boldToggle.dataset.active;
                }
                if (fontInfo.italic) {
                    italicToggle.dataset.active = true;
                } else {
                    delete italicToggle.dataset.active;
                }
            } else if (itemMappings[option].fontFamily) {
                fontSelector.disabled = false;
                const fontInfo = getFontInfo(getComputedStyle(preview.contentDocument.documentElement).getPropertyValue(`--${itemMappings[option].fontFamily}`), true);
                fontSelector.value = fontInfo.primaryFamily;
                fontSelector.label.textContent = fontInfo.primaryFamily;
                fontSizeWrap.classList.add("disabled");
                fontSize.disabled = true;
                fontSize.value = '';
                delete boldToggle.dataset.active;
                boldToggle.disabled = true;
                delete italicToggle.dataset.active;
                italicToggle.disabled = true;
            } else {
                fontSelector.selectedIndex = 0;
                fontSelector.disabled = true;
                fontSize.value = '';
                fontSizeWrap.classList.add("disabled");
                fontSize.disabled = true;
                delete boldToggle.dataset.active;
                boldToggle.disabled = true;
                delete italicToggle.dataset.active;
                italicToggle.disabled = true;
            }
        } else {
            colorPickerWrap.classList.remove("disabled");
            colorPicker.disabled = false;
            secondColorPickerWrap.classList.add("disabled");
            secondColorPicker.disabled = true;
            textColorPickerWrap.classList.add("disabled");
            textColorPicker.disabled = true;
            itemSize.value = '';
            itemSizeWrap.classList.add("disabled");
            itemSize.disabled = true;
            itemSizeUp.disabled = true;
            itemSizeDown.disabled = true;
            fontSelector.selectedIndex = 0;
            fontSelector.disabled = true;
            fontSize.value = '';
            fontSizeWrap.classList.add("disabled");
            fontSize.disabled = true;
            delete boldToggle.dataset.active;
            boldToggle.disabled = true;
            delete italicToggle.dataset.active;
            italicToggle.disabled = true;
        }
    });

    itemSize.addEventListener("change", function () {
        if (!itemSize.validity.valid) {
            itemSize.value = 1;
        }
        appendModified();
        const option = selector.value;
        if (itemMappings[option].itemSize) {
            if (itemMappings[option].itemSize === "extra-title-height") {
                scheme[itemMappings[option].itemSize] = itemSize.value - 20 + "px";
            } else {
                scheme[itemMappings[option].itemSize] = itemSize.value + "px";
            }
            applyPreview();
        }
    });

    itemSizeUp.addEventListener("click", function () {
        itemSize.value = parseInt(itemSize.value) + 1;
        itemSize.dispatchEvent(new Event("change"));
    });

    itemSizeDown.addEventListener("click", function () {
        itemSize.value = parseInt(itemSize.value) - 1;
        itemSize.dispatchEvent(new Event("change"));
    });

    for (const colorPicker of colorPickers) {
        const ditheredItems = ["active-border", "app-workspace", "background", "inactive-border", "info-window"];
        colorPicker.addEventListener("click", function () {
            openColorPicker = colorPicker;
            const currentColor = getComputedStyle(this.querySelector(".colorPicker-color")).backgroundColor;
            const dithered = ditheredItems.includes(selector.value) && colorPicker.id === "firstColor";
            madOpenMiniColorPicker(this, currentColor, changeColor, !dithered);
        });
    }

    fontSelector.addEventListener("change", function () {
        if (fontSelector.value === "custom") {
            madPrompt(madGetString("MADCONF_PROMPT_CUSTOM_FONT"), function (res) {
                if (res === null) return;
                setFont(res);
            });
        } else {
            setFont();
        }
    });

    fontSize.addEventListener("click", function () {
        madPrompt(madGetString("MADCONF_PROMPT_FONT_SIZE"), function (res) {
            if (res === null) return;
            if (parseFloat(res).toString() === res) {
                res += "pt";
            }
            fontSize.dataset.fullValue = res;
            fontSize.value = parseFloat(res.split("/")[0]);
            setFont();
        }, '', fontSize.dataset.fullValue);
    }, );

    fontSize.addEventListener("change", function () {
        setFont();
    });

    boldToggle.addEventListener("click", function () {
        if (this.dataset.active) {
            delete this.dataset.active;
        } else {
            this.dataset.active = true;
        }
        setFont();
    });

    italicToggle.addEventListener("click", function () {
        if (this.dataset.active) {
            delete this.dataset.active;
        } else {
            this.dataset.active = true;
        }
        setFont();
    });

    flatMenuChkBox.addEventListener("change", applyPreview);
    flatMenuSelector.addEventListener("change", applyPreview);

    enableAnimationsChkBox.addEventListener("change", function () {
        if (this.checked) {
            scheme["menu-animation"] = animationSelector.value;
        } else {
            scheme["menu-animation"] = "none";
        }
    });

    animationSelector.addEventListener("change", function () {
        if (enableAnimationsChkBox.checked) {
            scheme["menu-animation"] = animationSelector.value;
        } else {
            scheme["menu-animation"] = "none";
        }
    });

    flatMenuChkBox.addEventListener("change", function () {
        if (this.checked) {
            scheme["flat-menus"] = flatMenuSelector.value;
        } else {
            scheme["flat-menus"] = "none";
        }
    });

    flatMenuSelector.addEventListener("change", function () {
        if (flatMenuChkBox.checked) {
            scheme["flat-menus"] = flatMenuSelector.value;
        } else {
            scheme["flat-menus"] = "none";
        }
    });

    shadowChkBox.addEventListener("change", function () {
        if (this.checked) {
            scheme["menu-shadow"] = "true";
        } else {
            scheme["menu-shadow"] = "false";
        }
    });

    transparencyChkBox.addEventListener("change", function () {
        preview.contentWindow.changeAeroGlass(this.checked);
    });

    effectsBtn.addEventListener("click", function () {
        const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
        const top = parseInt(madDeskMover.config.yPos) + 80 + 'px';
        const options = { left, top, width: '476px', height: '263px', aot: true };
        const configWindow = madOpenWindow('apps/madconf/effects.html', true, options);
        configWindow.windowElement.addEventListener('load', () => {
            configWindow.windowElement.contentWindow.init(document);
        });
    });

    window.apply = function () {
        if (schemeSelector.value === "import") {
            schemeSelector.selectedIndex = 0;
            window.apply();
            return;
        } else if (schemeSelector.value === "sys") {
            applyScheme(scheme); // Apply the cached one (for preview) first to give libmad a chance to load the system scheme at the right time
            applyScheme("sys");
            parent.changeBgColor(colorPickerColor.style.backgroundColor);
            delete localStorage.madesktopAeroColor;
        } else if (selector.disabled) {
            schemeName = schemeSelector.options[schemeSelector.selectedIndex].textContent.trim();
            schemeSelector.options[0].textContent = schemeName;
            parentSchemeElement.textContent = preview.contentDocument.getElementById("style").textContent;
            parent.changeColorScheme(schemeSelector.value);
            localStorage.madesktopColorScheme = schemeSelector.value;
            localStorage.madesktopLastSchemeName = schemeName;
            parent.changeBgColor(colorPickerColor.style.backgroundColor);
            if (scheme["supports-colorization"]) {
                parent.changeAeroColor(secondColorPickerColor.style.backgroundColor);
                localStorage.madesktopAeroColor = secondColorPickerColor.style.backgroundColor;
            } else {
                delete localStorage.madesktopAeroColor;
            }
            if (localStorage.madesktopBgPattern) {
                parent.document.documentElement.style.backgroundImage = `url('${genPatternImage(base64ToPattern(localStorage.madesktopBgPattern), preview.contentDocument.documentElement)}')`;
            }
        } else {
            applyScheme(scheme, schemeName);
            delete localStorage.madesktopAeroColor;
        }

        if (enableAnimationsChkBox.checked) {
            localStorage.madesktopCmAnimation = animationSelector.value;
        } else {
            localStorage.madesktopCmAnimation = "none";
        }
        parent.changeCmAnimation(localStorage.madesktopCmAnimation);

        if (flatMenuChkBox.checked) {
            localStorage.madesktopMenuStyle = flatMenuSelector.value;
        } else {
            delete localStorage.madesktopMenuStyle;
        }
        parent.changeMenuStyle(localStorage.madesktopMenuStyle);

        if (shadowChkBox.checked) {
            localStorage.madesktopCmShadow = true;
        } else {
            delete localStorage.madesktopCmShadow;
        }
        parent.changeCmShadow(localStorage.madesktopCmShadow);

        if (winShadowChkBox.checked) {
            delete localStorage.madesktopNoWinShadow;
        } else {
            localStorage.madesktopNoWinShadow = true;
        }
        parent.changeWinShadow(localStorage.madesktopNoWinShadow);

        if (outlineModeChkBox.checked) {
            delete localStorage.madesktopOutlineMode;
        } else {
            localStorage.madesktopOutlineMode = true;
        }

        if (underlineChkBox.checked) {
            localStorage.madesktopHideUnderline = true;
        } else {
            delete localStorage.madesktopHideUnderline;
        }
        parent.changeUnderline(!localStorage.madesktopHideUnderline);

        if (transparencyChkBox.checked) {
            delete localStorage.madesktopAeroNoGlass;
        } else {
            localStorage.madesktopAeroNoGlass = true;
        }
        if (animChkBox.checked) {
            delete localStorage.madesktopNoWinAnim;
        } else {
            localStorage.madesktopNoWinAnim = true;
        }
        parent.changeAeroGlass(localStorage.madesktopAeroNoGlass);
        parent.changeWinAnim(localStorage.madesktopNoWinAnim);

        if (selector.disabled && schemeSelector.value !== "sys") {
            parent.adjustAllElements(parseInt(scheme["extra-title-height"]) || 0, parseInt(scheme["extra-border-size"]) || 0, parseInt(scheme["extra-border-bottom"]) || 0);
        } else {
            parent.adjustAllElements();
        }

        // legacy config
        delete localStorage.madesktopNoPixelFonts;

        madAnnounce("scheme-updated");
    }

    if (localStorage.madesktopColorScheme !== "custom" && localStorage.madesktopColorScheme !== "98" && localStorage.madesktopColorScheme) {
        schemeSelector.value = localStorage.madesktopColorScheme;
        if (schemeSelector.options[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.disabled = true;
            preview.style.pointerEvents = "none";
            colorPickerColor.style.backgroundColor = localStorage.madesktopBgColor;
            if (getComputedStyle(parent.document.documentElement).getPropertyValue("--supports-colorization")) {
                secondColorPickerWrap.classList.remove("disabled");
                secondColorPicker.disabled = false;
                secondColorPickerColor.style.backgroundColor = localStorage.madesktopAeroColor || "#4580c4";
                transparencyChkBox.disabled = false;
                transparencyChkBox.checked = !localStorage.madesktopAeroNoGlass;
                animChkBox.disabled = false;
                animChkBox.checked = !localStorage.madesktopNoWinAnim;
            }
        }
        schemeName = schemeSelector.options[schemeSelector.selectedIndex].textContent.trim();
        schemeSelector.options[0].textContent = schemeName;
    }

    if (localStorage.madesktopCmAnimation === "none") {
        enableAnimationsChkBox.checked = false;
        animationSelector.disabled = true;
        scheme["menu-animation"] = "none";
    } else if (localStorage.madesktopCmAnimation === "fade") {
        animationSelector.selectedIndex = 1;
        scheme["menu-animation"] = "fade";
    } else {
        scheme["menu-animation"] = "slide";
    }

    if (localStorage.madesktopMenuStyle) {
        flatMenuChkBox.checked = true;
        flatMenuSelector.disabled = false;
        switch (localStorage.madesktopMenuStyle) {
            case "mb":
                flatMenuSelector.selectedIndex = 0;
                break;
            case "cm":
                flatMenuSelector.selectedIndex = 1;
                break;
            case "mbcm":
                flatMenuSelector.selectedIndex = 2;
        }
        scheme["flat-menus"] = localStorage.madesktopMenuStyle;
    } else {
        scheme["flat-menus"] = "none";
    }

    if (localStorage.madesktopCmShadow) {
        shadowChkBox.checked = true;
        scheme["menu-shadow"] = "true";
    }

    if (localStorage.madesktopOutlineMode) {
        outlineModeChkBox.checked = false;
    }

    if (localStorage.madesktopHideUnderline) {
        underlineChkBox.checked = true;
    }

    if (localStorage.madesktopLastSchemeName) {
        schemeName = localStorage.madesktopLastSchemeName;
        schemeSelector.options[0].textContent = schemeName;
    } else if (localStorage.madesktopColorScheme === "98" || !localStorage.madesktopColorScheme) {
        schemeName = madGetString("MADCONF_SCHEME_CLASSIC") + " (98)";
        schemeSelector.options[0].textContent = schemeName;
    }

    if (getComputedStyle(parent.document.documentElement).getPropertyValue("--supports-win-shadow")) {
        winShadowChkBox.disabled = false;
        if (localStorage.madesktopNoWinShadow) {
            winShadowChkBox.checked = false;
        } else {
            winShadowChkBox.checked = true;
        }
    }

    FontDetective.each(font => {
        const option = document.createElement("option");
        option.textContent = font.name;
        option.value = font.name;
        fontSelector.appendChild(option);
        fonts.push(font.name);
    });

    function changeColor(color) {
        appendModified();
        const option = selector.value;
        switch (openColorPicker.id) {
            case "firstColor":
                scheme[option] = color;
                break;
            case "secondColor":
                if (!scheme["supports-colorization"]) {
                    scheme[itemMappings[option].second] = color;
                }
                break;
            case "textColor":
                scheme[itemMappings[option].text] = color;
                break;
        }
        openColorPicker.querySelector(".colorPicker-color").style.backgroundColor = color;
        applyPreview();
    }

    function setFont(customFamily) {
        appendModified();
        const option = selector.value;
        if (itemMappings[option].font) {
            let fontShorthand = '';
            if (boldToggle.dataset.active) {
                fontShorthand += 'bold ';
            }
            if (italicToggle.dataset.active) {
                fontShorthand += 'italic ';
            }
            fontShorthand += fontSize.dataset.fullValue + ' ';
            if (customFamily) {
                fontShorthand += customFamily;
            } else if (fontSelector.value.includes(" ")) {
                fontShorthand += `"${fontSelector.value}", var(--ui-font)`;
            } else {
                fontShorthand += fontSelector.value + ', var(--ui-font)';
            }
            scheme[itemMappings[option].font] = fontShorthand;
        } else if (itemMappings[option].fontFamily) {
            if (customFamily) {
                scheme[itemMappings[option].fontFamily] = customFamily;
            } else {
                scheme[itemMappings[option].fontFamily] = `"${fontSelector.value}", Arial`;
                if (fontSelector.selectedIndex <= 2 || fontSelector.value === "Tahoma") {
                    scheme[itemMappings[option].fontFamily] += ', var(--cjk-fontlink)';
                }
            }
        }
        applyPreview();
    }

    function appendModified() {
        const modifiedStr = ` (${madGetString("MADCONF_SCHEME_MODIFIED")})`;
        if (!selector.disabled && !schemeName.endsWith(modifiedStr)) {       
            schemeName += modifiedStr;
            schemeSelector.options[0].textContent = schemeName;
            schemeSelector.selectedIndex = 0;
        }
    }

    function applyPreview() {
        if (selector.disabled) {
            preview.src = "scheme_preview.html?scheme=" + schemeSelector.value;
            preview.addEventListener("load", function () {
                preview.contentDocument.body.style.backgroundColor = colorPickerColor.style.backgroundColor;
                preview.contentWindow.changeMenuStyle(flatMenuChkBox.checked ? flatMenuSelector.value : false);
                if (scheme["supports-colorization"]) {
                    preview.contentWindow.changeAeroColor(secondColorPickerColor.style.backgroundColor);
                    preview.contentWindow.changeAeroGlass(!transparencyChkBox.checked);
                }
                preview.contentWindow.changeWinShadow(!winShadowChkBox.checked);
            });
        } else {
            const schemeText = generateCssScheme(scheme);
            preview.contentWindow.changeColorScheme(schemeText);
            preview.contentDocument.body.style.backgroundColor = scheme["background"];
            preview.contentWindow.changeMenuStyle(flatMenuChkBox.checked ? flatMenuSelector.value : false);
        }
    }

    async function importScheme() {
        const pickerOpts = {
            types: [{
                description: "Theme Files",
                accept: {
                    "application/x-windows-theme": [".theme", ".themepack"]
                }
            }, {
                description: "Registry Files",
                accept: {
                    "application/x-windows-registry": [".reg"]
                }
            }, {
                description: "JSON Files",
                accept: {
                    "application/json": [".json"]
                }
            }, {
                description: "CSS Files",
                accept: {
                    "text/css": [".css"]
                }
            }],
            excludeAcceptAllOption: false,
            multiple: false,
        };
        const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
        const file = await fileHandle.getFile();
        const text = await file.text();

        schemeName = getFilename(file.name);
        schemeSelector.options[0].textContent = schemeName;

        if (text.match("--.*:.*;") || file.name.endsWith(".css")) {
            parent.changeColorScheme(text);
            localStorage.madesktopColorScheme = "custom";
            location.reload();
        } else {
            try {
                scheme = JSON.parse(text);
                schemeSelector.selectedIndex = 0;
                selector.disabled = false;
                applyPreview();
                selector.dispatchEvent(new Event("change"));
            } catch {
                // Match both REGEDIT4 and Windows Registry Editor Version 5.00
                let reg = !!text.split("\n")[0].match(/(?=.*REG)(?=.*EDIT)/i);
                try {
                    scheme = {
                        'active-border': getColorValue(text, 'ActiveBorder', reg),
                        'active-title': getColorValue(text, 'ActiveTitle', reg),
                        'app-workspace': getColorValue(text, 'AppWorkspace', reg),
                        'background': getColorValue(text, 'Background', reg),
                        'button-alternate-face': getColorValue(text, 'ButtonAlternateFace', reg),
                        'button-dk-shadow': getColorValue(text, 'ButtonDkShadow', reg),
                        'button-face': getColorValue(text, 'ButtonFace', reg),
                        'button-hilight': getColorValue(text, 'ButtonHilight', reg),
                        'button-light': getColorValue(text, 'ButtonLight', reg),
                        'button-shadow': getColorValue(text, 'ButtonShadow', reg),
                        'button-text': getColorValue(text, 'ButtonText', reg),
                        'gradient-active-title': getColorValue(text, 'GradientActiveTitle', reg),
                        'gradient-inactive-title': getColorValue(text, 'GradientInactiveTitle', reg),
                        'gray-text': getColorValue(text, 'GrayText', reg),
                        'hilight': getColorValue(text, 'Hilight', reg),
                        'hilight-text': getColorValue(text, 'HilightText', reg),
                        'hot-tracking-color': getColorValue(text, 'HotTrackingColor', reg),
                        'inactive-border': getColorValue(text, 'InactiveBorder', reg),
                        'inactive-title': getColorValue(text, 'InactiveTitle', reg),
                        'inactive-title-text': getColorValue(text, 'InactiveTitleText', reg),
                        'info-text': getColorValue(text, 'InfoText', reg),
                        'info-window': getColorValue(text, 'InfoWindow', reg),
                        'menu': getColorValue(text, 'Menu', reg),
                        'menu-bar': getColorValue(text, 'MenuBar', reg),
                        'menu-hilight': getColorValue(text, 'MenuHilight', reg),
                        'menu-text': getColorValue(text, 'MenuText', reg),
                        'scrollbar': getColorValue(text, 'Scrollbar', reg),
                        'title-text': getColorValue(text, 'TitleText', reg),
                        'window': getColorValue(text, 'Window', reg),
                        'window-frame': getColorValue(text, 'WindowFrame', reg),
                        'window-text': getColorValue(text, 'WindowText', reg)
                    };
                    schemeSelector.selectedIndex = 0;
                    selector.disabled = false;
                    applyPreview();
                    selector.dispatchEvent(new Event("change"));
                } catch {
                    madAlert(madGetString("MADCONF_MSG_INVALID_SCHEME_FILE"), null, "error");
                    throw new Error();
                }
            }
        }
    }
}

async function getSchemeText(scheme = parent.document.getElementById("scheme").href) {
    // 98 scheme
    let schemeText = `:root {
        --active-border: #c0c0c0;
        --active-title: #000080;
        --app-workspace: #808080;
        --background: #008080;
        --button-alternate-face: #b4b4b4;
        --button-dk-shadow: #000000;
        --button-face: #c0c0c0;
        --button-hilight: #ffffff;
        --button-light: #dfdfdf;
        --button-shadow: #808080;
        --button-text: #000000;
        --gradient-active-title: #1084d0;
        --gradient-inactive-title: #b5b5b5;
        --gray-text: #808080;
        --hilight: #000080;
        --hilight-text: #ffffff;
        --hot-tracking-color: #000080;
        --inactive-border: #c0c0c0;
        --inactive-title: #808080;
        --inactive-title-text: #c0c0c0;
        --info-text: #000000;
        --info-window: #ffffe1;
        --menu: #c0c0c0;
        --menu-bar: #c0c0c0;
        --menu-hilight: #000080;
        --menu-text:  #000000;
        --scrollbar: #c0c0c0;
        --title-text: #ffffff;
        --window: #ffffff;
        --window-frame: #000000;
        --window-text: #000000;
        --scrollbar-size: 16px;
        --menu-height: 18px;
        --palette-title-height: 15px;
    }
    .window {
        --extra-border-size: 1px;
        --extra-title-height: -2px;
    }`;
    if (scheme === "../../schemes/98.css" || scheme === "data:text/css,") {
        return schemeText;
    } else {
        try {
            await fetch(scheme).then(res => res.text()).then(text => {
                schemeText = text;
            });
            return schemeText;
        } catch {
            return schemeText;
        }
    }
}

function getFontInfo(fontShorthand, familyOnly = false) {
    const fontInfo = {};
    if (familyOnly) {
        fontInfo.family = fontShorthand.trim();
    } else {
        const split = fontShorthand.trim().split(" ");
        fontInfo.bold = split.indexOf("bold") !== -1;
        fontInfo.italic = split.indexOf("italic") !== -1;
        if (fontInfo.bold && fontInfo.italic) {
            fontInfo.size = split[2];
            fontInfo.family = split.slice(3).join(" ");
        } else if (fontInfo.bold || fontInfo.italic) {
            fontInfo.size = split[1];
            fontInfo.family = split.slice(2).join(" ");
        } else {
            fontInfo.size = split[0];
            fontInfo.family = split.slice(1).join(" ");
        }
    }
    let i = 0;
    while (fonts.indexOf(fontInfo.primaryFamily) === -1 && i < fontInfo.family.split(",").length) {
        fontInfo.primaryFamily = fontInfo.family.split(",")[i++].trim();
        if (fontInfo.primaryFamily.startsWith('"') || fontInfo.primaryFamily.startsWith("'")) {
            fontInfo.primaryFamily = fontInfo.primaryFamily.slice(1, -1);
        }
    }
    if (!fontInfo.primaryFamily) {
        fontInfo.primaryFamily = "Unknown Font";
    }
    return fontInfo;
}

function applyScheme(scheme, schemeName) {
    if (scheme === "sys") {
        parent.changeColorScheme("sys");
        localStorage.madesktopColorScheme = "sys";
    } else {
        const schemeText = generateCssScheme(scheme);
        parent.changeColorScheme(schemeText);
        localStorage.madesktopColorScheme = "custom";
    }
    if (schemeName) {
        localStorage.madesktopLastSchemeName = schemeName;
    } else {
        delete localStorage.madesktopLastSchemeName;
    }
    parent.changeBgColor("var(--background)");
}

function parseCssScheme(schemeText) {
    const lines = schemeText.split("\n");
    const scheme = {};
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("--") && line.length <= 100) {
            const [key, value] = line.split(":");
            scheme[key.trim().slice(2)] = value.trim().slice(0, -1);
        }
    }
    return scheme;
}

function generateCssScheme(scheme, keepEffects = false) {
    const belongsInWindow = [
        'extra-title-height',
        'extra-border-size'
    ];
    const shouldBeDeleted = [
        'extra-border-bottom',
        'supports-win-shadow'
    ];
    if (!keepEffects) {
        shouldBeDeleted.push('flat-menus', 'menu-animation', 'menu-shadow');
    }

    let cssScheme = `:root {\n`;
    for (const key in scheme) {
        if (belongsInWindow.includes(key) || shouldBeDeleted.includes(key)) {
            continue;
        }
        cssScheme += `--${key}: ${scheme[key]};\n`;
    }
    cssScheme += "}\n.window {\n";
    for (const key of belongsInWindow) {
        if (scheme[key]) {
            cssScheme += `--${key}: ${scheme[key].replaceAll('!important', '')};\n`;
        }
    }
    cssScheme += "}";
    return cssScheme;
}

// Parse *.theme files
// Or exported "HKCU\Control Panel\Colors" *.reg files (reg = true)
function getColorValue(themeText, name, reg) {
    const regex = reg ? `\n\"${name}\"=\"(.*)\"\r\n` : `\n${name}=(.*)\r\n`
    let rgb = themeText.match(regex);
    if (!rgb) {
        switch (name) {
            case 'ButtonAlternateFace':
                return '#B5B5B5';
            case 'GradientActiveTitle':
                return getColorValue(themeText, 'ActiveTitle');
            case 'GradientInactiveTitle':
                return getColorValue(themeText, 'InactiveTitle');
            case 'MenuBar':
                return getColorValue(themeText, 'Menu');
            case 'MenuHilight':
                return getColorValue(themeText, 'Hilight');
            case 'HotTrackingColor':
                return '#008080';
            default:
                throw new Error(`Color not found for ${name}`);
        }
    }
    return '#' + rgb[1].trim().split(' ').map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function changeItemSelection(item) {
    document.getElementById("selector").value = item;
    document.getElementById("selector").dispatchEvent(new Event("change"));
}