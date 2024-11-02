// search.js for ModernActiveDesktop Visualizer Lyrics
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const urlParsed = new URLSearchParams(window.location.search);
const query = urlParsed.get('query');
const currentId = parseInt(urlParsed.get('current'));

const searchBar = document.getElementById('searchBar');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const addOverrideChkBox = document.getElementById('addOverrideChkBox');

const okBtn = document.getElementById('okBtn');
const cancelBtn = document.getElementById('cancelBtn');
const applyBtn = document.getElementById('applyBtn');

searchBar.value = query;

searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        search();
    }
});

searchBar.addEventListener('click', async function () {
    if (madKbdSupport !== 1) {
        if (madSysPlug.inputStatus) {
            madSysPlug.focusInput();
        } else if (!await madSysPlug.beginInput(true)) {
            const res = await madPrompt(madGetString("UI_PROMPT_ENTER_VALUE"), null, "", searchBar.value, true);
            if (res === null) return;
            searchBar.value = res;
            searchBar.dispatchEvent(new Event('change'));
        }
    }
});

document.addEventListener('madinput', function (e) {
    if (e.key === 'Enter') {
        search();
    } else if (e.key === 'Escape') {
        madCloseWindow();
    }
});

searchBtn.addEventListener('click', () => {
    search();
});

search();

async function search() {
    searchResults.disabled = true;
    searchResults.label.textContent = madGetString("VISLRCFIND_SEARCHING");
    for (const option of searchResults.options) {
        option.remove();
    }

    const response = await fetch(`https://lrclib.net/api/search?q=${searchBar.value}`, {
        method: 'GET',
        headers: {
            'Lrclib-Client': 'ModernActiveDesktop/' + top.madVersion.toString(1) + (madRunningMode === 1 ? ' (Wallpaper Engine)' : '') + ' (https://madesktop.ingan121.com/)'
        }
    });
    const result = await response.json();

    if (result.length === 0) {
        searchResults.label.textContent = madGetString("VISLRC_STATUS_NOT_FOUND");
        searchResults.disabled = true;
        return;
    }

    searchResults.disabled = false;
    let currentIdFound = false;
    for (const item of result) {
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
    if (!currentIdFound) {
        searchResults.selectedIndex = 0;
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
    madResizeTo(null, document.documentElement.offsetHeight);
});

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});