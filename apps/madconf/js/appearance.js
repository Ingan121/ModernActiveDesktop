// appearance.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License

'use strict';

main();

async function main() {
    let scheme = parseCssScheme(await getSchemeText());
    let schemeName = "Windows Classic (98)";
    const preview = document.getElementById("schemePreview");
    const schemeSelector = document.getElementById("schemeSelector");
    const schemeSelectorOptions = schemeSelector.options;
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
    const secondColorPickerWrap = document.getElementById("secondColorWrap");
    const secondColorPicker = document.getElementById("secondColor");
    const secondColorPickerColor = secondColorPicker.querySelector(".colorPicker-color");
    const textColorPickerWrap = document.getElementById("textColorWrap");
    const textColorPicker = document.getElementById("textColor");
    const textColorPickerColor = textColorPicker.querySelector(".colorPicker-color");
    const miniPicker = document.getElementById("miniPicker");
    const miniPickerColors = document.querySelectorAll(".color");
    const openColorPickerBtn = document.getElementById("openColorPickerBtn");
    const fontSelector = document.getElementById("fontSelector");
    const flatMenuChkBox = document.getElementById("flatMenuChkBox");
    const flatMenuSelector = document.getElementById("flatMenuSelector");
    const enableAnimationsChkBox = document.getElementById("enableAnimationsChkBox");
    const animationSelector = document.getElementById("animationSelector");
    const shadowChkBox = document.getElementById("shadowChkBox");
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
            itemSize: 'extra-title-height'
        },
        'inactive-title': {
            second: 'gradient-inactive-title',
            text: 'inactive-title-text',
            itemSize: 'extra-title-height'
        },
        'active-border': {
            itemSize: 'extra-border-size'
        },
        'inactive-border': {
            itemSize: 'extra-border-size'
        },
        'menu': {
            text: 'menu-text',
            itemSize: 'menu-height'
        },
        'menu-bar': {
            second: 'menu-highlight',
            text: 'menu-text',
            itemSize: 'menu-height'
        },
        'palette-title': {
            noFirst: true,
            itemSize: 'palette-title-height'
        },
        'scrollbar': {
            itemSize: 'scrollbar-size'
        },
        'hilight': {
            second: 'hilight-text'
        },
        'info-window': {
            text: 'info-text'
        },
        'window': {
            second: 'window-frame',
            text: 'window-text'
        }
    };
    /*
        ItemMatrics: menu, scrollbar OK, title OK, palette-title OK, border OK
        FontMatrics: menu, message-box, title, palette-title, info-window
    */

    let openColorPicker = null;

    colorPickerColor.style.backgroundColor = scheme[options[selector.selectedIndex].value];

    schemeSelector.addEventListener("change", async function () {
        if (schemeSelector.value === "sys") {
            scheme = parseCssScheme(await getSchemeText("http://localhost:3031/systemscheme"));
        } else if (schemeSelector.value === "import") {
            importCss();
            return;
        } else {
            scheme = parseCssScheme(await getSchemeText(`../../schemes/${schemeSelector.value}.css`));
        }
        schemeName = schemeSelectorOptions[schemeSelector.selectedIndex].textContent;

        if (schemeSelectorOptions[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.value = "background";
            selector.disabled = true;
            saveAsBtn.disabled = true;
            deleteBtn.disabled = true;
        } else {
            selector.disabled = false;
            saveAsBtn.disabled = false;
        }
        selector.dispatchEvent(new Event("change"));

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
    });

    saveAsBtn.addEventListener("click", function () {
        madAlert("Not implemented yet", null, "error");
    });

    deleteBtn.addEventListener("click", function () {
        madAlert("Not implemented yet", null, "error");
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
                let itemSizeValue = parseInt(scheme[itemMappings[option].itemSize]);
                if (itemMappings[option].itemSize === "extra-title-height") {
                    itemSizeValue += 20;
                }
                itemSize.value = itemSizeValue;
            } else {
                itemSize.value = '';
                itemSizeWrap.classList.add("disabled");
                itemSize.disabled = true;
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

    for (const colorPicker of colorPickers) {
        colorPicker.addEventListener("click", function () {
            openColorPicker = colorPicker;
            const clientRect = colorPicker.getBoundingClientRect();
            let top = clientRect.top + colorPicker.offsetHeight;
            let left = clientRect.left;

            if (left + 78 > window.innerWidth) {
                left = window.innerWidth - 78;
            }
            if (top + 121 > window.innerHeight) {
                top = window.innerHeight - 121;
            }

            miniPicker.style.top = `${top}px`;
            miniPicker.style.left = `${left}px`;
            miniPicker.style.display = "block";
            miniPicker.focus();
        });
    }

    miniPicker.addEventListener("focusout", function (event) {
        if (Array.from(colorPickers).indexOf(event.relatedTarget) === -1 && event.relatedTarget !== openColorPickerBtn) {
            miniPicker.style.display = "none";
        }
    });

    for (const miniPickerColor of miniPickerColors) {
        miniPickerColor.addEventListener("click", function () {
            changeColor(this.style.backgroundColor);
            miniPicker.style.display = "none";
        });
    }

    openColorPickerBtn.addEventListener("click", function () {
        const color = scheme[options[selector.selectedIndex].value];
        madOpenColorPicker(color, true, changeColor);
    });

    fontSelector.addEventListener("change", function () {
        applyPreview();
    });

    flatMenuChkBox.addEventListener("change", applyPreview);
    flatMenuSelector.addEventListener("change", applyPreview);

    effectsBtn.addEventListener("click", function () {
        const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
        const top = parseInt(madDeskMover.config.yPos) + 80 + 'px';
        const configWindow = madOpenWindow('apps/madconf/effects.html', true, '476px', '263px', 'wnd', false, top, left, true, true);
        configWindow.windowElement.addEventListener('load', () => {
            configWindow.windowElement.contentWindow.init(document);
        });
    });

    window.apply = function () {
        parent.changeFont(fontSelector.selectedIndex === 1);
        if (schemeSelector.value === "sys") {
            applyScheme(scheme); // Apply the cached one (for preview) first to give libmad a chance to load the system scheme at the right time
            applyScheme("sys");
            parent.changeBgColor(colorPickerColor.style.backgroundColor);
        } else if (selector.disabled) {
            parent.changeColorScheme(schemeSelector.value);
            localStorage.madesktopColorScheme = schemeSelector.value;
            parent.changeBgColor(colorPickerColor.style.backgroundColor);
        } else {
            applyScheme(scheme, schemeName);
        }

        if (fontSelector.selectedIndex === 1) {
            localStorage.madesktopNoPixelFonts = true;
        } else {
            delete localStorage.madesktopNoPixelFonts;
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

        if (selector.disabled && schemeSelector.value !== "sys") {
            parent.adjustAllElements(parseInt(scheme["extra-title-height"]) || 0, parseInt(scheme["extra-border-size"]) || 0, parseInt(scheme["extra-border-bottom"]) || 0);
        } else {
            parent.adjustAllElements();
        }
    }

    if (localStorage.madesktopColorScheme !== "custom" && localStorage.madesktopColorScheme !== "98" && localStorage.madesktopColorScheme) {
        schemeSelector.value = localStorage.madesktopColorScheme;
        if (schemeSelectorOptions[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.disabled = true;
            colorPickerColor.style.backgroundColor = localStorage.madesktopBgColor;
        }
    }

    if (localStorage.madesktopNoPixelFonts) {
        fontSelector.selectedIndex = 1;
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

    if (localStorage.madesktopLastSchemeName) {
        schemeName = localStorage.madesktopLastSchemeName;
        schemeSelectorOptions[0].textContent = schemeName;
    }

    function changeColor(color) {
        appendModified();
        const option = selector.value;
        switch (openColorPicker.id) {
            case "firstColor":
                scheme[option] = color;
                break;
            case "secondColor":
                scheme[itemMappings[option].second] = color;
                break;
            case "textColor":
                scheme[itemMappings[option].text] = color;
                break;
        }
        openColorPicker.querySelector(".colorPicker-color").style.backgroundColor = color;
        applyPreview();
    }

    function appendModified() {
        if (!selector.disabled && !schemeName.endsWith(" (Modified)")) {       
            schemeName += " (Modified)";
            schemeSelectorOptions[0].textContent = schemeName;
            schemeSelector.value = "current";
        }
    }


    function applyPreview() {
        if (selector.disabled) {
            preview.src = "scheme_preview.html?scheme=" + schemeSelector.value;
            preview.addEventListener("load", function () {
                preview.contentDocument.body.style.backgroundColor = colorPickerColor.style.backgroundColor;
                preview.contentWindow.changeFont(fontSelector.selectedIndex === 1);
                preview.contentWindow.changeMenuStyle(flatMenuChkBox.checked ? flatMenuSelector.value : false);
            });
        } else {
            const schemeText = generateCssScheme(scheme);
            preview.contentWindow.changeColorScheme(schemeText);
            preview.contentDocument.body.style.backgroundColor = scheme["background"];
            preview.contentWindow.changeFont(fontSelector.selectedIndex === 1);
        preview.contentWindow.changeMenuStyle(flatMenuChkBox.checked ? flatMenuSelector.value : false);
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
        --menu-highlight: #000080;
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
        if (line.startsWith("--") && line.length <= 50) {
            const [key, value] = line.split(":");
            scheme[key.trim().slice(2)] = value.trim().slice(0, -1);
        }
    }
    return scheme;
}

function generateCssScheme(scheme) {
    const belongsInWindow = [
        'extra-title-height',
        'extra-border-size',
    ];
    const shouldBeDeleted = [
        'extra-border-bottom',
        'flat-menus',
        'menu-animation',
        'menu-shadow'
    ];

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
            cssScheme += `--${key}: ${scheme[key]};\n`;
        }
    }
    cssScheme += "}";
    return cssScheme;
}

async function importCss() {
    const pickerOpts = {
        types: [{
            description: "CSS Files",
            accept: {
                "text/css": [".css"],
            },
        }],
        excludeAcceptAllOption: false,
        multiple: false,
    };
    const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
    const file = await fileHandle.getFile();
    const text = await file.text();
    parent.changeColorScheme(text);
    localStorage.madesktopColorScheme = "custom";
    location.reload();
}