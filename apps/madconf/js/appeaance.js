main();

async function main() {
    let scheme = parseCssScheme(await getSchemeText());
    const schemeSelector = document.getElementById("schemeSelector");
    const selector = document.getElementById("selector");
    const options = selector.options;
    const colorPicker = document.getElementById("colorPicker");
    const generalBtn = document.getElementById("generalBtn");
    const okBtn = document.getElementById("okBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const applyBtn = document.getElementById("applyBtn");
    colorPicker.value = scheme[options[selector.selectedIndex].value];

    schemeSelector.addEventListener("change", async function() {
        scheme = parseCssScheme(await getSchemeText(schemeSelector.value));
        applyPreview(scheme);
        selector.dispatchEvent(new Event("change"));
    });

    selector.addEventListener("change", function() {
        const option = options[selector.selectedIndex].value;
        colorPicker.value = scheme[option];
    });

    colorPicker.addEventListener("change", function() {
        const option = options[selector.selectedIndex].value;
        scheme[option] = colorPicker.value;
        applyPreview(scheme);
    });

    generalBtn.addEventListener("click", function() {
        madLocReplace("general.html");
    });

    okBtn.addEventListener("click", function() {
        applyScheme(scheme);
        madCloseWindow();
    });

    cancelBtn.addEventListener("click", function() {
        madCloseWindow();
    });

    applyBtn.addEventListener("click", function() {
        applyScheme(scheme);
    });

    okBtn.focus();
    if (parent.runningMode !== 0) {
        generalBtn.style.display = "none";
    
    }
}

async function getSchemeText(scheme) {
    const schemeLink = scheme ? `../../schemes/${scheme}.css` : parent.document.getElementById("scheme").href;
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
        --hot-tracking-color: #0000ff;
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
    if (scheme === "98" || schemeLink === "data:text/css,") {
        return schemeText;
    } else {
        await fetch(schemeLink).then(res => res.text()).then(text => {
            schemeText = text;
        });
        return schemeText;
    }
}

function applyPreview(scheme) {
    const styleElement = document.getElementById("style");
    const schemeText = generateCssScheme(scheme, "#preview");
    styleElement.textContent = schemeText;
}

function applyScheme(scheme) {
    const schemeText = generateCssScheme(scheme, ":root");
    parent.changeColorScheme(schemeText);
    localStorage.madesktopColorScheme = "custom";
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