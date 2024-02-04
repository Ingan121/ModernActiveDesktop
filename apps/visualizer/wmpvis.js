// wmpvis.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License

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
    desktopVisOnlyAlbumArt: localStorage.madesktopVisOnlyAlbumArt
};

updateSize();

const lastAud = new Array(128).fill(0);
const lastBar = new Array(128).fill(0);
const lastTop = new Array(128).fill(visTop.height);
const topSpeed = new Array(128).fill(0);

function wallpaperAudioListener(audioArray) {
    updateCnt++;
    triedRegistering = false;
    clearTimeout(timeout);
    pausedAlert.style.display = 'none';

    if (window.noupdate || visConfig.desktopVisOnlyAlbumArt) {
        return;
    }

    // Optimization
    if (idle) {
        if (audioArray[Math.round(Math.random() * 120)] <= 0.0001) {
            return;
        }
        idle = false;
        top.log("Active", "log", "MADVis");
    }

    // Clear the canvas
    visBarCtx.clearRect(0, 0, visBar.width, visBar.height);

    // Render bars along the full width of the canvas
    const barWidth = Math.max(Math.round(1.0 / 128.0 * visBar.width), Math.floor(6 * madScaleFactor));
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

    let allZero = true;
    for (var i = 0; i < audioArray.length; ++i) {
        // Create an audio bar with its hight depending on the audio volume level of the current frequency
        const height = Math.round(visBar.height * Math.min(audioArray[i], 1));
        if (height > lastBar[i]) {
            lastBar[i] = height;
            visBarCtx.fillRect(barWidth * i, visBar.height - height, barWidth - gap, height);
        } else {
            lastBar[i] -= 3;
            const diff = audioArray[i] - lastAud[i];
            if (diff > 0.1) {
                lastBar[i] += Math.round(visBar.height * diff * 0.07);
                if (lastBar[i] > visBar.height) {
                    lastBar[i] = visBar.height;
                }
            }
            visBarCtx.fillRect(barWidth * i, visBar.height - lastBar[i], barWidth - gap, lastBar[i]);
        }
        const topPos = visTop.height - Math.round(lastBar[i]) - 1;
        if (topPos < lastTop[i]) {
            lastTop[i] = topPos;
            visTopCtx.fillRect(barWidth * i, topPos, barWidth - gap, 1);
            topSpeed[i] = 0;
            allZero = false;
        } else if (lastTop[i] < visTop.height - 1) {
            visTopCtx.clearRect(barWidth * i, 0, barWidth - gap, visTop.height);
            if (topSpeed[i] > 38) {
                lastTop[i] += 5;
            } else if (topSpeed[i] > 26) {
                lastTop[i] += 4;
                topSpeed[i] += 1;
            } else if (topSpeed[i] > 18) {
                lastTop[i] += 3;
                topSpeed[i] += 1;
            } else if (topSpeed[i] > 10) {
                lastTop[i] += 2;
                topSpeed[i] += 1;
            } else {
                topSpeed[i] += 1;
            }
            visTopCtx.fillRect(barWidth * i, lastTop[i], barWidth - gap, 1);
            allZero = false;
        }
        lastAud[i] = audioArray[i];
    }
    if (allZero) {
        idle = true;
        top.log("Idle", "log", "MADVis");
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
        desktopVisOnlyAlbumArt: localStorage.madesktopVisOnlyAlbumArt
    };
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

pausedAlert.addEventListener('click', () => {
    window.wallpaperRegisterAudioListener(wallpaperAudioListener);
    setupMediaListeners();
});

// Register the audio listener provided by Wallpaper Engine.
window.wallpaperRegisterAudioListener(wallpaperAudioListener);
setupMediaListeners();

// Any iframe load in MAD invalidates this somehow
setInterval(() => {
    // But don't infinitely re-register, as this will cause winrtutil32.exe spawning and instantly dying repeatedly
    // And that will cause the wallpaper32/64.exe to freeze eventually
    // Only re-register if we've not had an update in the last 200ms
    if (updateCnt === 0 && !triedRegistering) {
        window.wallpaperRegisterAudioListener(wallpaperAudioListener);
        setupMediaListeners();
        // Only try once, as having a maximized window, etc also causes the update to stop
        // It will begin updating again when such conditions are no longer met
        triedRegistering = true;
        timeout = setTimeout(() => {
            pausedAlert.style.display = 'block';
        }, 500);
    }
    updateCnt = 0;
}, 200);

configChanged();