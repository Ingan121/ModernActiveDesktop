'use strict';

const schemeElement = document.getElementById("scheme");
const menuBar = document.getElementById('menuBar');
const visualizer = document.getElementById('visualizer');

const statusArea = document.getElementById('statusArea');
const playIcon = document.getElementById('play');
const pauseIcon = document.getElementById('pause');
const stopIcon = document.getElementById('stop');
const seekBar = document.getElementById('seekBar');
const seekHandle = document.getElementById('seekHandle');

const infoArea = document.getElementById('infoArea');
const infoMainArea = document.getElementById('infoMainArea');
const titleText = document.getElementById('title');
const subtitleText = document.getElementById('subtitle');
const artistText = document.getElementById('artist');
const albumText = document.getElementById('album');
const albumArtistText = document.getElementById('albumArtist');
const genreText = document.getElementById('genre');

const titleValue = document.getElementById('titleValue').querySelector('p');
const subtitleValue = document.getElementById('subtitleValue').querySelector('p');
const artistValue = document.getElementById('artistValue').querySelector('p');
const albumValue = document.getElementById('albumValue').querySelector('p');
const albumArtistValue = document.getElementById('albumArtistValue').querySelector('p');
const genreValue = document.getElementById('genreValue').querySelector('p');

const infoAreaSeparator = document.getElementById('infoAreaSeparator');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText').querySelector('p');
const timeText = document.getElementById('timeText').querySelector('p');

const visMenuBtn = document.getElementById('visMenuBtn');
const visMenuBg = document.getElementById('visMenuBg');
const visMenu = document.getElementById('visMenu');
const visMenuItems = visMenu.querySelectorAll('.contextMenuItem');

const viewMenuBtn = document.getElementById('viewMenuBtn');
const viewMenuBg = document.getElementById('viewMenuBg');
const viewMenu = document.getElementById('viewMenu');
const viewMenuItems = viewMenu.querySelectorAll('.contextMenuItem');

const optMenuBtn = document.getElementById('optMenuBtn');
const optMenuBg = document.getElementById('optMenuBg');
const optMenu = document.getElementById('optMenu');
const optMenuItems = optMenu.querySelectorAll('.contextMenuItem');

const helpMenuBtn = document.getElementById('helpMenuBtn');
const helpMenuBg = document.getElementById('helpMenuBg');
const helpMenu = document.getElementById('helpMenu');
const helpMenuItems = helpMenu.querySelectorAll('.contextMenuItem');

let mouseOverMenu = false;

for (const menuName of ['vis', 'view', 'opt', 'help']) {
    const menuBtn = document.getElementById(menuName + 'MenuBtn');
    const menuBg = document.getElementById(menuName + 'MenuBg');

    menuBtn.addEventListener('pointerdown', (event) => {
        if (menuBtn.dataset.active) {
            mouseOverMenu = false;
            closeMenu(menuName);
            return;
        }
        openMenu(menuName);
        event.preventDefault();
    });

    menuBg.addEventListener('focusout', () => {
        closeMenu(menuName);
    });

    menuBtn.addEventListener('mouseover', () => {
        if (menuBar.dataset.active) {
            mouseOverMenu = true;
            openMenu(menuName);
        }
    });

    menuBtn.addEventListener('mouseout', () => {
        mouseOverMenu = false;
    });
}

if (localStorage.madesktopVisMenuAutohide) {
    viewMenuItems[0].classList.add('checkedItem');
    menuBar.style.position = 'absolute';
    menuBar.style.opacity = '0';
    visualizer.addEventListener('load', () => {
        visualizer.contentDocument.dispatchEvent(new Event('resize')); // Resize the visualizer to fill the space left by the menu bar
    }, { once: true });
}

if (localStorage.madesktopVisInfoShown) {
    viewMenuItems[1].classList.add('checkedItem');
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
    viewMenuItems[2].classList.add('checkedItem');
    statusArea.style.display = 'flex';
    infoArea.style.display = 'block';
    statusBar.style.display = 'flex';
    if (!localStorage.madesktopVisInfoShown) {
        infoMainArea.style.display = 'none';
        infoAreaSeparator.style.display = 'none';
    }
}

visMenuItems[2].addEventListener('click', () => { // Exit button
    madCloseWindow();
});

