// config.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const showSpotifyBtn = document.getElementById("showSpotifyBtn");
const spotifyFieldset = document.getElementById("spotifyFieldset");
const enableSpotifyChkBox = document.getElementById("enableSpotifyChkBox");
const spotifyLoginBtn = document.getElementById("spotifyLoginBtn");
const spotifyAlbumArtArea = document.getElementById("spotifyAlbumArtArea");
const useSpotifyAlbumArtChkBox = document.getElementById("useSpotifyAlbumArtChkBox");
const albumArtHeightInput = document.getElementById("albumArtHeightInput");

const mainFieldsets = document.querySelectorAll("fieldset:not(#spotifyFieldset)");
const fontSelector = document.getElementById("fontSelector");
const fontSize = document.getElementById("fontSize");
const boldToggle = document.getElementById("boldToggle");
const italicToggle = document.getElementById("italicToggle");

const cacheFieldset = document.getElementById("cacheFieldset");
const enableCacheChkBox = document.getElementById("enableCacheChkBox");
const cacheCount = document.getElementById("cacheCount");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const maxCacheInput = document.getElementById("maxCacheInput");
const cacheExpiryInput = document.getElementById("cacheExpiryInput");

const forceUnsyncedChkBox = document.getElementById("forceUnsyncedChkBox");
const syncInfoText = document.getElementById("syncInfoText");
const smoothScrollChkBox = document.getElementById("smoothScrollChkBox");
const smoothScrollChkBoxLabel = document.querySelector("label[for=smoothScrollChkBox] mad-string");
const show1stRunBtn = document.getElementById("show1stRunBtn");
const showTipsBtn = document.getElementById("showTipsBtn");

const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

const textboxes = document.querySelectorAll("input[type=text], input[type=number]:not(#fontSize)");
const links = document.querySelectorAll('a');

const animationsDisabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

for (const link of links) {
    // Unset the alwaysOnTop flag when the user clicks on a link
    link.addEventListener('click', () => {
        delete madDeskMover.config.alwaysOnTop;
        madBringToTop();
    });
}

for (const textbox of textboxes) {
    textbox.addEventListener("click", async function () {
        if (madKbdSupport !== 1) {
            if (madSysPlug.inputStatus) {
                madSysPlug.focusInput();
            } else if (!await madSysPlug.beginInput()) {
                madPrompt(madGetString("UI_PROMPT_ENTER_VALUE"), function (res) {
                    if (res === null) return;
                    textbox.value = res;
                    textbox.dispatchEvent(new Event('change'));
                }, '', textbox.value, true);
            }
        }
    });
}

let spotifyShown = false;

let fonts = [
    "Pixelated MS Sans Serif",
    "Fixedsys Excelsior",
];
let fontShorthand = localStorage.madesktopVisLyricsFont || "11px var(--ui-font)";

FontDetective.each(font => {
    const option = document.createElement("option");
    option.textContent = font.name;
    option.value = font.name;
    fontSelector.appendChild(option);
    fonts.push(font.name);
});

if (madRunningMode !== 1) {
    syncInfoText.locId = "VISLRCCONF_SYNCED_UNAVAILABLE";
    forceUnsyncedChkBox.disabled = true;
    smoothScrollChkBox.disabled = true;
}
if (madRunningMode === 0) {
    cacheFieldset.style.display = "none";
    show1stRunBtn.style.display = "none";
    showTipsBtn.style.display = "none";
} else if (localStorage.madesktopDebugMode || localStorage.madesktopVisSpotifyEnabled || localStorage.madesktopVisSpotifyInfo) {
    showSpotifyBtn.style.display = "block";
}

// Only shown if this config is manually created with DevTools / debug menu js execution
if (localStorage.madesktopVisUseSpotifyAlbumArt) {
    spotifyAlbumArtArea.style.display = "block";
    useSpotifyAlbumArtChkBox.checked = true;
    albumArtHeightInput.value = parseInt(localStorage.madesktopVisUseSpotifyAlbumArt) || 640;
}

showSpotifyBtn.addEventListener("click", function () {
    if (spotifyShown) {
        spotifyFieldset.style.display = "none";
        for (const fieldset of mainFieldsets) {
            fieldset.style.display = "block";
        }
        showSpotifyBtn.textContent = "Spotify >>";
    } else {
        spotifyFieldset.style.display = "block";
        for (const fieldset of mainFieldsets) {
            fieldset.style.display = "none";
        }
        showSpotifyBtn.textContent = "Back <<";
    }
    spotifyShown = !spotifyShown;
    madResizeTo(null, document.documentElement.offsetHeight / madScaleFactor);
});

