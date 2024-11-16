// main.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// #region Pre-launch checks
if (parent === window) {
    alert("This page is not meant to be opened directly. Please open it from ModernActiveDesktop.");
} else if (!frameElement) {
    alert("MADVis is being cross-origin restricted. Please run ModernActiveDesktop with a web server.");
} else if (window.madFallbackMode) {
    top.madAlert(madGetString("UI_MSG_RUNNING_AS_BG"), null, "error", { title: "locid:VISUALIZER_TITLE" });
} else if (madRunningMode === 0) {
    madAlert(madGetString("VISUALIZER_UNSUPPORTED_MSG"), null, "error", { title: "locid:VISUALIZER_TITLE" });
    madDeskMover.isVisualizer = true;
    madCloseWindow();
} else if (parent.visDeskMover && parent.visDeskMover !== madDeskMover) {
    madAlert(madGetString("VISUALIZER_MULTI_INSTANCE_MSG"), null, "warning", { title: "locid:VISUALIZER_TITLE" });
    madCloseWindow();
} else if (localStorage.madesktopVisUnavailable) {
    // Although the media integration is available, it is not reliable to be used in MAD
    // because we don't have a way to check if the media listener is invalidated or not
    // This happens frequently when an iframe loads a page or gets closed
    // See also: the bottom of wmpvis.js
    madAlert(madGetString("VISUALIZER_NO_AUDIO_MSG"), null, "error", { title: "locid:VISUALIZER_TITLE" });
    madDeskMover.isVisualizer = true;
    madCloseWindow();
} else {
    parent.visDeskMover = madDeskMover;
    madDeskMover.isVisualizer = true;
}
// #endregion

// #region Constants and variables
const schemeElement = document.getElementById("scheme");
const menuBar = document.getElementById('menuBar');
const idleIndicator = document.getElementById('idleIndicator');

const mainArea = document.getElementById('mainArea');
const albumArt = document.getElementById('albumArt');
const visBar = document.getElementById('bar');
const visTop = document.getElementById('top');
const pausedAlert = document.getElementById('pausedAlert');
const extraAlert = document.getElementById('extraAlert');

const statusArea = document.getElementById('statusArea');
const playIcon = document.getElementById('play');
const pauseIcon = document.getElementById('pause');
const stopIcon = document.getElementById('stop');
const prevIcon = document.getElementById('prev');
const nextIcon = document.getElementById('next');
const seekBar = document.getElementById('seekBar');
const seekHandle = document.getElementById('seekHandle');

const infoArea = document.getElementById('infoArea');
const infoMainArea = document.getElementById('infoMainArea');
const leftArea = document.getElementById('leftArea');
const titleText = document.getElementById('title');
const subtitleText = document.getElementById('subtitle');
const artistText = document.getElementById('artist');
const albumText = document.getElementById('album');
const albumArtistText = document.getElementById('albumArtist');
const genreText = document.getElementById('genre');

const rightArea = document.getElementById('rightArea');
const titleValue = document.getElementById('titleValue').querySelector('p');
const subtitleValue = document.getElementById('subtitleValue').querySelector('p');
const artistValue = document.getElementById('artistValue').querySelector('p');
const albumValue = document.getElementById('albumValue').querySelector('p');
const albumArtistValue = document.getElementById('albumArtistValue').querySelector('p');
const genreValue = document.getElementById('genreValue').querySelector('p');

const infoAreaSeparator = document.getElementById('infoAreaSeparator');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText').querySelector('mad-string');
const timeText = document.getElementById('timeText').querySelector('p');

const visMenuItems = document.querySelectorAll('#visMenu .contextMenuItem');
const viewMenuItems = document.querySelectorAll('#viewMenu .contextMenuItem');
const optMenuItems = document.querySelectorAll('#optMenu .contextMenuItem');
const helpMenuItems = document.querySelectorAll('#helpMenu .contextMenuItem');

const estimateMenuItems = document.querySelectorAll('#estimateMenu .contextMenuItem');
const colorMenuItems = document.querySelectorAll('#colorMenu .contextMenuItem');
const albumArtSizeMenuItems = document.querySelectorAll('#albumArtSizeMenu .contextMenuItem');
const titleOptMenuItems = document.querySelectorAll('#titleOptMenu .contextMenuItem');
const chanSepMenuItems = document.querySelectorAll('#chanSepMenu .contextMenuItem');

const mediaStatusEvent = new CustomEvent('mediaStatus');
const mediaPropertiesEvent = new CustomEvent('mediaProperties');
const mediaTimelineEvent = new CustomEvent('mediaTimeline');
const mediaPlaybackEvent = new CustomEvent('mediaPlayback');
const mediaThumbnailEvent = new CustomEvent('mediaThumbnail');

const isWin10 = navigator.userAgent.includes('Windows NT 10.0');
const NO_MEDINT_MSG = isWin10 ? "VISUALIZER_NO_MEDINT_MSG" : "VISUALIZER_MEDINT_UNSUPPORTED_MSG";

let schemeBarColor = null;
let schemeTopColor = null;

const visStatus = {};
madDeskMover.visStatus = visStatus;

let timelineGuesserTick = null;
let secondDifferences = [];
let lastTimelineEventTime = 0;
let lastTimelineEventTimeMode2 = 0;
let mode2InitialTime = 0;

// Always start with true regardless of OS, to allow already enabled MedInt features to be disabled
// (As it just clicks the menu item for disabling, if it starts with false, error messages will be shown constantly on non-Win10 systems)
// (Handle cases where the user imports configs from a Win10 system to a non-Win10 system)
// As of writing, I'm not caring that much about Win < 10 / WPE < 2.5 compatibility though
// Early Win10 versions without MedInt support? That cannot be handled cuz CEF doesn't allow us to check the build version
// Just let WPE handle it, although it will show instructions to enable MedInt which won't work
visStatus.mediaIntegrationAvailable = true;

