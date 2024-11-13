// welcome.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const langSelector = document.getElementById("langSelector");
const items = document.querySelectorAll(".items");
const contents = document.querySelectorAll(".contents");
const bgImg = document.getElementById("bgImg");
const showWelcomeChkBox = document.getElementById("showWelcome");
const closeBtn = document.getElementById("closeBtn");
const itemsTitleImage = document.getElementById("itemsTitleImage");
const itemsTitleText = document.getElementById("itemsTitleText");
const checkmarks = document.querySelectorAll(".checkmark");
const unsupportedWarning = document.getElementById("unsupportedWarning");
const isUnsupportedChromium = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)?.[2] < 124 || false;

if (!localStorage.madesktopStartSndMuted) {
    const audio = new Audio("resources/WELCOM98.FLAC");
    audio.volume = 0.7;
    audio.play();
}

if (navigator.userAgent.match("Windows NT 6.1")) {
    unsupportedWarning.style.display = "block";
    unsupportedWarning.locId = "WELCOME_UNSUPPORTED_WIN7";
} else if (navigator.userAgent.match("Windows NT 6.2")) {
    unsupportedWarning.style.display = "block";
    unsupportedWarning.locId = "WELCOME_UNSUPPORTED_WIN8";
} else if (navigator.userAgent.match("Windows NT 6.3")) {
    unsupportedWarning.style.display = "block";
    unsupportedWarning.locId = "WELCOME_UNSUPPORTED_WIN81";
} else if (isUnsupportedChromium) {
    unsupportedWarning.style.display = "block";
    if (madRunningMode === 1) {
        unsupportedWarning.locId = "WELCOME_UNSUPPORTED_WPE";
    } else {
        unsupportedWarning.locId = "WELCOME_UNSUPPORTED_CHROMIUM";
    }
}

for (const supportedLang in window.madSupportedLanguages) {
    const option = document.createElement('option');
    option.value = supportedLang;
    option.textContent = window.madSupportedLanguages[supportedLang];
    langSelector.insertBefore(option, langSelector.lastElementChild);
}

langSelector.value = window.madLang;

langSelector.addEventListener("change", function () {
    localStorage.madesktopLang = langSelector.value;
    top.changeLanguage(langSelector.value);
});

for (const item of items) {
    item.addEventListener("pointerover", function () {
        for (const content of contents) {
            if (item.id[4] === content.id[7]) {
                content.style.display = "block";
            } else {
                content.style.display = "none";
            }

            switch (item.id[4]) {
                case "1":
                    bgImg.src = "resources/clock.png";
                    break;
                case "2":
                    bgImg.src = "resources/phone.png";
                    break;
                case "3":
                    bgImg.src = "resources/keyboard.png";
                    break;
                case "4":
                    bgImg.src = "resources/earth.png";
            }
        }
    });

    item.addEventListener("pointerleave", function () {
        contents[item.id[4]].style.display = "none";
        contents[0].style.display = "block";
        bgImg.src = "resources/computer.png";
    });
}

items[0].addEventListener("click", function () {
    madOpenWindow("Updated.md", true);
    checkmarks[0].style.display = "block";
    localStorage.madesktopCheckedChanges = true;
});

items[1].addEventListener("click", async function () {
    // Show tutorial of how to open the properties menu
    const menuBtn = madDeskMover.config.style === "wnd" ? madDeskMover.windowIcon : madDeskMover.windowMenuBtn;
    await flashElement(menuBtn);
    madDeskMover.contextMenuBg.style.pointerEvents = "none";
    madDeskMover.confMenuBg.style.pointerEvents = "none";
    madDeskMover.ignoreFocusLoss = true;
    madDeskMover.openContextMenu();
    await waitForAnim(madDeskMover.contextMenuBg);
    await asyncTimeout(300);
    await flashElement(madDeskMover.contextMenuItems[0], true);
    madDeskMover.openConfMenu();
    await waitForAnim(madDeskMover.confMenuBg);
    await asyncTimeout(300);
    await flashElement(madDeskMover.confMenuItems[10], true);
    await asyncTimeout(100);
    madOpenConfig();
    madDeskMover.closeContextMenu();
    madDeskMover.confMenuBg.style.pointerEvents = "auto";
    madDeskMover.contextMenuBg.style.pointerEvents = "auto";
    madDeskMover.ignoreFocusLoss = false;

    checkmarks[1].style.display = "block";
    localStorage.madesktopCheckedConfigs = true;
});

items[2].addEventListener("click", function () {
    madOpenWindow("SysplugSetupGuide.md", true);
});

items[3].addEventListener("click", function () {
    window.open("https://github.com/Ingan121/ModernActiveDesktop", "_blank");
    checkmarks[3].style.display = "block";
    localStorage.madesktopCheckedGithub = true;
});

closeBtn.addEventListener("click", function () {
    madCloseWindow();
});

closeBtn.addEventListener("animationend", function () {
    for (const content of contents) {
        content.style.animation = "none";
    }
});

showWelcomeChkBox.addEventListener("change", function () {
    if (showWelcomeChkBox.checked) {
        localStorage.removeItem("madesktopHideWelcome");
    } else {
        localStorage.madesktopHideWelcome = true;
    }
});

if (localStorage.madesktopHideWelcome) {
    showWelcomeChkBox.checked = false;
}

if (localStorage.madesktopCheckedChanges) {
    checkmarks[0].style.display = "block";
}

if (localStorage.madesktopCheckedConfigs) {
    checkmarks[1].style.display = "block";
}

if (localStorage.madesktopCheckedGithub) {
    checkmarks[3].style.display = "block";
}

// HiDPI: use real font instead of image
switchItemTitleDisplay();

new MutationObserver(function (mutations) {
    switchItemTitleDisplay();
}).observe(
    document.body,
    { attributes: true, attributeFilter: ["style"] }
);

setInterval(checkSysplug, 2000);

function switchItemTitleDisplay() {
    if (madScaleFactor * window.devicePixelRatio !== 1) {
        itemsTitleImage.style.display = "none";
        itemsTitleText.style.display = "block";
    } else {
        itemsTitleImage.style.display = "block";
        itemsTitleText.style.display = "none";
    }
}

async function checkSysplug() {
    if (await madSysPlug.checkConnectivity() === 1) {
        checkmarks[2].style.display = "block";
    } else {
        checkmarks[2].style.display = "none";
    }
}

closeBtn.focus();