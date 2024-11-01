// config.js for ModernActiveDesktop Visualizer Lyrics
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
let fontShorthand = localStorage.madesktopVisLyricsFont || "11px var(--ui-font)";

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
            madAlert(madGetString("VISLRCCONF_SPOTIFY_SYSPLUG_REQUIRED"), null, "warning");
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
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_SUCCESS"), null, "info");
                    spotifyLoginBtn.innerHTML = madGetString("VISLRCCONF_SPOTIFY_LOGOUT");
                } else if (json.error) {
                    if (json.error_description) {
                        madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL_TOKEN") + "<br>" + json.error_description, null, "error");
                    } else {
                        madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL_TOKEN"), null, "error");
                    }
                } else {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL_TOKEN"), null, "error");
                }
            } else if (result.error) {
                if (result.error === "access_denied") {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_USER_CANCEL"), null, "info");
                } else if (result.error === "Timeout") {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_TIMEOUT"), null, "error");
                } else if (result.error === "System plugin has denied the connection") {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_SYSPLUG_DENIED"), null, "error");
                } else {
                    madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL") + "<br>" + result.error, null, "error");
                }
            } else {
                madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL"), null, "error");
            }
        } catch (error) {
            if (error.message === "Failed to fetch") {
                madAlert(madGetString("UI_MSG_NO_SYSPLUG"), null, "error");
            } else {
                madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGIN_FAIL") + "<br>" + error.message, null, "error");
            }
        }
    } else {
        delete localStorage.madesktopVisSpotifyInfo;
        madAlert(madGetString("VISLRCCONF_SPOTIFY_LOGOUT_SUCCESS"), null, "info");
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

window.apply = function () {
    if (enableSpotifyChkBox.checked) {
        localStorage.madesktopVisSpotifyEnabled = true;
    } else {
        delete localStorage.madesktopVisSpotifyEnabled;
    }
    localStorage.madesktopVisLyricsFont = fontShorthand;
    if (forceUnsyncedChkBox.checked) {
        localStorage.madesktopVisLyricsForceUnsynced = true;
    } else {
        delete localStorage.madesktopVisLyricsForceUnsynced;
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

if (localStorage.madesktopVisLyricsForceUnsynced) {
    forceUnsyncedChkBox.checked = true;
}

window.addEventListener('load', () => {
    if (madScaleFactor !== 1) {
        madResizeTo(null, document.documentElement.offsetHeight + 40);
    } else {
        madResizeTo(null, document.documentElement.offsetHeight);
    }
});

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});