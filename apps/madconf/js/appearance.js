// appearance.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License

'use strict';

main();

let scheme = {};
let fonts = [
    "Pixelated MS Sans Serif",
    "Fixedsys Excelsior"
];
let savedSchemes = JSON.parse(localStorage.madesktopSavedSchemes || "{}");

async function main() {
    scheme = parseCssScheme(await getSchemeText());
    let schemeName = "Windows Classic (98)";
    const parentSchemeElement2 = parent.document.getElementById("style2");
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
    const outlineModeChkBox = document.getElementById("outlineModeChkBox");
    const transparencyChkBox = document.getElementById("transparencyChkBox");
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

    colorPickerColor.style.backgroundColor = scheme[options[selector.selectedIndex].value];

    schemeSelector.addEventListener("change", async function () {
        if (schemeSelector.selectedIndex === 0) {
            deleteBtn.disabled = true;
            return;
        } else if (schemeSelector.options[schemeSelector.selectedIndex].dataset.userSaved) {
            scheme = savedSchemes[schemeSelector.value];
            deleteBtn.disabled = false;
        } else if (schemeSelector.value === "sys") {
            scheme = parseCssScheme(await getSchemeText("http://localhost:3031/systemscheme"));
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
        schemeName = schemeSelector.options[schemeSelector.selectedIndex].textContent;

        if (schemeSelector.options[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.value = "background";
            selector.disabled = true;
            preview.style.pointerEvents = "none";
        } else {
            selector.disabled = false;
            preview.style.pointerEvents = "auto";
        }

        if (scheme["flat-menus"] === "mbcm") {
            flatMenuChkBox.checked = true;
            flatMenuSelector.disabled = false;
            flatMenuSelector.selectedIndex = 2;
        } else if (scheme["flat-menus"] === "mb") {
            flatMenuChkBox.checked = true;
            flatMenuSelector.disabled = false;
            flatMenuSelector.selectedIndex = 0;
        } else {
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

        applyPreview();
        selector.dispatchEvent(new Event("change"));
        if (schemeSelector.value === "7css4mad") {
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
            let msg = "If you save this scheme, the unique look of this theme will be lost and only the colors and window metrics will be saved. Are you sure you want to continue?";
            if (schemeSelector.value === "sys") {
                msg = "If you save this scheme, ModernActiveDesktop will no longer fetch the system scheme dynamically. Are you sure you want to continue?";
            }
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
        madPrompt("Save this color scheme as:", function (res) {
            switch (res) {
                case null:
                    return;
                case "":
                    madAlert("The scheme name cannot be empty.", null, "error");
                    return;
                case "!copycss":
                    copyText(generateCssScheme(scheme, true));
                    madAlert("CSS scheme copied to clipboard.", null, "info");
                    return;
                case "!copyjson":
                    copyText(JSON.stringify(scheme));
                    madAlert("Scheme JSON copied to clipboard.", null, "info");
                    return;
            }
            if (savedSchemes[res]) {
                madConfirm("A scheme with the same name already exists. Do you want to overwrite it?", function (res2) {
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
        schemeSelector.options[0].textContent = "Current Scheme";
        delete localStorage.madesktopLastSchemeName;
        deleteBtn.disabled = true;
    });

    selector.addEventListener("change", function () {
        const option = selector.value;
        colorPickerColor.style.backgroundColor  = scheme[option];
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
        colorPicker.addEventListener("click", function () {
            openColorPicker = colorPicker;
            madOpenMiniColorPicker(this, this.querySelector(".colorPicker-color").style.backgroundColor, function (color) {
                changeColor(color);
            });
        });
    }

    fontSelector.addEventListener("change", function () {
        setFont();
    });

    fontSize.addEventListener("click", function () {
        madPrompt("Enter font size (optionally append a slash and line height)", function (res) {
            if (res === null) return;
            if (parseInt(res).toString() === res) {
                res += "pt";
            }
            fontSize.dataset.fullValue = res;
            fontSize.textContent = res.split("/")[0];
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
        scheme["menu-animation"] = animationSelector.value;
    });

    flatMenuChkBox.addEventListener("change", function () {
        if (this.checked) {
            scheme["flat-menus"] = flatMenuSelector.value;
        } else {
            scheme["flat-menus"] = "none";
        }
    });

    flatMenuSelector.addEventListener("change", function () {
        scheme["flat-menus"] = flatMenuSelector.value;
    });

    shadowChkBox.addEventListener("change", function () {
        if (this.checked) {
            scheme["menu-shadow"] = "true";
        } else {
            scheme["menu-shadow"] = "false";
        }
    });

    transparencyChkBox.addEventListener("change", function () {
        if (this.checked) {
            preview.contentWindow.changeAeroGlass(false);
        } else {
            preview.contentWindow.changeAeroGlass(true);
        }
    });

    effectsBtn.addEventListener("click", function () {
        const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
        const top = parseInt(madDeskMover.config.yPos) + 80 + 'px';
        const configWindow = madOpenWindow('apps/madconf/effects.html', true, '476px', '263px', 'wnd', false, top, left, true, true);
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
            schemeName = schemeSelector.options[schemeSelector.selectedIndex].textContent;
            schemeSelector.options[0].textContent = schemeName;
            parentSchemeElement2.textContent = preview.contentDocument.getElementById("style").textContent;
            parent.changeColorScheme(schemeSelector.value);
            localStorage.madesktopColorScheme = schemeSelector.value;
            localStorage.madesktopLastSchemeName = schemeName;
            parent.changeBgColor(colorPickerColor.style.backgroundColor);
            if (schemeSelector.value === "7css4mad") {
                parent.changeAeroColor(secondColorPickerColor.style.backgroundColor);
                localStorage.madesktopAeroColor = secondColorPickerColor.style.backgroundColor;
            } else {
                delete localStorage.madesktopAeroColor;
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

        if (outlineModeChkBox.checked) {
            delete localStorage.madesktopOutlineMode;
        } else {
            localStorage.madesktopOutlineMode = true;
        }

        if (schemeSelector.value === "7css4mad") {
            if (transparencyChkBox.checked) {
                delete localStorage.madesktopAeroNoGlass;
            } else {
                localStorage.madesktopAeroNoGlass = true;
            }
        } else {
            delete localStorage.madesktopAeroNoGlass;
        }
        parent.changeAeroGlass(localStorage.madesktopAeroNoGlass);

        if (selector.disabled && schemeSelector.value !== "sys") {
            parent.adjustAllElements(parseInt(scheme["extra-title-height"]) || 0, parseInt(scheme["extra-border-size"]) || 0, parseInt(scheme["extra-border-bottom"]) || 0);
        } else {
            parent.adjustAllElements();
        }

        // legacy config
        delete localStorage.madesktopNoPixelFonts;
    }

    if (localStorage.madesktopColorScheme !== "custom" && localStorage.madesktopColorScheme !== "98" && localStorage.madesktopColorScheme) {
        schemeSelector.value = localStorage.madesktopColorScheme;
        if (schemeSelector.options[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.disabled = true;
            preview.style.pointerEvents = "none";
            colorPickerColor.style.backgroundColor = localStorage.madesktopBgColor;
            if (localStorage.madesktopColorScheme === "7css4mad") {
                secondColorPickerWrap.classList.remove("disabled");
                secondColorPicker.disabled = false;
                secondColorPickerColor.style.backgroundColor = localStorage.madesktopAeroColor || "#4580c4";
                transparencyChkBox.disabled = false;
                transparencyChkBox.checked = !localStorage.madesktopAeroNoGlass;
            }
        }
        schemeName = schemeSelector.options[schemeSelector.selectedIndex].textContent;
        schemeSelector.options[0].textContent = schemeName;
    }

    if (localStorage.madesktopCmAnimation === "none") {
        enableAnimationsChkBox.checked = false;
        animationSelector.disabled = true;
    } else if (localStorage.madesktopCmAnimation === "fade") {
        animationSelector.selectedIndex = 1;
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
    }

    if (localStorage.madesktopCmShadow) {
        shadowChkBox.checked = true;
    }

    if (localStorage.madesktopOutlineMode) {
        outlineModeChkBox.checked = false;
    }

    if (localStorage.madesktopLastSchemeName) {
        schemeName = localStorage.madesktopLastSchemeName;
        schemeSelector.options[0].textContent = schemeName;
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
                if (schemeSelector.value !== "7css4mad") {
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

    function setFont() {
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
            if (fontSelector.value.includes(" ")) {
                fontShorthand += `"${fontSelector.value}", var(--ui-font)`;
            } else {
                fontShorthand += fontSelector.value + ', var(--ui-font)';
            }
            scheme[itemMappings[option].font] = fontShorthand;
        } else if (itemMappings[option].fontFamily) {
            scheme[itemMappings[option].fontFamily] = `"${fontSelector.value}", Arial`;
            if (fontSelector.selectedIndex <= 2 || fontSelector.value === "Tahoma") {
                scheme[itemMappings[option].fontFamily] += ', var(--cjk-fontlink)';
            }
        }
        applyPreview();
    }

    function appendModified() {
        if (!selector.disabled && !schemeName.endsWith(" (Modified)")) {       
            schemeName += " (Modified)";
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
                if (schemeSelector.value === "7css4mad") {
                    preview.contentWindow.changeAeroColor(secondColorPickerColor.style.backgroundColor);
                    preview.contentWindow.changeAeroGlass(!transparencyChkBox.checked);
                }
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
                description: "JSON Files",
                accept: {
                    "application/json": [".json"]
                }
            }, {
                description: "CSS Files",
                accept: {
                    "text/css": [".css"]
                },
            }],
            excludeAcceptAllOption: false,
            multiple: false,
        };
        const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
        const file = await fileHandle.getFile();
        const text = await file.text();

        schemeName = getFilename(file.name);
        schemeSelector.options[0].textContent = schemeName;

        if (file.name.endsWith(".theme") || file.name.endsWith(".themepack")) {
            try {
                scheme = {
                    'active-border': getColorValue(text, 'ActiveBorder'),
                    'active-title': getColorValue(text, 'ActiveTitle'),
                    'app-workspace': getColorValue(text, 'AppWorkspace'),
                    'background': getColorValue(text, 'Background'),
                    'button-alternate-face': getColorValue(text, 'ButtonAlternateFace'),
                    'button-dk-shadow': getColorValue(text, 'ButtonDkShadow'),
                    'button-face': getColorValue(text, 'ButtonFace'),
                    'button-hilight': getColorValue(text, 'ButtonHilight'),
                    'button-light': getColorValue(text, 'ButtonLight'),
                    'button-shadow': getColorValue(text, 'ButtonShadow'),
                    'button-text': getColorValue(text, 'ButtonText'),
                    'gradient-active-title': getColorValue(text, 'GradientActiveTitle'),
                    'gradient-inactive-title': getColorValue(text, 'GradientInactiveTitle'),
                    'gray-text': getColorValue(text, 'GrayText'),
                    'hilight': getColorValue(text, 'Hilight'),
                    'hilight-text': getColorValue(text, 'HilightText'),
                    'hot-tracking-color': getColorValue(text, 'HotTrackingColor'),
                    'inactive-border': getColorValue(text, 'InactiveBorder'),
                    'inactive-title': getColorValue(text, 'InactiveTitle'),
                    'inactive-title-text': getColorValue(text, 'InactiveTitleText'),
                    'info-text': getColorValue(text, 'InfoText'),
                    'info-window': getColorValue(text, 'InfoWindow'),
                    'menu': getColorValue(text, 'Menu'),
                    'menu-bar': getColorValue(text, 'MenuBar'),
                    'menu-hilight': getColorValue(text, 'MenuHilight'),
                    'menu-text': getColorValue(text, 'MenuText'),
                    'scrollbar': getColorValue(text, 'Scrollbar'),
                    'title-text': getColorValue(text, 'TitleText'),
                    'window': getColorValue(text, 'Window'),
                    'window-frame': getColorValue(text, 'WindowFrame'),
                    'window-text': getColorValue(text, 'WindowText')
                }
                schemeSelector.selectedIndex = 0;
                applyPreview();
                selector.dispatchEvent(new Event("change"));
            } catch {
                madAlert("The imported theme file does not contain valid colors.", null, "error");
            }
        } else if (file.name.endsWith(".json")) {
            try {
                scheme = JSON.parse(text);
                schemeSelector.selectedIndex = 0;
                applyPreview();
                selector.dispatchEvent(new Event("change"));
            } catch {
                madAlert("The imported JSON file is not valid.", null, "error");
            }
        } else {
            parent.changeColorScheme(text);
            localStorage.madesktopColorScheme = "custom";
            location.reload();
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
        await fetch(scheme).then(res => res.text()).then(text => {
            schemeText = text;
        });
        return schemeText;
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
        console.log(fontInfo.primaryFamily);
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
    let scheme = {};
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
        'uses-classic-controls'
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
function getColorValue(themeText, name) {
    let rgb = themeText.match(`${name}=(.*)\r\n`);
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
    return '#' + rgb[1].split(' ').map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function changeItemSelection(item) {
    document.getElementById("selector").value = item;
    document.getElementById("selector").dispatchEvent(new Event("change"));
}