const dpiSlider = document.getElementById('dpiSlider');
const dpiSelector = document.getElementById('dpiSelector');
const dpiSelectorOptions = dpiSelector.options;
const dpiSelectorCustom = dpiSelectorOptions[dpiSelectorOptions.length - 1];
const sysplugChkBox = document.getElementById('sysplugChkBox');
const sysplugOpenOptSelector = document.getElementById('sysplugOpenOptSelector');
const sysplugOpenOptSelectorOptions = sysplugOpenOptSelector.options;
const startSoundChkBox = document.getElementById('startSoundChkBox');
const alertSoundChkBox = document.getElementById('alertSoundChkBox');
const noDisableChkBox = document.getElementById('noDisableChkBox');
const leftIconArea = document.getElementById('leftIconArea');
const rightIconArea = document.getElementById('rightIconArea');
const connectTestBtn = document.getElementById('connectTestBtn');
const connectionStatus = document.getElementById('connectionStatus');
const showGuideBtn = document.getElementById('showGuideBtn');
const resetBtn = document.getElementById('resetBtn');

let config = {
    dpi: parent.scaleFactor,
    sysplug: localStorage.sysplugIntegration,
    sysplugOpenOpt: localStorage.madesktopPrevOWConfigRequest || 1,
    startSound: !localStorage.madesktopStartSndMuted,
    alertSound: !localStorage.madesktopAlertSndMuted,
    noDisable: localStorage.madesktopNoDeactivate,
    leftIcon: localStorage.madesktopChanViewLeftMargin || '75px',
    rightIcon: localStorage.madesktopChanViewRightMargin || 0
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

if (config.sysplug) {
    sysplugChkBox.checked = true;
    sysplugOpenOptSelector.disabled = false;
}

sysplugOpenOptSelector.selectedIndex = config.sysplugOpenOpt;

if (config.startSound) {
    startSoundChkBox.checked = true;
}

if (config.alertSound) {
    alertSoundChkBox.checked = true;
}

if (config.noDisable) {
    noDisableChkBox.checked = true;
}

leftIconArea.value = config.leftIcon;
rightIconArea.value = config.rightIcon;

window.apply = function() {
    parent.changeScale(config.dpi);
    localStorage.madesktopScaleFactor = config.dpi;

    if (config.sysplug) {
        localStorage.sysplugIntegration = true;
        localStorage.madesktopPrevOWConfigRequest = config.sysplugOpenOpt;
        parent.updateSysplugOpenOpt(config.sysplugOpenOpt);
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

    if (config.noDisable) {
        localStorage.madesktopNoDeactivate = true;
    } else {
        delete localStorage.madesktopNoDeactivate;
    }
    parent.activateWindow();

    localStorage.madesktopChanViewLeftMargin = config.leftIcon;
    localStorage.madesktopChanViewRightMargin = config.rightIcon;
}

dpiSlider.addEventListener('input', function() {
    dpiSelector.selectedIndex = this.value;
    config.dpi = dpiSelector.value;
});

dpiSelector.addEventListener('change', function() {
    dpiSlider.value = this.selectedIndex;
    if (this.value === 'custom') {
        madPrompt("Enter scale (%) :", res => {
            if (res === null) return;
            config.dpi = res / 100;
            dpiSelectorCustom.textContent = res + "%";
        });
    } else {
        dpiSelectorCustom.textContent = "Custom";
        config.dpi = this.value;
    }
});

sysplugChkBox.addEventListener('change', function() {
    config.sysplug = this.checked;
    if (this.checked) {
        checkSysplug();
        sysplugOpenOptSelector.disabled = false;
    } else {
        sysplugOpenOptSelector.disabled = true;
    }
});

sysplugOpenOptSelector.addEventListener('change', function() {
    config.sysplugOpenOpt = this.selectedIndex;
});

startSoundChkBox.addEventListener('change', function() {
    config.startSound = this.checked;
});

alertSoundChkBox.addEventListener('change', function() {
    config.alertSound = this.checked;
});

noDisableChkBox.addEventListener('change', function() {
    config.noDisable = this.checked;
});

leftIconArea.addEventListener('change', function() {
    config.leftIcon = this.value;
});

rightIconArea.addEventListener('change', function() {
    config.rightIcon = this.value;
});

connectTestBtn.addEventListener('click', checkSysplug);

showGuideBtn.addEventListener('click', function() {
    madOpenWindow("SysplugSetupGuide.md", true);
});

resetBtn.addEventListener('click', function() {
    madConfirm("If you want to reset all the configurations completely, first click the big red Reset button in the Wallpaper Engine properties panel, then click OK.", parent.reset);
});

function checkSysplug() {
    connectionStatus.textContent = "Checking system plugin connectivity...";
    fetch("http://localhost:3031/connecttest")
        .then(response => response.text())
        .then(responseText => {
            if (responseText !== "OK") {
                connectionStatus.textContent = "An error occurred while connecting with the system plugin.";
                madAlert("An error occurred!\nSystem plugin response: " + responseText, null, "error");
            } else {
                connectionStatus.textContent = "System plugin connection successful!";
            }
        })
        .catch(error => {
            connectionStatus.textContent = "System plugin is not running. Please install the system plugin with the guide.";
        });
}