visStatus.lastAlbumArt = null;
visStatus.lastMusic = null;
// #endregion

// #region Event listeners
playIcon.addEventListener('click', () => {
    if (!playIcon.dataset.active) {
        mediaControl('play');
    }
});

pauseIcon.addEventListener('click', () => {
    if (!pauseIcon.dataset.active && !pauseIcon.dataset.disabled) {
        mediaControl('pause');
    }
});

stopIcon.addEventListener('click', () => {
    if (!stopIcon.dataset.active) {
        mediaControl('stop');
    }
});

prevIcon.addEventListener('click', () => {
    mediaControl('prev');
});

nextIcon.addEventListener('click', () => {
    mediaControl('next');
});

window.addEventListener('load', updateSchemeColor);

window.addEventListener("message", (event) => {
    switch (event.data.type) {
        case "scheme-updated":
            if (!['98', 'custom', 'sys', undefined].includes(localStorage.madesktopColorScheme) &&
                localStorage.madesktopVisUseSchemeColors &&
                (!visStatus.lastAlbumArt || !localStorage.madesktopVisFollowAlbumArt))
            {
                location.reload();
            } else {
                updateSchemeColor();
            }
            break;
        case "sysplug-option-changed":
            if (localStorage.sysplugIntegration && isWin10) {
                viewMenuItems[4].classList.remove('disabled');
            } else {
                viewMenuItems[4].classList.add('disabled');
                if (localStorage.madesktopVisMediaControls) {
                    delete localStorage.madesktopVisMediaControls;
                    viewMenuItems[4].classList.remove('checkedItem');
                    delete statusArea.dataset.controllable;
                }
            }
        case "language-ready":
            if (visStatus.lastMusic === null || localStorage.madesktopVisTitleMode === "static") {
                document.title = madGetString("VISUALIZER_TITLE");
            }
    }
});
// #endregion

// #region Initialization
if (localStorage.madesktopVisOnlyAlbumArt) {
    visMenuItems[0].classList.add('activeStyle');
    visMenuItems[1].classList.remove('activeStyle');
    optMenuItems[2].classList.add('disabled');
    optMenuItems[3].classList.add('checkedItem');
    optMenuItems[4].classList.remove('checkedItem');
    optMenuItems[3].classList.add('disabled');
    optMenuItems[4].classList.add('disabled');
}

if (localStorage.madesktopVisMenuAutohide) {
    viewMenuItems[0].classList.add('checkedItem');
    mainArea.style.marginTop = '0';
    menuBar.dataset.autohide = true;
}

if (localStorage.madesktopVisFullscreen) {
    madEnterFullscreen();
    viewMenuItems[1].classList.add('checkedItem');

    if (localStorage.madesktopVisBgMode) {
        viewMenuItems[6].classList.add('checkedItem');
        madDeskMover.bottomMost = true;
        madBringToTop(); // Trigger z-index update
    }
}

if (localStorage.madesktopVisInfoShown) {
    viewMenuItems[2].classList.add('checkedItem');
    infoArea.style.display = 'block';
    infoMainArea.style.display = 'flex';
    if (localStorage.madesktopVisStatusShown) {
        infoAreaSeparator.style.display = 'block';
    } else {
        infoAreaSeparator.style.display = 'none';
        statusBar.style.display = 'none';
    }
}

if (localStorage.madesktopVisStatusShown) {
    viewMenuItems[3].classList.add('checkedItem');
    statusArea.style.display = 'flex';
    infoArea.style.display = 'block';
    statusBar.style.display = 'flex';
    if (!localStorage.madesktopVisInfoShown) {
        infoMainArea.style.display = 'none';
        infoAreaSeparator.style.display = 'none';
    }
}

if (localStorage.madesktopVisGuessTimeline === '2') {
    estimateMenuItems[2].classList.add('activeStyle');
} else if (localStorage.madesktopVisGuessTimeline) {
    estimateMenuItems[1].classList.add('activeStyle');
} else {
    estimateMenuItems[0].classList.add('activeStyle');
}

if (localStorage.sysplugIntegration) {
    viewMenuItems[4].classList.remove('disabled');
    if (localStorage.madesktopVisMediaControls) {
        viewMenuItems[4].classList.add('checkedItem');
        statusArea.dataset.controllable = true;
    }
} else {
    delete localStorage.madesktopVisMediaControls;
}
// #endregion

// #region Menu bar
madDeskMover.menu = new MadMenu(menuBar, ['vis', 'view', 'opt', 'help'], ['estimate', 'color', 'albumArtSize', 'titleOpt', 'chanSep']);

visMenuItems[0].addEventListener('click', () => { // Album Art button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
        return;
    }

    localStorage.madesktopVisOnlyAlbumArt = true;
    visMenuItems[0].classList.add('activeStyle');
    visMenuItems[1].classList.remove('activeStyle');
    optMenuItems[2].classList.add('disabled');
    optMenuItems[3].classList.add('checkedItem');
    optMenuItems[4].classList.remove('checkedItem');
    optMenuItems[3].classList.add('disabled');
    optMenuItems[4].classList.add('disabled');
    visBar.style.opacity = '0';
    visTop.style.opacity = '0';
    albumArt.style.opacity = '1';
    idleIndicator.style.display = 'none';
    localStorage.madesktopVisShowAlbumArt = true;
    delete localStorage.madesktopVisDimAlbumArt;
    configChanged();
});

