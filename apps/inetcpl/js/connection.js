// connection.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

if (madRunningMode === 1) {
    madLocReplace('apps/inetcpl/general.html');
}

const proxyInput = document.getElementById('proxyInput');
const useDefaultBtn = document.getElementById('useDefaultBtn');
const forceLoadChkBox = document.getElementById('forceLoadChkBox');

useDefaultBtn.addEventListener('click', function () {
    proxyInput.value = 'https://api.codetabs.com/v1/proxy/?quest=';
});

window.apply = function () {
    localStorage.madesktopCorsProxy = proxyInput.value;
    if (forceLoadChkBox.checked) {
        delete localStorage.madesktopChanViewNoForceLoad;
    } else {
        localStorage.madesktopChanViewNoForceLoad = true;
    }
};

if (localStorage.madesktopCorsProxy) {
    proxyInput.value = localStorage.madesktopCorsProxy;
}

if (localStorage.madesktopChanViewNoForceLoad) {
    forceLoadChkBox.checked = false;
}