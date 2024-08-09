// wmpvis.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const visBarCtx = visBar.getContext('2d');
const visTopCtx = visTop.getContext('2d');

let updateCnt = 0;
let triedRegistering = false;
let timeout;
let idle = false;

let visConfig = {
    barColor: localStorage.madesktopVisBarColor || '#a4eb0c',
    topColor: localStorage.madesktopVisTopColor || '#dfeaf7',
    useSchemeColors: localStorage.madesktopVisUseSchemeColors,
    followAlbumArt: localStorage.madesktopVisFollowAlbumArt,
    desktopVisOnlyAlbumArt: localStorage.madesktopVisOnlyAlbumArt,
    barWidth: parseInt(localStorage.madesktopVisBarWidth),
    channelSeparation: parseInt(localStorage.madesktopVisChannelSeparation) || 2, // 1 = no processing (pre-3.2 behavior), 2 = reverse right, 3 = combine
    decSpeed: parseFloat(localStorage.madesktopVisDecSpeed || 3),
    primaryScale: parseFloat(localStorage.madesktopVisPrimaryScale || 1.0),
    diffScale: parseFloat(localStorage.madesktopVisDiffScale || 0.07) // idk what to call this lol, pre-3.2 value was 0.15
};

updateSize();

let arraySize = visConfig.channelSeparation === 3 ? 64 : 128;

const lastAud = new Array(128).fill(0);
const lastBar = new Array(128).fill(0);
const lastTop = new Array(128).fill(visTop.height);
const topSpeed = new Array(128).fill(0);

function wallpaperAudioListener(audioArray) {
    updateCnt++;
    triedRegistering = false;
    clearTimeout(timeout);
    pausedAlert.style.display = 'none';
    extraAlert.style.display = 'none';

    if (window.noupdate || visConfig.desktopVisOnlyAlbumArt) {
        return;
    }

    // Optimization
    if (idle) {
        if (audioArray[Math.round(Math.random() * (arraySize - 1))] <= 0.0001) {
            return;
        }
        idle = false;
        log("Active", "log", "MADVis");
    }

    // Clear the canvas
    visBarCtx.clearRect(0, 0, visBar.width, visBar.height);

    // Render bars along the full width of the canvas
    const barWidth = Math.round(visConfig.barWidth * madScaleFactor) || Math.max(Math.round(1.0 / arraySize * visBar.width), Math.floor(6 * madScaleFactor));
    const gap = 1;

    visBarCtx.fillStyle = visConfig.barColor;
    visTopCtx.fillStyle = visConfig.topColor;
    if (visConfig.followAlbumArt && lastAlbumArt) {
        visBarCtx.fillStyle = lastAlbumArt.textColor;
        visTopCtx.fillStyle = lastAlbumArt.highContrastColor;
    } else if (visConfig.useSchemeColors) {
        visBarCtx.fillStyle = schemeBarColor;
        visTopCtx.fillStyle = schemeTopColor;
    }

    switch (visConfig.channelSeparation) {
        case 2:
            let tempArray = new Array(64).fill(0);
            for (let i = 64; i < 128; i++) {
                tempArray[i - 64] = audioArray[i];
            }
            for (let i = 0; i < 64; i++) {
                audioArray[127 - i] = tempArray[i];
            }
            break;
        case 3:
            for (let i = 0; i < 64; i++) {
                audioArray[i] = (audioArray[i] + audioArray[i + 64]) / 2;
            }
            break;
    }

    let leftMargin = 0;
    if (barWidth * arraySize < visBar.width) {
        leftMargin = Math.round((visBar.width - barWidth * arraySize) / 2);
    }
    let allZero = true;
    for (var i = 0; i < audioArray.length; ++i) {
        if (i === 64 && visConfig.channelSeparation === 3) {
            break;
        }
        // Create an audio bar with its hight depending on the audio volume level of the current frequency
        const height = Math.round(visBar.height * Math.min(audioArray[i], 1) * visConfig.primaryScale);
        if (height > lastBar[i]) {
            lastBar[i] = height;
            visBarCtx.fillRect(leftMargin + barWidth * i, visBar.height - height, barWidth - gap, height);
        } else {
            lastBar[i] -= visConfig.decSpeed;
            const diff = audioArray[i] - lastAud[i];
            if (diff > 0.1) {
                lastBar[i] += Math.round(visBar.height * diff * visConfig.diffScale);
                if (lastBar[i] > visBar.height) {
                    lastBar[i] = visBar.height;
                }
            }
            visBarCtx.fillRect(leftMargin + barWidth * i, visBar.height - lastBar[i], barWidth - gap, lastBar[i]);
        }
        const topPos = visTop.height - Math.round(lastBar[i]) - 1;
        if (topPos < lastTop[i]) {
            lastTop[i] = topPos;
            visTopCtx.fillRect(leftMargin + barWidth * i, topPos, barWidth - gap, 1);
            topSpeed[i] = 0;
            allZero = false;
        } else if (lastTop[i] < visTop.height - 1) {
            visTopCtx.clearRect(leftMargin + barWidth * i, 0, barWidth - gap, visTop.height);
            if (topSpeed[i] > 38) {
                lastTop[i] += 5 * Math.round(visConfig.decSpeed / 3);
            } else if (topSpeed[i] > 26) {
                lastTop[i] += 4 * Math.round(visConfig.decSpeed / 3);
                topSpeed[i] += 1;
            } else if (topSpeed[i] > 18) {
                lastTop[i] += 3 * Math.round(visConfig.decSpeed / 3);
                topSpeed[i] += 1;
            } else if (topSpeed[i] > 10) {
                lastTop[i] += 2 * Math.round(visConfig.decSpeed / 3);
                topSpeed[i] += 1;
            } else {
                topSpeed[i] += 1 + Math.round(visConfig.decSpeed / 3);
            }
            visTopCtx.fillRect(leftMargin + barWidth * i, lastTop[i], barWidth - gap, 1);
            allZero = false;
        }
        lastAud[i] = audioArray[i];
    }
    if (allZero) {
        idle = true;
        log("Idle", "log", "MADVis");
    }
}

