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

lrcMenuItems[3].addEventListener('click', function () { // Provieder info button
    madOpenExternal('https://lrclib.net/');
});

lrcMenuItems[4].addEventListener('click', function () { // Close button
    madCloseWindow();
});

top.addEventListener('load', init);

if (top.document.readyState === 'complete') {
    init();
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

        visDeskMover.addEventListener('mediaProperties', async function () {
            // Make sure the music has changed, as the event can be triggered multiple times
            // E.g. when the WPE media listeners got invalidated by closing an iframe and listners got re-registered
            if (visStatus.lastMusic &&
                (visStatus.lastMusic?.artist !== lastMusic?.artist ||
                visStatus.lastMusic?.title !== lastMusic?.title ||
                visStatus.lastMusic?.albumTitle !== lastMusic?.albumTitle ||
                visStatus.lastMusic?.albumArtist !== lastMusic?.albumArtist)
            ) {
                autoScroll = true;
                lrcMenuItems[1].classList.add('checkedItem');
                if (localStorage.madesktopVisSpotifyInfo) {
                    const spotifyNowPlaying = await getSpotifyNowPlaying();
                    if (spotifyNowPlaying && spotifyNowPlaying.item) {
                        if (spotifyNowPlaying.item.album.artists.length > 0) {
                            const artist = spotifyNowPlaying.item.artists[0].name;
                            const title = spotifyNowPlaying.item.name;
                            const albumTitle = spotifyNowPlaying.item.album.name;
                            const duration = spotifyNowPlaying.item.duration_ms / 1000;
                            loadLyrics(artist, title, albumTitle, duration);
                            visStatus.lastSpotifyMusic = {
                                artist: artist,
                                title: title,
                                albumTitle: albumTitle,
                                duration: duration
                            };
                        }
                    }
                } else {
                    loadLyrics();
                }
            }

            lastMusic = visStatus.lastMusic;
        });

        visDeskMover.addEventListener('mediaTimeline', processTimeline);

        visDeskMover.addEventListener('load', function () {
            // MADVis has been reloaded; setup listeners again
            location.reload();
        }, null, 'iframe');

        lrcMenuItems[0].addEventListener('click', function () { // Load Lyrics button
            if (localStorage.madesktopVisSpotifyInfo && visStatus.lastSpotifyMusic) {
                loadLyrics(visStatus.lastSpotifyMusic.artist, visStatus.lastSpotifyMusic.title, visStatus.lastSpotifyMusic.albumTitle, visStatus.lastSpotifyMusic.duration);
            } else {
                loadLyrics();
            }
        });

        lrcMenuItems[1].addEventListener('click', function () { // Auto Scroll button
            autoScroll = !autoScroll;
            if (autoScroll) {
                lrcMenuItems[1].classList.add('checkedItem');
            } else {
                lrcMenuItems[1].classList.remove('checkedItem');
            }
        });

        lyricsView.addEventListener('scroll', function () {
            if (!autoScrolling) {
                autoScroll = false;
                lrcMenuItems[1].classList.remove('checkedItem');
            } else {
                autoScrolling = false;
            }
        });

        async function findLyrics(artist, title, albumTitle, duration) {
            const url = new URL('https://lrclib.net/api/get');
            const params = {
                artist_name: artist || visStatus.lastMusic.artist,
                track_name: title || visStatus.lastMusic.title,
                album_name: albumTitle || visStatus.lastMusic.albumTitle
            }
            if (duration) {
                params.duration = duration || visStatus.timeline.duration;
            }
            url.search = new URLSearchParams(params).toString();

            const response = await fetch(url.toString(), {
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
                        lyrics: json.syncedLyrics
                    }
                } else if (json.plainLyrics) {
                    return {
                        synced: false,
                        lyrics: json.plainLyrics
                    }
                } else {
                    return null;
                }
            } else {
                if (duration) {
                    // Retry without duration
                    return findLyrics(artist, title, albumTitle);
                }
                return null;
            }
        }

        async function loadLyrics(artist, title, albumTitle, duration) {
            const lyrics = await findLyrics(artist, title, albumTitle, duration);
            lastLyrics = lyrics;
            if (lyrics) {
                if (lyrics.synced) {
                    lyricsView.innerHTML = '';
                    const lrc = parseLrc(lyrics.lyrics);
                    lrc.forEach((line, index) => {
                        const p = document.createElement('p');
                        p.textContent = line.text;
                        p.dataset.time = line.time;
                        lyricsView.appendChild(p);
                    });
                    lastSyncedLyricsParsed = lrc;
                    processTimeline();
                } else {
                    lyricsView.textContent = lyrics.lyrics;
                    lastSyncedLyricsParsed = null;
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

        function processTimeline() {
            if (lastLyrics) {
                if (lastLyrics.synced) {
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