visMenuItems[1].addEventListener('click', () => { // WMP Bars button
    delete localStorage.madesktopVisOnlyAlbumArt;
    visMenuItems[0].classList.remove('activeStyle');
    visMenuItems[1].classList.add('activeStyle');
    if (visStatus.mediaIntegrationAvailable) {
        optMenuItems[2].classList.remove('disabled');
        if (localStorage.madesktopVisShowAlbumArt) {
            optMenuItems[3].classList.remove('disabled');
            optMenuItems[4].classList.remove('disabled');
        }
    }
    visBar.style.opacity = '1';
    visTop.style.opacity = '1';
    configChanged();
});

visMenuItems[2].addEventListener('click', () => { // Exit button
    madCloseWindow();
});

viewMenuItems[0].addEventListener('click', () => { // Autohide Menu Bar button
    if (localStorage.madesktopVisMenuAutohide) {
        delete localStorage.madesktopVisMenuAutohide;
        viewMenuItems[0].classList.remove('checkedItem');
        mainArea.style.marginTop = '';
        delete menuBar.dataset.autohide;
    } else {
        localStorage.madesktopVisMenuAutohide = true;
        viewMenuItems[0].classList.add('checkedItem');
        mainArea.style.marginTop = '0';
        menuBar.dataset.autohide = true;
    }
    updateSize();
});

viewMenuItems[1].addEventListener('click', () => { // Fullscreen button
    if (madDeskMover.isFullscreen) {
        madExitFullscreen();
        viewMenuItems[1].classList.remove('checkedItem');
        delete localStorage.madesktopVisFullscreen;
        if (localStorage.madesktopVisBgMode) {
            viewMenuItems[6].click();
        }
    } else {
        madEnterFullscreen();
        viewMenuItems[1].classList.add('checkedItem');
        localStorage.madesktopVisFullscreen = true;
    }
    updateSize();
});

viewMenuItems[2].addEventListener('click', () => { // Information button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
        return;
    }

    const currentHeight = parseInt(madDeskMover.config.height);
    if (localStorage.madesktopVisInfoShown) {
        delete localStorage.madesktopVisInfoShown;
        viewMenuItems[2].classList.remove('checkedItem');

        let infoAreaHeight = infoMainArea.offsetHeight + 1;
        infoMainArea.style.display = 'none';
        infoAreaSeparator.style.display = 'none';
        if (!localStorage.madesktopVisStatusShown) {
            infoArea.style.display = 'none';
            infoAreaHeight += 2;
        }

        if (madDeskMover.config.unscaled) {
            infoAreaHeight /= parent.scaleFactor;
        }
        madResizeTo(undefined, currentHeight - infoAreaHeight);
    } else {
        localStorage.madesktopVisInfoShown = true;
        viewMenuItems[2].classList.add('checkedItem');

        infoArea.style.display = 'block';
        infoMainArea.style.display = 'flex';
        if (localStorage.madesktopVisStatusShown) {
            infoAreaSeparator.style.display = 'block';
        } else {
            infoAreaSeparator.style.display = 'none';
            statusBar.style.display = 'none';
        }

        let infoAreaHeight = infoMainArea.offsetHeight + 1;
        if (!localStorage.madesktopVisStatusShown) {
            infoAreaHeight += 2;
        }

        if (madDeskMover.config.unscaled) {
            infoAreaHeight /= parent.scaleFactor;
        }
        madResizeTo(undefined, currentHeight + infoAreaHeight);
    }
});

viewMenuItems[3].addEventListener('click', () => { // Playback Status button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
        return;
    }

    const currentHeight = parseInt(madDeskMover.config.height);
    if (localStorage.madesktopVisStatusShown) {
        delete localStorage.madesktopVisStatusShown;
        viewMenuItems[3].classList.remove('checkedItem');

        let statusAreaHeight = statusArea.offsetHeight + 7;
        statusArea.style.display = 'none';
        if (localStorage.madesktopVisInfoShown) {
            statusAreaHeight += statusBar.offsetHeight + 1;
            infoAreaSeparator.style.display = 'none';
            statusBar.style.display = 'none';
        } else {
            statusAreaHeight += infoArea.offsetHeight;
            infoArea.style.display = 'none';
        }

        if (madDeskMover.config.unscaled) {
            statusAreaHeight /= parent.scaleFactor;
        }
        madResizeTo(undefined, currentHeight - statusAreaHeight);

        if (localStorage.madesktopVisMediaControls) {
            delete localStorage.madesktopVisMediaControls;
            viewMenuItems[4].classList.remove('checkedItem');
            delete statusArea.dataset.controllable;
        }
    } else {
        localStorage.madesktopVisStatusShown = true;
        viewMenuItems[3].classList.add('checkedItem');

        statusArea.style.display = 'flex';
        infoArea.style.display = 'block';
        let statusAreaHeight = statusArea.offsetHeight + 7;
        statusBar.style.display = 'flex';
        if (localStorage.madesktopVisInfoShown) {
            infoAreaSeparator.style.display = 'block';
            statusAreaHeight += statusBar.offsetHeight + 1;
        } else {
            infoMainArea.style.display = 'none';
            infoAreaSeparator.style.display = 'none';
            statusAreaHeight += infoArea.offsetHeight;
        }

        if (madDeskMover.config.unscaled) {
            statusAreaHeight /= parent.scaleFactor;
        }
        madResizeTo(undefined, currentHeight + statusAreaHeight);
    }
});

