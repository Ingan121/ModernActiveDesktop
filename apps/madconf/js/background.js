// background.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const wallMap = {};
const preview = document.getElementById('preview');
const wpChooser = document.getElementById('wpChooser');
const imgItems = document.querySelectorAll('#wpChooser li');
const customImgItem = document.getElementById('customImgItem');
const customWebImgItem = document.getElementById('customWebImgItem');
const weImgItem = document.getElementById('weImgItem');
const videoImgItem = document.getElementById('videoImgItem');
const wpBrowseBtn = document.getElementById('wpBrowseBtn');
const wpPatternBtn = document.getElementById('wpPatternBtn');
const imgModeSelector = document.getElementById('imgModeSelector');
const wpVideoMuteChkBox = document.getElementById('wpVideoMuteChkBox');
const wpVideoMuteLabel = document.querySelector('label[for=wpVideoMuteChkBox]');
let patternData = localStorage.madesktopBgPattern || '';

for (const imgItem of imgItems) {
    wallMap[imgItem.dataset.wpname] = imgItem;
    imgItem.addEventListener('click', function () {
        const i = Array.from(imgItems).indexOf(this);
        if (i === 0) {
            preview.contentWindow.changeBgType('image');
            preview.contentDocument.body.style.backgroundImage = 'none';
            imgModeSelector.disabled = true;
            switchDisplayOptionElement(false);
        } else if (i >= 1 && i <= 17) {
            if (this.dataset.nontile) {
                imgModeSelector.value = 'scale';
                preview.contentWindow.changeBgImgMode('scale');
            } else {
                imgModeSelector.value = 'grid';
                preview.contentWindow.changeBgImgMode('grid');
            }
            preview.contentWindow.changeBgType('image');
            preview.contentDocument.body.style.backgroundImage = `url('wallpapers/${this.dataset.wpname}.png')`;
            imgModeSelector.disabled = false;
            switchDisplayOptionElement(false);
        } else if (i === 18) {
            preview.contentWindow.changeBgType('web');
            preview.contentWindow.bgHtmlView.src = 'bghtml/index.html';
            imgModeSelector.disabled = true;
            switchDisplayOptionElement(false);
        } else if (imgItem.id == 'customImgItem') {
            if (this.blob) {
                preview.contentWindow.changeBgType('image');
                preview.contentDocument.body.style.backgroundImage = `url('${URL.createObjectURL(this.blob)}')`;
            } else {
                preview.contentWindow.location.reload();
            }
            imgModeSelector.disabled = false;
            switchDisplayOptionElement(false);
        } else if (imgItem.id == 'weImgItem') {
            preview.contentWindow.changeBgType('image');
            preview.contentDocument.body.style.backgroundImage = `url('${localStorage.madesktopBgWeImg}')`;
            imgModeSelector.disabled = false;
            switchDisplayOptionElement(false);
        } else if (imgItem.id == 'customWebImgItem') {
            return; // It's handled by the click event listener below
        } else if (imgItem.id == 'videoImgItem') {
            if (localStorage.madesktopBgVideo) {
                preview.contentWindow.changeBgType('video');
                preview.contentDocument.body.style.backgroundImage = 'none';
                switchDisplayOptionElement(true);
            } else {
                madAlert(madGetString("MADCONF_MSG_VIDEOWP"));
                return;
            }
        }
        preview.contentWindow.updateImageSize();

        activateItem(this, false);
    });
}

wpBrowseBtn.addEventListener('click', async function () {
    const pickerOpts = {
        types: [{
                description: "Images",
                accept: {
                    "image/*": [".png", ".gif", ".jpeg", ".jpg", ".bmp", ".webp", ".svg", ".ico", ".cur", ".avif", ".apng", ".jfif", ".pjpeg", ".pjp"],
                },
            },
        ],
        excludeAcceptAllOption: false,
        multiple: false,
    };

    const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);

    preview.contentWindow.changeBgType('image');
    preview.contentDocument.body.style.backgroundImage = `url('${url}')`;
    preview.contentWindow.updateImageSize();
    customImgItem.blob = file;
    customImgItem.querySelector('span').textContent = getFilename(file.name);
    customImgItem.style.display = 'block';
    imgModeSelector.disabled = false;

    activateItem(customImgItem, true, true);
});

wpPatternBtn.addEventListener('click', async function () {
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 80 + 'px';
    const options = { left, top, width: '312px', height: '180px', aot: true };
    const patternWindow = madOpenWindow('apps/madconf/pattern.html', true, options);
    patternWindow.windowElement.addEventListener('load', () => {
        patternWindow.windowElement.contentWindow.callback = patternCallback;
    });
});

imgModeSelector.addEventListener('change', function () {
    preview.contentWindow.changeBgImgMode(this.value);
    preview.contentWindow.updateImageSize();
});

imgModeSelector.value = localStorage.madesktopBgImgMode || 'center';

customWebImgItem.addEventListener('click', function () {
    madPrompt(madGetString('MADCONF_MSG_ENTER_URL'), function (res) {
        if (res === null) return;
        preview.contentWindow.changeBgType('web');
        preview.contentWindow.bgHtmlView.src = res;
        imgModeSelector.disabled = true;

        activateItem(customWebImgItem, false);
        switchDisplayOptionElement(false);
    });
});

