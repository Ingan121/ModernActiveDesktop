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
} else if (madRunningMode === 0) {
    madAlert(madGetString("VISUALIZER_UNSUPPORTED_MSG"), null, "error");
    madDeskMover.isVisualizer = true;
    madCloseWindow();
} else if (parent.visDeskMover && parent.visDeskMover !== madDeskMover) {
    madAlert(madGetString("VISUALIZER_MULTI_INSTANCE_MSG"), null, "warning");
    madCloseWindow();
} else if (localStorage.madesktopVisUnavailable) {
    // Although the media integration is available, it is not reliable to be used in MAD
    // because we don't have a way to check if the media listener is invalidated or not
    // This happens frequently when an iframe loads a page or gets closed
    // See also: the bottom of wmpvis.js
    madAlert(madGetString("VISUALIZER_NO_AUDIO_MSG"), null, "error");
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

const isWin10 = navigator.userAgent.includes('Windows NT 10.0');
const NO_MEDINT_MSG = isWin10 ? "VISUALIZER_NO_MEDINT_MSG" : "VISUALIZER_MEDINT_UNSUPPORTED_MSG";

let mouseOverMenu = false;
let mediaIntegrationAvailable = isWin10;

let lastAlbumArt = null;
let lastMusic = null;
let schemeBarColor = null;
let schemeTopColor = null;
// #endregion

// #region Event listeners
playIcon.addEventListener('click', () => {
    if (!playIcon.dataset.active) {
        mediaControl('playpause');
    }
});

pauseIcon.addEventListener('click', () => {
    if (!pauseIcon.dataset.active && !pauseIcon.dataset.disabled) {
        mediaControl('playpause');
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
            if (schemeElement.href.startsWith('file:///') &&
                localStorage.madesktopVisUseSchemeColors &&
                (!lastAlbumArt || !localStorage.madesktopVisFollowAlbumArt))
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
            if (lastMusic === null || localStorage.madesktopVisTitleMode === "-1") {
                document.title = madGetString("VISUALIZER_TITLE");
            }
    }
});
// #endregion

// #region Initialization
if (localStorage.madesktopVisMenuAutohide) {
    viewMenuItems[0].classList.add('checkedItem');
    mainArea.style.marginTop = '0';
    menuBar.style.opacity = '0';
}

if (localStorage.madesktopVisFullscreen) {
    madEnterFullscreen();
    viewMenuItems[1].classList.add('checkedItem');
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

if (localStorage.sysplugIntegration) {
    viewMenuItems[4].classList.remove('disabled');
    if (localStorage.madesktopVisMediaControls) {
        viewMenuItems[4].classList.add('checkedItem');
        statusArea.dataset.controllable = true;
    }
} else {
    delete localStorage.madesktopVisMediaControls;
}

if (localStorage.madesktopVisOnlyAlbumArt) {   
    visMenuItems[0].classList.add('activeStyle');
    visMenuItems[1].classList.remove('activeStyle');
}
// #endregion

// #region Menu bar
madDeskMover.menu = new MadMenu(menuBar, ['vis', 'view', 'opt', 'help']);

visMenuItems[0].addEventListener('click', () => { // Album Art button
    if (!mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error');
        return;
    }

    localStorage.madesktopVisOnlyAlbumArt = true;
    visMenuItems[0].classList.add('activeStyle');
    visMenuItems[1].classList.remove('activeStyle');
    visBar.style.opacity = '0';
    visTop.style.opacity = '0';
    albumArt.style.opacity = '1';
    localStorage.madesktopVisShowAlbumArt = true;
    delete localStorage.madesktopVisDimAlbumArt;
    configChanged();
});

visMenuItems[1].addEventListener('click', () => { // WMP Bars button
    delete localStorage.madesktopVisOnlyAlbumArt;
    visMenuItems[0].classList.remove('activeStyle');
    visMenuItems[1].classList.add('activeStyle');
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
        menuBar.style.opacity = '';
    } else {
        localStorage.madesktopVisMenuAutohide = true;
        viewMenuItems[0].classList.add('checkedItem');
        mainArea.style.marginTop = '0';
        menuBar.style.opacity = '0';
    }
    updateSize();
});

viewMenuItems[1].addEventListener('click', () => { // Fullscreen button
    if (madDeskMover.isFullscreen) {
        madExitFullscreen();
        viewMenuItems[1].classList.remove('checkedItem');
        delete localStorage.madesktopVisFullscreen;
    } else {
        madEnterFullscreen();
        viewMenuItems[1].classList.add('checkedItem');
        localStorage.madesktopVisFullscreen = true;
    }
    updateSize();
});

viewMenuItems[2].addEventListener('click', () => { // Information button
    if (!mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error');
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
    if (!mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error');
        return;
    }

    const currentWidth = parseInt(madDeskMover.config.width);
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
        madResizeTo(currentWidth, currentHeight - statusAreaHeight);

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
        madResizeTo(currentWidth, currentHeight + statusAreaHeight);
    }
});

viewMenuItems[4].addEventListener('click', () => { // Enable Media Controls button
    if (!mediaIntegrationAvailable) {
        madAlert(madGetString(NO_MEDINT_MSG), null, isWin10 ? 'info' : 'error');
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
            });
        }
    }
});

