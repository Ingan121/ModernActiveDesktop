'use strict';

main();

async function main() {
    let scheme = parseCssScheme(await getSchemeText());
    const schemeSelector = document.getElementById("schemeSelector");
    const selector = document.getElementById("selector");
    const options = selector.options;
    const colorPicker = document.querySelector(".colorPicker");
    const colorPickerColor = document.querySelector(".colorPicker-color");
    const miniPicker = document.getElementById("miniPicker");
    const miniPickerColors = document.querySelectorAll(".color");
    const openColorPickerBtn = document.getElementById("openColorPickerBtn");
    const systemColorChhkBox = document.getElementById("systemColorChkBox");
    const fontSmoothingChkBox = document.getElementById("fontSmoothingChkBox");
    const importBtn = document.getElementById("importBtn");

    colorPickerColor.style.backgroundColor = scheme[options[selector.selectedIndex].value];

    schemeSelector.addEventListener("change", async function () {
        scheme = parseCssScheme(await getSchemeText(`../../schemes/${schemeSelector.value}.css`));
        applyPreview(scheme, fontSmoothingChkBox.checked);
        selector.dispatchEvent(new Event("change"));
        if (schemeSelector.value === "xpcss4mad") {
            selector.disabled = true;
            colorPicker.disabled = true;
        } else {
            selector.disabled = false;
            colorPicker.disabled = false;
        }
    });

    selector.addEventListener("change", function () {
        const option = options[selector.selectedIndex].value;
        colorPickerColor.style.backgroundColor  = scheme[option];
    });

    colorPicker.addEventListener("click", function () {
        miniPicker.style.top = `${colorPicker.getBoundingClientRect().top + colorPicker.offsetHeight}px`;
        miniPicker.style.left = `${colorPicker.offsetLeft}px`;
        miniPicker.style.display = "block";
    });

    function changeColor(color) {
        const option = options[selector.selectedIndex].value;
        scheme[option] = color;
        colorPickerColor.style.backgroundColor = color;
        applyPreview(scheme, fontSmoothingChkBox.checked);
    }

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
            applyPreview(scheme, fontSmoothingChkBox.checked);
        } else {
            schemeSelector.disabled = false;
            selector.disabled = false;
            colorPicker.disabled = false;
        }
    });

    fontSmoothingChkBox.addEventListener("change", function () {
        applyPreview(scheme, fontSmoothingChkBox.checked);
    });

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
        } else if (schemeSelector.value === "xpcss4mad") {
            parent.changeColorScheme("xpcss4mad");
            localStorage.madesktopColorScheme = "xpcss4mad";
        } else {
            applyScheme(scheme);
        }

        if (fontSmoothingChkBox.checked) {
            localStorage.madesktopNoPixelFonts = true;
        } else {
            delete localStorage.madesktopNoPixelFonts;
        }

        parent.document.dispatchEvent(new Event("mouseup"));
    }

    if (localStorage.madesktopColorScheme === "sys") {
        systemColorChhkBox.checked = true;
        schemeSelector.disabled = true;
        selector.disabled = true;
        colorPicker.disabled = true;
    }

    if (localStorage.madesktopColorScheme === "xpcss4mad") {
        schemeSelector.value = "xpcss4mad";
        selector.disabled = true;
        colorPicker.disabled = true;
    }

    if (localStorage.sysplugIntegration) {
        systemColorChhkBox.disabled = false;
    }
    
    if (localStorage.madesktopNoPixelFonts) {
        fontSmoothingChkBox.checked = true;
    }

    if (localStorage.madesktopDebugMode) {
        importBtn.style.display = "block";
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
    `;
    if (scheme === "../../schemes/98.css" || scheme === "data:text/css,") {
        return schemeText;
    } else {
        await fetch(scheme).then(res => res.text()).then(text => {
            schemeText = text;
        });
        return schemeText;
    }
}

function applyPreview(scheme, nopixel = false) {
    const styleElement = document.getElementById("style");
    const schemeText = generateCssScheme(scheme, "#preview");
    styleElement.textContent = schemeText;
    if (nopixel) {
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
}

function applyScheme(scheme) {
    if (scheme === "sys") {
        parent.changeColorScheme("sys");
        parent.changeBgColor("var(--background)");
        localStorage.madesktopColorScheme = "sys";
    } else {
        const schemeText = generateCssScheme(scheme, ":root");
        parent.changeColorScheme(schemeText);
        parent.changeBgColor("var(--background)");
        localStorage.madesktopColorScheme = "custom";
    }
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