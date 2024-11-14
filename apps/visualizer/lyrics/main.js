// main.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const lyricsView = document.getElementById('lyricsView');

const menuBar = document.getElementById('menuBar');
const lrcMenuItems = document.querySelectorAll('#lrcMenu .contextMenuItem');
const saveMenuItems = document.querySelectorAll('#saveMenu .contextMenuItem');
const syncMenuItems = document.querySelectorAll('#syncMenu .contextMenuItem');
const syncDelayDisplay = document.getElementById('syncDelayDisplay');
const loadingIndicator = document.getElementById('loadingIndicator');
const nonceIndicator = document.getElementById('nonceIndicator');

const loadLyricsBtn = lrcMenuItems[0];
const searchLyricsBtn = lrcMenuItems[1];
const openLyricsFileBtn = lrcMenuItems[2];
const saveLyricsBtn = lrcMenuItems[3];
const publishLyricsBtn = lrcMenuItems[4];
const autoScrollBtn = lrcMenuItems[5];
const syncAdjustBtn = lrcMenuItems[6];

let connected = false;
let visStatus = {};

let lastLyrics = null;
let lastSyncedLyricsParsed = null;
let lastLyricsId = null;
let lastMusic = null;
let lastFetchInfo = {}; // For debugging
let autoScroll = true;
let nonceObj = null;
let preferUnsynced = localStorage.madesktopVisLyricsForceUnsynced || // User preference
    !visStatus.mediaIntegrationAvailable || // No timeline available (only valild if Spotify is enabled)
    madRunningMode !== 1 || // Lively Wallpaper (no timeline support) or normal browsers (no MADVis support)
    !connected; // No connection to MADVis
let syncDelay = parseFloat(localStorage.madesktopVisLyricsSyncDelay) || 0;
let overrides = {};
let abortController = new AbortController();

const headers = {
    'Lrclib-Client': 'ModernActiveDesktop/' + window.madVersion.toString(1)
};
switch (madRunningMode) {
    case 1:
        headers['Lrclib-Client'] += ' (Wallpaper Engine)';
        break;
    case 2:
        headers['Lrclib-Client'] += ' (Lively Wallpaper)';
        break;
}
headers['Lrclib-Client'] += ' (https://madesktop.ingan121.com/)';

if (localStorage.madesktopVisLyricsFont) {
    lyricsView.style.font = localStorage.madesktopVisLyricsFont;
}
syncDelayDisplay.textContent = syncDelay + 's';

if (madRunningMode === 0) {
    loadLyricsBtn.dataset.hidden = true;
}
if (madRunningMode !== 1) {
    autoScrollBtn.dataset.hidden = true;
    syncAdjustBtn.dataset.hidden = true;
}

// #region Menu Bar
madDeskMover.menu = new MadMenu(menuBar, ['lrc'], ['save', 'sync'], [], ['nonceIndicator']);

lrcMenuItems[0].addEventListener('click', async function () { // Load Lyrics button
    if (madRunningMode === 0) {
        return;
    }
    const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
    if (overrides[hash]) {
        delete overrides[hash];
        madIdb.setItem('lyricsOverrides', overrides); // Doesn't need to wait for the promise to resolve
    }
    processProperties(true);
});

lrcMenuItems[1].addEventListener('click', function () { // Search Lyrics button
    const artist = visStatus.lastSpotifyMusic?.artist || visStatus.lastMusic?.artist || '';
    const title = visStatus.lastSpotifyMusic?.title || visStatus.lastMusic?.title || '';
    const albumTitle = visStatus.lastSpotifyMusic?.albumTitle || visStatus.lastMusic?.albumTitle || '';
    const params = {
        artist: artist,
        title: title,
        albumTitle: albumTitle
    };
    const query = new URLSearchParams(params).toString();

    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const options = {
        left, top, width: '520px', height: '132px',
        aot: true, unresizable: true, noIcon: true
    }
    const searchDeskMover = madOpenWindow('apps/visualizer/lyrics/search.html?' + query + "&current=" + lastLyricsId, true, options);
    searchDeskMover.addEventListener('load', () => {
        searchDeskMover.windowElement.contentWindow.loadLyrics = loadLyrics;
    }, null, "window");
});

lrcMenuItems[2].addEventListener('click', async function () { // Open Lyrics File button
    const pickerOpts = {
        types: [
            {
                description: 'Lyrics Files',
                accept: {
                    'text/plain': ['.lrc']
                }
            }
        ]
    };

    const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
    const file = await fileHandle.getFile();
    loadLyrics(file);

    const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
    if (hash && await madConfirm(madGetString('VISLRC_CONFIRM_SAVE_LYRICS'))) {
        overrides[hash] = {
            lrc: text
        };
        madIdb.setItem('lyricsOverrides', overrides);
    }
});

lrcMenuItems[4].addEventListener('click', function () { // Publish Lyrics button
    publish();
});

lrcMenuItems[5].addEventListener('click', function () { // Auto Scroll button
    if (!lastSyncedLyricsParsed) {
        return;
    }

    autoScroll = !autoScroll;
    if (autoScroll) {
        lrcMenuItems[5].classList.add('checkedItem');
        processTimeline();
    } else {
        lrcMenuItems[5].classList.remove('checkedItem');
    }
});

lrcMenuItems[7].addEventListener('click', function () { // Options button
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const options = {
        left, top, width: '400px', height: '412px',
        aot: true, unresizable: true, noIcon: true
    }
    const confDeskMover = madOpenWindow('apps/visualizer/lyrics/config.html', true, options);
    confDeskMover.addEventListener('load', () => {
        confDeskMover.windowElement.contentWindow.configChanged = configChanged;
    }, null, "window");
});

lrcMenuItems[8].addEventListener('click', function () { // Debug Info button
    showDebugInfo();
});

lrcMenuItems[9].addEventListener('click', function () { // About Lyrics button
    madOpenConfig('about');
});

lrcMenuItems[10].addEventListener('click', function () { // Close button
    madCloseWindow();
});