viewMenuItems[4].addEventListener('click', () => { // Enable Media Controls button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
        return;
    }

    if (localStorage.madesktopVisMediaControls) {
        delete localStorage.madesktopVisMediaControls;
        viewMenuItems[4].classList.remove('checkedItem');
        delete statusArea.dataset.controllable;
    } else {
        if (localStorage.sysplugIntegration) {
            localStorage.madesktopVisMediaControls = true;
            viewMenuItems[4].classList.add('checkedItem');
            statusArea.dataset.controllable = true;
            if (!localStorage.madesktopVisStatusShown) {
                viewMenuItems[3].click();
            }
        } else {
            madAlert(madGetString("UI_MSG_SYSPLUG_REQUIRED"), () => {
                madOpenWindow('SysplugSetupGuide.md', true);
            }, 'info', { title: 'locid:VISUALIZER_TITLE' });
        }
    }
});

viewMenuItems[5].addEventListener('click', () => { // Estimate Timeline button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
    }
    // Submenu will be opened by MadMenu if this item is not disabled
});

viewMenuItems[6].addEventListener('click', () => { // Show as Background button
    if (localStorage.madesktopVisBgMode) {
        delete localStorage.madesktopVisBgMode;
        viewMenuItems[6].classList.remove('checkedItem');
        madDeskMover.bottomMost = false;
        madBringToTop(); // Trigger z-index update
        if (madDeskMover.isFullscreen) {
            viewMenuItems[1].click();
        }
    } else {
        localStorage.madesktopVisBgMode = true;
        viewMenuItems[6].classList.add('checkedItem');
        madDeskMover.bottomMost = true;
        madBringToTop(); // Trigger z-index update
        if (!madDeskMover.isFullscreen) {
            viewMenuItems[1].click();
        }
    }
});

viewMenuItems[7].addEventListener('click', () => { // Lyrics button
    const options = {
        left: parseInt(madDeskMover.config.xPos) + 25 + 'px',
        top: parseInt(madDeskMover.config.yPos) + 50 + 'px',
        width: '400px', height: '502px'
    }
    madOpenWindow('apps/visualizer/lyrics/index.html', false, options);
});

optMenuItems[1].addEventListener('click', () => { // Window Title button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
    }
    // Submenu will be opened by MadMenu if this item is not disabled
});

optMenuItems[3].addEventListener('click', () => { // Show Album Art button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
        return;
    }
    if (localStorage.madesktopVisOnlyAlbumArt) {
        return;
    }
    if (localStorage.madesktopVisShowAlbumArt) {
        delete localStorage.madesktopVisShowAlbumArt;
        configChanged();
    } else {
        localStorage.madesktopVisShowAlbumArt = true;
        configChanged();
    }
});

optMenuItems[4].addEventListener('click', () => { // Dim Album Art button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
        return;
    }
    if (localStorage.madesktopVisOnlyAlbumArt || !localStorage.madesktopVisShowAlbumArt) {
        return;
    }
    if (localStorage.madesktopVisDimAlbumArt) {
        delete localStorage.madesktopVisDimAlbumArt;
        configChanged();
    } else {
        localStorage.madesktopVisDimAlbumArt = true;
        configChanged();
    }
});

optMenuItems[5].addEventListener('click', () => { // Album Art Size button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
    }
    // Submenu will be opened by MadMenu if this item is not disabled
});

optMenuItems[6].addEventListener('click', () => { // Advanced Options button
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const options = {
        left, top, width: '400px', height: '502px',
        aot: true, unresizable: true, noIcon: true
    }
    madOpenWindow('apps/visualizer/config.html', true, options);
});

helpMenuItems[0].addEventListener('click', () => { // About Visualizer button
    madOpenConfig('about');
});

estimateMenuItems[0].addEventListener('click', () => { // Disable button
    delete localStorage.madesktopVisGuessTimeline;
    estimateMenuItems[0].classList.add('activeStyle');
    estimateMenuItems[1].classList.remove('activeStyle');
    estimateMenuItems[2].classList.remove('activeStyle');
    if (timelineGuesserTick) {
        clearInterval(timelineGuesserTick);
        timelineGuesserTick = null;
    }
});

estimateMenuItems[1].addEventListener('click', () => { // Enable button
    localStorage.madesktopVisGuessTimeline = true;
    estimateMenuItems[0].classList.remove('activeStyle');
    estimateMenuItems[1].classList.add('activeStyle');
    estimateMenuItems[2].classList.remove('activeStyle');
    if (timelineGuesserTick) {
        clearInterval(timelineGuesserTick);
        timelineGuesserTick = null;
    }
});

estimateMenuItems[2].addEventListener('click', () => { // Ignore Original Timeline button
    localStorage.madesktopVisGuessTimeline = '2';
    estimateMenuItems[0].classList.remove('activeStyle');
    estimateMenuItems[1].classList.remove('activeStyle');
    estimateMenuItems[2].classList.add('activeStyle');
    if (timelineGuesserTick) {
        clearInterval(timelineGuesserTick);
        timelineGuesserTick = null;
    }
});

estimateMenuItems[3].addEventListener('click', () => { // Help button
    madAlert(madGetString("VISUALIZER_ESTIMATE_TIMELINE_HELP_MSG"), null, 'info', { title: 'locid:VISUALIZER_TITLE' });
});

colorMenuItems[0].addEventListener('click', () => { // Default button
    delete localStorage.madesktopVisBgColor;
    delete localStorage.madesktopVisBarColor;
    delete localStorage.madesktopVisTopColor;
    delete localStorage.madesktopVisUseSchemeColors;
    configChanged();
});

colorMenuItems[1].addEventListener('click', () => { // Follow Color Scheme button
    localStorage.madesktopVisUseSchemeColors = true;
    configChanged();
});

