// inputpanel.js for ModernActiveDesktop System Plugin
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const { ipcRenderer } = require('electron');

window.addEventListener('keyup', (event) => {
    ipcRenderer.send('input', event.key);
    if (event.key === 'Escape') {
        window.close();
    }
});