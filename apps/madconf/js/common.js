// common.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

if (!location.href.includes("about.html")) {
    if (parent === window) {
        alert("This page is not meant to be opened directly. Please open it from ModernActiveDesktop.");
    } else if (!frameElement) {
        alert("MADConf is being cross-origin restricted. Please run ModernActiveDesktop with a web server.");
    } else if (window.madFallbackMode) {
        top.madAlert(madGetString("UI_MSG_RUNNING_AS_BG"), null, "error");
    } else {
        parent.confDeskMover = madDeskMover;
    }
} else {
    parent.confDeskMover = madDeskMover;
}
madDeskMover.isConfigurator = true;

const tabs = document.querySelectorAll(".tab");
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

const textboxes = document.querySelectorAll("input[type=text], input[type=number]:not(#fontSize)");

for (const tab of tabs) {
    tab.addEventListener("click", function () {
        madLocReplace(`apps/madconf/${this.dataset.pagename}.html`);
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

madSetIcon(false);
okBtn.focus();

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});

if (!window.showOpenFilePicker) {
    // https://stackoverflow.com/a/69118077
    window.showOpenFilePicker = async function (options = {}) {
        return new Promise((resolve) => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = options.multiple;
            if (options.types) {
                input.accept = options.types
                    .map((type) => type.accept)
                    .flatMap((inst) => Object.keys(inst).flatMap((key) => inst[key]))
                    .join(",");
            }
    
            input.addEventListener("change", () => {
                resolve(
                    [...input.files].map((file) => {
                        return {
                            getFile: async () =>
                                new Promise((resolve) => {
                                    resolve(file);
                                }),
                        };
                    })
                );
            });
    
            input.click();
        });
    }
}