colorMenuItems[2].addEventListener('click', () => { // Custom Color button
    if (localStorage.madesktopVisUseSchemeColors) {
        localStorage.madesktopVisBgColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
        localStorage.madesktopVisBarColor = schemeBarColor;
        localStorage.madesktopVisTopColor = schemeTopColor;
        delete localStorage.madesktopVisUseSchemeColors;
    } else if (!localStorage.madesktopVisBgColor) {
        localStorage.madesktopVisBgColor = "#000000";
        localStorage.madesktopVisBarColor = visConfig.barColor;
        localStorage.madesktopVisTopColor = visConfig.topColor;
    }
    configChanged();
    optMenuItems[6].click();
});

colorMenuItems[3].addEventListener('click', () => { // Follow Album Art button
    if (!visStatus.mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error', { title: 'locid:VISUALIZER_TITLE' });
        return;
    }
    if (localStorage.madesktopVisFollowAlbumArt) {
        delete localStorage.madesktopVisFollowAlbumArt;
        configChanged();
    } else {
        localStorage.madesktopVisFollowAlbumArt = true;
        configChanged();
    }
});

for (const item of albumArtSizeMenuItems) {
    item.addEventListener('click', () => {
        localStorage.madesktopVisAlbumArtSize = item.dataset.value;
        configChanged();
    });
}

for (const item of titleOptMenuItems) {
    item.addEventListener('click', () => {
        localStorage.madesktopVisTitleMode = item.dataset.value;
        configChanged();
    });
}

for (let i = 0; i < chanSepMenuItems.length; i++) {
    const value = i + 1;
    chanSepMenuItems[i].addEventListener('click', () => {
        localStorage.madesktopVisChannelSeparation = value;
        configChanged();
    });
}
// #endregion

// #region Functions
async function mediaControl(action) {
    if (!localStorage.sysplugIntegration || !localStorage.madesktopVisMediaControls) {
        return;
    }
    const title = visStatus.lastMusic ? visStatus.lastMusic.title : '';
    try {
        const response = await madSysPlug.mediaControl(action, title);
        if (response !== 'OK') {
            madAlert(madGetString("VISUALIZER_MEDIA_CONTROL_ERROR") + '<br>' + response, null, 'error', { title: 'locid:VISUALIZER_TITLE' });
        }
    } catch (error) {
        await madAlert(madGetString("UI_MSG_NO_SYSPLUG"), null, 'warning', { title: 'locid:VISUALIZER_TITLE' });
        madOpenWindow('SysplugSetupGuide.md', true);
    }
}

function wallpaperMediaStatusListener(event) {
    if (!event.enabled) {
        wallpaperMediaPropertiesListener({});
        
        if (localStorage.madesktopVisInfoShown) {
            viewMenuItems[2].click();
        }
        if (localStorage.madesktopVisStatusShown) {
            viewMenuItems[3].click();
        }
        if (localStorage.madesktopVisMediaControls) {
            viewMenuItems[4].click();
        }
        if (localStorage.madesktopVisGuessTimeline) {
            estimateMenuItems[0].click();
        }
        viewMenuItems[2].classList.add('disabled');
        viewMenuItems[3].classList.add('disabled');
        viewMenuItems[4].classList.add('disabled');
        viewMenuItems[5].classList.add('disabled');

        if (localStorage.madesktopVisOnlyAlbumArt) {
            visMenuItems[1].click();
        }
        visMenuItems[0].classList.add('disabled');

        optMenuItems[1].classList.add('disabled');
        optMenuItems[3].classList.add('disabled');
        optMenuItems[4].classList.add('disabled');
        optMenuItems[5].classList.add('disabled');
        colorMenuItems[3].classList.add('disabled');
    } else {
        viewMenuItems[2].classList.remove('disabled');
        viewMenuItems[3].classList.remove('disabled');
        if (localStorage.sysplugIntegration) {
            viewMenuItems[4].classList.remove('disabled');
        }
        viewMenuItems[5].classList.remove('disabled');
        visMenuItems[0].classList.remove('disabled');
        optMenuItems[1].classList.remove('disabled');
        if (!localStorage.madesktopVisOnlyAlbumArt) {
            optMenuItems[3].classList.remove('disabled');
            if (localStorage.madesktopVisShowAlbumArt) {
                optMenuItems[4].classList.remove('disabled');
                optMenuItems[5].classList.remove('disabled');
            }
        }
        colorMenuItems[3].classList.remove('disabled');
    }
    visStatus.mediaIntegrationAvailable = event.enabled;
    document.dispatchEvent(mediaStatusEvent);
}