saveMenuItems[0].addEventListener('click', function () { // Synced button
    if (!lastLyrics) {
        return;
    }
    if (!lastLyrics.syncedLyrics) {
        return;
    }
    let filename = '';
    const artist = visStatus.lastSpotifyMusic?.artist || visStatus.lastMusic?.artist || lastLyrics.artist || '';
    const title = visStatus.lastSpotifyMusic?.title || visStatus.lastMusic?.title || lastLyrics.title || '';
    if (artist && title) {
        filename = artist + ' - ' + title + '.lrc';
    } else if (title) {
        filename = title + '.lrc';
    } else {
        filename = 'lyrics.lrc';
    }
    if (navigator.userAgent.includes('Windows')) {
        filename.replace(/[/\\?%*:|"<>]/g, '-');
    } else {
        filename.replace(/\//g, '-');
    }
    saveText(lastLyrics.syncedLyrics, filename, true);
});

saveMenuItems[1].addEventListener('click', function () { // Plain button
    if (!lastLyrics) {
        return;
    }
    let filename = '';
    const artist = visStatus.lastSpotifyMusic?.artist || visStatus.lastMusic?.artist || lastLyrics.artist || '';
    const title = visStatus.lastSpotifyMusic?.title || visStatus.lastMusic?.title || lastLyrics.title || '';
    if (artist && title) {
        filename = artist + ' - ' + title + '.txt';
    } else if (title) {
        filename = title + '.txt';
    } else {
        filename = 'lyrics.txt';
    }
    if (navigator.userAgent.includes('Windows')) {
        filename.replace(/[/\\?%*:|"<>]/g, (char) => {
            return encodeURIComponent(char);
        });
    } else {
        filename.replace(/\//g, '%2F');
    }
    saveText(lastLyrics.plainLyrics, filename, false);
});

// Sync adjust feature for some use cases like these:
// - Estimate timeline feature being inaccurate for some reason (adjusting this for this purpose is only recommended for 'Ignore original timeline' mode)
// - Using a high latency audio device
// - Listening to a audio streamed over RDP with AirPods, like me (lol)
syncMenuItems[0].addEventListener('click', function () { // -0.5s button
    syncDelay -= 0.5;
    syncDelayDisplay.textContent = syncDelay + 's';
    processTimeline();
    localStorage.madesktopVisLyricsSyncDelay = syncDelay;
});

syncMenuItems[2].addEventListener('click', function () { // +0.5s button
    syncDelay += 0.5;
    syncDelayDisplay.textContent = syncDelay + 's';
    processTimeline();
    localStorage.madesktopVisLyricsSyncDelay = syncDelay;
});

syncMenuItems[3].addEventListener('click', async function () { // Custom button
    const custom = await madPrompt(madGetString('UI_PROMPT_ENTER_VALUE'), null, syncDelay.toString());
    if (custom !== null) {
        if (isNaN(parseFloat(custom)) || parseFloat(custom) === 0) {
            syncDelay = 0;
            syncDelayDisplay.textContent = '0s';
            delete localStorage.madesktopVisLyricsSyncDelay;
        } else {
            syncDelay = parseFloat(custom);
            syncDelayDisplay.textContent = syncDelay + 's';
            localStorage.madesktopVisLyricsSyncDelay = syncDelay;
        }
        processTimeline();
    }
});

syncMenuItems[4].addEventListener('click', function () { // Reset button
    syncDelay = 0;
    syncDelayDisplay.textContent = '0s';
    processTimeline();
    delete localStorage.madesktopVisLyricsSyncDelay;
});

nonceIndicator.addEventListener('click', async function () { // Nonce indicator
    if (nonceObj) {
        const res = await madConfirm(madGetString('VISLRC_PUBLISH_NONCE_INFO'), null, {
            icon: 'info',
            title: 'locid:VISLRC_TITLE',
            defaultBtn: 1,
            cancelBtn: 1
        });
        if (res === false) {
            nonceObj.worker.terminate();
            nonceObj.resolve();
            nonceObj = null;
            nonceIndicator.style.display = 'none';
        }
    }
});
// #endregion

// #region Event Listeners
lyricsView.addEventListener('pointerdown', function (event) {
    const computed = getComputedStyle(lyricsView);
    const scrollbarSize = parseInt(computed.getPropertyValue('--scrollbar-size'));
    const padding = parseInt(computed.paddingRight);
    if (event.clientX >= window.innerWidth - scrollbarSize - padding) {
        // scrollbar clicked
        autoScroll = false;
        autoScrollBtn.classList.remove('checkedItem');
    }
});

window.addEventListener('online', function () {
    if (lyricsView.querySelector('mad-string')?.locId === 'VISLRC_STATUS_OFFLINE') {
        processProperties(true);
    }
});
// #endregion

// #region Functions

// Load lyrics from the API
// Priority:
// 1. Overrides (if present)
// 2. Synced results (except for inaccurate search fallback with no album title data)
//  2.1 Get (whatever succeeds first)
//  2.2 Accurate search fallback
//  2.3 Accurate search fallback without album title
//  2.4 Accurate search fallback without artist name (only if album title is present)
//  2.5 Inaccurate search fallback
//  2.6 Inaccurate search fallback with parentheses stripped
// 3. Unsynced results
//  3.1 Same as 2.1-2.6
// 4. Synced inaccurate search fallback with no album title data
// 5. Unsynced inaccurate search fallback with no album title data
// 6. No lyrics found
//
// Priority when preferUnsynced is true:
// 1. Overrides (if present)
// 2. Synced or unsynced results
//  2.1 Same as 2.1-2.6 above
// 3. No lyrics found
async function findLyrics(id) {
    if (id) {
        return await fetchLyrics('https://lrclib.net/api/get/' + id);
    }

    const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
    if (lastFetchInfo.spotifyResponse && !lastFetchInfo.hash) {
        lastFetchInfo.hash = hash;
    } else {
        lastFetchInfo = { hash };
    }
    const override = overrides[hash];
    if (override) {
        if (override.lrc) {
            lastFetchInfo.override = -1;
            if (isTextLrc(override.lrc)) {
                const { artist, title, albumTitle, duration } = parseLrcMetadata(override.lrc);
                return {
                    synced: true,
                    id: null,
                    title: title,
                    artist: artist,
                    albumTitle: albumTitle,
                    duration: duration,
                    syncedLyrics: override.lrc,
                    plainLyrics: lrcToPlain(override.lrc)
                };
            } else {
                return {
                    synced: false,
                    id: null,
                    plainLyrics: override.lrc
                };
            }
        } else if (override.id) {
            lastFetchInfo.override = override.id;
            return await fetchLyrics('https://lrclib.net/api/get/' + override.id);
        }
    }

    // Try to get best (synced) results by trying multiple URLs
    let urlsToTry = [];

    const url = new URL('https://lrclib.net/api/get');
    if (localStorage.madesktopVisSpotifyEnabled && localStorage.madesktopVisSpotifyInfo && visStatus.lastSpotifyMusic) {
        const { artist, title, albumTitle, duration } = visStatus.lastSpotifyMusic;
        const params = {
            artist_name: artist,
            track_name: title,
            album_name: albumTitle, // This doesn't seem to cause the find to fail even if the album name is completely wrong (even including 'undefined')
            duration: duration // However this does, so try without duration too. Also some songs have inaccurate durations (e.g. zero) in the DB
        };
        url.search = new URLSearchParams(params).toString();
        urlsToTry.push(url.toString());

        if (duration) {
            delete params.duration;
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());
            params.duration = duration;
        }

        const strippedTitle = stripNonAlphaNumeric(title);
        if (strippedTitle) {
            params.track_name = strippedTitle;
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());

            if (duration) {
                delete params.duration;
                url.search = new URLSearchParams(params).toString();
                urlsToTry.push(url.toString());
            }
        }
    }
    if (visStatus.lastMusic) { // Some songs only have localized artist names in the DB, so try without Spotify data too even if it's available. Test case: "프로미스나인 - Supersonic"
        const { artist, title, albumTitle } = visStatus.lastMusic;
        const params = {
            artist_name: artist,
            track_name: title,
            album_name: albumTitle
            // Duration here is more inaccurate than Spotify's duration, and it also may not be present or up to date when the timeline event is triggered
            // So don't include it here
        };

        if (urlsToTry.length === 0 && !artist) {
            // Don't try get without artist name, as it's mandatory for the get API
            return await searchFallbackAccurate();
        }

        url.search = new URLSearchParams(params).toString();
        urlsToTry.push(url.toString());

        const strippedTitle = stripNonAlphaNumeric(title);
        if (strippedTitle) {
            params.track_name = strippedTitle;
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());
        }

        // YTM has these stuff EVEN FOR ARTISTS in ENGLISH MODE, so try stripping them too (seen "IZ*ONE (아이즈원)", "Apink(에이핑크)", and even "WJSN(Cosmic Girls)(우주소녀)")
        const strippedArtist = stripNonAlphaNumeric(artist);
        if (strippedArtist) {
            params.artist_name = strippedArtist;
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());
        }

        // Spotify Web Player reports all artists to SMTC as a single string, so try splitting it
        // Same for YT Music, and it also uses ', & ' (or localized variant) for the last artist
        // Or just ' & ' (or localized variant) if there are only two artists
        if (artist.includes(', ') || artist.includes(' & ')) {
            params.artist_name = artist.split(', ')[0].split(' & ')[0];
            url.search = new URLSearchParams(params).toString();
            urlsToTry.push(url.toString());

            if (strippedTitle) {
                params.track_name = strippedTitle;
                url.search = new URLSearchParams(params).toString();
                urlsToTry.push(url.toString());
            }
        }
    }
    urlsToTry = [...new Set(urlsToTry)];
    log(urlsToTry, 'log', 'MADVisLrc');
    lastFetchInfo.urls = urlsToTry;
    lastFetchInfo.attempt = new Array(urlsToTry.length).fill(0);
    lastFetchInfo.attempted = 0;
    lastFetchInfo.searchFallback = 0;

    let lastUnsyncedLyrics = null;
    for (const url of urlsToTry) {
        const lyrics = await fetchLyrics(url);
        if (lyrics) {
            if (lyrics.synced || preferUnsynced) {
                return lyrics;
            } else {
                lastUnsyncedLyrics = lyrics;
            }
        }
    }
    if (lastUnsyncedLyrics) {
        const searchResult = await searchFallbackAccurate();
        if (searchResult?.synced) {
            // If the search fallback found a synced result, return that instead of the unsynced one
            // Example of get not finding the best result that the search api does: "STAYC - Flexing On My Ex" (maybe because of the duration)
            return searchResult
        }
        // If the search result is unsynced, or it's not found, return the get result instead as that's more accurate
        lastFetchInfo.searchFallback = 0;
        return lastUnsyncedLyrics;
    } else {
        // May work in weird cases like instrumental tracks getting returned above, test case: "GFRIEND - Glass Bead"
        // Or if the get api just doesn't find the result that the search api does, test case: "QWER - 고민중독" (get works fine with Spotify data though)
        // Or some complicated cases like "Jay Park - All I Wanna Do (K) (Feat. Hoody & Loco)"
        return await searchFallbackAccurate();
    }
}