optMenuItems[0].addEventListener('click', () => { // Configure Visualization button
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const options = {
        left, top, width: '400px', height: '467px',
        aot: true, unresizable: true, noIcon: true
    }
    madOpenWindow('apps/visualizer/config.html', true, options);
});

helpMenuItems[0].addEventListener('click', () => { // About Visualizer button
    madOpenConfig('about');
});
// #endregion

// #region Functions
async function mediaControl(action) {
    if (!localStorage.sysplugIntegration || !localStorage.madesktopVisMediaControls) {
        return;
    }
    const title = lastMusic ? lastMusic.title : '';
    try {
        const response = await madSysPlug.mediaControl(action, title);
        if (response !== 'OK') {
            madAlert(madGetString("VISUALIZER_MEDIA_CONTROL_ERROR") + '<br>' + response, null, 'error');
        }
    } catch (error) {
        await madAlert(madGetString("UI_MSG_NO_SYSPLUG"), null, 'warning');
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
        viewMenuItems[2].classList.add('disabled');
        viewMenuItems[3].classList.add('disabled');
        viewMenuItems[4].classList.add('disabled');

        delete localStorage.madesktopVisOnlyAlbumArt;
        visMenuItems[0].classList.remove('activeStyle');
        visMenuItems[1].classList.add('activeStyle');
        visBar.style.display = 'block';
        visTop.style.display = 'block';
        visMenuItems[0].classList.add('disabled');
    } else {
        viewMenuItems[2].classList.remove('disabled');
        viewMenuItems[3].classList.remove('disabled');
        if (localStorage.sysplugIntegration) {
            viewMenuItems[4].classList.remove('disabled');
        }
        visMenuItems[0].classList.remove('disabled');
    }
    mediaIntegrationAvailable = event.enabled;
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
        lastMusic = null;
        return;
    }

    if (event.artist.endsWith(' - Topic')) { // YT auto-generated stuff
        event.artist = artist.slice(0, -7);
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
    seekBar.style.backgroundColor = 'transparent';
    seekHandle.style.display = 'none';
    timeText.parentElement.style.display = 'none';

    lastMusic = event;
}

function wallpaperMediaTimelineListener(event) {
    if (event.duration === 0) {
        seekBar.style.backgroundColor = 'transparent';
        seekHandle.style.display = 'none';
        timeText.parentElement.style.display = 'none';
        return;
    }
    const percent = event.position / event.duration * 100;
    seekBar.style.backgroundColor = 'var(--window)';
    seekHandle.style.left = `calc(${percent}% - 6px)`;
    seekHandle.style.display = 'block';
    timeText.textContent = `${formatTime(event.position)} / ${formatTime(event.duration)}`;
    timeText.parentElement.style.display = 'block';
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
}

function wallpaperMediaThumbnailListener(event) {
    if (event.thumbnail === 'data:image/png;base64,') {
        lastAlbumArt = null;
        configChanged();
        return;
    }
    if (localStorage.madesktopVisShowAlbumArt) {
        albumArt.src = event.thumbnail;
    }
    if (localStorage.madesktopVisFollowAlbumArt) {
        document.body.style.backgroundColor = event.primaryColor;
    }
    const image = new Image();
    image.onload = () => {
        event.width = image.width;
        event.height = image.height;
        updateAlbumArtSize();
    }
    image.src = event.thumbnail;
    lastAlbumArt = event;
}

