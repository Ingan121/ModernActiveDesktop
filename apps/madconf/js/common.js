// common.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License

'use strict';

if (parent === window) {
    alert("This page is not meant to be opened directly. Please open it from ModernActiveDesktop.");
} else if (!frameElement) {
    alert("MADConf is being cross-origin restricted. Please run ModernActiveDesktop with a web server.");
}

const tabs = document.querySelectorAll(".tab");
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

const dropdowns = document.querySelectorAll("select");
const textboxes = document.querySelectorAll("input[type=text]");

for (const tab of tabs) {
    tab.addEventListener("click", function () {
        madLocReplace(`apps/madconf/${this.dataset.pagename}.html`);
    });
}

for (const dropdown of dropdowns) {
    dropdown.addEventListener("click", function () {
        madOpenDropdown(this);
    });
}

for (const textbox of textboxes) {
    textbox.addEventListener("click", function () {
        if (madRunningMode === 1) {
            madPrompt("Enter value", function (res) {
                if (res === null) return;
                textbox.value = res;
                textbox.dispatchEvent(new Event('change'));
            }, '', textbox.value);
        }
    });
}

if (okBtn) {
    okBtn.addEventListener("click", function () {
        if (window.apply && !location.href.includes("about.html")) {
            window.apply();
        }
        madCloseWindow();
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
        madCloseWindow();
    });
}

if (applyBtn) {
    applyBtn.addEventListener("click", function () {
        if (window.apply) {
            window.apply();
        }
    });
}

okBtn.focus();