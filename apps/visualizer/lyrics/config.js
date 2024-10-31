// config.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const textboxes = document.querySelectorAll("input[type='text'], input[type='number']");

const enableSpotifyChkBox = document.getElementById("enableSpotifyChkBox");
const spotifyLoginBtn = document.getElementById("spotifyLoginBtn");

const fontSelector = document.getElementById("fontSelector");
const fontSize = document.getElementById("fontSize");
const boldToggle = document.getElementById("boldToggle");
const italicToggle = document.getElementById("italicToggle");

const forceUnsyncedChkBox = document.getElementById("forceUnsyncedChkBox");

const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

let fonts = [
    "Pixelated MS Sans Serif",
    "Fixedsys Excelsior",
];
let fontShorthand = localStorage.madesktopVisLyricsFont || "11px " + getComputedStyle(document.documentElement).getPropertyValue("--ui-font");

FontDetective.each(font => {
    const option = document.createElement("option");
    option.textContent = font.name;
    option.value = font.name;
    fontSelector.appendChild(option);
    fonts.push(font.name);
});

for (const textbox of textboxes) {
    textbox.addEventListener("click", async function () {
        if (madKbdSupport !== 1) {
            if (madSysPlug.inputStatus) {
                madSysPlug.focusInput();
            } else if (!await madSysPlug.beginInput()) {
                const msg = textbox.placeholder ? "UI_PROMPT_ENTER_VALUE_RESETTABLE" : "UI_PROMPT_ENTER_VALUE";
                const res = await madPrompt(madGetString(msg), null, textbox.placeholder, textbox.value, true);
                if (res === null) return;
                if (res === '') {
                    textbox.value = textbox.placeholder;
                } else {
                    textbox.value = res;
                }
                textbox.dispatchEvent(new Event('change'));
            }
        }
    });
}

spotifyLoginBtn.addEventListener("click", async function () {
    if (!localStorage.madesktopVisSpotifyInfo) {
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
                    spotifyLoginBtn.innerHTML = madGetString("VISLRCCONF_SPOTIFY_LOGOUT");
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
    } else {
        delete localStorage.madesktopVisSpotifyInfo;
        madAlert("Signed out from Spotify!", null, "info");
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
    let i = 0;
    while (fonts.indexOf(fontInfo.primaryFamily) === -1 && i < fontInfo.family.split(",").length) {
        fontInfo.primaryFamily = fontInfo.family.split(",")[i++].trim();
        if (fontInfo.primaryFamily.startsWith('"') || fontInfo.primaryFamily.startsWith("'")) {
            fontInfo.primaryFamily = fontInfo.primaryFamily.slice(1, -1);
        }
    }
    if (!fontInfo.primaryFamily) {
        fontInfo.primaryFamily = "Unknown Font";
    }
    return fontInfo;
}

window.apply = function () {
    if (enableSpotifyChkBox.checked) {
        localStorage.madesktopVisSpotifyEnabled = true;
    } else {
        delete localStorage.madesktopVisSpotifyEnabled;
    }
    localStorage.madesktopVisLyricsFont = fontShorthand;
    if (forceUnsyncedChkBox.checked) {
        localStorage.madesktopVisForceUnsynced = true;
    } else {
        delete localStorage.madesktopVisForceUnsynced;
    }

    window.targetDeskMover.windowElement.contentWindow.configChanged();
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
fontSelector.value = fontInfo.primaryFamily;
fontSelector.label.textContent = fontInfo.primaryFamily;
if (fontInfo.bold) {
    boldToggle.dataset.active = true;
}
if (fontInfo.italic) {
    italicToggle.dataset.active = true;
}

if (localStorage.madesktopVisForceUnsynced) {
    forceUnsyncedChkBox.checked = true;
}

window.addEventListener('load', () => {
    madResizeTo(null, document.documentElement.offsetHeight);
    if (document.documentElement.offsetHeight > top.vHeight) {
        document.body.dataset.smallScreen = true;
        madResizeTo(null, document.documentElement.offsetHeight);
    }
});

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});