// main.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const lyricsView = document.getElementById('lyricsView');

const menuBar = document.getElementById('menuBar');
const lrcMenuItems = document.querySelectorAll('#lrcMenu .contextMenuItem');

let inited = 0;

madDeskMover.menu = new MadMenu(menuBar, ['lrc']);

lrcMenuItems[3].addEventListener('click', function () { // Close button
    madCloseWindow();
});

top.addEventListener('load', init);

if (top.document.readyState === 'complete') {
    init();
}

if (localStorage.madesktopVisLyricsFont) {
    lyricsView.style.font = localStorage.madesktopVisLyricsFont;
}

function init() {
    inited = 1;
    if (top.visDeskMover) {
        inited = 2;
        const visDeskMover = top.visDeskMover;
        const visStatus = visDeskMover.visStatus;

        let lastLyrics = null;
        let lastSyncedLyricsParsed = null;
        let lastMusic = null;
        let autoScroll = true;
        let autoScrolling = false;

        processProperties(true);

        visDeskMover.addEventListener('mediaProperties', processProperties);

        visDeskMover.addEventListener('mediaTimeline', processTimeline);

        visDeskMover.addEventListener('load', function () {
            // MADVis has been reloaded; setup listeners again
            location.reload();
        }, null, 'iframe');

        lrcMenuItems[0].addEventListener('click', function () { // Load Lyrics button
            processProperties(true);
        });

        lrcMenuItems[1].addEventListener('click', function () { // Auto Scroll button
            if (!lastSyncedLyricsParsed) {
                return;
            }

            autoScroll = !autoScroll;
            if (autoScroll) {
                lrcMenuItems[1].classList.add('checkedItem');
            } else {
                lrcMenuItems[1].classList.remove('checkedItem');
            }
        });
        
        lrcMenuItems[2].addEventListener('click', function () { // Options button
            const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
            const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
            const options = {
                left, top, width: '400px', height: '502px',
                aot: true, unresizable: true, noIcon: true
            }
            const confDeskMover = madOpenWindow('apps/visualizer/lyrics/config.html', true, options);
            confDeskMover.addEventListener('load', () => {
                confDeskMover.windowElement.contentWindow.configChanged = configChanged;
            }, null, "window");
        });

        lyricsView.addEventListener('scroll', function () {
            if (!autoScrolling) {
                autoScroll = false;
                lrcMenuItems[1].classList.remove('checkedItem');
            } else {
                autoScrolling = false;
            }
        });

        // Load lyrics from the API
        async function findLyrics() {
            // Try to get best (synced) results by trying multiple URLs
            let urlsToTry = [];

            const url = new URL('https://lrclib.net/api/get');
            if (localStorage.madesktopVisSpotifyEnabled && localStorage.madesktopVisSpotifyInfo && visStatus.lastSpotifyMusic) {
                const { artist, title, albumTitle, duration } = visStatus.lastSpotifyMusic;
                const params = {
                    artist_name: artist,
                    track_name: title,
                    album_name: albumTitle,
                    duration: duration
                };
                url.search = new URLSearchParams(params).toString();
                urlsToTry.push(url.toString());

                if (duration) {
                    delete params.duration;
                    url.search = new URLSearchParams(params).toString();
                    urlsToTry.push(url.toString());
                }
            }
            if (visStatus.lastMusic) {
                const { artist, title, albumTitle } = visStatus.lastMusic;
                const params = {
                    artist_name: artist,
                    track_name: title,
                    album_name: albumTitle
                };
                url.search = new URLSearchParams(params).toString();
                urlsToTry.push(url.toString());
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
                return lastUnsyncedLyrics;
            } else {
                return null;
            }
        }

        async function fetchLyrics(url) {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Lrclib-Client': 'ModernActiveDesktop/' + top.madVersion.toString(1) + (madRunningMode === 1 ? ' (Wallpaper Engine)' : '') + ' (https://madesktop.ingan121.com/)'
                }
            });
            const json = await response.json();
            
            if (response.ok) {
                if (json.syncedLyrics) {
                    return {
                        synced: true,
                        syncedLyrics: json.syncedLyrics,
                        plainLyrics: json.plainLyrics
                    }
                } else if (json.plainLyrics) {
                    return {
                        synced: false,
                        plainLyrics: json.plainLyrics
                    }
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }

        async function loadLyrics(artist, title, albumTitle, duration) {
            const lyrics = await findLyrics(artist, title, albumTitle, duration);
            lastLyrics = lyrics;
            if (lyrics) {
                if (lyrics.synced && !localStorage.madesktopVisLyricsForceUnsynced) {
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
                    lrcMenuItems[1].classList.remove('disabled');
                    lrcMenuItems[1].classList.add('checkedItem');
                    processTimeline();
                } else {
                    lyricsView.textContent = lyrics.plainLyrics;
                    lastSyncedLyricsParsed = null;

                    autoScroll = false;
                    lrcMenuItems[1].classList.add('disabled');
                    lrcMenuItems[1].classList.remove('checkedItem');
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

        async function processProperties(force) {
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
                if (localStorage.madesktopVisSpotifyEnabled && localStorage.madesktopVisSpotifyInfo) {
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
                            loadLyrics();
                        }
                    }
                } else if (visStatus.lastMusic) {
                    loadLyrics();
                } else {
                    lyricsView.innerHTML = '<mad-string data-locid="VISLRC_STATUS_NO_MUSIC"></mad-string>';
                }
            }

            lastMusic = visStatus.lastMusic;
        }

        function processTimeline() {
            if (lastLyrics) {
                if (lastSyncedLyricsParsed) {
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

        function configChanged() {
            processProperties(true);
            lyricsView.style.font = localStorage.madesktopVisLyricsFont || '';
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
    if (response.ok) {
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