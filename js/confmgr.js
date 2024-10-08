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

(async function () {
    switch (action) {
        case 'reset':
            reset();
            break;
        case 'import':
            const file = await madIdb.configToImport;
            if (!file) {
                break;
            }
            let json;
            if (file.type === 'application/json') {
                json = await file.text();
            } else {
                // Decompress gzip
                try {
                    const ds = new DecompressionStream("gzip");
                    const reader = file.stream().pipeThrough(ds).getReader();
                    const decoder = new TextDecoder();
                    const chunks = [];

                    let result;
                    while (!(result = await reader.read()).done) {
                        chunks.push(decoder.decode(result.value));
                    }

                    json = chunks.join('');
                } catch (error) {
                    urlAppend = "#cmfail_invconf";
                    console.error(error);
                    break;
                }
            }
            if (json) {
                try {
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
                    reset(true);
                    for (const key in parsed) {
                        if (key === "madesktopBgImg") {
                            await madIdb.setItem("bgImg", new Blob([base64ToArrayBuffer(parsed[key])], { type: "image/png" }));
                        } else {
                            localStorage.setItem(key, parsed[key]);
                        }
                    }
                    localStorage.madesktopLastVer = madVersion.toString();
                } catch (error) {
                    if (error.name === "QuotaExceededError") {
                        urlAppend = "#cmfail_full";
                    } else {
                        urlAppend = "#cmfail_invconf";
                    }
                    console.error(error);
                }
            } else {
                urlAppend = "#cmfail_invconf";
            }
            break;
    }

    console.log("Done");
    // WPE somehow doesn't navigate to page if hash is provided without a question mark
    // So we need to add a question mark if hash is provided and running in WPE
    if (urlAppend && typeof wallpaperOnVideoEnded === "function") {
        urlAppend = "?" + urlAppend;
    }
    location.replace('index.html' + urlAppend);
})();

function reset(softIdbReset = false) {
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
    if (softIdbReset) {
        delete madIdb.bgImg;
        delete madIdb.configToImport;
    } else {
        // This causes further IDB operations to take a long time
        indexedDB.deleteDatabase('madesktop');
    }
}