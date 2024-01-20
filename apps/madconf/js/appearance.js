'use strict';

main();

async function main() {
    let scheme = parseCssScheme(await getSchemeText());
    const schemeSelector = document.getElementById("schemeSelector");
    const schemeSelectorOptions = schemeSelector.options;
    const selector = document.getElementById("selector");
    const options = selector.options;
    const colorPicker = document.querySelector(".colorPicker");
    const colorPickerColor = document.querySelector(".colorPicker-color");
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

    colorPickerColor.style.backgroundColor = scheme[options[selector.selectedIndex].value];

    schemeSelector.addEventListener("change", async function () {
        scheme = parseCssScheme(await getSchemeText(`../../schemes/${schemeSelector.value}.css`));
        if (schemeSelectorOptions[schemeSelector.selectedIndex].dataset.inconfigurable) {
            selector.selectedIndex = 11; // background
            selector.disabled = true;
        } else {
            selector.disabled = false;
        }
        selector.dispatchEvent(new Event("change"));
    
        if (schemeSelector.value === "95") {
            flatMenuChkBox.checked = true;
            flatMenuSelector.disabled = false;
            flatMenuSelector.selectedIndex = 0;
        } else if (schemeSelector.value.startsWith("xp")) {
            flatMenuChkBox.checked = true;
            flatMenuSelector.disabled = false;
            flatMenuSelector.selectedIndex = 2;
        } else {
            flatMenuChkBox.checked = false;
            flatMenuSelector.disabled = true;
        }

        applyPreview();
    });

    selector.addEventListener("change", function () {
        const option = options[selector.selectedIndex].value;
        colorPickerColor.style.backgroundColor  = scheme[option];
    });

    colorPicker.addEventListener("click", function () {
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

    miniPicker.addEventListener("focusout", function (event) {
        if (event.relatedTarget !== colorPicker && event.relatedTarget !== openColorPickerBtn) {
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
            selector.disabled = true;
            colorPicker.disabled = true;
            scheme = parseCssScheme(await getSchemeText("http://localhost:3031/systemscheme"));
            applyPreview();
        } else {
            schemeSelector.disabled = false;
            selector.disabled = false;
            colorPicker.disabled = false;
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
            applyScheme("sys");
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

        parent.adjustAllElements(parseInt(scheme["extra-title-height"]) || 0, parseInt(scheme["extra-border-width"]) || 0, parseInt(scheme["extra-border-height"]) || 0);
    }

    if (localStorage.madesktopColorScheme === "sys") {
        systemColorChhkBox.checked = true;
        schemeSelector.disabled = true;
        selector.disabled = true;
        colorPicker.disabled = true;
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

    applyPreview();

    if (localStorage.madesktopDebugMode) {
        importBtn.style.display = "block";
    }

    function changeColor(color) {
        const option = options[selector.selectedIndex].value;
        scheme[option] = color;
        colorPickerColor.style.backgroundColor = color;
        applyPreview();
    }

    function applyPreview() {
        const preview = document.getElementById("preview");
        const styleElement = document.getElementById("style");
        const schemeText = generateCssScheme(scheme, "#preview");
        styleElement.textContent = schemeText;
    
        if (fontSmoothingChkBox.checked) {
            styleElement.textContent += `
                #preview * {
                    font-family: 'Segoe UI', sans-serif !important;
                }
            `;
        } else {
            styleElement.textContent += `
                #preview * {
                    font-family: "Pixelated MS Sans Serif" !important;
                }
            `;
        }
    
        if (flatMenuChkBox.checked && flatMenuSelector.selectedIndex !== 1) {
            styleElement.textContent += `
                .menu > div[data-active] {
                    border-color: var(--menu-highlight) !important;
                    background-color: var(--menu-highlight) !important;
                    color: var(--hilight-text) !important;
                }
                .menu > div[data-active] span {
                    margin: 0;
                }
            `;
        }
    
        if (selector.disabled) {
            preview.style.backgroundColor = document.querySelector(".colorPicker-color").style.backgroundColor;
        } else {
            preview.style.backgroundColor = scheme["background"];
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
        const schemeText = generateCssScheme(scheme, ":root");
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
        if (line.startsWith("--")) {
            const [key, value] = line.split(":");
            scheme[key.trim().slice(2)] = value.trim().slice(0, -1);
        }
    }
    return scheme;
}

function generateCssScheme(scheme, parent) {
    let cssScheme = `${parent} {\n`;
    for (const key in scheme) {
        cssScheme += `--${key}: ${scheme[key]};\n`;
    }
    cssScheme += "}";
    return cssScheme;
}