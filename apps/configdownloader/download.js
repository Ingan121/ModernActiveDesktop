// download.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const url = new URL(location.href).searchParams.get('url');
const info = document.getElementById('info');
const progress = document.getElementById('progress');
const cancelBtn = document.getElementById('cancelBtn');

if (url) {
    let filename = url.split('/').pop();
    const hostname = new URL(url).hostname;
    document.title = madGetString("CONFDL_DL_TITLE_INDETERMINATE", filename);
    info.innerHTML = madGetString("CONFDL_DL_INFO", escapeHTML(filename), hostname);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onreadystatechange = () => {
        if (xhr.readyState === xhr.HEADERS_RECEIVED) {
            const contentDisposition = xhr.getResponseHeader('Content-Disposition');
            if (contentDisposition) {
                let headerFilename = contentDisposition.split('filename=')[1]?.replace(/"/g, '');
                if (headerFilename) {
                    filename = headerFilename;
                    info.innerHTML = madGetString("CONFDL_DL_INFO", escapeHTML(filename), hostname);
                }
            }
        }
    };
    xhr.onprogress = (e) => {
        if (e.lengthComputable) {
            document.title = madGetString("CONFDL_DL_TITLE").replace("%1s", Math.round(e.loaded / e.total * 100)).replace("%2s", filename);
            const currentPercent = e.loaded / e.total;
            const boxCnt = progress.getElementsByClassName('progressBox').length;
            const requiredBoxes = Math.ceil(currentPercent * progress.clientWidth / 8) - 1;

            if (boxCnt < requiredBoxes) {
                for (let i = boxCnt; i < requiredBoxes; i++) {
                    const box = document.createElement('div');
                    box.className = 'progressBox';
                    progress.appendChild(box);
                }
            }
        } else {
            document.title = madGetString("CONFDL_DL_TITLE_INDETERMINATE", filename);
        }
    };
    xhr.onload = async () => {
        if (xhr.status === 200) {
            if (madDeskMover.temp) {
                await madIdb.setItem("configToImport", xhr.response);
                top.location.replace("../../confmgr.html?action=importpreset");
            }
            // Otherwise there can be a import attempt loop if the config is invalid
            // Don't try importing if it's not a temp window, for debugging the window itself
        } else {
            madAlert(madGetString("CONFDL_DL_ERROR"), madCloseWindow, "error");
        }
    };
    xhr.onerror = () => {
        madAlert(madGetString("CONFDL_DL_ERROR"), madCloseWindow, "error");
    };
    cancelBtn.addEventListener('click', () => {
        xhr.abort();
        madCloseWindow();
    });
    xhr.send();
} else {
    madCloseWindow();
}