viewMenuItems[0].addEventListener('click', () => { // Autohide Menu Bar button
    closeMenu('view');
    if (localStorage.madesktopVisMenuAutohide) {
        delete localStorage.madesktopVisMenuAutohide;
        viewMenuItems[0].classList.remove('checkedItem');
        menuBar.style.position = '';
        menuBar.style.opacity = '';
    } else {
        localStorage.madesktopVisMenuAutohide = true;
        viewMenuItems[0].classList.add('checkedItem');
        menuBar.style.position = 'absolute';
        menuBar.style.opacity = '0';
    }
});

viewMenuItems[1].addEventListener('click', () => { // Information button
    closeMenu('view');
    const currentWidth = parseInt(madDeskMover.config.width);
    const currentHeight = parseInt(madDeskMover.config.height);
    if (localStorage.madesktopVisInfoShown) {
        delete localStorage.madesktopVisInfoShown;
        viewMenuItems[1].classList.remove('checkedItem');

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
        madResizeTo(currentWidth, currentHeight - infoAreaHeight);
    } else {
        localStorage.madesktopVisInfoShown = true;
        viewMenuItems[1].classList.add('checkedItem');

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
        madResizeTo(currentWidth, currentHeight + infoAreaHeight);
    }
});

viewMenuItems[2].addEventListener('click', () => { // Playback Status button
    closeMenu('view');
    const currentWidth = parseInt(madDeskMover.config.width);
    const currentHeight = parseInt(madDeskMover.config.height);
    if (localStorage.madesktopVisStatusShown) {
        delete localStorage.madesktopVisStatusShown;
        viewMenuItems[2].classList.remove('checkedItem');

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
    } else {
        localStorage.madesktopVisStatusShown = true;
        viewMenuItems[2].classList.add('checkedItem');

        statusArea.style.display = 'flex';
        infoArea.style.display = 'block';
        let statusAreaHeight = statusArea.offsetHeight + 7;
        statusBar.style.display = 'flex';
        if (localStorage.madesktopVisInfoShown) {
            infoAreaSeparator.style.display = 'block';
            statusAreaHeight += statusBar.offsetHeight + 1;
        } else {
            statusAreaHeight += infoArea.offsetHeight;
            infoAreaSeparator.style.display = 'none';
        }

        if (madDeskMover.config.unscaled) {
            statusAreaHeight /= parent.scaleFactor;
        }
        madResizeTo(currentWidth, currentHeight + statusAreaHeight);
    }
});

optMenuItems[0].addEventListener('click', () => { // Configure Visualization button
    closeMenu('opt');
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 80 + 'px';
    const configWindow = madOpenWindow('apps/visualizer/wmpvis/config.html', true, '400px', '250px', 'wnd', false, top, left, true);
    configWindow.windowElement.addEventListener('load', () => {
        configWindow.windowElement.contentWindow.targetDeskMover = madDeskMover;
    });
});

helpMenuItems[0].addEventListener('click', () => { // About button
    closeMenu('help');
    madOpenWindow('apps/madconf/about.html', true);
});

function openMenu(menuName) {
    const menuBtn = document.getElementById(menuName + 'MenuBtn');
    const menuBg = document.getElementById(menuName + 'MenuBg');

    switch (localStorage.madesktopCmAnimation) {
        case 'none':
            menuBg.style.animation = 'none';
            break;
        case 'slide':
            menuBg.style.animation = 'cmDropdown 0.25s linear';
            break;
        case 'fade':
            menuBg.style.animation = 'fade 0.2s';
    }
    menuBg.style.display = 'block';
    menuBar.dataset.active = true;
    menuBtn.dataset.active = true;
    menuBg.focus();
}

function closeMenu(menuName) {
    const menuBtn = document.getElementById(menuName + 'MenuBtn');
    const menuBg = document.getElementById(menuName + 'MenuBg');
    menuBg.style.display = 'none';
    delete menuBtn.dataset.active;
    if (!mouseOverMenu) {
        delete menuBar.dataset.active;
    }
}

function wallpaperMediaStatusListener(event) {
    if (!event.properties) {
        madCloseWindow();
    }
}

