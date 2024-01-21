// main.js for ModernActiveDesktop Visualizer
// Made by Ingan121
// Licensed under the MIT License

'use strict';

if (parent === window) {
    alert("This page is not meant to be opened directly. Please open it from ModernActiveDesktop.");
} else if (!frameElement) {
    alert("MADVis is being cross-origin restricted. Please run ModernActiveDesktop with a web server.");
} else if (madRunningMode !== 1) {
    madAlert("Sorry, but the visualizer is only available for Wallpaper Engine.", null, "error");
    madCloseWindow();
} else if (parent.visDeskMover && parent.visDeskMover !== madDeskMover) {
    madAlert("Only one instance of the visualizer can be open at a time.", null, "warning");
    madCloseWindow();
} else if (localStorage.madesktopVisUnavailable) {
    // Although the media integration is available, it is not reliable to be used in MAD
    // because we don't have a way to check if the media listener is invalidated or not
    // This happens frequently when an iframe loads a page or gets closed
    madAlert("Audio recording is not enabled. Please enable it in the Wallpaper Engine properties panel.", null, "error");
    madCloseWindow();
} else {
    parent.visDeskMover = madDeskMover;
    madDeskMover.isVisualizer = true;
}

const schemeElement = document.getElementById("scheme");
const menuBar = document.getElementById('menuBar');

const mainArea = document.getElementById('mainArea');
const albumArt = document.getElementById('albumArt');
const visualizer = document.getElementById('visualizer');

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
let mediaIntegrationAvailable = true;

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
        event.preventDefault(); // Prevent focusout event
        madDeskMover.wcMouseDown(); // But keep the window activation working
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

playIcon.addEventListener('click', () => {
    if (!playIcon.dataset.active) {
        mediaControl('playpause');
    }
});

