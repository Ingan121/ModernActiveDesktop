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

        visDeskMover.addEventListener('mediaProperties', function () {
            //console.log('mediaProperties', visStatus.lastMusic);
            if (visStatus.lastMusic?.artist !== lastMusic?.artist ||
                visStatus.lastMusic?.title !== lastMusic?.title ||
                visStatus.lastMusic?.albumTitle !== lastMusic?.albumTitle ||
                visStatus.lastMusic?.albumArtist !== lastMusic?.albumArtist
            ) {
                loadLyrics();
            }
            lastMusic = visStatus.lastMusic;
        });

        visDeskMover.addEventListener('mediaTimeline', function () {
            if (lastLyrics) {
                if (lastLyrics.synced) {
                    const nearestIndex = getNearestLyricIndex(visStatus.timeline.position);
                    if (nearestIndex !== -1) {
                        lyricsView.dataset.currentIndex = nearestIndex;
                        const nearestLyric = lyricsView.children[nearestIndex];
                        if (nearestLyric) {
                            nearestLyric.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                            });
                        }
                    }
                }
            }
        });

        async function findLyrics() {
            const url = 'https://lrclib.net/api/get' +
                '?artist_name=' + encodeURIComponent(visStatus.lastMusic.artist) +
                '&track_name=' + encodeURIComponent(visStatus.lastMusic.title) +
                '&album_name=' + encodeURIComponent(visStatus.lastMusic.albumTitle) +
                '&duration=' + visStatus.timeline.duration;

            const response = await fetch(url, {
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
                return null;
            }
        }

        async function loadLyrics() {
            const lyrics = await findLyrics();
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

        function getNearestLyricIndex(time) {
            if (lastSyncedLyricsParsed) {
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
        
        document.getElementById('findLyricsBtn').addEventListener('click', loadLyrics);
    } else {
        lyricsView.textContent = 'No running instance of ModernActiveDesktop Visualizer found. Open the Visualizer first then reload this window.';
    }
}