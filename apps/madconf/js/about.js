// about.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

if (parent !== window) {
    const icon = document.querySelector("img");
    let debugReady = false;

    icon.addEventListener("click", () => {
        if (!localStorage.madesktopDebugMode) {
            debugReady = true;
        }
    });

    window.apply = function () {
        if (debugReady && !localStorage.madesktopDebugMode) {
            madConfirm(madGetString("MADCONF_CONFIRM_DEBUG"), function(res) {
                if (res) {
                    parent.activateDebugMode();
                }
            });
            debugReady = false;
        }
    }
} else {
    document.body.dataset.notMad = true;
}