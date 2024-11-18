// spotify.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

(function () {
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

    window.getSpotifyNowPlaying = getSpotifyNowPlaying;
})();