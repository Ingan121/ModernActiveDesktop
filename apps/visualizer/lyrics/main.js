// main.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const lyricsView = document.getElementById('lyricsView');

top.addEventListener('load', init);

if (top.document.readyState === 'complete') {
    init();
}

function init() {
    if (top.visDeskMover) {
        const visDeskMover = top.visDeskMover;
        const visStatus = visDeskMover.visStatus;

        let lastLyrics = null;
        let lastSyncedLyricsParsed = null;
        let lastMusic = null;

        visDeskMover.addEventListener('mediaProperties', async function () {
            if (visStatus.lastMusic &&
                (visStatus.lastMusic?.artist !== lastMusic?.artist ||
                visStatus.lastMusic?.title !== lastMusic?.title ||
                visStatus.lastMusic?.albumTitle !== lastMusic?.albumTitle ||
                visStatus.lastMusic?.albumArtist !== lastMusic?.albumArtist)
            ) {
                loadLyrics();
            }

            if (localStorage.madesktopVisSpotifyInfo) {
                const spotifyNowPlaying = await getSpotifyNowPlaying();
                console.log(spotifyNowPlaying);
                if (spotifyNowPlaying && spotifyNowPlaying.item) {
                    if (spotifyNowPlaying.item.album.artists.length > 0) {
                        const artist = spotifyNowPlaying.item.album.artists[0].name;
                        const title = spotifyNowPlaying.item.name;
                        const albumTitle = spotifyNowPlaying.item.album.name;
                        const duration = spotifyNowPlaying.item.duration_ms / 1000;
                        if (visStatus.lastMusic &&
                            (artist !== visStatus.lastMusic.artist ||
                            title !== visStatus.lastMusic.title ||
                            albumTitle !== visStatus.lastMusic.albumTitle)
                        ) {
                            loadLyrics(artist, title, albumTitle, duration);
                        }
                    }
                }
            }

            lastMusic = visStatus.lastMusic;
        });

        visDeskMover.addEventListener('mediaTimeline', processTimeline);

        async function findLyrics(artist, title, albumTitle, duration) {
            const url = new URL('https://lrclib.net/api/get');
            const params = {
                artist_name: artist || visStatus.lastMusic.artist,
                track_name: title || visStatus.lastMusic.title,
                album_name: albumTitle || visStatus.lastMusic.albumTitle
            }
            if (duration) {
                // Don't use visStatus.lastMusic.duration because it can be inaccurate and cause lyric fetching to fail
                params.duration = duration;
            }
            url.search = new URLSearchParams(params).toString();

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Lrclib-Client': 'ModernActiveDesktop/' + top.madVersion.toString(1) + (madRunningMode === 1 ? ' (Wallpaper Engine)' : '') + ' (https://madesktop.ingan121.com/)'
                }
            });
            const json = await response.json();
            console.log(json);
            
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
                lyricsView.textContent = 'No lyrics found.';
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
                                lyric.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center'
                                });
                            } else {
                                lyric.style.color = 'var(--gray-text)';
                            }
                        }
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
        
        document.getElementById('findLyricsBtn').addEventListener('click', function () {
            loadLyrics();
        });
    } else {
        lyricsView.textContent = 'No running instance of ModernActiveDesktop Visualizer found. Open the Visualizer first then reload this window.';
    }
}

document.getElementById('spotifyLoginBtn').addEventListener('click', async function () {
    if (!localStorage.sysplugIntegration) {
        madAlert("System plugin is required to sign in to Spotify.<br><br>Note that you don't need it anymore once you finish signing in.", null, "warning");
        return;
    }
    try {
        const result = await madSysPlug.spotifyLogin();
        if (result.code && result.verifier && result.clientId) {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: result.code,
                    redirect_uri: 'http://localhost:3031/spotify/callback',
                    code_verifier: result.verifier,
                    client_id: result.clientId
                })
            });
            const json = await response.json();
            if (response.ok) {
                localStorage.madesktopVisSpotifyInfo = JSON.stringify({
                    accessToken: json.access_token,
                    expiresIn: json.expires_in,
                    fetchedAt: Date.now() / 1000,
                    refreshToken: json.refresh_token,
                    clientId: result.clientId
                });
                madAlert("Spotify login successful!", null, "info");
            } else if (json.error) {
                madAlert("Spotify login failed! (Failed to fetch access token)<br>" + json.error_description, null, "error");
            } else {
                madAlert("Spotify login failed! (Failed to fetch access token)<br>Unknown error", null, "error");
            }
        } else if (result.error) {
            madAlert("Spotify login failed!<br>" + result.error, null, "error");
        } else {
            madAlert("Spotify login failed!<br>Unknown error", null, "error");
        }
    } catch (error) {
        if (error.message === "Failed to fetch") {
            madAlert(madGetString("UI_MSG_NO_SYSPLUG"), null, "error");
        } else {
            madAlert("Spotify login failed!<br>" + error.message, null, "error");
        }
    }
});

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