// background.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License

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
const wpEnterUrlBtn = document.getElementById('wpEnterUrlBtn');
const imgModeSelector = document.getElementById('imgModeSelector');
const wpVideoMuteChkBox = document.getElementById('wpVideoMuteChkBox');
const wpVideoMuteLabel = document.querySelector('label[for=wpVideoMuteChkBox]');

for (const imgItem of imgItems) {
    wallMap[imgItem.textContent] = imgItem;
    imgItem.addEventListener('click', function () {
        const i = Array.from(imgItems).indexOf(this);
        if (i === 0) {
            preview.contentWindow.changeBgType('image');
            preview.contentDocument.body.style.backgroundImage = 'none';
            imgModeSelector.disabled = true;
            switchDisplayOptionElement(false);
        } else if (i >= 1 && i <= 14) {
            if (i === 9 || i === 13 || i === 14) {
                imgModeSelector.value = 'scale';
                preview.contentWindow.changeBgImgMode('scale');
            } else {
                imgModeSelector.value = 'grid';
                preview.contentWindow.changeBgImgMode('grid');
            }
            preview.contentWindow.changeBgType('image');
            preview.contentDocument.body.style.backgroundImage = `url('../../wallpapers/${this.textContent}.bmp')`;
            imgModeSelector.disabled = false;
            switchDisplayOptionElement(false);
        } else if (i === 15) {
            preview.contentWindow.changeBgType('web');
            preview.contentWindow.bgHtmlView.src = '../../bghtml/index.html';
            imgModeSelector.disabled = true;
            switchDisplayOptionElement(false);
        } else if (imgItem.id == 'customImgItem') {
            if (this.dataset.base64) {
                preview.contentWindow.changeBgType('image');
                preview.contentDocument.body.style.backgroundImage = "url('data:image/png;base64," + this.dataset.base64 + "')";
            } else {
                preview.contentWindow.location.reload();
            }
            imgModeSelector.disabled = false;
            switchDisplayOptionElement(false);
        } else if (imgItem.id == 'customWebImgItem') {
            preview.contentWindow.changeBgType('web');
            preview.contentWindow.bgHtmlView.src = this.dataset.url;
            imgModeSelector.disabled = true;
            switchDisplayOptionElement(false);
        } else if (imgItem.id == 'weImgItem') {
            preview.contentWindow.changeBgType('image');
            preview.contentDocument.body.style.backgroundImage = `url('${localStorage.madesktopBgWeImg}')`;
            imgModeSelector.disabled = false;
            switchDisplayOptionElement(false);
        } else if (imgItem.id == 'videoImgItem') {
            if (localStorage.madesktopBgVideo) {
                preview.contentWindow.changeBgType('video');
                preview.contentDocument.body.style.backgroundImage = 'none';
                switchDisplayOptionElement(true);
            } else {
                madAlert("Please use the Wallpaper Engine properties panel to configure a video wallpaper.");
                return;
            }
        }
        preview.contentWindow.updateImageSize();

        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        imgItem.dataset.active = true;
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
    const reader = new FileReader();
    reader.onload = function () {
        const b64str = reader.result.split(";base64,")[1];
        preview.contentWindow.changeBgType('image');
        preview.contentDocument.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
        preview.contentWindow.updateImageSize();
        customImgItem.dataset.base64 = b64str;
        customImgItem.querySelector('span').textContent = getFilename(file.name);
        customImgItem.style.display = 'block';
        imgModeSelector.disabled = false;

        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        customImgItem.dataset.active = true;
        wpChooser.appendChild(customImgItem);
        wpChooser.scrollTo(0, wpChooser.scrollHeight);
    }
    reader.readAsDataURL(file);
});

imgModeSelector.addEventListener('change', function () {
    preview.contentWindow.changeBgImgMode(this.value);
});

imgModeSelector.value = localStorage.madesktopBgImgMode || 'center';

wpEnterUrlBtn.addEventListener('click', function () {
    madPrompt('Enter URL of a web wallpaper', function (res) {
        if (res === null) return;
        preview.contentWindow.changeBgType('web');
        preview.contentWindow.bgHtmlView.src = res;
        imgModeSelector.disabled = true;

        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        customWebImgItem.dataset.active = true;
        customWebImgItem.dataset.url = res;
        customWebImgItem.style.display = 'block';
        scrollIntoView(customWebImgItem);
    });
});

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
        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        videoImgItem.dataset.active = true;
        wpChooser.appendChild(videoImgItem);
        wpChooser.scrollTo(0, wpChooser.scrollHeight);
        switchDisplayOptionElement(true);
    }
}

