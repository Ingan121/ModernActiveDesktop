// download.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const url = new URL(location.href).searchParams.get('url');// + "?nocache=" + Math.random();
const progress = document.getElementById('progress');

if (url) {
    const filename = getFilename(url);
    const origin = new URL(url).origin;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onprogress = (e) => {
        if (e.lengthComputable) {
            document.title = `${Math.round(e.loaded / e.total * 100)}% of ${filename} Completed`;
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
            document.title = `Downloading ${filename}`;
        }
    };
    xhr.onload = () => {
        if (xhr.status === 200) {
            document.title = 'Done!';
        }
    };
    xhr.send();
}

// index: 435 x 297
// download: 367 x 160