// More tolerant than get, but still tries to get the most accurate result (besides album title matters here)
// Less tolerant than searchFallback (e.g. duplicated titles don't work here)
async function searchFallbackAccurate(mode = 0) { // 0: Normal, 1: No album title, 2: No artist name
    lastFetchInfo.searchFallback = 1;
    let artist = visStatus.lastSpotifyMusic?.artist || visStatus.lastMusic?.artist || '';
    if (artist.includes(', ') || artist.includes(' & ')) {
        artist = artist.split(', ')[0].split(' & ')[0];
    }
    const strippedArtist = stripNonAlphaNumeric(artist);
    if (strippedArtist) {
        artist = strippedArtist;
    }
    let title = visStatus.lastSpotifyMusic?.title || visStatus.lastMusic?.title || '';
    const strippedTitle = stripNonAlphaNumeric(title);
    if (strippedTitle) {
        title = strippedTitle;
    }
    const albumTitle = visStatus.lastSpotifyMusic?.albumTitle || visStatus.lastMusic?.albumTitle || '';
    if (!albumTitle) {
        mode = 1;
    }
    log('searchFallbackAccurate: ' + mode, 'log', 'MADVisLrc');

    const url = new URL('https://lrclib.net/api/search');
    const params = {
        track_name: title
    };
    switch (mode) {
        case 0:
            params.artist_name = artist;
            params.album_name = albumTitle;
            break;
        case 1:
            // Album title matters here, unlike in the get api
            // So try without album title too
            params.artist_name = artist;
            break;
        case 2:
            // In case the artist name comes in a format not in the DB
            // Test case: "QUEEN BEE - メフィスト (メフィスト)" - only the Japanese name is in the DB. Same for "fromis_9 - Supersonic" above
            // So try without the artist name too - it's possible unlike the get api which mandates the artist name
            // I believe title name + album title is more accurate than the inaccurate search fallback?
            // This also works with localized artist names. That's not a primarily supported case though. May not work if title is fully localized with no English part
            params.album_name = albumTitle;
            break;
    }
    lastFetchInfo.searchFallback = mode + 1;
    url.search = new URLSearchParams(params).toString();

    abortController = new AbortController();
    const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        signal: abortController.signal
    });
    const result = await response.json();

    let lastUnsyncedLyrics = null;
    if (result.length > 0) {
        for (const item of result) {
            if (item.syncedLyrics) {
                return {
                    synced: true,
                    id: item.id,
                    title: item.trackName,
                    artist: item.artistName,
                    albumTitle: item.albumName,
                    duration: item.duration,
                    syncedLyrics: item.syncedLyrics,
                    plainLyrics: item.plainLyrics || lrcToPlain(item.syncedLyrics)
                };
            } else if (item.plainLyrics) {
                lastUnsyncedLyrics = {
                    synced: false,
                    id: item.id,
                    title: item.trackName,
                    artist: item.artistName,
                    albumTitle: item.albumName,
                    duration: item.duration,
                    plainLyrics: item.plainLyrics
                };
                if (preferUnsynced) {
                    return lastUnsyncedLyrics;
                }
            }
        }
        if (lastUnsyncedLyrics) {
            let searchResult;
            switch (mode) {
                case 0:
                    searchResult = await searchFallbackAccurate(1);
                    break;
                case 1:
                    // Don't fall back to (inaccurate) search or accurate search without the artist name if the album title is not present and unsynced lyrics exist, as it may find a completely different song. Test case: "IVE - I WANT"
                    // In fact, "IVE" easily causes the inaccurate search fallback to return a completely different song, as LRCLIB doesn't care about punctuation so songs with "I've" in titles, albums, ... gets returned
                    if (!visStatus.lastSpotifyMusic?.albumTitle && !visStatus.lastMusic?.albumTitle) {
                        return lastUnsyncedLyrics;
                    }
                    searchResult = await searchFallbackAccurate(2);
                    break;
                case 2:
                    searchResult = await searchFallback();
                    break;
            }
            if (searchResult?.synced) {
                // If the search fallback found a synced result, return that instead of the unsynced one
                return searchResult
            }
            // If the search result is unsynced, return the accurate search result instead as that's more accurate
            lastFetchInfo.searchFallback = mode + 1;
            return lastUnsyncedLyrics;
        }
    }
    switch (mode) {
        case 0:
            return await searchFallbackAccurate(1);
        case 1:
            // Don't try accurate search without artist name if the album title is not present, as it's too inaccurate at that point
            if (!visStatus.lastSpotifyMusic?.albumTitle && !visStatus.lastMusic?.albumTitle) {
                return await searchFallback();
            }
            return await searchFallbackAccurate(2);
        case 2:
            return await searchFallback();
    }
}

