// common.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const homePageInput = document.getElementById('homePageInput');
const useCurrentBtn = document.getElementById('useCurrentBtn');
const useDefaultBtn = document.getElementById('useDefaultBtn');
const useBlankBtn = document.getElementById('useBlankBtn');

const jsChkBox = document.getElementById('jsChkBox');
const autoFullscrnChkBox = document.getElementById('autoFullscrnChkBox');
const injectStyleChkBox = document.getElementById('injectStyleChkBox');

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

    let sandbox = "allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin";
    if (jsChkBox.checked) {
        sandbox += " allow-scripts";
    }
    targetDeskMover.windowElement.contentWindow.iframe.sandbox = sandbox;
}

if (localStorage.madesktopChanViewHome) {
    homePageInput.value = localStorage.madesktopChanViewHome;
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