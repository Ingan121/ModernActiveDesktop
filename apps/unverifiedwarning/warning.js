// warning.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

let urlToLoad = madDeskMover.config.src;
if (urlToLoad.startsWith('apps/channelviewer')) {
    urlToLoad = new URL(urlToLoad, top.location.href).searchParams.get('page') + ' (ChannelViewer)';
}

document.getElementById('url').textContent = urlToLoad;

document.getElementById('loadBtn').addEventListener('click', async () => {
    if (document.body.dataset.compact) {
        if (await madConfirm(madGetString("UNV_MSG") + "<br><br>URL: " + escapeHTML(urlToLoad), null, 'warning')) {
            delete madDeskMover.config.unverified;
            madLocReplace(madDeskMover.config.src);
        }
    } else {
        delete madDeskMover.config.unverified;
        madLocReplace(madDeskMover.config.src);
    }
});

window.addEventListener('resize', () => {
    delete document.body.dataset.compact;
    if (document.body.offsetHeight + 40 > window.innerHeight || window.innerWidth < 300) {
        document.body.dataset.compact = true;
    } else {
        delete document.body.dataset.compact;
    }
});

window.dispatchEvent(new Event('resize'));