spotifyLoginBtn.addEventListener("click", async function () {
    if (!localStorage.madesktopVisSpotifyInfo) {
        if (!localStorage.sysplugIntegration) {
            await madAlert(madGetString("VISLRCCONF_SPOTIFY_SYSPLUG_REQUIRED"), null, "warning", { title: "locid:VISLRC_TITLE" });
            madOpenWindow('SysplugSetupGuide.md', true);
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
                        redirect_uri: result.redirectUri,
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
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_SUCCESS"), null, "info", { title: "locid:VISLRC_TITLE" });
                    spotifyLoginBtn.innerHTML = madGetString("VISLRCCONF_SPOTIFY_LOGOUT");
                } else if (json.error) {
                    if (json.error_description) {
                        madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL_TOKEN") + "<br>" + json.error_description, null, "error", { title: "locid:VISLRC_TITLE" });
                    } else {
                        madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL_TOKEN"), null, "error", { title: "locid:VISLRC_TITLE" });
                    }
                } else {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL_TOKEN"), null, "error", { title: "locid:VISLRC_TITLE" });
                }
            } else if (result.error) {
                if (result.error === "access_denied") {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_USER_CANCEL"), null, "info", { title: "locid:VISLRC_TITLE" });
                } else if (result.error === "Timeout") {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_TIMEOUT"), null, "error", { title: "locid:VISLRC_TITLE" });
                } else if (result.error === "System plugin has denied the connection") {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_SYSPLUG_DENIED"), null, "error", { title: "locid:VISLRC_TITLE" });
                } else {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL") + "<br>" + result.error, null, "error", { title: "locid:VISLRC_TITLE" });
                }
            } else {
                madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL"), null, "error", { title: "locid:VISLRC_TITLE" });
            }
        } catch (error) {
            if (error.name === "AbortError") {
                // New login attempt; ignore the previous one
            } else if (error.message === "Failed to fetch") {
                madAlert(madGetString("UI_MSG_NO_SYSPLUG"), null, "error");
            } else {
                madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL") + "<br>" + error.message, null, "error");
            }
        }
    } else {
        delete localStorage.madesktopVisSpotifyInfo;
        madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGOUT_SUCCESS"), null, "info", { title: "locid:VISLRC_TITLE" });
        spotifyLoginBtn.innerHTML = madGetString("VISLRCCONF_SPOTIFY_LOGIN");
    }
});

fontSelector.addEventListener("change", function () {
    if (fontSelector.value === "custom") {
        madPrompt(madGetString("MADCONF_PROMPT_CUSTOM_FONT"), function (res) {
            if (res === null) return;
            setFont(res);
        });
    } else {
        setFont();
    }
});

fontSize.addEventListener("click", function () {
    madPrompt(madGetString("MADCONF_PROMPT_FONT_SIZE"), function (res) {
        if (res === null) return;
        if (res === "") {
            res = "11px";
        }
        if (parseFloat(res).toString() === res) {
            res += "pt";
        }
        fontSize.dataset.fullValue = res;
        fontSize.value = parseFloat(res.split("/")[0]);
        setFont();
    }, '', fontSize.dataset.fullValue);
}, );

fontSize.addEventListener("change", function () {
    setFont();
});

boldToggle.addEventListener("click", function () {
    if (this.dataset.active) {
        delete this.dataset.active;
    } else {
        this.dataset.active = true;
    }
    setFont();
});

italicToggle.addEventListener("click", function () {
    if (this.dataset.active) {
        delete this.dataset.active;
    } else {
        this.dataset.active = true;
    }
    setFont();
});

function setFont(customFamily) {
    fontShorthand = '';
    if (boldToggle.dataset.active) {
        fontShorthand += 'bold ';
    }
    if (italicToggle.dataset.active) {
        fontShorthand += 'italic ';
    }
    fontShorthand += fontSize.dataset.fullValue + ' ';
    if (customFamily) {
        fontShorthand += customFamily;
    } else if (fontSelector.value.includes(" ")) {
        fontShorthand += `"${fontSelector.value}", var(--ui-font)`;
    } else if (fontSelector.value === "uifont") {
        fontShorthand += 'var(--ui-font)';
    } else {
        fontShorthand += fontSelector.value + ', var(--ui-font)';
    }
}

function getFontInfo() {
    const fontInfo = {};
    const split = fontShorthand.trim().split(" ");
    fontInfo.bold = split.indexOf("bold") !== -1;
    fontInfo.italic = split.indexOf("italic") !== -1;
    if (fontInfo.bold && fontInfo.italic) {
        fontInfo.size = split[2];
        fontInfo.family = split.slice(3).join(" ");
    } else if (fontInfo.bold || fontInfo.italic) {
        fontInfo.size = split[1];
        fontInfo.family = split.slice(2).join(" ");
    } else {
        fontInfo.size = split[0];
        fontInfo.family = split.slice(1).join(" ");
    }
    // Don't check for the existence here as FD load is quite slow
    fontInfo.primaryFamily = fontInfo.family.split(",")[0].trim();
    if (fontInfo.primaryFamily.startsWith('"') || fontInfo.primaryFamily.startsWith("'")) {
        fontInfo.primaryFamily = fontInfo.primaryFamily.slice(1, -1);
    }
    return fontInfo;
}