// Inaccurate but more tolerant search fallback
// Surprisingly it also works surprisingly well with YT/YTM duplicated titles. Even artificailly duplicated titles like "tripleS - Girls Never Die (Girls Never Die (Girls Never Die (Girls Never Die)))" work fine
// (though that case is already handled in stripNonAlphaNumeric)
// Although the search API allows dropping some words (e.g. "OH MY DUN" finds "OH MY GIRL - DUN DUN DANCE" fine), search results will be less accurate if we do that
// So try both with and without parentheses stripped
// Misc note: dropping punctuations and special characters also work ("youre" finds "you're" without issues), but dropping other arbitrary characters doesn't (e.g. "NewJean" doesn't find "NewJeans")
async function searchFallback(stripParens) {
    log('searchFallback' + (stripParens ? ' (stripped)' : ''), 'log', 'MADVisLrc');
    lastFetchInfo.searchFallback = 4;
    let artist = visStatus.lastSpotifyMusic?.artist || visStatus.lastMusic?.artist || '';
    let title = visStatus.lastSpotifyMusic?.title || visStatus.lastMusic?.title || '';
    if (stripParens) {
        lastFetchInfo.searchFallback = 5;
        let differenceExists = false;
        if (artist.includes(', ') || artist.includes(' & ')) {
            artist = artist.split(', ')[0].split(' & ')[0];
            const strippedArtist = stripNonAlphaNumeric(artist);
            if (strippedArtist) {
                artist = strippedArtist;
                differenceExists = true;
            }
        }
        const strippedTitle = stripNonAlphaNumeric(title);
        if (strippedTitle) {
            title = strippedTitle;
            differenceExists = true;
        }
        if (!differenceExists) {
            return null;
        }
    }
    const albumTitle = visStatus.lastSpotifyMusic?.albumTitle || visStatus.lastMusic?.albumTitle || '';
    const query = artist + ' ' + title + ' ' + albumTitle;

    abortController = new AbortController();
    const response = await fetch(`https://lrclib.net/api/search?q=${query}`, {
        method: 'GET',
        headers: headers,
        signal: abortController.signal
    });
    const result = await response.json();

    let lastUnsyncedLyrics = null;
    if (result.length > 0) {
        for (const item of result) {
            if (item.syncedLyrics) {
                return {
                    synced: true,
                    id: item.id,
                    title: item.trackName,
                    artist: item.artistName,
                    albumTitle: item.albumName,
                    duration: item.duration,
                    syncedLyrics: item.syncedLyrics,
                    plainLyrics: item.plainLyrics || lrcToPlain(item.syncedLyrics)
                };
            } else if (item.plainLyrics) {
                lastUnsyncedLyrics = {
                    synced: false,
                    id: item.id,
                    title: item.trackName,
                    artist: item.artistName,
                    albumTitle: item.albumName,
                    duration: item.duration,
                    plainLyrics: item.plainLyrics
                };
                if (preferUnsynced) {
                    return lastUnsyncedLyrics;
                }
            }
        }
        if (lastUnsyncedLyrics) {
            if (!stripParens) {
                const searchResult = await searchFallback(true);
                if (searchResult?.synced) {
                    // If the search fallback found a synced result, return that instead of the unsynced one
                    return searchResult;
                }
            }
            lastFetchInfo.searchFallback = stripParens ? 5 : 4;
            return lastUnsyncedLyrics;
        }
    }
    if (stripParens) {
        return null;
    } else {
        // Attempt to get "CHUU - Confession (Ditto X Chuu (LOONA)) (고백 (영화 '동감' X 츄 (이달의 소녀)))" (YT/YTM) to work with the search fallback
        return await searchFallback(true);
    }
}

async function fetchLyrics(url) {
    try {
        if (lastFetchInfo.attempted !== undefined) {
            lastFetchInfo.attempted++;
        }
        abortController = new AbortController();
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            signal: abortController.signal
        });
        const json = await response.json();
        
        if (response.ok) {
            if (json.syncedLyrics) {
                if (lastFetchInfo.attempt) {
                    lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = 1;
                }
                return {
                    synced: true,
                    id: json.id,
                    title: json.trackName,
                    artist: json.artistName,
                    albumTitle: json.albumName,
                    duration: json.duration,
                    syncedLyrics: json.syncedLyrics,
                    plainLyrics: json.plainLyrics || lrcToPlain(json.syncedLyrics)
                }
            } else if (json.plainLyrics) {
                if (lastFetchInfo.attempt) {
                    lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = 2;
                }
                return {
                    synced: false,
                    id: json.id,
                    title: json.trackName,
                    artist: json.artistName,
                    albumTitle: json.albumName,
                    duration: json.duration,
                    plainLyrics: json.plainLyrics
                }
            } else {
                if (lastFetchInfo.attempt) {
                    lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = -1;
                }
                return null;
            }
        } else {
            if (lastFetchInfo.attempt) {
                lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = -2;
            }
            return null;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        } else {
            if (lastFetchInfo.attempt) {
                lastFetchInfo.attempt[lastFetchInfo.attempted - 1] = -3;
            }
            console.error(error);
            return null;
        }
    }
}

async function loadLyrics(idOrLrc, addOverride) {
    // Abort the previous request if it's still running
    // On early startup, 'undefined undefined undefined' might be used for the song hash (before receiving the first mediaProperties/SMTC event)
    // and cause finding the appropriate override to fail
    // This function is called both on startup and mediaProperties events, and if the former uses fetch instead of the override, the fetch might finish after the latter gets the override
    // So the fetch should be aborted to prevent the loaded override from being overwritten by the fetch result (likely "No lyrics found")
    abortController.abort();

    let lyrics = null;
    if (idOrLrc) {
        lastFetchInfo = {
            hash: lastFetchInfo.hash
        };
    }
    if (idOrLrc instanceof File) {
        const text = await idOrLrc.text();
        if (isTextLrc(text)) {
            const { artist, title, albumTitle, duration } = parseLrcMetadata(text);
            lyrics = {
                synced: true,
                id: null,
                title: title || getFilename(idOrLrc.name),
                artist: artist,
                albumTitle: albumTitle,
                duration: duration,
                syncedLyrics: text,
                plainLyrics: lrcToPlain(text)
            }
        } else {
            lyrics = {
                synced: false,
                id: null,
                title: getFilename(idOrLrc.name),
                plainLyrics: text
            }
        }
    } else {
        try {
            if (lyricsView.querySelector('mad-string')) {
                lyricsView.innerHTML = `<mad-string data-locid="VISLRC_STATUS_LOADING">Loading...</mad-string>`;
            } else {
                loadingIndicator.style.display = 'block';
            }
            lyrics = await findLyrics(idOrLrc);
        } catch (error) {
            if (error.name === 'AbortError') {
                // New request was made, ignore the old one
                return;
            }
        }
    }

    lastLyrics = lyrics;
    loadingIndicator.style.display = 'none';
    if (lyrics) {
        lastLyricsId = lyrics.id;
        saveLyricsBtn.classList.remove('disabled');
        if (lyrics.id) {
            publishLyricsBtn.classList.add('disabled');
        } else {
            publishLyricsBtn.classList.remove('disabled');
        }
        if (lyrics.synced && !preferUnsynced) {
            saveMenuItems[0].classList.remove('disabled');
            lyricsView.innerHTML = '';
            const lrc = parseLrc(lyrics.syncedLyrics);
            lrc.forEach((line, index) => {
                const p = document.createElement('p');
                p.textContent = line.text;
                p.dataset.time = line.time;
                lyricsView.appendChild(p);
            });
            lastSyncedLyricsParsed = lrc;

            autoScroll = true;
            autoScrollBtn.classList.remove('disabled');
            autoScrollBtn.classList.add('checkedItem');
            processTimeline();
        } else {
            if (lyrics.synced) {
                saveMenuItems[0].classList.remove('disabled');
            } else {
                saveMenuItems[0].classList.add('disabled');
            }
            lyricsView.textContent = lyrics.plainLyrics;
            lastSyncedLyricsParsed = null;

            autoScroll = false;
            autoScrollBtn.classList.add('disabled');
            autoScrollBtn.classList.remove('checkedItem');
        }
        if (addOverride && idOrLrc && !(idOrLrc instanceof File) && idOrLrc.length <= 10) {
            const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
            if (!hash) {
                return;
            }
            overrides[hash] = {
                id: lyrics.id
            };
            madIdb.setItem('lyricsOverrides', overrides);
        }
    } else {
        saveLyricsBtn.classList.add('disabled');
        saveMenuItems[0].classList.add('disabled');
        publishLyricsBtn.classList.add('disabled');
        autoScrollBtn.classList.add('disabled');
        autoScrollBtn.classList.remove('checkedItem');
        if (!navigator.onLine) {
            lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_OFFLINE"></mad-string>';
        } else {
            lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NOT_FOUND"></mad-string>';
        }
        lastSyncedLyricsParsed = null;
    }
}