pauseIcon.addEventListener('click', () => {
    if (!pauseIcon.dataset.active) {
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

if (localStorage.sysplugIntegration) {
    viewMenuItems[3].classList.remove('disabled');
    if (localStorage.madesktopVisMediaControls) {
        viewMenuItems[3].classList.add('checkedItem');
        statusArea.dataset.controllable = true;
    }
} else {
    delete localStorage.madesktopVisMediaControls;
}

if (localStorage.madesktopVisOnlyAlbumArt) {   
    visMenuItems[0].classList.add('activeStyle');
    visMenuItems[1].classList.remove('activeStyle');
}

visMenuItems[0].addEventListener('click', () => { // Album Art button
    closeMenu('vis');
    if (!mediaIntegrationAvailable) {
        madAlert('Media integration support is disabled. Please enable it in Wallpaper Engine -> General -> Media integration support.');
        return;
    }

    localStorage.madesktopVisOnlyAlbumArt = true;
    visMenuItems[0].classList.add('activeStyle');
    visMenuItems[1].classList.remove('activeStyle');
    visMenuItems[2].classList.remove('activeStyle');
    visualizer.style.opacity = '0';
    albumArt.style.opacity = '1';
    localStorage.madesktopVisShowAlbumArt = true;
    delete localStorage.madesktopVisDimAlbumArt;
    configChanged();
});

visMenuItems[1].addEventListener('click', () => { // WMP Bars button
    closeMenu('vis');
    delete localStorage.madesktopVisOnlyAlbumArt;
    visMenuItems[0].classList.remove('activeStyle');
    visMenuItems[1].classList.add('activeStyle');
    visMenuItems[2].classList.remove('activeStyle');
    visualizer.style.opacity = '1';
});

visMenuItems[2].addEventListener('click', () => { // MilkDrop button
    closeMenu('vis');
});

visMenuItems[3].addEventListener('click', () => { // Exit button
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
    if (!mediaIntegrationAvailable) {
        madAlert('Media integration support is disabled. Please enable it in Wallpaper Engine -> General -> Media integration support.');
        return;
    }

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
    if (!mediaIntegrationAvailable) {
        madAlert('Media integration support is disabled. Please enable it in Wallpaper Engine -> General -> Media integration support.');
        return;
    }

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

        if (localStorage.madesktopVisMediaControls) {
            delete localStorage.madesktopVisMediaControls;
            viewMenuItems[3].classList.remove('checkedItem');
            delete statusArea.dataset.controllable;
        }
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

viewMenuItems[3].addEventListener('click', () => { // Enable Media Controls button
    closeMenu('view');
    if (!mediaIntegrationAvailable) {
        madAlert('Media integration support is disabled. Please enable it in Wallpaper Engine -> General -> Media integration support.');
        return;
    }

    if (localStorage.madesktopVisMediaControls) {
        delete localStorage.madesktopVisMediaControls;
        viewMenuItems[3].classList.remove('checkedItem');
        delete statusArea.dataset.controllable;
    } else {
        if (localStorage.sysplugIntegration) {
            localStorage.madesktopVisMediaControls = true;
            viewMenuItems[3].classList.add('checkedItem');
            statusArea.dataset.controllable = true;
            if (!localStorage.madesktopVisStatusShown) {
                viewMenuItems[2].click();
            }
        } else {
            madAlert('This feature requires system plugin integration.', () => {
                madOpenWindow('SysplugSetupGuide.md', true);
            });
        }
    }
});

optMenuItems[0].addEventListener('click', () => { // Configure Visualization button
    closeMenu('opt');
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 80 + 'px';
    const configWindow = madOpenWindow('apps/visualizer/wmpvis/config.html', true, '400px', '260px', 'wnd', false, top, left, true);
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

function mediaControl(action, title = window.lastMusic.title) {
    if (!localStorage.sysplugIntegration || !localStorage.madesktopVisMediaControls) {
        return;
    }
    fetch(`http://localhost:3031/${action}`, { method: 'POST', body: title })
        .then(response => response.text())
        .then(responseText => {
            if (responseText !== 'OK') {
                madAlert('An error occurred while processing the media control request.<br>' + responseText);
            }
        })
        .catch(error => {
            madAlert("System plugin is not running. Please make sure you have installed it properly.", function () {
                madOpenWindow('SysplugSetupGuide.md', true);
            }, "warning");
        });
}

function wallpaperMediaStatusListener(event) {
    if (!event.enabled) {
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
        
        if (localStorage.madesktopVisInfoShown) {
            viewMenuItems[1].click();
        }
        if (localStorage.madesktopVisStatusShown) {
            viewMenuItems[2].click();
        }
        if (localStorage.madesktopVisMediaControls) {
            viewMenuItems[3].click();
        }
        viewMenuItems[1].classList.add('disabled');
        viewMenuItems[2].classList.add('disabled');
        viewMenuItems[3].classList.add('disabled');

        delete localStorage.madesktopVisOnlyAlbumArt;
        visMenuItems[0].classList.remove('activeStyle');
        visMenuItems[1].classList.add('activeStyle');
        visualizer.style.opacity = '1';
        visMenuItems[0].classList.add('disabled');
    } else {
        viewMenuItems[1].classList.remove('disabled');
        viewMenuItems[2].classList.remove('disabled');
        if (localStorage.sysplugIntegration) {
            viewMenuItems[3].classList.remove('disabled');
        }
        visMenuItems[0].classList.remove('disabled');
    }
    mediaIntegrationAvailable = event.enabled;
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
    if (artist) {
        document.title = event.title + ' - ' + artist;
    } else {
        document.title = event.title;
    }

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
        albumArt.src = event.thumbnail;
    }
    if (localStorage.madesktopVisFollowAlbumArt) {
        mainArea.style.backgroundColor = event.primaryColor;
    }
    window.lastAlbumArt = event;
}

function configChanged() {
    if (localStorage.madesktopVisShowAlbumArt && window.lastAlbumArt) {
        albumArt.src = lastAlbumArt.thumbnail;
    } else {
        albumArt.src = '';
    }

    if (localStorage.madesktopVisFollowAlbumArt && window.lastAlbumArt) {
        mainArea.style.backgroundColor = lastAlbumArt.primaryColor;
    } else if (localStorage.madesktopVisUseSchemeColors) {
        updateSchemeColor();
    } else {
        mainArea.style.backgroundColor = localStorage.madesktopVisBgColor || 'black';
    }

    if (localStorage.madesktopVisDimAlbumArt) {
        albumArt.style.opacity = '0.5';
    } else {
        albumArt.style.opacity = '1';
    }
}

window.addEventListener('load', updateSchemeColor);

window.addEventListener("message", (event) => {
    switch (event.data.type) {
        case "scheme-updated":
            if (schemeElement.href.startsWith('file:///') && localStorage.madesktopVisUseSchemeColors && (!window.lastAlbumArt || !localStorage.madesktopVisFollowAlbumArt)) {
                location.reload();
            } else {
                updateSchemeColor();
            }
            break;
        case "sysplug-option-changed":
            if (localStorage.sysplugIntegration) {
                viewMenuItems[3].classList.remove('disabled');
            } else {
                viewMenuItems[3].classList.add('disabled');
                if (localStorage.madesktopVisMediaControls) {
                    delete localStorage.madesktopVisMediaControls;
                    viewMenuItems[3].classList.remove('checkedItem');
                    delete statusArea.dataset.controllable;
                }
            }
    }
});

function updateSchemeColor() {
    window.schemeBarColor = getComputedStyle(document.documentElement).getPropertyValue('--hilight');
    window.schemeTopColor = getComputedStyle(document.documentElement).getPropertyValue('--button-text');
    if (localStorage.madesktopVisUseSchemeColors && (!window.lastAlbumArt || !localStorage.madesktopVisFollowAlbumArt)) {
        mainArea.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
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