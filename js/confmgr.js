// confmgr.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

// Do these in a separate page, as DeskMovers make frequent changes to the localStorage
// Otherwise some configs before the operation might persist after the operation, causing unexpected behavior

const searchParams = new URLSearchParams(window.location.search);
const action = searchParams.get('action');

const keys = Object.keys(localStorage);

switch (action) {
    case 'reset':
        reset();
        break;
    case 'import':
        const json = localStorage.madesktopConfigToImport;
        if (json) {
            const parsed = JSON.parse(json);
            reset();
            for (const key in parsed) {
                localStorage.setItem(key, parsed[key]);
            }
            localStorage.madesktopLastVer = "3.2.2";
        }
}

location.replace('index.html');

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