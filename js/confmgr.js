// confmgr.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// Do these in a separate page, as DeskMovers make frequent changes to the localStorage
// Otherwise some configs before the operation might persist after the operation, causing unexpected behavior

const searchParams = new URLSearchParams(window.location.search);
const action = searchParams.get('action');

const keys = Object.keys(localStorage);

let urlAppend = "";

switch (action) {
    case 'reset':
        reset();
        break;
    case 'import':
        const json = localStorage.madesktopConfigToImport;
        if (json) {
            const parsed = JSON.parse(json);
            const confVer = parsed.madesktopLastVer;
            if (confVer) {
                if (madVersion.compare(confVer, true) < 0) {
                    urlAppend = "#cmfail_oldver";
                    break;
                }
            } else {
                urlAppend = "#cmfail_invconf";
                break;
            }
            reset();
            for (const key in parsed) {
                localStorage.setItem(key, parsed[key]);
            }
            localStorage.madesktopLastVer = madVersion.toString();
        }
        break;
}

delete localStorage.madesktopConfigToImport;
location.replace('index.html' + urlAppend);

function reset() {
    for (const key of keys) {
        if (key.startsWith('madesktop') || key === 'sysplugIntegration' ||
            key.startsWith('image#') || key.startsWith('jspaint '))
        {
            console.log("Deleting " + key);
            localStorage.removeItem(key);
        } else {
            console.log("Not deleting " + key);
        }
    }
}