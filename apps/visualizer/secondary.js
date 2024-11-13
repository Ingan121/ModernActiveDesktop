// secondary.js for ModernActiveDesktop Visualizer
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
    madCloseWindow();
}
// #endregion

// #region Constants and variables
const schemeElement = document.getElementById("scheme");
const menuBar = document.getElementById('menuBar');

const mainArea = document.getElementById('mainArea');
const albumArt = document.getElementById('albumArt');
const alertArea = document.getElementById('alertArea');
const alertText = document.getElementById('alertText');

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

const viewMenuItems = document.querySelectorAll('#viewMenu .contextMenuItem');
const optMenuItems = document.querySelectorAll('#optMenu .contextMenuItem');
const helpMenuItems = document.querySelectorAll('#helpMenu .contextMenuItem');

const colorMenuItems = document.querySelectorAll('#colorMenu .contextMenuItem');
const albumArtSizeMenuItems = document.querySelectorAll('#albumArtSizeMenu .contextMenuItem');
const titleOptMenuItems = document.querySelectorAll('#titleOptMenu .contextMenuItem');
const miscMenuItems = document.querySelectorAll('#miscMenu .contextMenuItem');

const isWin10 = navigator.userAgent.includes('Windows NT 10.0');

let visStatus = {};
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

window.addEventListener("message", (event) => {
    switch (event.data.type) {
        case "sysplug-option-changed":
            if (localStorage.sysplugIntegration && isWin10) {
                viewMenuItems[4].classList.remove('disabled');
            } else {
                viewMenuItems[4].classList.add('disabled');
                if (madDeskMover.config.visMediaControls) {
                    delete madDeskMover.config.visMediaControls;
                    viewMenuItems[4].classList.remove('checkedItem');
                    delete statusArea.dataset.controllable;
                }
            }
        case "language-ready":
            if (visStatus.lastMusic === null || madDeskMover.config.visTitleMode === "static") {
                document.title = madGetString("VIS2ND_TITLE");
            }
    }
});
// #endregion

// #region Initialization
if (madDeskMover.config.visMenuAutohide) {
    viewMenuItems[0].classList.add('checkedItem');
    mainArea.style.marginTop = '0';
    menuBar.dataset.autohide = true;
}

if (madDeskMover.config.visFullscreen) {
    madEnterFullscreen();
    viewMenuItems[1].classList.add('checkedItem');

    if (madDeskMover.config.visBgMode) {
        viewMenuItems[5].classList.add('checkedItem');
        madDeskMover.bottomMost = true;
        madBringToTop(); // Trigger z-index update
    }
}

if (!madDeskMover.config.visInfoHidden) {
    viewMenuItems[2].classList.add('checkedItem');
    infoArea.style.display = 'block';
    infoMainArea.style.display = 'flex';
    if (!madDeskMover.config.visStatusHidden) {
        infoAreaSeparator.style.display = 'block';
    } else {
        infoAreaSeparator.style.display = 'none';
        statusBar.style.display = 'none';
    }
}

if (!madDeskMover.config.visStatusHidden) {
    viewMenuItems[3].classList.add('checkedItem');
    statusArea.style.display = 'flex';
    infoArea.style.display = 'block';
    statusBar.style.display = 'flex';
    if (madDeskMover.config.visInfoHidden) {
        infoMainArea.style.display = 'none';
        infoAreaSeparator.style.display = 'none';
    }
}

if (localStorage.sysplugIntegration) {
    viewMenuItems[4].classList.remove('disabled');
    if (madDeskMover.config.visMediaControls) {
        viewMenuItems[4].classList.add('checkedItem');
        statusArea.dataset.controllable = true;
    }
} else {
    delete madDeskMover.config.visMediaControls;
}

if (madDeskMover.config.visNoClientEdge) {
    miscMenuItems[0].classList.remove('checkedItem');
    mainArea.style.boxShadow = 'none';
    mainArea.style.setProperty('--main-area-margin', '0px');
}

