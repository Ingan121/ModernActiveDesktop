// osk.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const keys = document.getElementsByTagName('button');
let shift = 0;
let ctrl = false;

for (const key of keys) {
    key.addEventListener('click', () => {
        if (key.dataset.key.length === 1) {
            let char = key.dataset.key;
            if (ctrl) {
                char = '^' + char;
                ctrl = false;
            }
            if (shift > 0) {
                char = char.toUpperCase();
                if (shift === 1) {
                    if (key.dataset.shift) {
                        char = key.dataset.shift;
                    }
                    shift = 0;
                }
            }
            sendMadInput(char);
        } else {
            switch (key.dataset.key) {
                case 'backspace':
                    sendMadInput('Backspace');
                    break;
                case 'enter':
                    sendMadInput('Enter');
                    break;
                case 'space':
                    sendMadInput(' ');
                    break;
                case 'left':
                    sendMadInput('ArrowLeft');
                    break;
                case 'right':
                    sendMadInput('ArrowRight');
                    break;
                case 'ctrl':
                    ctrl = !ctrl;
                    break;
                case 'shift':
                    shift = shift !== 1 ? 1 : 0;
                    break;
                case 'caps':
                    shift = shift !== 2 ? 2 : 0;
                    break;
                case 'tab':
                    // Do nothing
                    // Only for aesthetics
                    break;
            }
        }
        if (shift === 1) {
            for (const key of keys) {
                if (key.dataset.shift) {
                    key.textContent = key.dataset.shift;
                }
            }
        } else {
            for (const key of keys) {
                if (key.dataset.shift) {
                    key.textContent = key.dataset.key;
                }
            }
        }
        document.body.dataset.ctrl = ctrl;
        document.body.dataset.shift = shift;
    });
}

function sendMadInput(key) {
    top.msgboxInput.focus();
    const inputEvent = new Event('madinput');
    inputEvent.key = key;
    top.document.dispatchEvent(inputEvent);
}