function wallpaperMediaPropertiesListener(event) {
    if (!event.title) {
        document.title = madGetString("VISUALIZER_TITLE");
        titleValue.textContent = '';
        subtitleValue.textContent = '';
        artistValue.textContent = '';
        albumValue.textContent = '';
        albumArtistValue.textContent = '';
        genreValue.textContent = '';
        subtitleText.style.display = 'none';
        artistText.style.display = 'block';
        albumText.style.display = 'none';
        albumArtistText.style.display = 'none';
        genreText.style.display = 'none';
        pauseIcon.dataset.disabled = true;
        statusText.locId = "VISUALIZER_STATUS_STOPPED";
        delete playIcon.dataset.active;
        delete pauseIcon.dataset.active;
        stopIcon.dataset.active = true;
        seekBar.style.backgroundColor = 'transparent';
        seekHandle.style.display = 'none';
        timeText.parentElement.style.display = 'none';
        visStatus.lastMusic = null;
        visStatus.timelineOrig = null;
        visStatus.timeline = null;
        document.dispatchEvent(mediaPropertiesEvent);
        return;
    }

    if (event.artist.endsWith(' - Topic')) { // YT auto-generated stuff
        event.artist = event.artist.slice(0, -7);
    }
    updateTitle(event);

    titleValue.textContent = event.title;
    subtitleValue.textContent = event.subTitle;
    artistValue.textContent = event.artist;
    albumValue.textContent = event.albumTitle;
    albumArtistValue.textContent = event.albumArtist;
    genreValue.textContent = event.genres.replaceAll(',', ', ');

    if (event.subTitle) {
        subtitleText.style.display = 'block';
    } else {
        subtitleText.style.display = 'none';
    }
    if (event.artist) {
        artistText.style.display = 'block';
    } else {
        artistText.style.display = 'none';
    }
    if (event.albumTitle) {
        albumText.style.display = 'block';
    } else {
        albumText.style.display = 'none';
    }
    if (event.albumArtist) {
        albumArtistText.style.display = 'block';
    } else {
        albumArtistText.style.display = 'none';
    }
    if (event.genres) {
        genreText.style.display = 'block';
    } else {
        genreText.style.display = 'none';
    }

    // New music; consider we might not get a timeline event
    if (visStatus.lastMusic &&
        (visStatus.lastMusic.title !== event.title ||
        visStatus.lastMusic.artist !== event.artist ||
        visStatus.lastMusic.albumTitle !== event.albumTitle ||
        visStatus.lastMusic.albumArtist !== event.albumArtist ||
        visStatus.lastMusic.genres !== event.genres)
    ) {
        seekBar.style.backgroundColor = 'transparent';
        seekHandle.style.display = 'none';
        timeText.parentElement.style.display = 'none';
        visStatus.timelineOrig = null;
        visStatus.timeline = null;
    }

    visStatus.lastMusic = event;
    document.dispatchEvent(mediaPropertiesEvent);
}

function wallpaperMediaTimelineListener(event) {
    if (event.duration === 0) {
        seekBar.style.backgroundColor = 'transparent';
        seekHandle.style.display = 'none';
        timeText.parentElement.style.display = 'none';
        visStatus.timelineOrig = null;
        visStatus.timeline = null;
        return;
    }
    log(`Timeline event: ${event.position} / ${event.duration}`, 'debug', 'MADVis');

    // If the estimated timeline setting is set to "Ignore Original Timeline",
    // only update the timeline here if this is a new music
    if (localStorage.madesktopVisGuessTimeline !== '2' || !visStatus.timeline) {
        if (!visStatus.timeline) {
            // Always clear the timeline guesser on new music
            if (timelineGuesserTick) {
                clearInterval(timelineGuesserTick);
                timelineGuesserTick = null;
            }
            secondDifferences = [];
        }

        const percent = event.position / event.duration * 100;
        seekBar.style.backgroundColor = 'var(--window)';
        seekHandle.style.left = `calc(${percent}% - 6px)`;
        seekHandle.style.display = 'block';
        timeText.textContent = `${formatTime(event.position)} / ${formatTime(event.duration)}`;
        timeText.parentElement.style.display = 'block';

        visStatus.timeline = {
            position: event.position,
            duration: event.duration
        };
    }

    if (visStatus.timeline && visStatus.timelineOrig) {
        if (event.position - visStatus.timeline.position <= 1) {
            if (lastTimelineEventTime) {
                const diff = performance.now() - lastTimelineEventTime;
                const diff2 = (event.position - visStatus.timelineOrig.position) * 1000;
                const res = diff - diff2;
                if (res > 1000) {
                    timelineGuesser();
                }
                log({ diff, diff2, res }, 'debug', 'MADVis');
                secondDifferences.push(res % 1000);
            }
            lastTimelineEventTime = performance.now();
            if (secondDifferences.length > 10) {
                secondDifferences.shift();
            }
        }
    }

    visStatus.timelineOrig = event;
    document.dispatchEvent(mediaTimelineEvent);

    if (localStorage.madesktopVisGuessTimeline) {
        if (localStorage.madesktopVisGuessTimeline === '2') {
            // In this mode, don't cancel the timeline guesser if it's running
            if (!timelineGuesserTick) {
                lastTimelineEventTimeMode2 = Date.now();
                mode2InitialTime = event.position;
                timelineGuesserTick = setInterval(timelineGuesser, 100);
            }
        } else {
            // Attempt to adjust the interval to match the actual second
            if (timelineGuesserTick) {
                clearInterval(timelineGuesserTick);
                timelineGuesserTick = null;
            }
            const sum = secondDifferences.reduce((a, b) => a + b, 0);
            const avg = sum / secondDifferences.length;
            if (isNaN(avg)) {
                timelineGuesserTick = setInterval(timelineGuesser, 1000);
                return;
            }
            const delay = avg > 0 ? 1000 - avg : -avg;
            setTimeout(function () {
                if (timelineGuesserTick) {
                    clearInterval(timelineGuesserTick);
                    timelineGuesserTick = null;
                }
                timelineGuesserTick = setInterval(timelineGuesser, 1000);
                if (avg > 0) {
                    timelineGuesser();
                }
            }, delay);
            log({ avg, lastDiff: secondDifferences[secondDifferences.length - 1], delay }, 'debug', 'MADVis');
        }
    }
}

function formatTime(sec) {
    const date = new Date(0);
    date.setSeconds(sec);
    const formatted = date.toISOString().slice(11,-5);
    if (formatted.startsWith('00:')) {
        return formatted.slice(3);
    }
    return formatted;
}