if (madDeskMover.config.visNoFsMargin) {
    miscMenuItems[1].classList.remove('checkedItem');
    document.body.dataset.noFsMargin = true;
}

if (madDeskMover.config.visBgColor) {
    document.body.style.backgroundColor = madDeskMover.config.visBgColor;
    colorMenuItems[2].classList.add('activeStyle');
} else if (madDeskMover.config.visUseSchemeColors) {
    document.body.style.backgroundColor = 'var(--button-face)';
    colorMenuItems[1].classList.add('activeStyle');
} else {
    document.body.style.backgroundColor = 'black';
    colorMenuItems[0].classList.add('activeStyle');
}

if (madDeskMover.config.visAlbumArtSize) {
    document.querySelector(`#albumArtSizeMenu [data-value="${madDeskMover.config.visAlbumArtSize}"]`).classList.add('activeStyle');
} else {
    albumArtSizeMenuItems[0].classList.add('activeStyle');
}

if (madDeskMover.config.visTitleMode) {
    document.querySelector(`#titleOptMenu [data-value="${madDeskMover.config.visTitleMode}"]`).classList.add('activeStyle');
} else {
    titleOptMenuItems[0].classList.add('activeStyle');
}
// #endregion

// #region Menu bar
madDeskMover.menu = new MadMenu(menuBar, ['view', 'opt', 'help'], ['color', 'albumArtSize', 'titleOpt', 'misc']);

viewMenuItems[0].addEventListener('click', () => { // Autohide Menu Bar button
    if (madDeskMover.config.visMenuAutohide) {
        delete madDeskMover.config.visMenuAutohide;
        viewMenuItems[0].classList.remove('checkedItem');
        mainArea.style.marginTop = '';
        delete menuBar.dataset.autohide;
    } else {
        madDeskMover.config.visMenuAutohide = true;
        viewMenuItems[0].classList.add('checkedItem');
        mainArea.style.marginTop = '0';
        menuBar.dataset.autohide = true;
    }
});

viewMenuItems[1].addEventListener('click', () => { // Fullscreen button
    if (madDeskMover.isFullscreen) {
        madExitFullscreen();
        viewMenuItems[1].classList.remove('checkedItem');
        delete madDeskMover.config.visFullscreen;
        if (madDeskMover.config.visBgMode) {
            viewMenuItems[6].click();
        }
    } else {
        madEnterFullscreen();
        viewMenuItems[1].classList.add('checkedItem');
        madDeskMover.config.visFullscreen = true;
    }
});

viewMenuItems[2].addEventListener('click', () => { // Information button
    const currentHeight = parseInt(madDeskMover.config.height);
    if (!madDeskMover.config.visInfoHidden) {
        madDeskMover.config.visInfoHidden = true;
        viewMenuItems[2].classList.remove('checkedItem');

        let infoAreaHeight = infoMainArea.offsetHeight + 1;
        infoMainArea.style.display = 'none';
        infoAreaSeparator.style.display = 'none';
        if (madDeskMover.config.visStatusHidden) {
            infoArea.style.display = 'none';
            infoAreaHeight += 2;
        }

        if (madDeskMover.config.unscaled) {
            infoAreaHeight /= parent.scaleFactor;
        }
        madResizeTo(undefined, currentHeight - infoAreaHeight);
    } else {
        delete madDeskMover.config.visInfoHidden;
        viewMenuItems[2].classList.add('checkedItem');

        infoArea.style.display = 'block';
        infoMainArea.style.display = 'flex';
        if (!madDeskMover.config.visStatusHidden) {
            infoAreaSeparator.style.display = 'block';
        } else {
            infoAreaSeparator.style.display = 'none';
            statusBar.style.display = 'none';
        }

        let infoAreaHeight = infoMainArea.offsetHeight + 1;
        if (madDeskMover.config.visStatusHidden) {
            infoAreaHeight += 2;
        }

        if (madDeskMover.config.unscaled) {
            infoAreaHeight /= parent.scaleFactor;
        }
        madResizeTo(undefined, currentHeight + infoAreaHeight);
    }
});