function parseLrc(string) {
    // Copilot did this!
    const lines = string.split('\n');
    const lyrics = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const time = line.match(/\[\d+:\d+\.\d+\]/g);
        if (time) {
            const text = line.replace(/\[\d+:\d+\.\d+\]/g, '');
            for (let j = 0; j < time.length; j++) {
                const t = time[j].match(/\d+/g);
                const seconds = parseInt(t[0]) * 60 + parseFloat(t[1]);
                lyrics.push({
                    time: seconds,
                    text: text
                });
            }
        }
    }
    return lyrics;
}

function parseLrcMetadata(string) {
    let artist = '';
    let title = '';
    let albumTitle = '';
    let duration = 0;
    for (const line of string.split('\n')) {
        if (line.startsWith('[ar:')) {
            artist = line.substring(4, line.length - 1);
        } else if (line.startsWith('[ti:')) {
            title = line.substring(4, line.length - 1);
        } else if (line.startsWith('[al:')) {
            albumTitle = line.substring(4, line.length - 1);
        } else if (line.startsWith('[length:')) {
            const value = line.substring(8, line.length - 1).trim().split(':');
            if (value.length === 2) {
                duration = parseInt(value[0]) * 60 + parseInt(value[1]);
            } else if (value.length === 3) {
                duration = parseInt(value[0]) * 3600 + parseInt(value[1]) * 60 + parseInt(value[2]);
            } else {
                duration = parseInt(value[0]);
            }
        }
    }
    return { artist, title, albumTitle, duration };
}

function lrcToPlain(string) {
    return string.replace(/\[\d+:\d+\.\d+\]/g, '').replace(/\[.*?:.*?\]/g, '').trim().split('\n').map(line => line.trim()).join('\n');
}

function isTextLrc(string) {
    return string.match(/\[\d+:\d+\.\d+\]/g) !== null;
}

async function processProperties(force, simulating) {
    preferUnsynced = localStorage.madesktopVisLyricsForceUnsynced || !visStatus.mediaIntegrationAvailable || madRunningMode !== 1 || !connected;
    if (preferUnsynced) {
        syncAdjustBtn.classList.add('disabled');
    } else {
        syncAdjustBtn.classList.remove('disabled');
    }
    // Make sure the music has changed, as the event can be triggered multiple times
    // E.g. when the WPE media listeners got invalidated by closing an iframe and listners got re-registered
    if (force === true ||
        !visStatus.lastMusic || // If no music is playing. Try Spotify if enabled anyway
        (visStatus.lastMusic && // If music data is present, check if it has changed
        (visStatus.lastMusic?.artist !== lastMusic?.artist ||
        visStatus.lastMusic?.title !== lastMusic?.title ||
        visStatus.lastMusic?.albumTitle !== lastMusic?.albumTitle ||
        visStatus.lastMusic?.albumArtist !== lastMusic?.albumArtist))
    ) {
        if (lyricsView.querySelector('mad-string')) {
            lyricsView.innerHTML = `<mad-string data-locid="VISLRC_STATUS_LOADING">Loading...</mad-string>`;
        } else {
            loadingIndicator.style.display = 'block';
        }
        if (simulating) {
            loadLyrics();
        } else if (localStorage.madesktopVisSpotifyEnabled && localStorage.madesktopVisSpotifyInfo) {
            const spotifyNowPlaying = await getSpotifyNowPlaying();
            if (spotifyNowPlaying && spotifyNowPlaying.item) {
                if (spotifyNowPlaying.item.album.artists.length > 0) {
                    const artist = spotifyNowPlaying.item.artists[0].name;
                    const title = spotifyNowPlaying.item.name;
                    const albumTitle = spotifyNowPlaying.item.album.name;
                    const duration = spotifyNowPlaying.item.duration_ms / 1000;
                    visStatus.lastSpotifyMusic = {
                        artist: artist,
                        title: title,
                        albumTitle: albumTitle,
                        duration: duration
                    };
                }
                loadLyrics();
            } else if (visStatus.lastMusic) {
                delete visStatus.lastSpotifyMusic;
                if (spotifyNowPlaying.errorCode) {
                    lastFetchInfo = {
                        spotifyResponse: spotifyNowPlaying.errorCode
                    }
                }
                loadLyrics();
            } else if (!connected) {
                loadingIndicator.style.display = 'none';
                lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MADVIS"></mad-string>';
            } else if (!visStatus.mediaIntegrationAvailable) {
                loadingIndicator.style.display = 'none';
                lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MEDINT"></mad-string>';
            } else {
                loadingIndicator.style.display = 'none';
                lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MUSIC"></mad-string>';
            }
        } else if (visStatus.lastMusic) {
            delete visStatus.lastSpotifyMusic;
            loadLyrics();
        } else if (!connected) {
            loadingIndicator.style.display = 'none';
            lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MADVIS"></mad-string>';
        } else if (!visStatus.mediaIntegrationAvailable) {
            loadingIndicator.style.display = 'none';
            lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MEDINT"></mad-string>';
        } else {
            loadingIndicator.style.display = 'none';
            lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MUSIC"></mad-string>';
        }
    }

    lastMusic = visStatus.lastMusic;
}