function wallpaperMediaPropertiesListener(event) {
    if (!event.title) {
        document.title = 'Visualization';
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
        statusText.textContent = 'Stopped';
        delete playIcon.dataset.active;
        delete pauseIcon.dataset.active;
        stopIcon.dataset.active = true;
        seekBar.style.backgroundColor = 'transparent';
        seekHandle.style.display = 'none';
        timeText.parentElement.style.display = 'none';
        return;
    }

    let artist = event.artist;
    if (artist.endsWith(' - Topic')) { // YT auto-generated stuff
        artist = artist.slice(0, -7);
    }
    document.title = event.title + ' - ' + artist;
    titleValue.textContent = event.title;
    subtitleValue.textContent = event.subtitle;
    artistValue.textContent = artist;
    albumValue.textContent = event.album;
    albumArtistValue.textContent = event.albumArtist;
    genreValue.textContent = event.genre;

    if (event.subtitle) {
        subtitleText.style.display = 'block';
    } else {
        subtitleText.style.display = 'none';
    }
    if (event.artist) {
        artistText.style.display = 'block';
    } else {
        artistText.style.display = 'none';
    }
    if (event.album) {
        albumText.style.display = 'block';
    } else {
        albumText.style.display = 'none';
    }
    if (event.albumArtist) {
        albumArtistText.style.display = 'block';
    } else {
        albumArtistText.style.display = 'none';
    }
    if (event.genre) {
        genreText.style.display = 'block';
    } else {
        genreText.style.display = 'none';
    }

    // New music; consider we might not get a timeline event
    seekBar.style.backgroundColor = 'transparent';
    seekHandle.style.display = 'none';
    timeText.parentElement.style.display = 'none';

    window.lastMusic = event;
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
            statusText.textContent = 'Playing';
            break;
        case window.wallpaperMediaIntegration.PLAYBACK_PAUSED:
            delete playIcon.dataset.active;
            pauseIcon.dataset.active = true;
            delete stopIcon.dataset.active;
            statusText.textContent = 'Paused';
            break;
        case window.wallpaperMediaIntegration.PLAYBACK_STOPPED:
            delete playIcon.dataset.active;
            delete pauseIcon.dataset.active;
            stopIcon.dataset.active = true;
            statusText.textContent = 'Stopped';
    }
}

function wallpaperMediaThumbnailListener(event) {
    if (event.thumbnail === 'data:image/png;base64,') {
        window.lastAlbumArt = null;
        configChanged();
        return;
    }
    if (localStorage.madesktopVisShowAlbumArt) {
        visualizer.style.backgroundImage = `url(${event.thumbnail})`;
    }
    if (localStorage.madesktopVisFollowAlbumArt) {
        visualizer.style.backgroundColor = event.primaryColor;
    }
    window.lastAlbumArt = event;
}

function configChanged() {
    if (localStorage.madesktopVisShowAlbumArt && window.lastAlbumArt) {
        visualizer.style.backgroundImage = `url(${lastAlbumArt.thumbnail})`;
    } else {
        visualizer.style.backgroundImage = '';
    }
    if (localStorage.madesktopVisFollowAlbumArt && window.lastAlbumArt) {
        visualizer.style.backgroundColor = lastAlbumArt.primaryColor;
    } else if (localStorage.madesktopVisUseSchemeColors) {
        updateSchemeColor();
    } else {
        visualizer.style.backgroundColor = localStorage.madesktopVisBgColor || 'black';
    }
}

window.addEventListener('load', updateSchemeColor);

window.addEventListener("message", (event) => {
    if (event.data.type === "scheme-updated") {
        if (schemeElement.href.startsWith('file:///') && localStorage.madesktopVisUseSchemeColors && (!window.lastAlbumArt || !localStorage.madesktopVisFollowAlbumArt)) {
            location.reload();
        } else {
            updateSchemeColor();
        }
    }
});

function updateSchemeColor() {
    window.schemeBarColor = getComputedStyle(document.documentElement).getPropertyValue('--hilight');
    window.schemeTopColor = getComputedStyle(document.documentElement).getPropertyValue('--button-text');
    if (localStorage.madesktopVisUseSchemeColors && (!window.lastAlbumArt || !localStorage.madesktopVisFollowAlbumArt)) {
        visualizer.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
    }
}

function setupListeners() {
    window.wallpaperRegisterMediaStatusListener(wallpaperMediaStatusListener);
    window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener);
    window.wallpaperRegisterMediaPlaybackListener(wallpaperMediaPlaybackListener);
    window.wallpaperRegisterMediaTimelineListener(wallpaperMediaTimelineListener);
    window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener);
}

configChanged();
setupListeners();