// warning.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

let urlToLoad = madDeskMover.config.src;
if (window.madFallbackMode) {
    urlToLoad = localStorage.madesktopBgHtmlSrc;
}
if (urlToLoad.startsWith('apps/channelviewer')) {
    urlToLoad = new URL(urlToLoad, top.location.href).searchParams.get('page') + ' (ChannelViewer)';
}

document.getElementById('url').textContent = urlToLoad;

document.getElementById('loadBtn').addEventListener('click', async () => {
    if (document.body.dataset.compact) {
        if (await madConfirm(madGetString("UNV_MSG") + "<br><br>URL: " + escapeHTML(urlToLoad), null, 'warning')) {
            if (window.madFallbackMode) {
                delete localStorage.madesktopBgHtmlUnverified;
                madLocReplace(localStorage.madesktopBgHtmlSrc);
            } else {
                delete madDeskMover.config.unverified;
                madLocReplace(madDeskMover.config.src);
            }
        }
    } else {
        if (window.madFallbackMode) {
            delete localStorage.madesktopBgHtmlUnverified;
            madLocReplace(localStorage.madesktopBgHtmlSrc);
        } else {
            delete madDeskMover.config.unverified;
            madLocReplace(madDeskMover.config.src);
        }
    }
});

window.addEventListener('resize', () => {
    delete document.body.dataset.compact;
    if (window.innerWidth < 300 || document.body.offsetHeight + 40 > window.innerHeight) {
        document.body.dataset.compact = true;
    } else {
        delete document.body.dataset.compact;
    }
});

window.addEventListener('load', () => {
    window.dispatchEvent(new Event('resize'));
});