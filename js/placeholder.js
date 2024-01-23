// placeholder.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

if (madRunningMode !== 1) {
    document.getElementById("visIcon").style.display = "none";
}

function openApp(app) {
    switch(app) {
        case "jspaint":
            madResizeTo(268, 355);
            madMoveTo(250, 150);
            madChangeWndStyle("wnd");
            madLocReplace("apps/jspaint/index.html");
            break;
        case "sol":
            madResizeTo(660, 440);
            madMoveTo(250, 150);
            madChangeWndStyle("wnd");
            madLocReplace("apps/solitaire/index.html");
            break;
        case "vis":
            if (parent.visDeskMover) {
                madAlert("Only one instance of the visualizer can be open at a time.", null, "warning");
                return;
            } else if (localStorage.madesktopVisUnavailable) {
                madAlert("Audio recording is not enabled. Please enable it in the Wallpaper Engine properties panel.", null, "error");
                return;
            }
            madResizeTo(480, 380);
            madMoveTo(500, 200);
            madChangeWndStyle("wnd");
            madLocReplace("apps/visualizer/index.html");
    }
}

function openYoutube() {
    madPrompt("Enter a YouTube URL", function (url) {
        if (url == null) return;
        const id = parseVideoId(url);
        if (id == null) {
            madAlert("Invalid URL", null, "error");
            return;
        }
        madResizeTo(560, 315);
        madMoveTo(250, 150);
        madChangeWndStyle("wnd");
        madLocReplace("https://www.youtube.com/embed/" + id);
    }, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '');
}

function parseVideoId(url) {
    try {
        if (url.includes("embed/")) {
            return url.split("embed/")[1].split("?")[0];
        } else if (!url.startsWith("http")) {
            url = "https://" + url;
        }
        const urlObj = new URL(url);
        if (urlObj.hostname == "youtu.be") {
            return urlObj.pathname.substring(1);
        }
        if (urlObj.hostname.includes("youtube")) {
            return urlObj.searchParams.get("v");
        }
        return null;
    } catch {
        return null;
    }
}