function processTimeline() {
    if (lastLyrics && lastSyncedLyricsParsed && visStatus.timeline) {
        const nearestIndex = getNearestLyricIndex(visStatus.timeline.position);
        if (nearestIndex !== -1) {
            for (let i = 0; i < lyricsView.children.length; i++) {
                const lyric = lyricsView.children[i];
                if (i <= nearestIndex) {
                    lyric.style.color = 'var(--button-text)';
                    if (autoScroll && i === nearestIndex) {
                        if (lyric.offsetTop < lyricsView.offsetHeight / 2) {
                            // scrolling to the top of the lyricsView
                            // don't use scrollIntoView with behavior: 'smooth' here as it causes jittering
                            lyricsView.scrollTop = 0;
                        } else {
                            lyric.scrollIntoView({
                                block: 'center', 
                                behavior: localStorage.madesktopVisLyricsSmoothScroll ? 'smooth' : 'instant'
                            });
                        }
                    }
                } else {
                    lyric.style.color = 'var(--gray-text)';
                }
            }
        } else {
            if (autoScroll) {
                lyricsView.scrollTop = 0;
            }
        }
    }
}

function getNearestLyricIndex(time) {
    if (lastSyncedLyricsParsed) {
        time += syncDelay;
        if (time < lastSyncedLyricsParsed[0].time) {
            return -1;
        }
        let nearestIndex = 0;
        let nearestTime = Math.abs(lastSyncedLyricsParsed[0].time - time);
        for (let i = 1; i < lastSyncedLyricsParsed.length; i++) {
            const diff = Math.abs(lastSyncedLyricsParsed[i].time - time);
            if (diff < nearestTime) {
                nearestIndex = i;
                nearestTime = diff;
            }
        }
        return nearestIndex;
    } else {
        return -1;
    }
}

// Crazy tricks regarding Spotify and YT Music title formatting
function stripNonAlphaNumeric(str) {
    // Spotify test cases: "IVE - 해야 (HEYA)", "DAY6 - 녹아내려요 Melt Down", "Ryokuoushoku Shakai - 花になって - Be a flower" (this one actually doesn't work in stripped form. Aaand in YTM: it only returns the English part to SMTC so have to use the search fallback), "TWICE - 올해 제일 잘한 일 / The Best Thing I Ever Did" (works fine in stripped form)
    // These songs do not provide English titles so the Spotify API returns titles like these            
    // Other weird formats I found: "NCT 127 - Fact Check (불가사의; 不可思議)", "SHINee - Sherlock · 셜록 (Clue+Note)" - these two work fine with Spotify data so was not going to handle them but it turns out they work nicely in the finished form of this function (lol)
    // Also: "NCT 127 - 영웅 (英雄; Kick It)" - semicolon is left in the stripped form, but it works fine in both get and search cuz LRCLIB doesn't care about punctuation

    // YTM English mode test cases: "YOUNHA - EVENT HORIZON (사건의 지평선)" (actually works fine in non-stripped form), "Weki Meki - Whatever U Want (너 하고 싶은 거 다 해 (너.하.다))"
    const replaced = str.replace(/[^\x20-\x7E]/g, '').trim(); // Remove non-ASCII characters
    const replacedHard = replaced.replace(/[^a-zA-Z0-9\s]/g, ''); // Remove non-alphanumeric characters (preserve spaces)

    // Check if the title is a duplicated English title (YTM somehow has these even in English mode)
    // Test case: "IVE - MINE (MINE)", "KWON EUNBI - Underwater (Underwater)", "OH MY GIRL - Dun Dun Dance (Dun Dun Dance)" (this actually works fine in non-stripped form in both get and search)
    // And "IVE - MINE (MINE)" returns a completely different song in the search fallback, so this is necessary
    if (replacedHard.length % 2 === 1) {
        const split = replacedHard.split(' ');
        const half = split.slice(0, split.length / 2).join(' ');
        if (replacedHard === half + ' ' + half) {
            return half;
        }
    }
    if (replaced === '' || replaced === str) {
        // Try stripping 'from', 'feat.', or such stuff from alphanumeric only titles (usually for YT Music)
        // The original title is in the DB in most cases though
        if ((str.includes('(') && str.includes(')'))) {
            return str.split('(')[0].trim();
        }
        return null;
    } else if (replaced.startsWith('(') && replaced.endsWith(')')) {
        // This may return something like "Feat. whatever" but surprisingly only giving the feat stuff as artist works fine with LRCLIB (searchFallbackAccurate)
        // Test case: "SUNMI - 보름달 (Feat. Lena)" (this one doesn't have English title at all in Spotify)
        return replaced.slice(1, -1);
    } else if (replaced.endsWith(')')) {
        // This may remove parentheses that are not a 'duplicated localized title' format, but it can also help with some weird cases like "ASHGRAY - Hello Mr. my yesterday (From 애니메이션 \"명탐정 코난\" 10기) (한국어버젼)" (watafak)
        const split = replaced.split('(')[0].trim();
        const splitReplacedHard = split.replace(/[^a-zA-Z0-9\s]/g, '');
        if (splitReplacedHard === '') {
            // This surprisingly works fine with some complicated examples in YTM English mode
            // Tested with "PRODUCE 48 - 반해버리잖아? (好きになっちゃうだろう？) (Suki ni Nacchaudarou?)", and "AKMU - 어떻게 이별까지 사랑하겠어, 널 사랑하는 거지(How can I love the heartbreak, you're the one I love)"
            // LRCLIB doesn't seem to care about punctuation or special characters
            return replacedHard.trim();
        } else if (split === '') {
            return null;
        } else {
            return split;
        }
    } else {
        return replacedHard.trim();
    }
}

async function getSongHash(artist, title, albumTitle) {
    if (!artist && !title && !albumTitle) {
        // undefined + undefined + undefined = NaN, sha1("NaN") = 9/2caPgErNpmXSqwgiF7sVgzGPI=
        // what the fuck
        return null;
    }
    const data = new TextEncoder().encode(artist + title + albumTitle);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashB64 = btoa(String.fromCharCode(...hashArray));
    return hashB64;
}