function timelineGuesser() {
    if (!visStatus.timeline || !visStatus.lastMusic || !localStorage.madesktopVisGuessTimeline) {
        if (timelineGuesserTick) {
            clearInterval(timelineGuesserTick);
            timelineGuesserTick = null;
        }
        return;
    }

    if (visStatus.state === window.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
        let changed = false;
        if (visStatus.timeline.position <= visStatus.timeline.duration) {
            if (localStorage.madesktopVisGuessTimeline === '2') {
                const newTime = Math.round((Date.now() - lastTimelineEventTimeMode2) / 1000) + mode2InitialTime;
                if (newTime !== visStatus.timeline.position) {
                    changed = true;
                }
                visStatus.timeline.position = newTime;
            } else {
                visStatus.timeline.position += 1;
                changed = true;
            }
            if (changed) {
                seekHandle.style.left = `calc(${visStatus.timeline.position / visStatus.timeline.duration * 100}% - 6px)`;
                timeText.textContent = `${formatTime(visStatus.timeline.position)} / ${formatTime(visStatus.timeline.duration)}`;
                document.dispatchEvent(mediaTimelineEvent);
            }
        } else {
            clearInterval(timelineGuesserTick);
            timelineGuesserTick = null;
        }
    } else if (localStorage.madesktopVisGuessTimeline === '2') {
        lastTimelineEventTimeMode2 = Date.now();
        mode2InitialTime = visStatus.timeline.position;
    }
}

function wallpaperMediaPlaybackListener(event) {
    switch (event.state) {
        case window.wallpaperMediaIntegration.PLAYBACK_PLAYING:
            playIcon.dataset.active = true;
            delete pauseIcon.dataset.active;
            delete stopIcon.dataset.active;
            delete pauseIcon.dataset.disabled;
            statusText.locId = "VISUALIZER_STATUS_PLAYING";
            break;
        case window.wallpaperMediaIntegration.PLAYBACK_PAUSED:
            delete playIcon.dataset.active;
            pauseIcon.dataset.active = true;
            delete stopIcon.dataset.active;
            delete pauseIcon.dataset.disabled;
            statusText.locId = "VISUALIZER_STATUS_PAUSED";
            break;
        case window.wallpaperMediaIntegration.PLAYBACK_STOPPED:
            delete playIcon.dataset.active;
            delete pauseIcon.dataset.active;
            stopIcon.dataset.active = true;
            pauseIcon.dataset.disabled = true;
            statusText.locId = "VISUALIZER_STATUS_STOPPED";
    }

    visStatus.state = event.state;
    document.dispatchEvent(mediaPlaybackEvent);
}

function wallpaperMediaThumbnailListener(event) {
    if (event.thumbnail === 'data:image/png;base64,' || !event.thumbnail) {
        visStatus.lastAlbumArt = null;
        configChanged();
        return;
    }
    if (localStorage.madesktopVisShowAlbumArt) {
        albumArt.style.display = 'block';
        albumArt.src = event.thumbnail;
    }
    if (localStorage.madesktopVisFollowAlbumArt) {
        document.body.style.backgroundColor = event.primaryColor;
    }
    visStatus.lastAlbumArt = event;
    const image = new Image();
    image.onload = () => {
        event.width = image.width;
        event.height = image.height;
        updateAlbumArtSize();
    }
    image.src = event.thumbnail;
    document.dispatchEvent(mediaThumbnailEvent);
}

function configChanged() {
    if (localStorage.madesktopVisNoClientEdge) {
        mainArea.style.boxShadow = 'none';
        mainArea.style.setProperty('--main-area-margin', '0px');
    } else {
        mainArea.style.boxShadow = '';
        mainArea.style.setProperty('--main-area-margin', '2px');
    }
    if (localStorage.madesktopVisNoFsMargin) {
        document.body.dataset.noFsMargin = true;
    } else {
        delete document.body.dataset.noFsMargin;
    }

    if (localStorage.madesktopVisShowAlbumArt && visStatus.lastAlbumArt) {
        albumArt.style.display = 'block';
        albumArt.src = visStatus.lastAlbumArt.thumbnail;
    } else {
        albumArt.style.display = 'none';
        albumArt.src = '';
    }

    if (localStorage.madesktopVisFollowAlbumArt && visStatus.lastAlbumArt) {
        document.body.style.backgroundColor = visStatus.lastAlbumArt.primaryColor;
    } else if (localStorage.madesktopVisUseSchemeColors) {
        updateSchemeColor();
    } else {
        document.body.style.backgroundColor = localStorage.madesktopVisBgColor || 'black';
    }

    if (localStorage.madesktopVisShowAlbumArt) {
        optMenuItems[3].classList.add('checkedItem');
        if (visStatus.mediaIntegrationAvailable) {
            if (!localStorage.madesktopVisOnlyAlbumArt) {
                optMenuItems[4].classList.remove('disabled');
            }
            optMenuItems[5].classList.remove('disabled');
        }
    } else {
        optMenuItems[3].classList.remove('checkedItem');
        optMenuItems[4].classList.add('disabled');
        optMenuItems[5].classList.add('disabled');
    }

    if (localStorage.madesktopVisDimAlbumArt) {
        albumArt.style.opacity = '0.5';
        optMenuItems[4].classList.add('checkedItem');
    } else {
        albumArt.style.opacity = '1';
        optMenuItems[4].classList.remove('checkedItem');
    }

    if (localStorage.madesktopVisFollowAlbumArt) {
        colorMenuItems[3].classList.add('checkedItem');
    } else {
        colorMenuItems[3].classList.remove('checkedItem');
    }

    document.querySelector(`#colorMenu .activeStyle`)?.classList.remove('activeStyle');
    if (localStorage.madesktopVisUseSchemeColors) {
        colorMenuItems[1].classList.add('activeStyle');
    } else if (localStorage.madesktopVisBgColor) {
        colorMenuItems[2].classList.add('activeStyle');
    } else {
        colorMenuItems[0].classList.add('activeStyle');
    }

    document.querySelector(`#albumArtSizeMenu .activeStyle`)?.classList.remove('activeStyle');
    if (localStorage.madesktopVisAlbumArtSize) {
        document.querySelector(`#albumArtSizeMenu [data-value="${localStorage.madesktopVisAlbumArtSize}"]`).classList.add('activeStyle');
    } else {
        albumArtSizeMenuItems[0].classList.add('activeStyle');
    }

    document.querySelector(`#titleOptMenu .activeStyle`)?.classList.remove('activeStyle');
    if (localStorage.madesktopVisTitleMode) {
        document.querySelector(`#titleOptMenu [data-value="${localStorage.madesktopVisTitleMode}"]`).classList.add('activeStyle');
    } else {
        titleOptMenuItems[0].classList.add('activeStyle');
    }

    document.querySelector(`#chanSepMenu .activeStyle`)?.classList.remove('activeStyle');
    chanSepMenuItems[(localStorage.madesktopVisChannelSeparation || 2) - 1].classList.add('activeStyle');

    updateVisConfig();
    updateTitle();
    updateAlbumArtSize();
    updateSize();
}

