// placeholder.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

madSetResizeArea(false);

function openApp(app) {
    const leftMargin = parseInt(localStorage.madesktopChanViewLeftMargin) || 75;
    const rightMargin = parseInt(localStorage.madesktopChanViewRightMargin) || 0;
    const topMargin = parseInt(localStorage.madesktopChanViewTopMargin) || 0;
    switch(app) {
        case "channelbar":
            madResizeTo(84, 471);
            madMoveTo(getRelativeWindowX(94.78) - 84 - rightMargin, getRelativeWindowY(18.52) + topMargin);
            madChangeWndStyle("ad");
            madLocReplace("ChannelBar.html");
            break;
        case "jspaint":
            madResizeTo(268, 355);
            madMoveTo(getRelativeWindowX(13.02) + leftMargin, getRelativeWindowY(13.38) + topMargin);
            madChangeWndStyle("wnd");
            madLocReplace("apps/jspaint/index.html");
            break;
        case "sol":
            madResizeTo(660, 440);
            madMoveTo(getRelativeWindowX(13.02) + leftMargin, getRelativeWindowY(13.38) + topMargin);
            madChangeWndStyle("wnd");
            madLocReplace("apps/solitaire/index.html");
            break;
        case "vis":
            if (madRunningMode === 0) {
                madConfirm(madGetString("VISUALIZER_UNSUPPORTED_MSG"), function (res) {
                    if (res) {
                        madResizeTo(400, 502);
                        madMoveTo(500, 200);
                        madChangeWndStyle("wnd");
                        madLocReplace("apps/visualizer/lyrics/index.html");
                    }
                }, {
                    icon: "warning",
                    btn1: "locid:PH_OPEN_LYRICS",
                    btn2: "locid:UI_OK",
                    defaultBtn: 2,
                    cancelBtn: 2
                });
                return;
            }
            if (parent.visDeskMover) {
                if (parent.visDeskMover.visStatus.mediaIntegrationAvailable) {
                    madResizeTo(600, 400);
                    madMoveTo(500, 200);
                    madChangeWndStyle("wnd");
                    madLocReplace("apps/visualizer/secondary.html");
                } else {
                    madAlert(madGetString("PH_VIS2ND_NO_MEDINT"), null, "warning");
                }
            } else if (localStorage.madesktopVisUnavailable) {
                madAlert(madGetString("VISUALIZER_NO_AUDIO_MSG"), null, "error");
                return;
            } else {
                madResizeTo(725, 380);
                madMoveTo(getRelativeWindowX(26.04) + leftMargin, getRelativeWindowY(18.52) + topMargin);
                madChangeWndStyle("wnd");
                madLocReplace("apps/visualizer/index.html");
            }
            break;
        case "cv":
            madResizeTo(1024, 768);
            madMoveTo(getRelativeWindowX(26.04) + leftMargin, getRelativeWindowY(18.52) + topMargin);
            madChangeWndStyle("wnd");
            madLocReplace("apps/channelviewer/index.html");
            break;
        case "clock":
            madResizeTo(398, 417);
            madMoveTo(getRelativeWindowX(26.04) + leftMargin, getRelativeWindowY(18.52) + topMargin);
            madChangeWndStyle("wnd");
            madLocReplace("apps/clock/index.html");
            break;
        case "calc":
            madResizeTo(254, 227);
            madMoveTo(getRelativeWindowX(26.04) + leftMargin, getRelativeWindowY(18.52) + topMargin);
            madChangeWndStyle("wnd");
            madSetResizable(false);
            madLocReplace("apps/calc/index.html");
            break;
    }
}

function openYoutube() {
    const leftMargin = parseInt(localStorage.madesktopChanViewLeftMargin) || 75;
    const topMargin = parseInt(localStorage.madesktopChanViewTopMargin) || 0;
    madPrompt(madGetString("PH_PROMPT_YT_URL"), function (url) {
        if (url == null) return;
        const id = parseVideoId(url);
        if (id == null) {
            madAlert(madGetString("PH_MSG_INVALID_URL"), null, "error");
            return;
        }
        madResizeTo(560, 315);
        madMoveTo(getRelativeWindowX(13.02) + leftMargin, getRelativeWindowY(13.38) + topMargin);
        madChangeWndStyle("wnd");
        madLocReplace("https://www.youtube.com/embed/" + id);
    }, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '');
}

function parseVideoId(url) {
    try {
        if (url.length == 11) {
            return url;
        } else if (url.includes("embed/")) {
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