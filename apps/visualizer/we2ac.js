// we2ac.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License

// Shim Wallpaper Engine visualization data to AudioContext / AnalyserNode

'use strict';

let updateCnt = 0;
let triedRegistering = false;
let lastAudWE = new Array(128).fill(1);
let we2acFftSize = 2048;

window.audioCtx = {
    createAnalyser: function() {
        return {
            getByteFrequencyData: function(array) {
                const repeat = we2acFftSize / lastAudWE.length / 2;
                for (let i = 0; i < we2acFftSize / 2; ++i) {
                    const idx = Math.floor(i / repeat);
                    array[i] = lastAudWE[idx] * 255;
                }
            },
            get fftSize() {
                return we2acFftSize;
            },
            set fftSize(val) {
                we2acFftSize = val;
            },
            getByteTimeDomainData: function(array) {
                // This is far from working and inaccurate af
                // So don't use this for a waveform visualizer
                // Hope Wallpaper Engine adds proper APIs for this
                const freqArray = new Float32Array(we2acFftSize * 2);
                const repeat = we2acFftSize / lastAudWE.length * 2;
                for (let i = 0; i < we2acFftSize * 2; ++i) {
                    const idx = Math.floor(i / repeat);
                    if (i % 2 === 0) {
                        freqArray[i] = lastAudWE[idx] * 255 * 0.296 - 97;
                    } else {
                        freqArray[i] = 0;
                    }
                }
                const fft = new FFTJS(we2acFftSize);
                const timeArray = fft.createComplexArray();
                fft.inverseTransform(timeArray, freqArray);
                for (let i = 0, j = 0; i < timeArray.length; i += 2) {
                    array[j++] = Math.sqrt(timeArray[i] * timeArray[i] + timeArray[i + 1] * timeArray[i + 1]) / 0.0078125 + 128;
                }
                window.asdf=array;
            },
            get frequencyBinCount() {
                return we2acFftSize / 2;
            }
        };
    }
};

function wallpaperAudioListener(audioArray) {
    lastAudWE = audioArray;
    updateCnt++;
    if (!window.noupdate && window.weAudCallback) {
        window.weAudCallback();
    }
}

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