viewMenuItems[3].addEventListener('click', () => { // Playback Status button
    const currentHeight = parseInt(madDeskMover.config.height);
    if (!madDeskMover.config.visStatusHidden) {
        madDeskMover.config.visStatusHidden = true;
        viewMenuItems[3].classList.remove('checkedItem');

        let statusAreaHeight = statusArea.offsetHeight + 7;
        statusArea.style.display = 'none';
        if (!madDeskMover.config.visInfoHidden) {
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

        if (madDeskMover.config.visMediaControls) {
            delete madDeskMover.config.visMediaControls;
            viewMenuItems[4].classList.remove('checkedItem');
            delete statusArea.dataset.controllable;
        }
    } else {
        delete madDeskMover.config.visStatusHidden;
        viewMenuItems[3].classList.add('checkedItem');

        statusArea.style.display = 'flex';
        infoArea.style.display = 'block';
        let statusAreaHeight = statusArea.offsetHeight + 7;
        statusBar.style.display = 'flex';
        if (!madDeskMover.config.visInfoHidden) {
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
    if (madDeskMover.config.visMediaControls) {
        delete madDeskMover.config.visMediaControls;
        viewMenuItems[4].classList.remove('checkedItem');
        delete statusArea.dataset.controllable;
    } else {
        if (localStorage.sysplugIntegration) {
            madDeskMover.config.visMediaControls = true;
            viewMenuItems[4].classList.add('checkedItem');
            statusArea.dataset.controllable = true;
            if (madDeskMover.config.visStatusHidden) {
                viewMenuItems[3].click();
            }
        } else {
            madAlert(madGetString("UI_MSG_SYSPLUG_REQUIRED"), () => {
                madOpenWindow('SysplugSetupGuide.md', true);
            }, 'info', { title: 'locid:VISUALIZER_TITLE' });
        }
    }
});

viewMenuItems[5].addEventListener('click', () => { // Show as Background button
    if (madDeskMover.config.visBgMode) {
        delete madDeskMover.config.visBgMode;
        viewMenuItems[5].classList.remove('checkedItem');
        madDeskMover.bottomMost = false;
        madBringToTop(); // Trigger z-index update
        if (madDeskMover.isFullscreen) {
            viewMenuItems[1].click();
        }
    } else {
        madDeskMover.config.visBgMode = true;
        viewMenuItems[5].classList.add('checkedItem');
        madDeskMover.bottomMost = true;
        madBringToTop(); // Trigger z-index update
        if (!madDeskMover.isFullscreen) {
            viewMenuItems[1].click();
        }
    }
});

viewMenuItems[6].addEventListener('click', () => { // Exit button
    madCloseWindow();
});

miscMenuItems[0].addEventListener('click', () => { // Show borders around the visualization area button
    if (madDeskMover.config.visNoClientEdge) {
        delete madDeskMover.config.visNoClientEdge;
        miscMenuItems[0].classList.add('checkedItem');
        mainArea.style.boxShadow = '';
        mainArea.style.setProperty('--main-area-margin', '2px');
    } else {
        madDeskMover.config.visNoClientEdge = true;
        miscMenuItems[0].classList.remove('checkedItem');
        mainArea.style.boxShadow = 'none';
        mainArea.style.setProperty('--main-area-margin', '0px');
    }
});

miscMenuItems[1].addEventListener('click', () => { // Apply margins in fullscreen mode button
    if (madDeskMover.config.visNoFsMargin) {
        delete madDeskMover.config.visNoFsMargin;
        miscMenuItems[1].classList.add('checkedItem');
        delete document.body.dataset.noFsMargin;
    } else {
        madDeskMover.config.visNoFsMargin = true;
        miscMenuItems[1].classList.remove('checkedItem');
        document.body.dataset.noFsMargin = true;
    }
});

helpMenuItems[0].addEventListener('click', () => { // About Visualizer button
    madOpenConfig('about');
});

colorMenuItems[0].addEventListener('click', () => { // Default button
    delete madDeskMover.config.visBgColor;
    delete madDeskMover.config.visUseSchemeColors;
    if (!madDeskMover.config.visFollowAlbumArt || !visStatus.lastAlbumArt) {
        document.body.style.backgroundColor = 'black';
    }
    document.querySelector('#colorMenu .activeStyle').classList.remove('activeStyle');
    colorMenuItems[0].classList.add('activeStyle');
});

colorMenuItems[1].addEventListener('click', () => { // Follow Color Scheme button
    madDeskMover.config.visUseSchemeColors = true;
    delete madDeskMover.config.visBgColor;
    if (!madDeskMover.config.visFollowAlbumArt || !visStatus.lastAlbumArt) {
        document.body.style.backgroundColor = 'var(--button-face)';
    }
    document.querySelector('#colorMenu .activeStyle').classList.remove('activeStyle');
    colorMenuItems[1].classList.add('activeStyle');
});

colorMenuItems[2].addEventListener('click', () => { // Custom Color button
    if (madDeskMover.config.visUseSchemeColors) {
        madDeskMover.config.visBgColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
        delete madDeskMover.config.visUseSchemeColors;
    } else if (!madDeskMover.config.visBgColor) {
        madDeskMover.config.visBgColor = "#000000";
    }
    if (!madDeskMover.config.visFollowAlbumArt || !visStatus.lastAlbumArt) {
        document.body.style.backgroundColor = madDeskMover.config.visBgColor;
    }
    madOpenColorPicker(madDeskMover.config.visBgColor, true, function (color) {
        madDeskMover.config.visBgColor = color;
        if (!madDeskMover.config.visFollowAlbumArt || !visStatus.lastAlbumArt) {
            document.body.style.backgroundColor = color;
        }
    });
    document.querySelector('#colorMenu .activeStyle').classList.remove('activeStyle');
    colorMenuItems[2].classList.add('activeStyle');
});

colorMenuItems[3].addEventListener('click', () => { // Follow Album Art button
    if (madDeskMover.config.visFollowAlbumArt) {
        delete madDeskMover.config.visFollowAlbumArt;
        colorMenuItems[3].classList.remove('checkedItem');
        if (madDeskMover.config.visBgColor) {
            document.body.style.backgroundColor = madDeskMover.config.visBgColor;
        } else if (madDeskMover.config.visUseSchemeColors) {
            document.body.style.backgroundColor = 'var(--button-face)';
        } else {
            document.body.style.backgroundColor = 'black';
        }
    } else {
        madDeskMover.config.visFollowAlbumArt = true;
        colorMenuItems[3].classList.add('checkedItem');
        if (visStatus.lastAlbumArt) {
            document.body.style.backgroundColor = visStatus.lastAlbumArt.primaryColor;
        }
    }
});

for (const item of albumArtSizeMenuItems) {
    item.addEventListener('click', () => {
        madDeskMover.config.visAlbumArtSize = item.dataset.value;
        updateAlbumArtSize();
        document.querySelector('#albumArtSizeMenu .activeStyle').classList.remove('activeStyle');
        item.classList.add('activeStyle');
    });
}

for (const item of titleOptMenuItems) {
    item.addEventListener('click', () => {
        madDeskMover.config.visTitleMode = item.dataset.value;
        updateTitle();
        document.querySelector('#titleOptMenu .activeStyle').classList.remove('activeStyle');
        item.classList.add('activeStyle');
    });
}
// #endregion

// #region Initialization - Attach to Primary
let connected = false;

top.addEventListener('load', init);

if (top.document.readyState === 'complete') {
    init();
}

function init() {
    if (top.visDeskMover) {
        connected = true;
        const visDeskMover = top.visDeskMover;
        visStatus = visDeskMover.visStatus;
        visDeskMover.addEventListener('mediaStatus', wallpaperMediaStatusListener);
        visDeskMover.addEventListener('mediaProperties', wallpaperMediaPropertiesListener);
        visDeskMover.addEventListener('mediaTimeline', wallpaperMediaTimelineListener);
        visDeskMover.addEventListener('mediaPlayback', wallpaperMediaPlaybackListener);
        visDeskMover.addEventListener('mediaThumbnail', wallpaperMediaThumbnailListener);
        visDeskMover.addEventListener('load', init, null, 'iframe');
        wallpaperMediaStatusListener();
        wallpaperMediaPropertiesListener();
        wallpaperMediaTimelineListener();
        wallpaperMediaPlaybackListener();
        wallpaperMediaThumbnailListener();
    } else {
        alertArea.style.display = 'block';
    }
}

setInterval(() => {
    if (!top.visDeskMover && connected) {
        alertArea.style.display = 'block';
        alertText.locId = "VIS2ND_NO_PRIMARY";
        connected = false;
        visStatus = {};
        wallpaperMediaPropertiesListener();
        wallpaperMediaThumbnailListener();
    } else if (top.visDeskMover && !connected) {
        alertArea.style.display = 'none';
        init();
    } else if (top.visDeskMover && connected) {
        if (top.visDeskMover.visStatus !== visStatus) {
            init();
        }
    }
}, 2000);
// #endregion

// #region Functions
async function mediaControl(action) {
    if (!localStorage.sysplugIntegration || !madDeskMover.config.visMediaControls) {
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

function wallpaperMediaStatusListener() {
    if (!visStatus.mediaIntegrationAvailable) {
        wallpaperMediaPropertiesListener();
        wallpaperMediaThumbnailListener();
        alertArea.style.display = 'block';
        alertText.locId = "VISUALIZER_NO_MEDINT_MSG";
    } else {
        alertArea.style.display = 'none';
    }
}

function wallpaperMediaPropertiesListener() {
    const event = visStatus.lastMusic;
    if (!event || !event.title) {
        document.title = madGetString("VIS2ND_TITLE");
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
        return;
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
}

function wallpaperMediaTimelineListener() {
    const event = visStatus.timeline;
    if (!event || event.duration === 0) {
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

function wallpaperMediaPlaybackListener() {
    switch (visStatus.state) {
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
        case undefined:
            delete playIcon.dataset.active;
            delete pauseIcon.dataset.active;
            stopIcon.dataset.active = true;
            pauseIcon.dataset.disabled = true;
            statusText.locId = "VISUALIZER_STATUS_STOPPED";
    }
}

function wallpaperMediaThumbnailListener() {
    const event = visStatus.lastAlbumArt;
    if (!event || event.thumbnail === 'data:image/png;base64,' || !event.thumbnail || !visStatus.mediaIntegrationAvailable) {
        albumArt.style.display = 'none';
        return;
    }
    albumArt.style.display = 'block';
    albumArt.src = event.thumbnail;
    if (madDeskMover.config.visFollowAlbumArt) {
        document.body.style.backgroundColor = event.primaryColor;
    }
    const image = new Image();
    image.onload = () => {
        event.width = image.width;
        event.height = image.height;
        updateAlbumArtSize();
    }
    image.src = event.thumbnail;
}

function updateTitle(musicInfo = visStatus.lastMusic) {
    const titleMode = madDeskMover.config.visTitleMode;
    if (!musicInfo || titleMode === "static") {
        document.title = madGetString("VIS2ND_TITLE");
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
    switch (madDeskMover.config.visAlbumArtSize) {
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
// #endregion