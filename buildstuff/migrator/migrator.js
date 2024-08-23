// confmgr.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

if (localStorage.madesktopMigrated || !localStorage.madesktopLastVer) {
    location.replace('https://madesktop.ingan121.com/');
} else {
    const iframe = document.getElementsByTagName('iframe')[0];

    const madConfig = {};
    for (const key in localStorage) {
        if (key.startsWith("madesktop") || key === "sysplugIntegration" ||
            key.startsWith('image#') || key.startsWith('jspaint '))
        {
            madConfig[key] = localStorage[key];
        }
    }

    iframe.addEventListener('load', function () {
        iframe.contentWindow.postMessage({
            type: 'migrate',
            config: madConfig
        }, 'https://madesktop.ingan121.com');
    });

    window.addEventListener('message', function (event) {
        if (event.origin !== 'https://madesktop.ingan121.com') {
            return;
        }
        const data = event.data;
        if (data.type === 'migrateCheck') {
            localStorage.madesktopMigrated = true;
            location.replace('https://madesktop.ingan121.com/');
        }
    });
}

function abort() {
    localStorage.madesktopMigrated = true;
    location.replace('https://madesktop.ingan121.com/');
}