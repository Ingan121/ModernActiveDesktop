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
            localStorage.madesktopLastVer = "3.3.0";
        }
        break;
    case 'migrate':
        if (localStorage.madesktopLastVer) {
            // Config already exists, no need to migrate
            // Do not overwrite the existing config
            parent.postMessage({ type: 'migrateCheck' }, 'https://www.ingan121.com');
        } else {
            window.addEventListener('message', function (event) {
                if (event.origin !== 'https://www.ingan121.com') {
                    return;
                }
                const data = event.data;
                if (data.type === 'migrate') {
                    for (const key in data.config) {
                        localStorage.setItem(key, data.config[key]);
                    }
                    localStorage.madesktopLastVer = "3.3.0";
                    parent.postMessage({ type: 'migrateCheck' }, 'https://www.ingan121.com');
                }
            });
        }
}

if (action !== 'migrate') {
    location.replace('index.html');
}

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