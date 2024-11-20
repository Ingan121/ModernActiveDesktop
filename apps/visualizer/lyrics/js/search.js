// search.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const urlParsed = new URLSearchParams(window.location.search);
const artist = urlParsed.get('artist');
const title = urlParsed.get('title');
const albumTitle = urlParsed.get('albumTitle');
const query = (artist + ' ' + title + ' ' + albumTitle).trim();
const currentId = parseInt(urlParsed.get('current'));

const normalSearchSection = document.querySelector('.normalSearch');
const advancedSections = document.querySelectorAll('.advancedSearch');
const advancedSearchLabels = document.querySelectorAll('.advancedSearch label');

const artistBar = document.getElementById('artistBar');
const titleBar = document.getElementById('titleBar');
const albumBar = document.getElementById('albumBar');
const searchBar = document.getElementById('searchBar');
const searchBtn = document.getElementById('searchBtn');
const searchBtnAdvanced = document.getElementById('searchBtnAdvanced');
const searchResults = document.getElementById('searchResults');
const addOverrideChkBox = document.getElementById('addOverrideChkBox');

const okBtn = document.getElementById('okBtn');
const cancelBtn = document.getElementById('cancelBtn');
const applyBtn = document.getElementById('applyBtn');
const advancedBtn = document.getElementById('advancedBtn');
const advancedBtnLabel = advancedBtn.querySelector('mad-string');

const textboxes = document.querySelectorAll("input[type=text], input[type=number]:not(#fontSize)");

const headers = {
    'Lrclib-Client': 'ModernActiveDesktop/' + window.madVersion.toString(1)
};
switch (madRunningMode) {
    case 1:
        headers['Lrclib-Client'] += ' (Wallpaper Engine)';
        break;
    case 2:
        headers['Lrclib-Client'] += ' (Lively Wallpaper)';
        break;
}
headers['Lrclib-Client'] += ' (https://madesktop.ingan121.com/)';

let advancedMode = false;

artistBar.value = artist;
titleBar.value = title;
albumBar.value = albumTitle;
searchBar.value = query;

searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        search();
    }
});

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

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        if (advancedMode) {
            advancedSearch();
        } else {
            search();
        }
    }
});
document.addEventListener('keyup', function (e) {
    if (e.key === 'Escape') {
        madCloseWindow();
    }
});

searchBtn.addEventListener('click', search);
searchBtnAdvanced.addEventListener('click', advancedSearch);

advancedBtn.addEventListener('click', () => {
    advancedMode = !advancedMode;
    advancedBtnLabel.locId = advancedMode ? 'VISLRCFIND_ADVANCED_COLLAPSE' : 'VISLRCFIND_ADVANCED_EXPAND';
    if (advancedMode) {
        normalSearchSection.style.display = 'none';
        for (const section of advancedSections) {
            section.style.display = 'flex';
        }
        calcLabelWidth();
    } else {
        normalSearchSection.style.display = 'flex';
        for (const section of advancedSections) {
            section.style.display = 'none';
        }
    }
    madResizeTo(null, document.documentElement.offsetHeight);
});

if (query) {
    search();
} else {
    // No music loaded
    addOverrideChkBox.disabled = true;
    searchResults.label.innerHTML = `<mad-string data-locid="VISLRCFIND_MANUAL_INFO"></mad-string>`;
}

async function search() {
    searchResults.disabled = true;
    searchResults.label.innerHTML = `<mad-string data-locid="VISLRCFIND_SEARCHING"></mad-string>`;
    for (const option of searchResults.options) {
        option.remove();
    }

    const response = await fetch(`https://lrclib.net/api/search?q=${searchBar.value}`, {
        method: 'GET',
        headers: headers
    });
    const result = await response.json();

    processResults(result);
}

async function advancedSearch() {
    searchResults.disabled = true;
    searchResults.label.innerHTML = `<mad-string data-locid="VISLRCFIND_SEARCHING"></mad-string>`;
    for (const option of searchResults.options) {
        option.remove();
    }

    const response = await fetch(`https://lrclib.net/api/search?artist_name=${artistBar.value}&track_name=${titleBar.value}&album_name=${albumBar.value}`, {
        method: 'GET',
        headers: headers
    });
    const result = await response.json();

    processResults(result);
}

function processResults(result) {
    if (result.length === 0) {
        searchResults.label.innerHTML = `<mad-string data-locid="VISLRC_STATUS_NOT_FOUND"></mad-string>`;
        searchResults.disabled = true;
        return;
    }

    searchResults.disabled = false;
    let currentIdFound = false;
    for (const item of result) {
        if (!item.syncedLyrics && !item.plainLyrics) {
            continue;
        }
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.artistName + ' - ' + item.trackName + ' (' + item.albumName + ')';
        if (localStorage.madesktopDebugMode) {
            option.textContent = '[' + item.id + '] ' + option.textContent;
        }
        searchResults.appendChild(option);
        if (currentId === item.id) {
            searchResults.value = item.id.toString();
            currentIdFound = true;
        }
    }
    if (searchResults.options.length === 0) {
        // Everything is instrumental!
        searchResults.label.innerHTML = `<mad-string data-locid="VISLRC_STATUS_NOT_FOUND"></mad-string>`;
        searchResults.disabled = true;
        return;
    }
    if (!currentIdFound) {
        searchResults.selectedIndex = 0;
    }
}

function calcLabelWidth() {
    const widths = [];
    for (const label of advancedSearchLabels) {
        widths.push(getTextWidth(label.textContent, '11px var(--ui-font)'));
    }
    const width = Math.max(...widths);
    for (const label of advancedSearchLabels) {
        label.style.width = width + 'px';
    }
}

window.apply = function () {
    window.loadLyrics(searchResults.value, addOverrideChkBox.checked);
};

okBtn.addEventListener('click', () => {
    window.apply();
    madCloseWindow();
});

cancelBtn.addEventListener('click', () => {
    madCloseWindow();
});

applyBtn.addEventListener('click', () => {
    window.apply();
});

window.addEventListener('load', () => {
    calcLabelWidth();
    madResizeTo(null, document.documentElement.offsetHeight);
});

window.addEventListener('message', (event) => {
    if (event.data.type === 'language-ready') {
        calcLabelWidth();
    }
});

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});