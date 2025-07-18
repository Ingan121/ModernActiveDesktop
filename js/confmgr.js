// confmgr.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

if (parent !== window) {
    throw new Error("Refusing to load inside an iframe");
}

// Do these in a separate page, as DeskMovers make frequent changes to the localStorage
// Otherwise some configs before the operation might persist after the operation, causing unexpected behavior

const keysToNotDelete = [
    'madesktopVisUnavailable',
    'madesktopBgWeColor',
    'madesktopBgWeImg',
    'madesktopBgVideo',
    'madesktopLastPresetUrl',
];
const keysToNotImport = [
    // Configs to be overwritten after the import is done
    'madesktopLastVer',
    'madesktopMigrationProgress',
    'madesktopForceRunStartup',
    // Configs used for tracking the WPE properties panel
    'madesktopVisUnavailable',
    'madesktopBgWeColor',
    'madesktopBgWeImg',
    'madesktopBgVideo',
    'madesktopLastPresetUrl',
    // Sensitive account information
    'madesktopVisSpotifyInfo',
    // Device specific configs
    'madesktopSysColorCache',
    // Legacy configs that existed before config export was introduced
    'madesktopLastCustomScale',
    'madesktopPrevOWConfigRequest',
    'madesktopDestroyedItems',
    'madesktopNonADStyle',
    'madesktopNoPixelFonts',
    // Debug configs without an exposed config UI (prevent troll configs)
    'madesktopDebugLangLoadDelay',
    // Temporary configs
    'madesktopFailCount',
    'madesktopConfigToImport',
    // Prevent security feature bypass
    'madesktopBgHtmlUnverified',
];
const keysToIgnoreOnPreset = [
    // Configs specific to the user's environment
    'madesktopScaleFactor',
    'madesktopChanViewTopMargin',
    'madesktopChanViewBottomMargin',
    'madesktopChanViewLeftMargin',
    'madesktopChanViewRightMargin',
    'madesktopLang',
    'jspaint language',
    'sysplugIntegration',
    'madesktopVisMediaControls',
    'madesktopVisSpotifyEnabled',
    'madesktopCorsProxy',
    'madesktopVisLyricsSyncDelay',
    // Aggregated configs
    'madesktopSavedSchemes',
    'madesktopUserPatterns',
    'madesktopChanViewFavorites',
    // Miscellanous user preferences that doesn't affect the appearance
    'madesktopLinkOpenMode',
    'madesktopChanViewHome',
    'madesktopChanViewNoJs',
    'madesktopChanViewNoAutoFullscrn',
    'madesktopChanViewNoForceLoad',
    'madesktopHideWelcome',
    'madesktopCheckedChanges',
    'madesktopCheckedConfigs',
    'madesktopCheckedGitHub',
    'madesktopVisGuessTimeline',
    'madesktopVisLyricsForceUnsynced',
    'madesktopVisLyricsOverrides',
    'madesktopVisLyricsRanOnce',
    'madesktopVisLyricsNoCache',
    'madesktopVisLyricsCacheMax',
    'madesktopVisLyricsCacheExpiry',
    'madesktopVisLyricsLastCacheClean',
    'madesktopVisUseSpotifyAlbumArt',
    // Debug configs
    'madesktopDebugMode',
    'madesktopDebugLog',
];

const searchParams = new URLSearchParams(window.location.search);
const action = searchParams.get('action');

const keys = Object.keys(localStorage);

let urlAppend = "";