async function publish() {
    let artist = visStatus.lastSpotifyMusic?.artist || visStatus.lastMusic?.artist || lastLyrics?.artist || '';
    let title = visStatus.lastSpotifyMusic?.title || visStatus.lastMusic?.title || lastLyrics?.title || '';
    let album = visStatus.lastSpotifyMusic?.albumTitle || visStatus.lastMusic?.albumTitle || lastLyrics?.albumTitle || '';
    let duration = parseInt(visStatus.lastSpotifyMusic?.duration) || visStatus.timeline?.duration || lastLyrics?.duration || 1;
    const lyrics = lastLyrics;
    if (!lyrics || !lyrics.plainLyrics) {
        madAlert(madGetString("VISLRC_PUBLISH_NO_LYRICS"), null, 'warning', { title: 'locid:VISLRC_TITLE' });
        return;
    }
    if (lyrics?.id) {
        madAlert(madGetString("VISLRC_PUBLISH_NOT_LOCAL"), null, 'warning', { title: 'locid:VISLRC_TITLE' });
        return;
    }

    artist = await madPrompt(madGetString("VISLRC_PUBLISH_REVIEW_ARTIST"), null, artist, artist);
    if (artist === null) {
        return;
    }
    title = await madPrompt(madGetString("VISLRC_PUBLISH_REVIEW_TITLE"), null, title, title);
    if (title === null) {
        return;
    }
    album = await madPrompt(madGetString("VISLRC_PUBLISH_REVIEW_ALBUM"), null, album, album);
    if (album === null) {
        return;
    }
    duration = await madPrompt(madGetString("VISLRC_PUBLISH_REVIEW_DURATION"), null, duration, duration);
    if (duration === null) {
        return;
    }
    duration = parseInt(duration);
    if (isNaN(duration)) {
        madAlert(madGetString("VISLRC_PUBLISH_DURATION_NAN"), null, 'error', { title: 'locid:VISLRC_TITLE' });
        return;
    }
    if (artist === '' || title === '' || album === '') {
        madAlert(madGetString("VISLRC_PUBLISH_FILL_ALL"), null, 'error', { title: 'locid:VISLRC_TITLE' });
        return;
    }

    const data = {
        trackName: title,
        artistName: artist,
        albumName: album,
        duration: duration,
        plainLyrics: lyrics.plainLyrics,
        syncedLyrics: lyrics.syncedLyrics || null
    };
    console.log(data);

    const challenge = await fetch('https://lrclib.net/api/request-challenge', {
        method: 'POST',
        headers: headers
    })
    const json = await challenge.json();
    const prefix = json.prefix;
    const targetHex = json.target;
    const targetBytes = new Uint8Array(targetHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    if (!madAlert.fallback) {
        madAlert(madGetString("VISLRC_PUBLISH_NONCE_WAIT"), null, 'info', { title: 'locid:VISLRC_TITLE' });
    }
    const nonce = await getNonce(prefix, targetBytes);
    console.log('Nonce:', nonce);
    if (nonce === undefined) {
        return;
    }
    if (nonce === -1) {
        madAlert(madGetString("VISLRC_PUBLISH_NONCE_TIMEOUT"), null, 'error', { title: 'locid:VISLRC_TITLE' });
        return;
    }

    const msg = madGetString("VISLRC_PUBLISH_FINAL_CONFIRM", artist, title, album, duration, lyrics.plainLyrics.split('\n').slice(0, 10).join('\n'));
    if (!await madConfirm(msg.replaceAll('\n', '<br>'), null, {
        icon: 'question',
        title: 'locid:VISLRC_TITLE'
    })) {
        return;
    }

    const publishHeaders = new Headers();
    publishHeaders.append('Content-Type', 'application/json');
    publishHeaders.append('X-Publish-Token', `${prefix}:${nonce}`);
    publishHeaders.append('Lrclib-Client', headers['Lrclib-Client']);

    const response = await fetch('https://lrclib.net/api/publish', {
        method: 'POST',
        headers: publishHeaders,
        body: JSON.stringify(data)
    });

    if (response.ok) {
        madAlert(madGetString("VISLRC_PUBLISH_SUCCESS"), null, 'info', { title: 'locid:VISLRC_TITLE' });
    } else {
        const result = await response.json();
        console.log(result);
        madAlert(madGetString("VISLRC_PUBLISH_SUCCESS") + '<br>' + result.message, null, 'error', { title: 'locid:VISLRC_TITLE' });
    }

    async function getNonce(prefix, targetBytes) {
        return new Promise((resolve, reject) => {
            const worker = new Worker('nonce.js');
            worker.postMessage({ prefix, targetBytes });
            worker.onmessage = (e) => {
                const data = e.data;
                if (data.nonce) {
                    nonceIndicator.style.display = 'none';
                    nonceObj = null;
                    resolve(data.nonce);
                } else if (data.progress !== undefined) {
                    nonceIndicator.style.display = 'block';
                    if (data.progress === 0) {
                        nonceIndicator.textContent = madGetString("VISLRC_PUBLISH_NONCE_START");
                    } else {
                        nonceIndicator.textContent = madGetString("VISLRC_PUBLISH_NONCE_PROGRESS", data.progress / 1000000);
                    }
                } else if (data.error) {
                    nonceIndicator.style.display = 'none';
                    nonceObj = null;
                    if (data.error === 'timeout') {
                        resolve(-1);
                    } else {
                        reject(data.error);
                    }
                }
            };
            worker.onerror = (e) => {
                nonceIndicator.style.display = 'none';
                nonceObj = null;
                reject(e);
            };
            nonceObj = {
                worker: worker,
                resolve: resolve,
                reject: reject
            }
        });
    }
}

async function saveText(text, filename, synced) {
    const blob = new Blob([text], { type: 'text/plain' });
    if (madRunningMode === 0) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    } else {
        try {
            const res = await madSysPlug.saveFile(blob, {
                "X-Format-Name": synced ? "Lyrics Files" : "Text Files",
                "X-Format-Extension": synced ? "lrc" : "txt",
                "X-File-Name": encodeURIComponent(filename)
            });
            if (!res) {
                copyText(text);
                madAlert(madGetString("VISLRC_LYRICS_COPIED"));
            }
        } catch {
            copyText(text);
            madAlert(madGetString("VISLRC_LYRICS_COPIED"));
        }
    }
}

async function configChanged() {
    if (connected) {
        processProperties(true);
    }
    lyricsView.style.font = localStorage.madesktopVisLyricsFont || '';
    if (!localStorage.madesktopVisSpotifyEnabled || !localStorage.madesktopVisSpotifyInfo) {
        delete visStatus.lastSpotifyMusic;
    }
}

// Spotify stuff
async function getSpotifyNowPlaying() {
    if (!localStorage.madesktopVisSpotifyInfo) {
        return null;
    }
    try {
        const info = await getSpotifyToken();
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + info.accessToken
            }
        });
        if (response.status === 200) {
            const json = await response.json();
            return json;
        } else {
            return {
                item: null,
                errorCode: response.status
            };
        }
    } catch (error) {
        console.error(error);
        return {
            item: null,
            errorCode: -1
        }
    }
}

async function getSpotifyToken() {
    if (!localStorage.madesktopVisSpotifyInfo) {
        return null;
    }
    const info = JSON.parse(localStorage.madesktopVisSpotifyInfo);
    if (info.fetchedAt + info.expiresIn - 60 > Date.now() / 1000) {
        return info;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: info.refreshToken,
            client_id: info.clientId
        })
    });
    if (response.ok) {
        const json = await response.json();
        const newInfo = {
            accessToken: json.access_token,
            expiresIn: json.expires_in,
            fetchedAt: Date.now() / 1000,
            refreshToken: json.refresh_token,
            clientId: info.clientId
        };
        localStorage.madesktopVisSpotifyInfo = JSON.stringify(newInfo);
        return newInfo;
    } else {
        return null;
    }
}

// Debugging stuff
async function simulate(artist, title, album, isSpotify, spotifyArtist, spotifyTitle, spotifyAlbum, spotifyDuration) {
    visStatus.lastMusic = {
        title: title,
        artist: artist,
        albumTitle: album,
        simulated: true
    };
    if (isSpotify) {
        visStatus.lastSpotifyMusic = {
            title: spotifyTitle || title,
            artist: spotifyArtist || artist,
            albumTitle: spotifyAlbum || album,
            duration: spotifyDuration || 1
        };
    } else {
        delete visStatus.lastSpotifyMusic;
    }
    processProperties(true, true);
    console.log('Hash:', await getSongHash(artist, title, album));
}

