window.bgHtmlContainer = document.getElementById("bgHtmlContainer");
window.bgHtmlView = document.getElementById("bgHtmlView");
window.bgVideoView = document.getElementById("bgVideo");
window.bgType = localStorage.madesktopBgType || "image";
window.bgImgMode = localStorage.madesktopBgImgMode || "center";

let scale = (localStorage.madesktopScaleFactor || 1) * 0.0625;
document.body.style.zoom = scale;

if (localStorage.madesktopBgColor) document.body.style.backgroundColor = localStorage.madesktopBgColor;
changeBgType(bgType);
changeBgImgMode(bgImgMode);
if (localStorage.madesktopBgHtmlSrc) bgHtmlView.src = localStorage.madesktopBgHtmlSrc;
document.getElementById("scheme").href = parent.parent.document.getElementById("scheme").href;

bgHtmlView.addEventListener("load", function() {
    bgHtmlView.contentWindow.document.body.style.zoom = scale;
});

new MutationObserver(function(mutations) {
    scale = (localStorage.madesktopScaleFactor || 1) * 0.0625;
    document.body.style.zoom = scale;
    bgHtmlView.contentWindow.document.body.style.zoom = scale;
}).observe(
    parent.document.body,
    { attributes: true, attributeFilter: ["style"] }
);

function changeBgType(type) {
    switch(type) {
        case 'image':
            loadBgImgConf();
            bgHtmlContainer.style.display = "none";
            bgVideoView.style.display = "none";
            bgVideoView.src = "";
            break;
        case 'video':
            document.body.style.backgroundImage = "none";
            bgHtmlContainer.style.display = "none";
            bgVideoView.style.display = "block";
            bgVideoView.src = localStorage.madesktopBgVideo;
            break;
        case 'web':
            document.body.style.backgroundImage = "none";
            bgHtmlContainer.style.display = "block";
            bgVideoView.style.display = "none";
            bgVideoView.src = "";
            break;
    }
    window.bgType = type;
}

function loadBgImgConf() {
    if (localStorage.madesktopBgImg) {
        if (localStorage.madesktopBgImg.startsWith("file:///") || // Set in WE
            localStorage.madesktopBgImg.startsWith("wallpapers/")) // Built-in wallpapers set in madconf
        {
            document.body.style.backgroundImage = "url('" + localStorage.madesktopBgImg + "')";
        } else {
            document.body.style.backgroundImage = "url('data:image/png;base64," + localStorage.madesktopBgImg + "')"; // Set in madconf
        }
    } else {
        document.body.style.backgroundImage = "none";
    }
}

function changeBgImgMode(value) {
    switch (value) {
        case "center": // Center
            document.body.style.backgroundSize = "auto";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
        case "grid": // Tile
            document.body.style.backgroundSize = "auto";
            document.body.style.backgroundRepeat = "repeat";
            document.body.style.backgroundPosition = "left top";
            break;
        case "horizfit": // Fit horizontally
            document.body.style.backgroundSize = "contain";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
        case "vertfit": // Fit vertically
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
        case "scale": // Stretch
            document.body.style.backgroundSize = "100% 100%";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            break;
    }
    window.bgImgMode = value;
}