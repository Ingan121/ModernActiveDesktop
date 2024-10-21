// main.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const url = new URL(location.href).searchParams.get('url');

const urlElem = document.getElementById('url');
const okBtn = document.getElementById('okBtn');
const cancelBtn = document.getElementById('cancelBtn');

const links = document.querySelectorAll('a');

for (const link of links) {
    // Unset the alwaysOnTop flag when the user clicks on a link
    link.addEventListener('click', () => {
        delete madDeskMover.config.alwaysOnTop;
        madBringToTop();
    });
}

if (url) {
    urlElem.textContent = url;
    urlElem.href = url;
}

okBtn.addEventListener('click', () => {
    const options = {
        width: '367px',
        height: '160px',
        centered: true,
        unresizable: true,
        aot: true,
        noIcon: true,
    };
    madOpenWindow('apps/configdownloader/download.html?url=' + encodeURIComponent(url), true, options);
    madCloseWindow();
});

cancelBtn.addEventListener('click', () => {
    madCloseWindow();
});