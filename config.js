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

colorPickerBtn.value = parent.getComputedStyle(parent.document.body).getPropertyValue('background-color');

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