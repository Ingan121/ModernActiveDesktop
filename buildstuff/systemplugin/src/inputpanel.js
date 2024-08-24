// inputpanel.js for ModernActiveDesktop System Plugin
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const { ipcRenderer } = require('electron');
let compMode = false;

window.addEventListener('keyup', (event) => {
    if (event.code === 'AltRight') {
        // Enable composited mode for IMEs
        compMode = true;
        ipcRenderer.send('inputmsg', 'CompModeOn');
        document.getElementById("compinput").focus();
    }

    if (!compMode) {
        let key = event.key;
        if (event.ctrlKey) {
            key = '^' + key;
        }
        ipcRenderer.send('input', key);
    } else if (event.key === 'Enter') {
        ipcRenderer.send('input', '/comp ' + document.getElementById("compinput").value);
        window.close();
    }

    if (event.key === 'Escape') {
        if (compMode) {
            ipcRenderer.send('input', 'Escape');
        }
        window.close();
    }
});


if (!location.href.endsWith('#notimeout')) {
    let timeoutTimer = null;
    window.addEventListener('blur', () => {
        timeoutTimer = setTimeout(() => {
            ipcRenderer.send('input', 'Escape');
            window.close();
        }, 30000);
    });
    window.addEventListener('focus', () => {
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
        }
    });
}