(async function () {
    let presetImport = false;
    switch (action) {
        case 'reset':
            await reset();
            break;
        case 'resetsoft':
            await reset(true);
            break;
        case 'resethard':
            localStorage.clear();
            indexedDB.deleteDatabase('madesktop');
            break;
        case 'importpreset':
            keysToNotDelete.push(...keysToIgnoreOnPreset);
            keysToNotImport.push(...keysToIgnoreOnPreset);
            presetImport = true;
        case 'import':
            const file = await madIdb.configToImport;
            if (!file) {
                break;
            }
            let json;
            if (file.type === 'application/json' || file.type.startsWith('text/')) {
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
                    await reset(true, presetImport);
                    for (const key in parsed) {
                        if (keysToNotImport.includes(key)) {
                            continue;
                        }
                        if (key === "madesktopBgImg") {
                            if (parsed[key].startsWith("file:///") ||
                                parsed[key].startsWith("wallpapers/")
                            ) {
                                localStorage.setItem("madesktopBgImg", parsed[key]);
                            } else if (parsed[key] === "!wpewall") {
                                if (localStorage.madesktopBgWeImg) {
                                    localStorage.setItem("madesktopBgImg", localStorage.madesktopBgWeImg);
                                }
                            } else {
                                await madIdb.setItem("bgImg", new Blob([base64ToArrayBuffer(parsed[key])], { type: "image/png" }));
                            }
                        } else if (key === "madesktopChanViewFavorites") {
                            const favParsed = JSON.parse(parsed[key]);
                            for (const favorite of favParsed) {
                                if (favorite.length === 3) {
                                    favorite[2] = new Blob([base64ToArrayBuffer(favorite[2].split(",")[1])], { type: favorite[2].split(",")[0].split(":")[1].split(";")[0] });
                                }
                            }
                            await madIdb.setItem("cvFavorites", favParsed);
                        } else if (key === "madesktopVisLyricsOverrides") {
                            await madIdb.setItem("lyricsOverrides", JSON.parse(parsed[key]));
                        } else if (key.startsWith("madesktopItemSrc")) {
                            // Prevent loading unverified URL after import
                            const src = parsed[key];
                            if (!src.startsWith("apps/") &&
                                !src.startsWith("placeholder.html") &&
                                !src.startsWith("ChannelBar.html") &&
                                !src.startsWith("ChannelBar-ko.html") &&
                                (!src.startsWith("https://www.youtube.com/embed/") || src.length !== 41)
                            ) {
                                localStorage.setItem("madesktopItemUnverified" + key.slice(16), true);
                            }
                            if (src.includes("apps/channelviewer")) {
                                const page = new URL(src, location.href).searchParams.get("page");
                                if (page && !page.startsWith("channels-") && page !== "about:blank" && !page.startsWith("https://www.ingan121.com/")) {
                                    localStorage.setItem("madesktopItemUnverified" + key.slice(16), true);
                                }
                            }
                            localStorage.setItem(key, src);
                        } else if (key === "madesktopBgHtmlSrc") {
                            if (!parsed[key].endsWith("bghtml/index.html")) {
                                localStorage.madesktopBgHtmlUnverified = true;
                                localStorage.setItem(key, parsed[key]);
                            } else {
                                localStorage.madesktopBgHtmlSrc = "bghtml/index.html"; // normalize it
                            }
                        } else if (!key.startsWith("madesktopItemUnverified")) {
                            localStorage.setItem(key, parsed[key]);
                        }
                    }
                    localStorage.madesktopLastVer = madVersion.toString();
                    localStorage.madesktopMigrationProgress = 2;
                    localStorage.madesktopForceRunStartup = true;
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
    if (urlAppend) {
        // WPE somehow doesn't navigate to page if hash is provided without a question mark
        // So we need to add a question mark if hash is provided and running in WPE
        if (typeof wallpaperOnVideoEnded === "function") {
            urlAppend = "?" + urlAppend;
        }
        // Break on error
        debugger;
    }
    location.replace('index.html' + urlAppend);
})();

async function reset(softIdbReset = false, presetImport = false) {
    for (const key of keys) {
        if ((key.startsWith('madesktop') || key === 'sysplugIntegration' ||
            key.startsWith('image#') || key.startsWith('jspaint ')) &&
            !keysToNotDelete.includes(key)
        ) {
            console.log("Deleting " + key);
            localStorage.removeItem(key);
        } else {
            console.log("Not deleting " + key);
        }
    }
    if (softIdbReset) {
        await madIdb.deleteItem("bgImg");
        if (!presetImport) {
            await madIdb.deleteItem("cvFavorites");
            await madIdb.deleteItem("configToImport");
            await madIdb.deleteItem("lyricsOverrides");
            await clearCache();
        }
    } else {
        // This causes further IDB operations to take a long time
        indexedDB.deleteDatabase('madesktop');
    }
}

async function clearCache() {
    const db = await madIdb.init();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("lrccache", "readwrite");
        const store = transaction.objectStore("lrccache");
        const request = store.clear();
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function () {
            console.error(request.error);
            reject(request.error);
        };
    });
}