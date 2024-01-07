const wallMap = {};
const preview = document.getElementById('preview');
const wpChooser = document.getElementById('wpChooser');
const imgItems = document.querySelectorAll('#wpChooser li');
const customImgItem = document.getElementById('customImgItem');
const wpBrowseBtn = document.getElementById('wpBrowseBtn');
const wpEnterUrlBtn = document.getElementById('wpEnterUrlBtn');
const imgModeSelector = document.getElementById('imgModeSelector');

for (const imgItem of imgItems) {
    wallMap[imgItem.textContent] = imgItem;
    imgItem.addEventListener('click', function() {
        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        imgItem.dataset.active = true;

        const i = Array.from(imgItems).indexOf(this);
        if (i == 0) {
            preview.contentWindow.changeBgType('image');
            preview.contentDocument.body.style.backgroundImage = 'none';
            imgModeSelector.disabled = true;
        } else if (i >= 1 && i <= 12) {
            preview.contentWindow.changeBgType('image');
            preview.contentDocument.body.style.backgroundImage = `url('../../wallpapers/${this.textContent}.bmp')`;
            imgModeSelector.disabled = false;
        } else if (i == 13) {
            preview.contentWindow.changeBgType('web');
            preview.contentWindow.bgHtmlView.src = '../../bghtml/index.html';
            imgModeSelector.disabled = true;
        } else if (i == 14) {
            if (this.dataset.base64) {
                preview.contentWindow.changeBgType('image');
                preview.contentDocument.body.style.backgroundImage = "url('data:image/png;base64," + this.dataset.base64 + "')";
            } else {
                preview.contentWindow.location.reload();
            }
            imgModeSelector.disabled = false;
        } else if (i == 15) {
            preview.contentWindow.changeBgType('video');
            preview.contentDocument.body.style.backgroundImage = 'none';
            imgModeSelector.disabled = true;
        }
    });
}

wpBrowseBtn.addEventListener('click', async function() {
    [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const reader = new FileReader();
    reader.onload = function() {
        const b64str = reader.result.split(";base64,")[1];
        preview.contentWindow.changeBgType('image');
        preview.contentDocument.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
        customImgItem.dataset.base64 = b64str;
        customImgItem.querySelector('span').textContent = file.name;
        customImgItem.style.display = 'block';
        imgModeSelector.disabled = false;

        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        customImgItem.dataset.active = true;
        wpChooser.scrollTo(0, wpChooser.scrollHeight);
    }
    reader.readAsDataURL(file);
});

imgModeSelector.addEventListener('change', function() {
    preview.contentWindow.changeBgImgMode(this.value);
});

imgModeSelector.value = localStorage.madesktopBgImgMode || 'center';

// Incomplete
wpEnterUrlBtn.addEventListener('click', function() {
    const url = prompt('Enter URL:');
    if (url) {
        preview.contentWindow.changeBgType('image');
        preview.contentDocument.body.style.backgroundImage = "url('" + url + "')";
        customImgItem.dataset.base64 = url;
        customImgItem.style.display = 'block';
        imgModeSelector.disabled = false;

        const activeItem = document.querySelector('li[data-active]');
        if (activeItem) {
            delete activeItem.dataset.active;
        }
        customImgItem.dataset.active = true;
        wpChooser.scrollTo(0, wpChooser.scrollHeight);
    }
});

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
            wallItem.scrollIntoView(false);
            wpChooser.scrollBy(0, 6);
        }
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
}

window.apply = function() {
    const activeItem = document.querySelector('li[data-active]');
    if (!activeItem) {
        return;
    }

    parent.changeBgImgMode(preview.contentWindow.bgImgMode);

    const i = Array.from(imgItems).indexOf(activeItem);
    if (i == 0) {
        delete localStorage.madesktopBgImg;
    } else if (i >= 1 && i <= 12) {
        localStorage.madesktopBgImg = `wallpapers/${activeItem.textContent}.bmp`;
    } else if (i == 14) {
        if (activeItem.dataset.base64) {
            localStorage.madesktopBgImg = activeItem.dataset.base64;
        } else {
            return;
        }
    } else if (i == 15) {
        return;
    }

    parent.changeBgType(preview.contentWindow.bgType);
    localStorage.madesktopBgType = preview.contentWindow.bgType;
    localStorage.madesktopBgImgMode = imgModeSelector.value;

    if (preview.contentWindow.bgType == 'web') {
        parent.document.getElementById('bgHtmlView').src = preview.contentWindow.bgHtmlView.src;
        localStorage.madesktopBgHtmlSrc = preview.contentWindow.bgHtmlView.src;
        delete localStorage.madesktopBgImg;
    }

    if (i != 14 && !customImgItem.dataset.base64) {
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