function updateSize() {
    const clientRect = visBar.getBoundingClientRect();
    visBar.height = Math.round(clientRect.height * madScaleFactor);
    visBar.width = Math.round(clientRect.width * madScaleFactor);
    visTop.height = visBar.height;
    visTop.width = visBar.width;
    idle = false;
}

function updateVisConfig() {
    visConfig = {
        barColor: localStorage.madesktopVisBarColor || '#a4eb0c',
        topColor: localStorage.madesktopVisTopColor || '#dfeaf7',
        useSchemeColors: localStorage.madesktopVisUseSchemeColors,
        followAlbumArt: localStorage.madesktopVisFollowAlbumArt,
        desktopVisOnlyAlbumArt: localStorage.madesktopVisOnlyAlbumArt,
        barWidth: parseInt(localStorage.madesktopVisBarWidth),
        channelSeparation: parseInt(localStorage.madesktopVisChannelSeparation) || 2,
        decSpeed: parseFloat(localStorage.madesktopVisDecSpeed || 3),
        primaryScale: parseFloat(localStorage.madesktopVisPrimaryScale || 1.0),
        diffScale: parseFloat(localStorage.madesktopVisDiffScale || 0.07)
    };
    arraySize = visConfig.channelSeparation === 3 ? 64 : 128;
    visTopCtx.clearRect(0, 0, visTop.width, visTop.height);
    idle = false;
}

function setupListeners() {
    window.wallpaperRegisterAudioListener(wallpaperAudioListener);
    setupMediaListeners();
}

window.addEventListener('resize', updateSize);
window.addEventListener('load', updateSize);

// Listen for scale change
new MutationObserver(function (mutations) {
    updateSize();
}).observe(
    document.body,
    { attributes: true, attributeFilter: ["style"] }
);

if (madRunningMode === 1) {
    pausedAlert.addEventListener('click', () => {
        setupListeners();
        setTimeout(() => {
            extraAlert.style.display = 'block';
        }, 1000);
    });

    // Register the audio listener provided by Wallpaper Engine.
    setupListeners();

    // Any iframe load in MAD invalidates this somehow
    setInterval(() => {
        // But don't infinitely re-register, as this will cause winrtutil32.exe spawning and instantly dying repeatedly
        // And that will cause the wallpaper32/64.exe to freeze eventually
        // Only re-register if we've not had an update in the last 200ms
        if (updateCnt === 0 && !triedRegistering) {
            setupListeners();
            // Only try once, as having a maximized window, etc also causes the update to stop
            // It will begin updating again when such conditions are no longer met
            triedRegistering = true;
            timeout = setTimeout(() => {
                pausedAlert.style.display = 'block';
            }, 500);
        }
        updateCnt = 0;
    }, 200);
} else if (madRunningMode === 2) {
    top.livelyAudioListener = wallpaperAudioListener;
}

configChanged();