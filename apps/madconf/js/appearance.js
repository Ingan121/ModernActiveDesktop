// appearance.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License

'use strict';

main();

async function main() {
    let scheme = parseCssScheme(await getSchemeText());
    const preview = document.getElementById("schemePreview");
    const schemeSelector = document.getElementById("schemeSelector");
    const schemeSelectorOptions = schemeSelector.options;
    const saveAsBtn = document.getElementById("saveAsBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const selector = document.getElementById("selector");
    const options = selector.options;
    const colorPickers = document.querySelectorAll(".colorPicker");
    const colorPickerColor = document.querySelector("#firstColor .colorPicker-color");
    const secondColorPickerWrap = document.getElementById("secondColorWrap");
    const secondColorPicker = document.getElementById("secondColor");
    const secondColorPickerColor = secondColorPicker.querySelector(".colorPicker-color");
    const textColorPickerWrap = document.getElementById("textColorWrap");
    const textColorPicker = document.getElementById("textColor");
    const textColorPickerColor = textColorPicker.querySelector(".colorPicker-color");
    const miniPicker = document.getElementById("miniPicker");
    const miniPickerColors = document.querySelectorAll(".color");
    const openColorPickerBtn = document.getElementById("openColorPickerBtn");
    const systemColorChhkBox = document.getElementById("systemColorChkBox");
    const fontSmoothingChkBox = document.getElementById("fontSmoothingChkBox");
    const flatMenuChkBox = document.getElementById("flatMenuChkBox");
    const flatMenuSelector = document.getElementById("flatMenuSelector");
    const enableAnimationsChkBox = document.getElementById("enableAnimationsChkBox");
    const animationSelector = document.getElementById("animationSelector");
    const importBtn = document.getElementById("importBtn");

    let openColorPicker = null;

    colorPickerColor.style.backgroundColor = scheme[options[selector.selectedIndex].value];

    schemeSelector.addEventListener("change", async function () {
        scheme = parseCssScheme(await getSchemeText(`../../schemes/${schemeSelector.value}.css`));
        if (schemeSelectorOptions[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.selectedIndex = 6; // background
            selector.disabled = true;
            saveAsBtn.disabled = true;
            deleteBtn.disabled = true;
        } else {
            selector.disabled = false;
            saveAsBtn.disabled = false;
        }
        selector.dispatchEvent(new Event("change"));

        if (schemeSelector.value.startsWith("xp") || schemeSelector.value === "aero" || schemeSelector.value === "windose") {
            flatMenuChkBox.checked = true;
            flatMenuSelector.disabled = false;
            flatMenuSelector.selectedIndex = 2;
        } else if (schemeSelector.value.includes("95") || schemeSelector.value.startsWith("win")) {
            flatMenuChkBox.checked = true;
            flatMenuSelector.disabled = false;
            flatMenuSelector.selectedIndex = 0;
        } else {
            flatMenuChkBox.checked = false;
            flatMenuSelector.disabled = true;
        }

        if (schemeSelector.value === "2k" || schemeSelector.value.startsWith("xp") || schemeSelector.value === "aero" || schemeSelector.value.startsWith("win11") || schemeSelector.value === "windose") {
            enableAnimationsChkBox.checked = true;
            animationSelector.selectedIndex = 1;
            animationSelector.disabled = false;
        } else if (schemeSelector.value.includes("95") || schemeSelector.value.match(/win[1-3].*/)) {
            enableAnimationsChkBox.checked = false;
            animationSelector.disabled = true;
        } else {
            enableAnimationsChkBox.checked = true;
            animationSelector.selectedIndex = 0;
            animationSelector.disabled = false;
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
        if (options[selector.selectedIndex].dataset.second) {
            secondColorPickerWrap.classList.remove("disabled");
            secondColorPicker.disabled = false;
            secondColorPickerColor.style.backgroundColor = scheme[options[selector.selectedIndex].dataset.second];
        } else {
            secondColorPickerWrap.classList.add("disabled");
            secondColorPickerWrap.disabled = true;
        }
        if (options[selector.selectedIndex].dataset.text) {
            textColorPickerWrap.classList.remove("disabled");
            textColorPicker.disabled = false;
            textColorPickerColor.style.backgroundColor = scheme[options[selector.selectedIndex].dataset.text];
        } else {
            textColorPickerWrap.classList.add("disabled");
            textColorPicker.disabled = true;
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

    systemColorChhkBox.addEventListener("change", async function () {
        if (systemColorChhkBox.checked) {
            schemeSelector.disabled = true;
            selector.selectedIndex = 6; // background
            scheme = parseCssScheme(await getSchemeText("http://localhost:3031/systemscheme"));
            selector.disabled = true;
            selector.dispatchEvent(new Event("change"));
            applyPreview();
        } else {
            schemeSelector.disabled = false;
            selector.disabled = false;
        }
    });

    fontSmoothingChkBox.addEventListener("change", function () {
        applyPreview();
    });

    enableAnimationsChkBox.addEventListener("change", function () {
        if (enableAnimationsChkBox.checked) {
            animationSelector.disabled = false;
        } else {
            animationSelector.disabled = true;
        }
    });

    flatMenuChkBox.addEventListener("change", function () {
        if (flatMenuChkBox.checked) {
            flatMenuSelector.disabled = false;
        } else {
            flatMenuSelector.disabled = true;
        }
        applyPreview();
    });

    flatMenuSelector.addEventListener("change", applyPreview);

    importBtn.addEventListener("click", async function () {
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
    });

    window.apply = function () {
        parent.changeFont(fontSmoothingChkBox.checked);
        if (systemColorChhkBox.checked) {
            applyScheme(scheme); // Apply the cached one (for preview) first to give libmad a chance to load the system scheme at the right time
            applyScheme("sys");
            parent.changeBgColor(colorPickerColor.style.backgroundColor);
        } else if (selector.disabled) {
            parent.changeColorScheme(schemeSelector.value);
            localStorage.madesktopColorScheme = schemeSelector.value;
            parent.changeBgColor(colorPickerColor.style.backgroundColor);
        } else {
            applyScheme(scheme);
        }

        if (fontSmoothingChkBox.checked) {
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

        if (schemeSelector.value === "xpcss4mad" && !systemColorChhkBox.checked && parseInt(madDeskMover.config.height) <= 455) {
            madResizeTo(undefined, 455);
        } else if (madDeskMover.config.height === "455px") {
            madResizeTo(undefined, 420);
        }

        if (selector.disabled && !systemColorChhkBox.checked) {
            parent.adjustAllElements(parseInt(scheme["extra-title-height"]) || 0, parseInt(scheme["extra-border-size"]) || 0, parseInt(scheme["extra-border-bottom"]) || 0);
        } else {
            parent.adjustAllElements();
        }
    }

    if (localStorage.madesktopColorScheme === "sys") {
        systemColorChhkBox.checked = true;
        schemeSelector.disabled = true;
        selector.disabled = true;
        colorPickerColor.style.backgroundColor = localStorage.madesktopBgColor;
    } else if (localStorage.madesktopColorScheme !== "custom" && localStorage.madesktopColorScheme !== "98" && localStorage.madesktopColorScheme) {
        schemeSelector.value = localStorage.madesktopColorScheme;
        if (schemeSelectorOptions[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.disabled = true;
            colorPickerColor.style.backgroundColor = localStorage.madesktopBgColor;
        }
    }

    if (localStorage.sysplugIntegration) {
        systemColorChhkBox.disabled = false;
    }
    
    if (localStorage.madesktopNoPixelFonts) {
        fontSmoothingChkBox.checked = true;
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

    if (localStorage.madesktopDebugMode) {
        importBtn.style.display = "block";
    }

    function changeColor(color) {
        const option = options[selector.selectedIndex];
        switch (openColorPicker.id) {
            case "firstColor":
                scheme[option.value] = color;
                break;
            case "secondColor":
                scheme[option.dataset.second] = color;
                break;
            case "textColor":
                scheme[option.dataset.text] = color;
                break;
        }
        openColorPicker.querySelector(".colorPicker-color").style.backgroundColor = color;
        applyPreview();
    }

    function applyPreview() {
        if (selector.disabled) {
            if (systemColorChhkBox.checked) {
                preview.contentWindow.changeColorScheme("sys");
            } else {
                preview.contentWindow.changeColorScheme(schemeSelector.value);
            }
            preview.contentDocument.body.style.backgroundColor = colorPickerColor.style.backgroundColor;
        } else {
            const schemeText = generateCssScheme(scheme);
            preview.contentWindow.changeColorScheme(schemeText);
            preview.contentDocument.body.style.backgroundColor = scheme["background"];
        }

        preview.contentWindow.changeFont(fontSmoothingChkBox.checked);
        preview.contentWindow.changeMenuStyle(flatMenuChkBox.checked ? flatMenuSelector.value : false);
    }
}

async function getSchemeText(scheme = parent.document.getElementById("scheme").href) {
    // 98 scheme
    let schemeText = `:root {
        --active-border: #c0c0c0;
        --active-title: #000080;
        --app-workspace: #808080;
        --background: #008080;
        --button-alternate-face: #c0c0c0;
        --button-dk-shadow: #000000;
        --button-face: #c0c0c0;
        --button-hilight: #ffffff;
        --button-light: #c0c0c0;
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

function applyScheme(scheme) {
    if (scheme === "sys") {
        parent.changeColorScheme("sys");
        localStorage.madesktopColorScheme = "sys";
    } else {
        const schemeText = generateCssScheme(scheme);
        parent.changeColorScheme(schemeText);
        localStorage.madesktopColorScheme = "custom";
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
    let cssScheme = `:root {\n`;
    for (const key in scheme) {
        cssScheme += `--${key}: ${scheme[key]};\n`;
    }
    cssScheme += "}";
    return cssScheme;
}