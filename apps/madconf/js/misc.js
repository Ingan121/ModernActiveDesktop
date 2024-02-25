// misc.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License

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
const resetBtn = document.getElementById('resetBtn');

const isWin10 = navigator.userAgent.includes('Windows NT 10.0');

let config = {
    dpi: parent.scaleFactor,
    sysplug: localStorage.sysplugIntegration,
    startSound: !localStorage.madesktopStartSndMuted,
    alertSound: !localStorage.madesktopAlertSndMuted,
    soundScheme: localStorage.madesktopSoundScheme || "98",
    noDisable: localStorage.madesktopNoDeactivate,
    leftIcon: localStorage.madesktopChanViewLeftMargin || '75px',
    rightIcon: localStorage.madesktopChanViewRightMargin || 0,
    topIcon: localStorage.madesktopChanViewTopMargin || 0,
    bottomIcon: localStorage.madesktopChanViewBottomMargin || '48px'
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

if (navigator.userAgent.includes("Firefox")) {
    dpiSelector.disabled = true;
    dpiSlider.disabled = true;
    dpiLabel.textContent = "Display Scaling (not supported in Firefox)";
}

if (isWin10) {
    if (config.sysplug) {
        sysplugChkBox.checked = true;
    }
} else {
    sysplugChkBox.disabled = true;
    connectTestBtn.disabled = true;
    connectionStatus.textContent = "System plugin requires Windows 10 or higher.";
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

    parent.announce("sysplug-option-changed");
}

dpiSlider.addEventListener('input', function () {
    dpiSelector.selectedIndex = this.value;
    config.dpi = dpiSelector.value;
});

dpiSelector.addEventListener('change', function () {
    dpiSlider.value = this.selectedIndex;
    if (this.value === 'custom') {
        madPrompt("Enter scale (%) :", async (res) => {
            if (res === null) {
                if (madRunningMode === 1) {
                    // Weird timing issues with prompt() and libmad mad-select
                    await parent.asyncTimeout(100);
                }
                dpiSelector.value = config.dpi;
                dpiSlider.value = dpiSelector.selectedIndex;
                dpiSelectorCustom.textContent = "Custom";
                return;
            }
            config.dpi = res / 100;
            dpiSelectorCustom.textContent = res + "%";
        });
    } else {
        dpiSelectorCustom.textContent = "Custom";
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
    config.leftIcon = this.value;
});

rightIconArea.addEventListener('change', function () {
    config.rightIcon = this.value;
});

topIconArea.addEventListener('change', function () {
    config.topIcon = this.value;
});

bottomIconArea.addEventListener('change', function () {
    config.bottomIcon = this.value;
});

connectTestBtn.addEventListener('click', checkSysplug);

showGuideBtn.addEventListener('click', function () {
    madOpenWindow("SysplugSetupGuide.md", true);
});

inetcplBtn.addEventListener('click', function () {
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    madOpenWindow('apps/inetcpl/general.html', true, '400px', '371px', 'wnd', false, top, left, false, true, true);
});

exportBtn.addEventListener('click', function () {
    const json = JSON.stringify(localStorage);
    copyText(json);
    madAlert("Configuration copied to clipboard! Paste it to a text file and save it to import it later.");
});

importBtn.addEventListener('click', async function () {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const text = await file.text();

    try {
        JSON.parse(text);
        const res = await madConfirm("Importing this configuration will overwrite your current configuration. Are you sure you want to continue?");
        if (res) {
            localStorage.madesktopConfigToImport = text;
            parent.location.replace("../../confmgr.html?action=import");
        }
    } catch {
        madAlert("Invalid configuration file!", null, "error");
    }
});

resetBtn.addEventListener('click', parent.reset);

function checkSysplug() {
    connectionStatus.textContent = "Checking system plugin connectivity...";
    fetch("http://localhost:3031/connecttest")
        .then(response => response.text())
        .then(responseText => {
            if (responseText !== localStorage.madesktopLastVer) {
                connectionStatus.textContent = "System plugin is outdated! Please update the system plugin with the guide.";
            } else {
                connectionStatus.textContent = "System plugin connection successful!";
            }
        })
        .catch(error => {
            connectionStatus.textContent = "System plugin is not running. Please install the system plugin with the guide.";
        });
}

window.scrollTo(0, 0);