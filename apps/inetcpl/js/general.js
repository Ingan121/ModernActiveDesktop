// general.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const connectionBtn = document.getElementById('connectionBtn');

const homePageInput = document.getElementById('homePageInput');
const useCurrentBtn = document.getElementById('useCurrentBtn');
const useDefaultBtn = document.getElementById('useDefaultBtn');
const useBlankBtn = document.getElementById('useBlankBtn');

const openOptSelector = document.getElementById('openOptSelector');

const faviconChkBox = document.getElementById('faviconChkBox');
const soundChkBox = document.getElementById('soundChkBox');
const jsChkBox = document.getElementById('jsChkBox');
const autoFullscrnChkBox = document.getElementById('autoFullscrnChkBox');
const injectStyleChkBox = document.getElementById('injectStyleChkBox');

// CORS proxy is not needed in Wallpaper Engine
if (madRunningMode === 1) {
    connectionBtn.style.display = 'none';
}

const currentPage = new URLSearchParams(location.search).get('currentPage');
if (currentPage) {
    useCurrentBtn.disabled = false;
}

useCurrentBtn.addEventListener('click', function () {
    homePageInput.value = currentPage;
});

useDefaultBtn.addEventListener('click', function () {
    homePageInput.value = 'https://www.ingan121.com/';
});

useBlankBtn.addEventListener('click', function () {
    homePageInput.value = 'about:blank';
});

window.apply = function () {
    localStorage.madesktopChanViewHome = homePageInput.value;

    localStorage.madesktopLinkOpenMode = openOptSelector.selectedIndex;

    if (faviconChkBox.checked) {
        localStorage.madesktopChanViewShowFavicon = true;
    } else {
        delete localStorage.madesktopChanViewShowFavicon;
    }
    if (soundChkBox.checked) {
        delete localStorage.madesktopChanViewNoSound;
    } else {
        localStorage.madesktopChanViewNoSound = true;
    }
    if (jsChkBox.checked) {
        delete localStorage.madesktopChanViewNoJs;
    } else {
        localStorage.madesktopChanViewNoJs = true;
    }
    if (autoFullscrnChkBox.checked) {
        delete localStorage.madesktopChanViewNoAutoFullscrn;
    } else {
        localStorage.madesktopChanViewNoAutoFullscrn = true;
    }
    if (injectStyleChkBox.checked) {
        delete localStorage.madesktopChanViewNoInjectStyle;
    } else {
        localStorage.madesktopChanViewNoInjectStyle = true;
    }
    
    madAnnounce("inet-option-changed");
}

if (localStorage.madesktopChanViewHome) {
    homePageInput.value = localStorage.madesktopChanViewHome;
}

if (localStorage.madesktopLinkOpenMode) {
    openOptSelector.selectedIndex = localStorage.madesktopLinkOpenMode;
}

if (localStorage.madesktopChanViewShowFavicon) {
    faviconChkBox.checked = true;
}

if (localStorage.madesktopChanViewNoSound) {
    soundChkBox.checked = false;
}

if (localStorage.madesktopChanViewNoJs) {
    jsChkBox.checked = false;
}

if (localStorage.madesktopChanViewNoAutoFullscrn) {
    autoFullscrnChkBox.checked = false;
}

if (localStorage.madesktopChanViewNoInjectStyle) {
    injectStyleChkBox.checked = false;
}