async function init() {
    if (madRunningMode === 1) {
        videoImgItem.style.display = 'block';
    }

    if (localStorage.madesktopBgVideoMuted) {
        wpVideoMuteChkBox.checked = true;
    }

    if (localStorage.madesktopBgWeImg) {
        weImgItem.querySelector('span').textContent = getFilename(localStorage.madesktopBgWeImg);
        weImgItem.style.display = 'block';
    }

    if (localStorage.madesktopBgVideo) {
        videoImgItem.querySelector('span').textContent = getFilename(localStorage.madesktopBgVideo);

        if (localStorage.madesktopBgType === 'video') {
            activateItem(videoImgItem, true, true);
            switchDisplayOptionElement(true);
        }
    }

    const idbBgImg = await madIdb.bgImg;
    if (idbBgImg) {
        customImgItem.blob = idbBgImg;
        if (idbBgImg.name) {
            customImgItem.querySelector('span').textContent = getFilename(idbBgImg.name);
        }
        customImgItem.style.display = 'block';
        activateItem(customImgItem);
        imgModeSelector.disabled = false;
    } else if (localStorage.madesktopBgImg) {
        if (localStorage.madesktopBgImg.startsWith('wallpapers/')) {
            const wallName = localStorage.madesktopBgImg.match(/wallpapers\/(.*)\.png/)[1];
            const wallItem = wallMap[wallName];
            if (wallItem) {
                activateItem(wallItem);
            }
        } else if (localStorage.madesktopBgWeImg === localStorage.madesktopBgImg) {
            activateItem(weImgItem);
        } else {
            customImgItem.style.display = 'block';
            imgModeSelector.disabled = false;
            activateItem(customImgItem);        
        }
        imgModeSelector.disabled = false;
    }

    if (localStorage.madesktopBgType == 'web') {
        if (!localStorage.madesktopBgHtmlSrc || localStorage.madesktopBgHtmlSrc.endsWith('bghtml/index.html')) {
            activateItem(imgItems[18]);
        } else {
            activateItem(customWebImgItem);
        }
    }
}
init();

window.apply = async function () {
    const activeItem = document.querySelector('li[data-active]');
    if (!activeItem) {
        return;
    }

    parent.changeBgImgMode(preview.contentWindow.bgImgMode);

    const i = Array.from(imgItems).indexOf(activeItem);
    delete madIdb.bgImg;
    if (i == 0) {
        delete localStorage.madesktopBgImg;
    } else if (i >= 1 && i <= 17) {
        localStorage.madesktopBgImg = `wallpapers/${activeItem.dataset.wpname}.png`;
    } else if (activeItem.id === 'customImgItem') {
        if (activeItem.blob) {
            try {
                await madIdb.setItem('bgImg', activeItem.blob);
                delete localStorage.madesktopBgImg;
            } catch (e) {
                console.error(e);
                madAlert(madGetString("MADCONF_MSG_SAVE_FAIL", e.name), null, 'error');
            }
        }
    } else if (activeItem.id === 'weImgItem') {
        localStorage.madesktopBgImg = localStorage.madesktopBgWeImg;
    }

    if (patternData) {
        localStorage.madesktopBgPattern = patternData;
        parent.document.documentElement.style.backgroundImage = preview.contentDocument.documentElement.style.backgroundImage;
    } else {
        delete localStorage.madesktopBgPattern;
        parent.document.documentElement.style.backgroundImage = 'none';
    }

    delete localStorage.madesktopBgHtmlUnverified;
    localStorage.madesktopBgHtmlSrc = preview.contentWindow.bgHtmlView.src;
    parent.changeBgType(preview.contentWindow.bgType);
    localStorage.madesktopBgType = preview.contentWindow.bgType;
    localStorage.madesktopBgImgMode = imgModeSelector.value;

    switch (preview.contentWindow.bgType) {
        case 'web': case 'video':
            delete localStorage.madesktopBgImg;
    }

    parent.document.getElementById('bgVideo').muted = wpVideoMuteChkBox.checked;
    if (wpVideoMuteChkBox.checked) {
        localStorage.madesktopBgVideoMuted = true;
    } else {
        delete localStorage.madesktopBgVideoMuted;
    }

    // Reset customImgItem if it's not the active item and it doesn't have a blob data saved
    // Less likely to happen as of writing tho
    if (activeItem.id !== 'customImgItem' && !customImgItem.blob) {
        delete customImgItem.dataset.active;
        customImgItem.querySelector('span').textContent = madGetString("MADCONF_WPCHOOSER_CURRENT_IMG");
        customImgItem.style.display = 'none';
    }
}

window.patternCallback = function (patternB64) {
    patternData = patternB64;
    if (patternB64 === '') {
        preview.contentDocument.documentElement.style.backgroundImage = 'none';
    } else {
        const pattern = base64ToPattern(patternB64);
        preview.contentDocument.documentElement.style.backgroundImage = `url('${genPatternImage(pattern)}')`;
    }
}

function switchDisplayOptionElement(isVideo) {
    if (isVideo) {
        wpVideoMuteLabel.style.display = 'block';
        wpVideoMuteChkBox.checked = localStorage.madesktopBgVideoMuted;
        imgModeSelector.disabled = true;
        imgModeSelector.style.opacity = 0;
    } else {
        wpVideoMuteLabel.style.display = 'none';
        imgModeSelector.style.opacity = 1;
    }
}

function activateItem(item, scroll = true, putToBottom = false) {
    const activeItem = document.querySelector('li[data-active]');
    if (activeItem) {
        delete activeItem.dataset.active;
    }
    item.dataset.active = true;
    if (putToBottom) {
        wpChooser.appendChild(item);
    }
    if (scroll) {
        scrollIntoView(item);
    }
}