function showDebugInfo() {
    let msg = '';

    const msgInLyricsView = lyricsView.querySelector('mad-string');
    if (msgInLyricsView) {
        msg = madGetString(msgInLyricsView.locId);
    } else {
        msg += 'Current track: ' + escapeHTML(visStatus.lastMusic?.artist) + ' - ' + escapeHTML(visStatus.lastMusic?.title) + ' (' + escapeHTML(visStatus.lastMusic?.albumTitle) + ')<br>';
        msg += 'Current lyrics ID: ' + (lastLyricsId ?? 'Local lyrics') + '<br>';
        msg += 'Song hash: ' + lastFetchInfo.hash + '<br>';
        msg += 'Timeline: ' + visStatus.timeline?.position + 's / ' + visStatus.timeline?.duration + 's<br><br>';
        msg += 'Track info from the loaded lyrics: ' + escapeHTML(lastLyrics?.artist) + ' - ' + escapeHTML(lastLyrics?.title) + ' (' + escapeHTML(lastLyrics?.albumTitle) + ')<br>';
        msg += 'Duration of the loaded lyrics: ' + lastLyrics?.duration + 's<br><br>';
        if (lastFetchInfo.override === -1) {
            msg += 'Override: Local lyrics<br>';
        } else if (lastFetchInfo.override) {
            msg += 'Override ID: ' + lastFetchInfo.override + '<br>';
        } else if (lastFetchInfo.urls) {
            msg += 'URLs tried:<br>';
            for (let i = 0; i < lastFetchInfo.urls.length; i++) {
                msg += '- ' + decodeURIComponent(lastFetchInfo.urls[i]) + ' (';
                switch (lastFetchInfo.attempt[i]) {
                    case 1:
                        msg += 'Synced';
                        break;
                    case 2:
                        msg += 'Unsynced';
                        break;
                    case 0:
                        msg += 'Not tried';
                        break;
                    case -1:
                        msg += 'Instrumental';
                        break;
                    case -2:
                        msg += 'No lyrics';
                        break;
                    case -3:
                        msg += 'Error';
                        break;
                    default:
                        msg += 'Unknown';
                        break;
                }
                msg += ')<br>';
            }
            msg += '<br>';
        }
        if (lastFetchInfo.searchFallback) {
            switch (lastFetchInfo.searchFallback) {
                case 1:
                    msg += 'Search fallback: Accurate<br>';
                    break;
                case 2:
                    msg += 'Search fallback: Accurate (no album)<br>';
                    break;
                case 3:
                    msg += 'Search fallback: Accurate (no artist)<br>';
                    break;
                case 4:
                    msg += 'Search fallback: Normal<br>';
                    break;
                case 5:
                    msg += 'Search fallback: Normal (stripped)<br>';
                    break;
            }
        }
        if (lastSyncedLyricsParsed) {
            msg += 'Loaded lyrics are synced';
        } else if (lastLyrics.synced) {
            msg += 'Loaded lyrics are not synced, synced lyrics are available';
        } else {
            msg += 'Loaded lyrics are not synced, synced lyrics are not available';
        }
        if (preferUnsynced) {
            msg += ', unsynced lyrics are preferred';
        }

        if (localStorage.madesktopVisSpotifyEnabled && localStorage.madesktopVisSpotifyInfo) {
            const info = JSON.parse(localStorage.madesktopVisSpotifyInfo);
            msg += '<br><br>';
            if (visStatus.lastSpotifyMusic) {
                msg += 'Current Spotify track: ' + escapeHTML(visStatus.lastSpotifyMusic?.artist) + ' - ' + escapeHTML(visStatus.lastSpotifyMusic?.title) + ' (' + escapeHTML(visStatus.lastSpotifyMusic?.albumTitle) + ')<br>';
                msg += 'Spotify duration: ' + visStatus.lastSpotifyMusic?.duration + 's<br><br>';
            } else {
                msg += 'Current Spotify track: None<br>';
                if (lastFetchInfo.spotifyResponse === -1) {
                    msg += 'Spotify API last response: Error<br>';
                } else if (lastFetchInfo.spotifyResponse) {
                    msg += 'Spotify API last response code: ' + lastFetchInfo.spotifyResponse + '<br>';
                }
            }
            msg += 'Spotify client ID: ' + info.clientId + '<br>';
            const fetchedAtDate = new Date(info.fetchedAt * 1000).toLocaleString(window.madLang);
            const expiryDate = new Date((info.fetchedAt + info.expiresIn - 60) * 1000).toLocaleString(window.madLang);
            msg += 'Spotify token fetched at: ' + fetchedAtDate + '<br>';
            msg += 'Spotify token expiry: ' + expiryDate;
        }

        if (visStatus.lastMusic?.simulated) {
            msg += '<br><br>This lyrics find was simulated. Click \'Setup listeners again\' to fetch the real lyrics.';
        }
    }
    let innerText = '';
    madConfirm(msg, function(res) {
        if (res === true) {
            copyText(innerText);
        } else if (res === null) {
            top.visDeskMover.windowElement.contentWindow.setupMediaListeners();
        }
    }, {
        icon: 'info',
        title: 'locid:VISLRC_TITLE',
        btn1: 'locid:UI_COPY',
        btn2: 'locid:UI_OK',
        btn3: '&Setup listeners again',
        defaultBtn: 2,
        cancelBtn: 2
    });
    innerText = top.document.getElementById('msgbox-msg').innerText;
    innerText += '\n\n';
    if (visStatus.lastSpotifyMusic) {
        innerText += 'window.simulate(' + JSON.stringify([visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle, true, visStatus.lastSpotifyMusic.artist, visStatus.lastSpotifyMusic.title, visStatus.lastSpotifyMusic.albumTitle, visStatus.lastSpotifyMusic.duration]).slice(1, -1) + ')';
    } else {
        innerText += 'window.simulate(' + JSON.stringify([visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle]).slice(1, -1) + ')';
    }
}
// #endregion

// #region Initialization - Attach to MADVis
top.addEventListener('load', init);

if (top.document.readyState === 'complete') {
    init();
}

async function init() {
    if (top.visDeskMover) {
        connected = true;
        const visDeskMover = top.visDeskMover;
        visStatus = visDeskMover.visStatus;

        overrides = await madIdb.lyricsOverrides;
        if (!overrides) {
            overrides = {};
            madIdb.setItem('lyricsOverrides', overrides);
        }

        processProperties(true);

        visDeskMover.addEventListener('mediaProperties', processProperties);
        visDeskMover.addEventListener('mediaTimeline', processTimeline);
        visDeskMover.addEventListener('load', init, null, 'iframe');
    } else if (madRunningMode !== 0) {
        lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MADVIS"></mad-string>';
    } else {
        lyricsView.innerHTML = `<mad-string data-locid="VISLRC_STATUS_MANUAL_INFO"></mad-string>`;
    }
}

if (madRunningMode !== 0) {
    setInterval(() => {
        if (!top.visDeskMover && connected) {
            lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MADVIS"></mad-string>';
            connected = false;
            visStatus = {};
        } else if (top.visDeskMover && !connected) {
            init();
        } else if (top.visDeskMover && connected) {
            if (top.visDeskMover.visStatus !== visStatus) {
                init();
            }
        }
    }, 2000);
}
// #endregion