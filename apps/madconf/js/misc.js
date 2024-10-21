// misc.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const dpiLabel = document.getElementById('dpiLabel');
const dpiSlider = document.getElementById('dpiSlider');
const dpiSelector = document.getElementById('dpiSelector');
const dpiSelectorOptions = dpiSelector.options;
const dpiSelectorCustom = dpiSelectorOptions[dpiSelectorOptions.length - 1];
const sysplugChkBox = document.getElementById('sysplugChkBox');
const startSoundChkBox = document.getElementById('startSoundChkBox');
const alertSoundChkBox = document.getElementById('alertSoundChkBox');
const soundSchemeSelector = document.getElementById('soundSchemeSelector');
const noDisableChkBox = document.getElementById('noDisableChkBox');
const leftIconArea = document.getElementById('leftIconArea');
const rightIconArea = document.getElementById('rightIconArea');
const topIconArea = document.getElementById('topIconArea');
const bottomIconArea = document.getElementById('bottomIconArea');
const connectTestBtn = document.getElementById('connectTestBtn');
const connectionStatus = document.getElementById('connectionStatus');
const showGuideBtn = document.getElementById('showGuideBtn');
const inetcplBtn = document.getElementById('inetcplBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const langSelector = document.getElementById('langSelector');
const resetBtn = document.getElementById('resetBtn');

const isWin10 = navigator.userAgent.includes('Windows NT 10.0');

let config = {
    dpi: parent.scaleFactor.toString(),
    sysplug: localStorage.sysplugIntegration,
    startSound: !localStorage.madesktopStartSndMuted,
    alertSound: !localStorage.madesktopAlertSndMuted,
    soundScheme: localStorage.madesktopSoundScheme || "98",
    noDisable: localStorage.madesktopNoDeactivate,
    leftIcon: localStorage.madesktopChanViewLeftMargin || '75px',
    rightIcon: localStorage.madesktopChanViewRightMargin || 0,
    topIcon: localStorage.madesktopChanViewTopMargin || 0,
    bottomIcon: localStorage.madesktopChanViewBottomMargin || '48px',
    lang: window.madLang
};

switch (config.dpi * 100) {
    case 100:
        dpiSelector.selectedIndex = 0;
        break;
    case 125:
        dpiSelector.selectedIndex = 1;
        break;
    case 150:
        dpiSelector.selectedIndex = 2;
        break;
    case 175:
        dpiSelector.selectedIndex = 3;
        break;
    case 200:
        dpiSelector.selectedIndex = 4;
        break;
    case 225:
        dpiSelector.selectedIndex = 5;
        break;
    case 250:
        dpiSelector.selectedIndex = 6;
        break;
    case 275:
        dpiSelector.selectedIndex = 7;
        break;
    case 300:
        dpiSelector.selectedIndex = 8;
        break;
    case 325:
        dpiSelector.selectedIndex = 9;
        break;
    case 350:
        dpiSelector.selectedIndex = 10;
        break;
    case 375:
        dpiSelector.selectedIndex = 11;
        break;
    case 400:
        dpiSelector.selectedIndex = 12;
        break;
    default:
        dpiSelector.selectedIndex = 13;
        dpiSelectorCustom.textContent = config.dpi * 100 + "%";
}
dpiSlider.value = dpiSelector.selectedIndex;

if (!CSS.supports('zoom', '1')) {
    dpiSelector.disabled = true;
    dpiSlider.disabled = true;
    dpiLabel.locId = "MADCONF_DPI_TITLE_FF_UNSUPPORTED";
}

if (isWin10) {
    if (config.sysplug) {
        sysplugChkBox.checked = true;
    }
} else {
    sysplugChkBox.disabled = true;
    connectTestBtn.disabled = true;
    connectionStatus.locId = "MADCONF_SYSPLUG_UNSUPPORTED";
    showGuideBtn.disabled = true;
}

if (config.startSound) {
    startSoundChkBox.checked = true;
}

if (config.alertSound) {
    alertSoundChkBox.checked = true;
}

if (config.soundScheme) {
    soundSchemeSelector.value = config.soundScheme;
}

if (config.noDisable) {
    noDisableChkBox.checked = true;
}

leftIconArea.value = config.leftIcon;
rightIconArea.value = config.rightIcon;
topIconArea.value = config.topIcon;
bottomIconArea.value = config.bottomIcon;

langSelector.value = config.lang;

window.apply = function () {
    parent.changeScale(config.dpi);
    localStorage.madesktopScaleFactor = config.dpi;

    if (config.sysplug) {
        localStorage.sysplugIntegration = true;
    } else {
        delete localStorage.sysplugIntegration;
        if (localStorage.madesktopColorScheme === "sys") {
            parent.changeColorScheme("98");
            localStorage.madesktopColorScheme = "98";
        }
    }

    if (!config.startSound) {
        localStorage.madesktopStartSndMuted = true;
    } else {
        delete localStorage.madesktopStartSndMuted;
    }

    if (!config.alertSound) {
        localStorage.madesktopAlertSndMuted = true;
    } else {
        delete localStorage.madesktopAlertSndMuted;
    }

    parent.changeSoundScheme(config.soundScheme);
    localStorage.madesktopSoundScheme = config.soundScheme;

    if (config.noDisable) {
        localStorage.madesktopNoDeactivate = true;
    } else {
        delete localStorage.madesktopNoDeactivate;
    }
    parent.activateWindow();

    localStorage.madesktopChanViewLeftMargin = config.leftIcon;
    localStorage.madesktopChanViewRightMargin = config.rightIcon;
    localStorage.madesktopChanViewTopMargin = config.topIcon;
    localStorage.madesktopChanViewBottomMargin = config.bottomIcon;

    parent.changeLanguage(config.lang);
    localStorage.madesktopLang = config.lang;

    madAnnounce("sysplug-option-changed");
}

dpiSlider.addEventListener('input', function () {
    dpiSelector.selectedIndex = this.value;
    config.dpi = dpiSelector.value;
});

dpiSelector.addEventListener('change', function () {
    dpiSlider.value = this.selectedIndex;
    if (this.value === 'custom') {
        madPrompt(madGetString("MADCONF_PROMPT_ENTER_SCALE"), async (res) => {
            if (res === null) {
                if (madKbdSupport === 0) {
                    // Weird timing issues with prompt() and libmad mad-select
                    await parent.asyncTimeout(100);
                }
                dpiSelector.value = config.dpi;
                dpiSlider.value = dpiSelector.selectedIndex;
                dpiSelectorCustom.innerHTML = '<mad-string data-locid="UI_CUSTOM"></mad-string>';
                return;
            }
            config.dpi = res / 100;
            dpiSelectorCustom.textContent = res + "%";
        });
    } else {
        dpiSelectorCustom.innerHTML = '<mad-string data-locid="UI_CUSTOM"></mad-string>';
        config.dpi = this.value;
    }
});

sysplugChkBox.addEventListener('change', function () {
    config.sysplug = this.checked;
    if (this.checked) {
        checkSysplug();
    }
});

startSoundChkBox.addEventListener('change', function () {
    config.startSound = this.checked;
});

alertSoundChkBox.addEventListener('change', function () {
    config.alertSound = this.checked;
});

soundSchemeSelector.addEventListener('change', function () {
    config.soundScheme = this.value;
});

noDisableChkBox.addEventListener('change', function () {
    config.noDisable = this.checked;
});

leftIconArea.addEventListener('change', function () {
    config.leftIcon = parseMarginInput(this.value);
});

rightIconArea.addEventListener('change', function () {
    config.rightIcon = parseMarginInput(this.value);
});

topIconArea.addEventListener('change', function () {
    config.topIcon = parseMarginInput(this.value);
});

bottomIconArea.addEventListener('change', function () {
    config.bottomIcon = parseMarginInput(this.value);
});

function parseMarginInput(input) {
    if (isNaN(input) || input === '0') {
        return input;
    } else if (input === '') {
        return '0';
    } else {
        return input + 'px';
    }
}

connectTestBtn.addEventListener('click', checkSysplug);

showGuideBtn.addEventListener('click', function () {
    madOpenWindow("SysplugSetupGuide.md", true);
});

inetcplBtn.addEventListener('click', function () {
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const options = {
        left, top, width: '400px', height: '371px', unresizable: true, noIcon: true
    }
    madOpenWindow('apps/inetcpl/general.html', true, options);
});

exportBtn.addEventListener('click', function () {
    exportConfig();
});

importBtn.addEventListener('click', async function () {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const text = await file.text();

    const res = await madConfirm(madGetString("MADCONF_CONF_IMPORT_CONFIRM"));
    if (res) {
        try {
            const parsed = JSON.parse(text);
            const confVer = parsed.madesktopLastVer;
            if (confVer) {
                if (top.madVersion.compare(confVer, true) < 0) {
                    madAlert(madGetString("MADCONF_NEWER_CONF_MSG"), null, "error");
                    return;
                }
            } else {
                madAlert(madGetString("MADCONF_CONF_INVALID"), null, "error");
                return;
            }
            await madIdb.setItem("configToImport", file);
            parent.location.replace("../../confmgr.html?action=import");
        } catch {
            // Might be gzipped
            // Just pass it to confmgr for further processing
            await madIdb.setItem("configToImport", file);
            parent.location.replace("../../confmgr.html?action=import");
        }
    }
});

langSelector.addEventListener('change', async function () {
    if (this.value === 'translate') {
        madOpenWindow('Translating.md', true);
        await asyncTimeout(100);
        this.value = config.lang;
    } else {
        config.lang = this.value;
    }
});

resetBtn.addEventListener('click', async function () {
    const res = await madConfirm(madGetString("MAD_CONFIRM_RESET"));
    if (res) {
        top.location.replace("../../confmgr.html?action=reset");
    }
});

async function checkSysplug() {
    connectionStatus.locId = "MADCONF_CONNECTTEST_CHECKING";
    switch (await madSysPlug.checkConnectivity()) {
        case 1:
            connectionStatus.locId = "MADCONF_CONNECTTEST_SUCCESS";
            break;
        case -1:
            connectionStatus.locId = "MADCONF_CONNECTTEST_OUTDATED";
            break;
        case -2:
            connectionStatus.locId = "MADCONF_CONNECTTEST_DENIED";
            break;
        case -3:
            connectionStatus.locId = "MADCONF_CONNECTTEST_NEWER";
            break;
        case 0:
            connectionStatus.locId = "MADCONF_CONNECTTEST_FAIL";
            break;
    }
}

// Export the MAD config to a file
// minimal: Exclude images (custom wallpapers and JSPaint image storage) from the export
async function exportConfig(minimal = false) {
    const keysToIgnore = [
        // Configs to be overwritten after the import is done
        'madesktopMigrationProgress',
        'madesktopForceRunStartup',
        // Configs used for tracking the WPE properties panel
        'madesktopVisUnavailable',
        'madesktopBgWeColor',
        'madesktopBgWeImg',
        'madesktopBgVideo',
        'madesktopLastPresetUrl',
        // Device specific configs
        'madesktopSysColorCache',
        // Legacy configs that existed before config export was introduced
        'madesktopLastCustomScale',
        'madesktopPrevOWConfigRequest',
        'madesktopDestroyedItems',
        'madesktopNonADStyle',
        'madesktopNoPixelFonts',
        // Debug configs without an exposed config UI (prevent troll configs)
        'madesktopDebugLangLoadDelay',
        // Temporary configs
        'madesktopFailCount',
        'madesktopConfigToImport',
        // Prevent security feature bypass
        'madesktopBgHtmlUnverified',
    ];

    const madConfig = {};
    let blob;
    let large = false;

    // Export MAD localStorage config
    for (const key in localStorage) {
        if ((key.startsWith("madesktop") || key === "sysplugIntegration" ||
            (key.startsWith('image#') && !minimal) || key.startsWith('jspaint ')) &&
            !keysToIgnore.includes(key)
        ) {
            madConfig[key] = localStorage[key];
        }
    }
    // Export MAD IndexedDB config
    if (await madIdb.itemExists("bgImg") && !minimal) {
        const base64 = await blobToBase64(await madIdb.bgImg);
        madConfig["madesktopBgImg"] = base64;
    }
    if (await madIdb.itemExists("cvFavorites")) {
        const cvFavorites = await madIdb.cvFavorites;
        for (const favorite of cvFavorites) {
            if (favorite.length === 3) {
                if (minimal) {
                    favorite.pop();
                } else {
                    const base64 = await blobToBase64(favorite[2]);
                    favorite[2] = "data:" + favorite[2].type + ";base64," + base64;
                }
            }
        }
        madConfig["madesktopChanViewFavorites"] = JSON.stringify(cvFavorites);
    }

    // Handle large files, compress if > 1 MB
    const json = JSON.stringify(madConfig);
    blob = new Blob([json], { type: 'application/json' });
    if (blob.size > 1024 * 1024 && !minimal) { // 1 MB
        const cs = new CompressionStream("gzip");
        const reader = blob.stream().pipeThrough(cs).getReader();
        const chunks = [];

        let result;
        while (!(result = await reader.read()).done) {
            chunks.push(result.value);
        }
        blob = new Blob(chunks, { type: 'application/gzip' });
        large = true;
    }

    // Download or save the file
    // If MAD is running in a browser, download the file
    // Else, if the system plugin is available, save the file
    // Otherwise, copy the JSON to the clipboard
    // If the file is too large to copy to the clipboard,
    // export the config again without images
    const filename = "madesktop-config.json" + (large ? ".gz" : "");
    if (madRunningMode === 0) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    } else {
        try {
            const res = await madSysPlug.saveFile(blob, {
                "X-Format-Name": large ? "GZ Files" : "JSON Files",
                "X-Format-Extension": large ? "gz" : "json",
                "X-File-Name": filename
            });
            if (!res) {
                if (large) {
                    exportConfig(true);
                } else {
                    copyText(json);
                    madAlert(madGetString(minimal ? "MADCONF_CONF_COPIED_MINIMAL" : "MADCONF_CONF_COPIED"));
                }
            }
        } catch {
            if (large) {
                exportConfig(true);
            } else {
                copyText(json);
                madAlert(madGetString(minimal ? "MADCONF_CONF_COPIED_MINIMAL" : "MADCONF_CONF_COPIED"));
            }
        }
    }
}

window.scrollTo(0, 0);