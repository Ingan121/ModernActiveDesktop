// main.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const lyricsView = document.getElementById('lyricsView');

const menuBar = document.getElementById('menuBar');
const lrcMenuItems = document.querySelectorAll('#lrcMenu .contextMenuItem');

let inited = 0; // 0: Not initialized at all, 1: Initialized but MADVis not loaded, 2: Fully initialized, -1: MADVis unloaded while running

madDeskMover.menu = new MadMenu(menuBar, ['lrc']);

lrcMenuItems[5].addEventListener('click', function () { // Close button
    madCloseWindow();
});

top.addEventListener('load', init);

if (top.document.readyState === 'complete') {
    init();
}

if (localStorage.madesktopVisLyricsFont) {
    lyricsView.style.font = localStorage.madesktopVisLyricsFont;
}

async function init() {
    inited = 1;
    if (top.visDeskMover) {
        inited = 2;
        const visDeskMover = top.visDeskMover;
        const visStatus = visDeskMover.visStatus;

        let lastLyrics = null;
        let lastSyncedLyricsParsed = null;
        let lastLyricsId = null;
        let lastMusic = null;
        let autoScroll = true;
        let autoScrolling = false;
        let overrides = await madIdb.lyricsOverrides;
        let abortController = new AbortController();

        if (!overrides) {
            overrides = {};
            madIdb.setItem('lyricsOverrides', overrides);
        }

        processProperties(true);

        visDeskMover.addEventListener('mediaProperties', processProperties);

        visDeskMover.addEventListener('mediaTimeline', processTimeline);

        visDeskMover.addEventListener('load', function () {
            // MADVis has been reloaded; setup listeners again
            location.reload();
        }, null, 'iframe');

        lrcMenuItems[0].addEventListener('click', async function () { // Load Lyrics button
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
            const query = artist + ' ' + title + ' ' + albumTitle;

            const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
            const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
            const options = {
                left, top, width: '520px', height: '132px',
                aot: true, unresizable: true, noIcon: true
            }
            const searchDeskMover = madOpenWindow('apps/visualizer/lyrics/search.html?query=' + encodeURIComponent(query) + "&current=" + lastLyricsId, true, options);
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
            const text = await file.text();
            loadLyrics(text);

            const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
            if (hash && await madConfirm(madGetString('VISLRC_CONFIRM_SAVE_LYRICS'))) {
                overrides[hash] = {
                    lrc: text
                };
                madIdb.setItem('lyricsOverrides', overrides);
            }
        });

        lrcMenuItems[3].addEventListener('click', function () { // Auto Scroll button
            if (!lastSyncedLyricsParsed) {
                return;
            }

            autoScroll = !autoScroll;
            if (autoScroll) {
                lrcMenuItems[3].classList.add('checkedItem');
                processTimeline();
            } else {
                lrcMenuItems[3].classList.remove('checkedItem');
            }
        });

        lrcMenuItems[4].addEventListener('click', function () { // Options button
            const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
            const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
            const options = {
                left, top, width: '400px', height: '410px',
                aot: true, unresizable: true, noIcon: true
            }
            const confDeskMover = madOpenWindow('apps/visualizer/lyrics/config.html', true, options);
            confDeskMover.addEventListener('load', () => {
                confDeskMover.windowElement.contentWindow.configChanged = configChanged;
            }, null, "window");
        });

        lyricsView.addEventListener('scroll', function () {
            // If the user scrolls, disable auto-scrolling
            if (!autoScrolling) {
                autoScroll = false;
                lrcMenuItems[3].classList.remove('checkedItem');
            } else {
                autoScrolling = false;
            }
        });

        // Load lyrics from the API
        async function findLyrics(id) {
            if (id) {
                return await fetchLyrics('https://lrclib.net/api/get/' + id);
            }

            const hash = await getSongHash(visStatus.lastMusic?.artist, visStatus.lastMusic?.title, visStatus.lastMusic?.albumTitle);
            const override = overrides[hash];
            if (override) {
                if (override.lrc) {
                    if (isTextLrc(override.lrc)) {
                        return {
                            synced: true,
                            id: null,
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
                    duration: duration // However this does, so try without duration too
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
                };
                // Duration here is more inaccurate than Spotify's duration, and it also may not be present or up to date when the timeline event is triggered
                // So don't include it here
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

            let lastUnsyncedLyrics = null;
            for (const url of urlsToTry) {
                const lyrics = await fetchLyrics(url);
                if (lyrics) {
                    if (lyrics.synced) {
                        return lyrics;
                    } else {
                        lastUnsyncedLyrics = lyrics;
                    }
                }
            }
            if (lastUnsyncedLyrics) {
                // Don't fall back to search if the album title is not present and unsynced lyrics exist, as it may find a completely different song. Test case: "IVE - I WANT"
                // In fact, "IVE" easily causes the search fallback to return a completely different song, as LRCLIB doesn't care about punctuation so songs with "I've" in titles, albums, ... gets returned
                if (visStatus.lastSpotifyMusic?.albumTitle || visStatus.lastMusic?.albumTitle) {
                    const searchResult = await searchFallback();
                    if (searchResult.synced) {
                        // If the search fallback found a synced result, return that instead of the unsynced one
                        // Example of get not finding the best result that the search api does: "STAYC - Flexing On My Ex" (maybe because of the duration)
                        return searchResult
                    }
                }
                // If the search result is unsynced, return the get result instead as that's more accurate
                return lastUnsyncedLyrics;
            } else {
                // May work in weird cases like instrumental tracks getting returned above, test case: "GFRIEND - Glass Bead"
                // Or if the get api just doesn't find the result that the search api does, test case: "QWER - 고민중독" (get works fine with Spotify data though)
                // Or some complicated cases like "Jay Park - All I Wanna Do (K) (Feat. Hoody & Loco)"
                // Also it works surprisingly well with YT/YTM duplicated titles. Even artificailly duplicated titles like "tripleS - Girls Never Die (Girls Never Die (Girls Never Die (Girls Never Die)))" work fine
                return await searchFallback();
            }
        }

        async function searchFallback(stripParens) {
            const artist = visStatus.lastSpotifyMusic?.artist || visStatus.lastMusic?.artist || '';
            let title = visStatus.lastSpotifyMusic?.title || visStatus.lastMusic?.title || '';
            if (stripParens) {
                title = stripNonAlphaNumeric(title);
                if (!title) {
                    return null;
                }
            }
            const albumTitle = visStatus.lastSpotifyMusic?.albumTitle || visStatus.lastMusic?.albumTitle || '';
            const query = artist + ' ' + title + ' ' + albumTitle;

            abortController = new AbortController();
            const response = await fetch(`https://lrclib.net/api/search?q=${query}`, {
                method: 'GET',
                headers: {
                    'Lrclib-Client': 'ModernActiveDesktop/' + top.madVersion.toString(1) + (madRunningMode === 1 ? ' (Wallpaper Engine)' : ' (Lively Wallpaper)') + ' (https://madesktop.ingan121.com/)'
                },
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
                            syncedLyrics: item.syncedLyrics,
                            plainLyrics: item.plainLyrics || lrcToPlain(item.syncedLyrics)
                        };
                    } else if (item.plainLyrics) {
                        lastUnsyncedLyrics = {
                            synced: false,
                            id: item.id,
                            plainLyrics: item.plainLyrics
                        };
                    }
                }
                if (lastUnsyncedLyrics) {
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
            abortController = new AbortController();
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Lrclib-Client': 'ModernActiveDesktop/' + top.madVersion.toString(1) + (madRunningMode === 1 ? ' (Wallpaper Engine)' : ' (Lively Wallpaper)') + ' (https://madesktop.ingan121.com/)'
                },
                signal: abortController.signal
            });
            const json = await response.json();
            
            if (response.ok) {
                if (json.syncedLyrics) {
                    return {
                        synced: true,
                        id: json.id,
                        syncedLyrics: json.syncedLyrics,
                        plainLyrics: json.plainLyrics || lrcToPlain(json.syncedLyrics)
                    }
                } else if (json.plainLyrics) {
                    return {
                        synced: false,
                        id: json.id,
                        plainLyrics: json.plainLyrics
                    }
                } else {
                    return null;
                }
            } else {
                return null;
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
            if (idOrLrc?.length >= 10) {
                if (isTextLrc(idOrLrc)) {
                    lyrics = {
                        synced: true,
                        id: null,
                        syncedLyrics: idOrLrc,
                        plainLyrics: lrcToPlain(idOrLrc)
                    }
                } else {
                    lyrics = {
                        synced: false,
                        id: null,
                        plainLyrics: idOrLrc
                    }
                }
            } else {
                try {
                    lyrics = await findLyrics(idOrLrc);
                } catch (error) {
                    if (error.name === 'AbortError') {
                        // New request was made, ignore the old one
                        return;
                    }
                }
            }

            lastLyrics = lyrics;
            if (lyrics) {
                lastLyricsId = lyrics.id;
                if (lyrics.synced && !localStorage.madesktopVisLyricsForceUnsynced && visStatus.mediaIntegrationAvailable && madRunningMode === 1) {
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
                    lrcMenuItems[3].classList.remove('disabled');
                    lrcMenuItems[3].classList.add('checkedItem');
                    processTimeline();
                } else {
                    lyricsView.textContent = lyrics.plainLyrics;
                    lastSyncedLyricsParsed = null;

                    autoScroll = false;
                    lrcMenuItems[3].classList.add('disabled');
                    lrcMenuItems[3].classList.remove('checkedItem');
                }
                if (addOverride && idOrLrc && idOrLrc.length <= 10) {
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
                lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NOT_FOUND"></mad-string>';
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

        function lrcToPlain(string) {
            return string.replace(/\[\d+:\d+\.\d+\]/g, '').replace(/\[.*?:.*?\]/g, '').trim();
        }

        function isTextLrc(string) {
            return string.match(/\[\d+:\d+\.\d+\]/g) !== null;
        }

        async function processProperties(force, simulating) {
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
                if (localStorage.madesktopVisSpotifyEnabled && localStorage.madesktopVisSpotifyInfo && !simulating) {
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
                        loadLyrics();
                    } else if (!visStatus.mediaIntegrationAvailable) {
                        lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MEDINT"></mad-string>';
                    } else {
                        lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MUSIC"></mad-string>';
                    }
                } else if (visStatus.lastMusic) {
                    delete visStatus.lastSpotifyMusic;
                    loadLyrics();
                } else if (!visStatus.mediaIntegrationAvailable) {
                    lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MEDINT"></mad-string>';
                } else {
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
                                autoScrolling = true;
                                lyric.scrollIntoView({ block: 'center' });
                            }
                        } else {
                            lyric.style.color = 'var(--gray-text)';
                        }
                    }
                } else {
                    if (autoScroll) {
                        autoScrolling = true;
                        lyricsView.scrollTop = 0;
                    }
                }
            }
        }

        function getNearestLyricIndex(time) {
            if (lastSyncedLyricsParsed) {
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
            // Spotify test cases: "IVE - 해야 (HEYA)", "DAY6 - 녹아내려요 Melt Down", "Ryokuoushoku Shakai - 花になって - Be a flower" (this one actually doesn't work in stripped form. Aaand in YTM: it only returns the English part to SMTC so have to use the search fallback)
            // These songs do not provide English titles so the Spotify API returns titles like these            
            // Other weird formats I found: "NCT 127 - Fact Check (불가사의; 不可思議)", "SHINee - Sherlock · 셜록 (Clue+Note)" - these two work fine with Spotify data so was not going to handle them but it turns out they work nicely in the finished form of this function (lol)

            // YTM English mode test cases: "YOUNHA - 사건의 지평선 (EVENT HORIZON)" (actually works fine in non-stripped form), "Weki Meki - Whatever U Want (너 하고 싶은 거 다 해 (너.하.다))"
            const replaced = str.replace(/[^\x20-\x7E]/g, '').trim(); // Remove non-ASCII characters
            const replacedHard = replaced.replace(/[^a-zA-Z0-9\s]/g, ''); // Remove non-alphanumeric characters (preserve spaces)

            // Check if the title is a duplicated English title (YTM somehow has these even in English mode)
            // Test case: "IVE - MINE (MINE)", "KWON EUNBI - Underwater (Underwater)" (this actually works fine in non-stripped form in both get and search), "OH MY GIRL - Dun Dun Dance (Dun Dun Dance)"
            // And "IVE - MINE (MINE)" returns a completely different song in the search fallback, so this is necessary
            if (replacedHard.length % 2 === 1) {
                const split = replacedHard.split(' ');
                const half = split.slice(0, split.length / 2).join(' ');
                if (replacedHard === half + ' ' + half) {
                    return half;
                }
            }
            if (replaced === '' || replaced === str) {
                return null;
            } else if (replaced.startsWith('(') && replaced.endsWith(')')) {
                return replaced.slice(1, -1);
            } else if (replaced.includes(' - ')) {
                return replaced.split(' - ')[1].trim();
            } else if (replaced.endsWith(')')) {
                // This may remove parentheses that are not a 'duplicated localized title' format, but it can also help with some weird cases like "ASHGRAY - Hello Mr. my yesterday (From 애니메이션 \"명탐정 코난\" 10기) (한국어버젼)" (watafak)
                const split = replaced.split('(')[0].trim();
                const splitReplacedHard = split.replace(/[^a-zA-Z0-9\s]/g, '');
                if (splitReplacedHard === '') {
                    // This surprisingly works fine with some complicated examples in YTM English mode
                    // Tested with "PRODUCE 48 - 반해버리잖아? (好きになっちゃうだろう？) (Suki ni Nacchaudarou?)", and "AKMU - 어떻게 이별까지 사랑하겠어, 널 사랑하는 거지(How can I love the heartbreak, you're the one I love)"
                    // LRCLIB doesn't seem to care about punctuation or special characters
                    return replacedHard;
                } else if (split === '') {
                    return null;
                } else {
                    return split;
                }
            } else {
                return replacedHard;
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

        async function configChanged() {
            processProperties(true);
            lyricsView.style.font = localStorage.madesktopVisLyricsFont || '';
            if (!localStorage.madesktopVisSpotifyEnabled || !localStorage.madesktopVisSpotifyInfo) {
                delete visStatus.lastSpotifyMusic;
            }
        }

        // Debugging stuff
        window.simulate = async function (artist, title, album) {
            visStatus.lastMusic = {
                title: title,
                artist: artist,
                albumTitle: album
            };
            visStatus.lastSpotifyMusic = {
                title: title,
                artist: artist,
                albumTitle: album,
            };
            processProperties(true, true);
            console.log('Hash:', await getSongHash(artist, title, album));
        }
    } else {
        lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MADVIS"></mad-string>';
    }
}

async function getSpotifyNowPlaying() {
    if (!localStorage.madesktopVisSpotifyInfo) {
        return null;
    }
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
        return null;
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

setInterval(() => {
    if (!top.visDeskMover && inited) {
        if (inited === 2) {
            lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MADVIS"></mad-string>';
            inited = -1;
        }
    } else if (top.visDeskMover) {
        if (inited === 1) {
            init();
        } else if (inited === -1) {
            location.reload();
        }
    }
}, 2000);