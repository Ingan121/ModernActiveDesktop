const mainCanvas = document.getElementById('bar');
const topCanvas = document.getElementById('top');
const mainCanvasCtx = mainCanvas.getContext('2d');
const topCanvasCtx = topCanvas.getContext('2d');

mainCanvas.height = window.innerHeight;
mainCanvas.width = window.innerWidth;
topCanvas.height = window.innerHeight;
topCanvas.width = window.innerWidth;

const lastAud = new Array(128).fill(1);
const lastBar = new Array(128).fill(0);
const lastTop = new Array(128).fill(topCanvas.height);
const topSpeed = new Array(128).fill(0);

let updateCnt = 0;
let triedRegistering = false;

function wallpaperAudioListener(audioArray) {
    updateCnt++;
    triedRegistering = false;

    if (window.noupdate) return;

    // Clear the canvas
    mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Render bars along the full width of the canvas
    const barWidth = Math.max(Math.round(1.0 / 128.0 * mainCanvas.width), 6);
    const gap = 1;

    mainCanvasCtx.fillStyle = localStorage.madesktopVisBarColor || '#a4eb0c';
    topCanvasCtx.fillStyle = localStorage.madesktopVisTopColor || '#dfeaf7';
    if (localStorage.madesktopVisFollowAlbumArt && parent.lastAlbumArt) {
        mainCanvasCtx.fillStyle = parent.lastAlbumArt.textColor;
        topCanvasCtx.fillStyle = parent.lastAlbumArt.highContrastColor;
    } else if (localStorage.madesktopVisUseSchemeColors) {
        mainCanvasCtx.fillStyle = parent.schemeBarColor;
        topCanvasCtx.fillStyle = parent.schemeTopColor;
    }
    // Iterate over the first 64 array elements (0 - 63) for the left channel audio data
    for (var i = 0; i < audioArray.length; ++i) {
        // Create an audio bar with its hight depending on the audio volume level of the current frequency
        const height = mainCanvas.height * Math.min(audioArray[i], 1);
        if (height > lastBar[i]) {
            lastBar[i] = height;
            mainCanvasCtx.fillRect(barWidth * i, mainCanvas.height - height, barWidth - gap, height);
        } else {
            lastBar[i] -= 3;
            const diff = audioArray[i] - lastAud[i];
            if (diff > 0.1) {
                lastBar[i] += mainCanvas.height * diff * 0.15;
                if (lastBar[i] > mainCanvas.height) {
                    lastBar[i] = mainCanvas.height;
                }
            }
            mainCanvasCtx.fillRect(barWidth * i, mainCanvas.height - lastBar[i], barWidth - gap, lastBar[i]);
        }
        const topPos = topCanvas.height - Math.round(lastBar[i]) - 1;
        if (topPos < lastTop[i]) {
            lastTop[i] = topPos;
            topCanvasCtx.fillRect(barWidth * i, topPos, barWidth - gap, 1);
            topSpeed[i] = 0;
        } else if (lastTop[i] < topCanvas.height - 1) {
            topCanvasCtx.clearRect(barWidth * i, 0, barWidth - gap, topCanvas.height);
            if (topSpeed[i] > 20) {
                lastTop[i] += 4;
            } else if (topSpeed[i] > 10) {
                lastTop[i] += 2;
                topSpeed[i] += 1;
            } else {
                topSpeed[i] += 1;
            }
            topCanvasCtx.fillRect(barWidth * i, lastTop[i], barWidth - gap, 1);
        }
        lastAud[i] = audioArray[i];
    }
}

window.addEventListener('resize', () => {
    mainCanvas.height = window.innerHeight;
    mainCanvas.width = window.innerWidth;
    topCanvas.height = window.innerHeight;
    topCanvas.width = window.innerWidth;
});

// Register the audio listener provided by Wallpaper Engine.
window.wallpaperRegisterAudioListener(wallpaperAudioListener);

// Any iframe load in MAD invalidates this somehow
setInterval(() => {
    // But don't infinitely re-register, as this will cause winrtutil32.exe spawning and instantly dying repeatedly
    // And that will cause the wallpaper32/64.exe to freeze eventually
    // Only re-register if we've not had an update in the last 200ms
    if (updateCnt === 0 && !triedRegistering) {
        window.wallpaperRegisterAudioListener(wallpaperAudioListener);
        parent.setupListeners();
        // Only try once, as having a maximized window, etc also causes the update to stop
        // It will begin updating again when such conditions are no longer met
        triedRegistering = true;
    }
    updateCnt = 0;
}, 200);