function configChanged() {
    if (localStorage.madesktopVisNoClientEdge) {
        mainArea.style.boxShadow = 'none';
        mainArea.style.setProperty('--main-area-margin', '0px');
    } else {
        mainArea.style.boxShadow = '';
        mainArea.style.setProperty('--main-area-margin', '2px');
    }

    if (localStorage.madesktopVisShowAlbumArt && lastAlbumArt) {
        albumArt.src = lastAlbumArt.thumbnail;
    } else {
        albumArt.src = '';
    }

    if (localStorage.madesktopVisFollowAlbumArt && lastAlbumArt) {
        document.body.style.backgroundColor = lastAlbumArt.primaryColor;
    } else if (localStorage.madesktopVisUseSchemeColors) {
        updateSchemeColor();
    } else {
        document.body.style.backgroundColor = localStorage.madesktopVisBgColor || 'black';
    }

    if (localStorage.madesktopVisDimAlbumArt) {
        albumArt.style.opacity = '0.5';
    } else {
        albumArt.style.opacity = '1';
    }
    updateVisConfig();
    updateTitle();
    updateAlbumArtSize();
    updateSize();
}

function updateSchemeColor() {
    schemeBarColor = getComputedStyle(document.documentElement).getPropertyValue('--hilight');
    schemeTopColor = getComputedStyle(document.documentElement).getPropertyValue('--button-text');
    if (localStorage.madesktopVisUseSchemeColors && (!lastAlbumArt || !localStorage.madesktopVisFollowAlbumArt)) {
        document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
    }
}

function updateTitle(musicInfo = lastMusic) {
    const titleMode = localStorage.madesktopVisTitleMode;
    if (!musicInfo || titleMode === "-1") {
        document.title = madGetString("VISUALIZER_TITLE");
    } else if (!musicInfo.artist || titleMode === "2") {
        document.title = musicInfo.title;
    } else if (titleMode === "1") {
        document.title = musicInfo.artist + ' - ' + musicInfo.title;
    } else {
        document.title = musicInfo.title + ' - ' + musicInfo.artist;
    }
}

function updateAlbumArtSize() {
    if (!lastAlbumArt) {
        return;
    }
    const width = lastAlbumArt.width;
    const height = lastAlbumArt.height;
    switch (localStorage.madesktopVisAlbumArtSize) {
        case "auto2x":
            albumArt.style.width = width * 2 + 'px';
            albumArt.style.height = height * 2 + 'px';
            albumArt.style.minWidth = '';
            albumArt.style.minHeight = '';
            albumArt.style.maxWidth = '';
            albumArt.style.maxHeight = '';
            albumArt.style.objectFit = '';
            break;
        case "auto2xmin":
            albumArt.style.width = '';
            albumArt.style.height = '';
            albumArt.style.minWidth = '70%';
            albumArt.style.minHeight = '70%';
            albumArt.style.maxWidth = '';
            albumArt.style.maxHeight = '';
            albumArt.style.objectFit = '';
            break;
        case "orig":
            albumArt.style.width = '';
            albumArt.style.height = '';
            albumArt.style.minWidth = '0';
            albumArt.style.minHeight = '0';
            albumArt.style.maxWidth = 'none';
            albumArt.style.maxHeight = 'none';
            albumArt.style.objectFit = '';
            break;
        case "2x":
            albumArt.style.width = width * 2 + 'px';
            albumArt.style.height = height * 2 + 'px';
            albumArt.style.minWidth = '0';
            albumArt.style.minHeight = '0';
            albumArt.style.maxWidth = 'none';
            albumArt.style.maxHeight = 'none';
            albumArt.style.objectFit = '';
            break;
        case "horizfit":
            albumArt.style.width = 'calc(100% - var(--main-area-margin))';
            albumArt.style.height = 'calc(100% - var(--main-area-margin))';
            albumArt.style.minWidth = '';
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
    if (madRunningMode === 1) {
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