// MadDialog.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// unfinished stuff

(function () {
    // Implemented like the one in Electron
    async function showMessageBox(deskMover, options) {
        return new Promise((resolve) => {
            const dialog = document.createElement("div");
            dialog.className = "msgbox";
            dialog.innerHTML = `
                <div class="title-bar">
                    <div class="title-bar-text">ModernActiveDesktop</div>
                    <div class="title-bar-controls">
                        <button class="msgbox-close"></button>
                    </div>
                </div>
                <div class="window-body">
                <section class="field-row">
                    <img class="msgbox-icon">
                    <p class="msgbox-msg">Message</p>
                </section>
                <section class="msgbox-buttons" class="field-row">
                </section>`;
            const title = dialog.getElementsByClassName("title-bar-text")[0];
            const content = dialog.getElementsByClassName("msgbox-msg")[0];
            const icon = dialog.getElementsByClassName("msgbox-icon")[0];
            const buttons = dialog.getElementsByClassName("msgbox-buttons")[0];
            const close = dialog.getElementsByClassName("msgbox-close")[0];

            let cancelId = options.cancelId;
            if (!cancelId) {
                for (const button of options.buttons) {
                    if (button.startsWith("locid:")) {
                        if (button.substring(6) === "UI_CANCEL" || button.substring(6) === "UI_NO") {
                            cancelId = options.buttons.indexOf(button);
                            break;
                        }
                    } else if (button.toLowerCase() === "cancel" || button.toLowerCase() === "no") {
                        cancelId = options.buttons.indexOf(button);
                        break;
                    }
                }
                if (!cancelId) {
                    cancelId = 0;
                }
            }

            title.innerText = options.title;
            content.innerText = options.message;

            if (options.icon) {
                icon.src = options.icon;
            } else if (options.type) {
                icon.src = `images/${options.type}.png`;
            }

            if (options.type) {
                playSound(options.type);
            }

            for (let i = 0; i < options.buttons.length; i++) {
                const button = document.createElement("button");
                if (options.buttons[i].startsWith("locid:")) {
                    button.innerHTML = madGetString(options.buttons[i].substring(6));
                } else {
                    button.innerHTML = madProcessString(options.buttons[i]);
                }
                button.onclick = () => {
                    resolve(i);
                    dialog.remove();
                };
                buttons.appendChild(button);
            }

            close.onclick = () => {
                resolve(cancelId);
                dialog.remove();
            }

            function modalListener(event) {
                flashDialog(dialog);
                event.stopPropagation();
            }

            if (deskMover) {
                deskMover.windowContainer.addEventListener("click", modalListener);
            } else {
                document.body.appendChild(dialog);
            }
        });
    }

    window.madDialog = {
        showMessageBox
    };
})();