if (localStorage.madesktopBgImg) {
    if (localStorage.madesktopBgImg.startsWith('wallpapers/')) {
        const wallName = localStorage.madesktopBgImg.match(/wallpapers\/(.*)\.bmp/)[1];
        const wallItem = wallMap[wallName];
        if (wallItem) {
            const activeItem = document.querySelector('li[data-active]');
            if (activeItem) {
                delete activeItem.dataset.active;
            }
            wallItem.dataset.active = true;
            scrollIntoView(wallItem);
        }
    } else if (localStorage.madesktopBgWeImg === localStorage.madesktopBgImg) {
        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        weImgItem.dataset.active = true;
        wpChooser.scrollTo(0, wpChooser.scrollHeight);
    } else {
        if (!localStorage.madesktopBgImg.startsWith('file:///')) {
            customImgItem.dataset.base64 = localStorage.madesktopBgImg;
        }
        customImgItem.style.display = 'block';
        imgModeSelector.disabled = false;

        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        customImgItem.dataset.active = true;
        wpChooser.scrollTo(0, wpChooser.scrollHeight);        
    }
    imgModeSelector.disabled = false;
}

if (localStorage.madesktopBgType == 'web') {
    if (!localStorage.madesktopBgHtmlSrc || localStorage.madesktopBgHtmlSrc.endsWith('bghtml/index.html')) {
        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        imgItems[15].dataset.active = true;
        scrollIntoView(imgItems[15]);
    } else {
        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        customWebImgItem.dataset.url = localStorage.madesktopBgHtmlSrc;
        customWebImgItem.dataset.active = true;
        customWebImgItem.style.display = 'block';
        imgModeSelector.disabled = true;
        scrollIntoView(customWebImgItem);
    }
}

window.apply = function () {
    const activeItem = document.querySelector('li[data-active]');
    if (!activeItem) {
        return;
    }

    parent.changeBgImgMode(preview.contentWindow.bgImgMode);

    const i = Array.from(imgItems).indexOf(activeItem);
    if (i == 0) {
        delete localStorage.madesktopBgImg;
    } else if (i >= 1 && i <= 14) {
        localStorage.madesktopBgImg = `wallpapers/${activeItem.textContent}.bmp`;
    } else if (activeItem.id === 'customImgItem') {
        if (activeItem.dataset.base64) {
            try {
                localStorage.madesktopBgImg = activeItem.dataset.base64;
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    let msg = "Failed to set the image as wallpaper due to the large size of the image. Please use a smaller image";
                    if (madRunningMode === 1) {
                        msg += " or use the Wallpaper Engine properties panel to set the image as wallpaper";
                    }
                    madAlert(msg + '.', null, 'error');
                } else {
                    throw e;
                }
            }
        } else {
            return;
        }
    } else if (activeItem.id === 'weImgItem') {
        localStorage.madesktopBgImg = localStorage.madesktopBgWeImg;
    }

    localStorage.madesktopBgHtmlSrc = preview.contentWindow.bgHtmlView.src;
    parent.changeBgType(preview.contentWindow.bgType);
    localStorage.madesktopBgType = preview.contentWindow.bgType;
    localStorage.madesktopBgImgMode = imgModeSelector.value;

    switch (preview.contentWindow.bgType) {
        case 'web':
            parent.document.getElementById('bgHtmlView').src = preview.contentWindow.bgHtmlView.src;        
            delete localStorage.madesktopBgImg;
            break;
        case 'video':
            delete localStorage.madesktopBgImg;
    }

    parent.document.getElementById('bgVideo').muted = wpVideoMuteChkBox.checked;
    if (wpVideoMuteChkBox.checked) {
        localStorage.madesktopBgVideoMuted = true;
    } else {
        delete localStorage.madesktopBgVideoMuted;
    }

    // Reset customImgItem if it's not the active item and it doesn't have a base64 data saved
    // Less likely to happen as of writing tho
    if (activeItem.id !== 'customImgItem' && !customImgItem.dataset.base64) {
        delete customImgItem.dataset.active;
        customImgItem.querySelector('span').textContent = "Current Image";
        customImgItem.style.display = 'none';
    }
}

function loadBgImgConf() {
    if (localStorage.madesktopBgImg) {
        if (localStorage.madesktopBgImg.startsWith("file:///") || // Set in WE
            localStorage.madesktopBgImg.startsWith("wallpapers/")) // Built-in wallpapers set in madconf
        {
            return "url('" + localStorage.madesktopBgImg + "')";
        } else {
            return "url('data:image/png;base64," + localStorage.madesktopBgImg + "')"; // Set in madconf
        }
    }
    return "";
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

function scrollIntoView(elem) {
    const top = elem.getBoundingClientRect().top;
    const height = elem.getBoundingClientRect().height;
    const parentTop = elem.parentElement.getBoundingClientRect().top;
    const parentHeight = elem.parentElement.getBoundingClientRect().height;
    elem.parentElement.scrollBy(0, top - parentTop + height - parentHeight + 6);
}