function updateSchemeColor() {
    schemeBarColor = localStorage.madesktopAeroColor || getComputedStyle(document.documentElement).getPropertyValue('--hilight');
    schemeTopColor = getComputedStyle(document.documentElement).getPropertyValue('--button-text');
    if (localStorage.madesktopVisUseSchemeColors && (!visStatus.lastAlbumArt || !localStorage.madesktopVisFollowAlbumArt)) {
        document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
    }
}

function updateTitle(musicInfo = visStatus.lastMusic) {
    const titleMode = localStorage.madesktopVisTitleMode;
    if (!musicInfo || titleMode === "static") {
        document.title = madGetString("VISUALIZER_TITLE");
    } else if (!musicInfo.artist || titleMode === "titleOnly") {
        document.title = musicInfo.title;
    } else if (titleMode === "artistThenTitle") {
        document.title = musicInfo.artist + ' - ' + musicInfo.title;
    } else {
        document.title = musicInfo.title + ' - ' + musicInfo.artist;
    }
}

function updateAlbumArtSize() {
    if (!visStatus.lastAlbumArt) {
        return;
    }
    const width = visStatus.lastAlbumArt.width;
    const height = visStatus.lastAlbumArt.height;
    switch (localStorage.madesktopVisAlbumArtSize) {
        case "auto2x":
            albumArt.style.width = width * 2 + 'px';
            albumArt.style.height = height * 2 + 'px';
            albumArt.style.minHeight = '';
            albumArt.style.maxWidth = '';
            albumArt.style.maxHeight = '';
            albumArt.style.objectFit = '';
            break;
        case "auto2xmin":
            albumArt.style.width = '';
            albumArt.style.height = '';
            albumArt.style.minHeight = '70%';
            albumArt.style.maxWidth = '';
            albumArt.style.maxHeight = '';
            albumArt.style.objectFit = '';
            break;
        case "orig":
            albumArt.style.width = '';
            albumArt.style.height = '';
            albumArt.style.minHeight = '0';
            albumArt.style.maxWidth = 'none';
            albumArt.style.maxHeight = 'none';
            albumArt.style.objectFit = '';
            break;
        case "2x":
            albumArt.style.width = width * 2 + 'px';
            albumArt.style.height = height * 2 + 'px';
            albumArt.style.minHeight = '0';
            albumArt.style.maxWidth = 'none';
            albumArt.style.maxHeight = 'none';
            albumArt.style.objectFit = '';
            break;
        case "horizfit":
            albumArt.style.width = 'calc(100% - var(--main-area-margin))';
            albumArt.style.height = 'calc(100% - var(--main-area-margin))';
            albumArt.style.minHeight = '';
            albumArt.style.maxWidth = 'none';
            albumArt.style.maxHeight = 'none';
            albumArt.style.objectFit = 'contain';
            break;
        case "vertfit":
            albumArt.style.width = 'calc(100% - var(--main-area-margin))';
            albumArt.style.height = 'calc(100% - var(--main-area-margin))';
            albumArt.style.minWidth = '';
            albumArt.style.minHeight = '';
            albumArt.style.maxWidth = 'none';
            albumArt.style.maxHeight = 'none';
            albumArt.style.objectFit = 'cover';
            break;
        case "scale":
            albumArt.style.width = 'calc(100% - var(--main-area-margin))';
            albumArt.style.height = 'calc(100% - var(--main-area-margin))';
            albumArt.style.minWidth = '';
            albumArt.style.minHeight = '';
            albumArt.style.maxWidth = 'none';
            albumArt.style.maxHeight = 'none';
            albumArt.style.objectFit = 'fill';
            break;
        default: // "auto" or not set; handled in CSS
            albumArt.style.width = '';
            albumArt.style.height = '';
            albumArt.style.minWidth = '';
            albumArt.style.minHeight = '';
            albumArt.style.maxWidth = '';
            albumArt.style.maxHeight = '';
            albumArt.style.objectFit = '';
    }
}

function setupMediaListeners() {
    if (madRunningMode === 1 && madDeskMover.isVisualizer) {
        if (!isWin10) {
            wallpaperMediaStatusListener({ enabled: false });
            return;
        }
        window.wallpaperRegisterMediaStatusListener(wallpaperMediaStatusListener);
        window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener);
        window.wallpaperRegisterMediaPlaybackListener(wallpaperMediaPlaybackListener);
        window.wallpaperRegisterMediaTimelineListener(wallpaperMediaTimelineListener);
        window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener);
    }
}
// #endregion