clearCacheBtn.addEventListener("click", async function () {
    if (await madConfirm(madGetString("VISLRCCONF_CACHE_CLEAR_CONFIRM"), null, {
        icon: "warning",
        title: "locid:VISLRC_TITLE"
    })) {
        await lrcCache.clear();
        cacheCount.textContent = 0;
        madAlert(madGetString("VISLRCCONF_CACHE_CLEAR_SUCCESS"), null, "info", { title: "locid:VISLRC_TITLE" });
    }
});

forceUnsyncedChkBox.addEventListener("click", function () {
    if (this.checked) {
        smoothScrollChkBox.disabled = true;
        smoothScrollChkBox.checked = false;
    } else if (!animationsDisabled) {
        smoothScrollChkBox.disabled = false;
    }
});

show1stRunBtn.addEventListener("click", function () {
    window.firstRun();
    madCloseWindow();
});

showTipsBtn.addEventListener("click", function () {
    madAlert(madGetString("VISLRCCONF_TIPS"), null, "info", { title: "locid:VISLRC_TITLE" });
});

window.apply = function () {
    if (enableSpotifyChkBox.checked) {
        localStorage.madesktopVisSpotifyEnabled = true;
    } else {
        delete localStorage.madesktopVisSpotifyEnabled;
    }
    if (useSpotifyAlbumArtChkBox.checked) {
        localStorage.madesktopVisUseSpotifyAlbumArt = albumArtHeightInput.value || 640;
    } else {
        delete localStorage.madesktopVisUseSpotifyAlbumArt;
    }
    localStorage.madesktopVisLyricsFont = fontShorthand;
    if (enableCacheChkBox.checked) {
        delete localStorage.madesktopVisLyricsNoCache;
    } else {
        localStorage.madesktopVisLyricsNoCache = true;
    }
    localStorage.madesktopVisLyricsCacheMax = maxCacheInput.value || 500;
    localStorage.madesktopVisLyricsCacheExpiry = cacheExpiryInput.value || 21;
    if (forceUnsyncedChkBox.checked) {
        localStorage.madesktopVisLyricsForceUnsynced = true;
    } else {
        delete localStorage.madesktopVisLyricsForceUnsynced;
    }
    if (smoothScrollChkBox.checked) {
        localStorage.madesktopVisLyricsSmoothScroll = true;
    } else {
        delete localStorage.madesktopVisLyricsSmoothScroll;
    }

    window.configChanged();
}

okBtn.addEventListener("click", () => {
    window.apply();
    madCloseWindow();
});

cancelBtn.addEventListener("click", () => {
    madCloseWindow();
});

applyBtn.addEventListener("click", () => {
    window.apply();
});

if (localStorage.madesktopVisSpotifyEnabled) {
    enableSpotifyChkBox.checked = true;
}
if (localStorage.madesktopVisSpotifyInfo) {
    spotifyLoginBtn.innerHTML = madGetString("VISLRCCONF_SPOTIFY_LOGOUT");
}

const fontInfo = getFontInfo();
fontSize.dataset.fullValue = fontInfo.size;
fontSize.value = parseInt(fontInfo.size);
if (fontInfo.primaryFamily === "var(--ui-font)") {
    fontSelector.value = "uifont";
} else {
    fontSelector.value = fontInfo.primaryFamily;
    fontSelector.label.textContent = fontInfo.primaryFamily;
}
if (fontInfo.bold) {
    boldToggle.dataset.active = true;
}
if (fontInfo.italic) {
    italicToggle.dataset.active = true;
}

if (localStorage.madesktopVisLyricsNoCache) {
    enableCacheChkBox.checked = false;
}
window.lrcCache?.count().then(count => {
    cacheCount.textContent = count;
});
if (localStorage.madesktopVisLyricsCacheMax) {
    maxCacheInput.value = localStorage.madesktopVisLyricsCacheMax;
}
if (localStorage.madesktopVisLyricsCacheExpiry) {
    cacheExpiryInput.value = localStorage.madesktopVisLyricsCacheExpiry;
}

if (localStorage.madesktopVisLyricsForceUnsynced) {
    forceUnsyncedChkBox.checked = true;
}

// scrollIntoView({ behavior: 'smooth' }) doesn't work if system animation is disabled (e.g. RDP by default)
if (animationsDisabled) {
    smoothScrollChkBox.disabled = true;
    smoothScrollChkBoxLabel.locId = "VISLRCCONF_SMOOTH_SCROLL_DISABLED";
} else if (localStorage.madesktopVisLyricsForceUnsynced) {
    smoothScrollChkBox.disabled = true;
} else if (localStorage.madesktopVisLyricsSmoothScroll) {
    smoothScrollChkBox.checked = true;
}

window.addEventListener('load', () => {
    madResizeTo(null, document.documentElement.offsetHeight);
});

new MutationObserver(function (mutations) {
    madResizeTo(null, document.documentElement.offsetHeight / madScaleFactor);
}).observe(
    document.body,
    { attributes: true, attributeFilter: ["style"] }
);

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});