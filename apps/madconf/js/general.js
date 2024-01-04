// Declare & set variables
const colorPickerBtn = document.getElementById("colorPicker");
const imgModeRadBtns = document.imgModeSelector.imgMode;

// Add event listeners
for (let i = 0; i < imgModeRadBtns.length; i++) {
    imgModeRadBtns[i].addEventListener('change', function() {
        localStorage.madesktopBgImgMode = this.value;
        parent.changeBgImgMode(this.value);
    });
}

// Load configs
colorPickerBtn.value = localStorage.madesktopBgColor || "#008080";
imgModeRadBtns.value = localStorage.madesktopBgImgMode || "center";

// Load background image from builtin settings
function loadBgImg() {
    const reader = new FileReader();
    reader.onload = function () {
        const b64str = reader.result.split(";base64,")[1];
        parent.document.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
        localStorage.madesktopBgImg = b64str;
    };
    reader.readAsDataURL(imgInput.files[0]);
}

function changeColorWithKeyboard() {
    parent.madPrompt('Enter color (format: #RRGGBB)', function(str) {
        if (str === null) return;
        parent.changeBgColor(str);
    }, "Color", colorPickerBtn.value);
}

function removeImage() {
    parent.document.body.style.backgroundImage = 'none';
    localStorage.removeItem('madesktopBgImg');
}

function changeScale() {
    parent.madPrompt("Enter scale (%) :", function (res) {
        if (res === null) return;
        const value = res / 100;
        parent.changeScale(value);
        localStorage.madesktopScaleFactor = value;
    });
}