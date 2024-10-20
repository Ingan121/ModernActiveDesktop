// common.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const tabs = document.querySelectorAll(".tab");
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

const textboxes = document.querySelectorAll("input[type=text], input[type=number]");

for (const tab of tabs) {
    tab.addEventListener("click", function () {
        madLocReplace(`apps/inetcpl/${this.dataset.pagename}.html` + location.search);
    });
}

for (const textbox of textboxes) {
    textbox.addEventListener("click", async function () {
        if (madKbdSupport !== 1) {
            if (madSysPlug.inputStatus) {
                madSysPlug.focusInput();
            } else if (!await madSysPlug.beginInput()) {
                madPrompt(madGetString("UI_PROMPT_ENTER_VALUE"), function (res) {
                    if (res === null) return;
                    textbox.value = res;
                    textbox.dispatchEvent(new Event('change'));
                }, '', textbox.value, true);
            }
        }
    });
}

if (okBtn) {
    okBtn.addEventListener("click", function () {
        if (window.apply) {
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

madSetIcon(false);
okBtn.focus();

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});