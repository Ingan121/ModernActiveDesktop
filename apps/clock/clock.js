// clock.js for ModernActiveDesktop Clock
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const dynQueryStyle = document.getElementById('dynQuery');
const mainArea = document.getElementById('mainArea');
const clockCanvas = document.getElementById('analogClock');
const clockCtx = clockCanvas.getContext('2d');

const digitalClock = document.getElementById('digitalClock');
const digitalClockTime = document.getElementById('digitalClockTime');
const digitalClockDate = document.getElementById('digitalClockDate');

const menuBar = document.getElementById('menuBar');
const settingsMenuBtn = document.getElementById('settingsMenuBtn');
const settingsMenuBg = document.getElementById('settingsMenuBg');
const settingsMenu = document.getElementById('settingsMenu');
const settingsMenuItems = settingsMenu.querySelectorAll('.contextMenuItem');
const confLabel = document.getElementById('confLabel');

// Define which angles to invert the highlight and shadow colors
const invertBegin = (Math.PI / 6) * 4.5 - Math.PI / 2;
const invertEnd = (Math.PI / 6) * 11 - Math.PI / 2;

let clockTitle = madGetString("CLOCK_TITLE")
let dblClickTimer, dblClickPositon = null, isTitleHidden = false;
let timeOptions = { timeStyle: 'medium' };

madDeskMover.menu = new MadMenu(menuBar, ['settings']);

// Config migration
let migrated = false;
if (localStorage.madesktopClockDigital) {
    madDeskMover.config.clockDigital = true;
    migrated = true;
}
if (localStorage.madesktopClock24H) {
    madDeskMover.config.clock24H = true;
    migrated = true;
}
if (localStorage.madesktopClockGMT) {
    madDeskMover.config.clockGMT = true;
    migrated = true;
}
if (localStorage.madesktopClockHideSeconds) {
    madDeskMover.config.clockHideSeconds = true;
    migrated = true;
}
if (localStorage.madesktopClockHideDate) {
    madDeskMover.config.clockHideDate = true;
    migrated = true;
}
if (localStorage.madesktopClockMainColor) {
    madDeskMover.config.clockMainColor = localStorage.madesktopClockMainColor;
    migrated = true;
}
if (localStorage.madesktopClockLightColor) {
    madDeskMover.config.clockLightColor = localStorage.madesktopClockLightColor;
    migrated = true;
}
if (localStorage.madesktopClockHilightColor) {
    madDeskMover.config.clockHilightColor = localStorage.madesktopClockHilightColor;
    migrated = true;
}
if (localStorage.madesktopClockShadowColor) {
    madDeskMover.config.clockShadowColor = localStorage.madesktopClockShadowColor;
    migrated = true;
}
if (localStorage.madesktopClockDkShadowColor) {
    madDeskMover.config.clockDkShadowColor = localStorage.madesktopClockDkShadowColor;
    migrated = true;
}
if (localStorage.madesktopClockBackgroundColor) {
    madDeskMover.config.clockBackgroundColor = localStorage.madesktopClockBackgroundColor;
    migrated = true;
}
if (localStorage.madesktopClockNoOutline) {
    madDeskMover.config.clockNoOutline = true;
    migrated = true;
}
if (localStorage.madesktopClockFont) {
    madDeskMover.config.clockFont = localStorage.madesktopClockFont;
    migrated = true;
}
if (migrated) {
    // Let all running clocks migrate their settings
    top.addEventListener('load', () => {
        setTimeout(() => {
            delete localStorage.madesktopClockDigital;
            delete localStorage.madesktopClock24H;
            delete localStorage.madesktopClockGMT;
            delete localStorage.madesktopClockHideSeconds;
            delete localStorage.madesktopClockHideDate;
            delete localStorage.madesktopClockMainColor;
            delete localStorage.madesktopClockLightColor;
            delete localStorage.madesktopClockHilightColor;
            delete localStorage.madesktopClockShadowColor;
            delete localStorage.madesktopClockDkShadowColor;
            delete localStorage.madesktopClockBackgroundColor;
            delete localStorage.madesktopClockNoOutline;
            delete localStorage.madesktopClockFont;
        }, 1000);
    });
}

settingsMenuItems[0].addEventListener('click', () => { // Analog button
    delete madDeskMover.config.clockDigital;
    settingsMenuItems[0].classList.add('activeStyle');
    settingsMenuItems[1].classList.remove('activeStyle');
    settingsMenuItems[4].classList.add('disabled');
    settingsMenuItems[4].classList.remove('checkedItem');
    confLabel.locId = "CLOCK_MENUITEM_SET_COLORS";
    clockCanvas.style.display = 'block';
    digitalClock.style.display = 'none';
    updateSize();
});

settingsMenuItems[1].addEventListener('click', () => { // Digital button
    madDeskMover.config.clockDigital = true;
    settingsMenuItems[1].classList.add('activeStyle');
    settingsMenuItems[0].classList.remove('activeStyle');
    settingsMenuItems[4].classList.remove('disabled');
    confLabel.locId = "CLOCK_MENUITEM_SET_FONT";
    clockCanvas.style.display = 'none';
    digitalClock.style.display = 'table';
    updateSize();

    if (madDeskMover.config.clock24H) {
        settingsMenuItems[4].classList.add('checkedItem');
    }
});

settingsMenuItems[2].addEventListener('click', () => { // Set Font / Colors button
    const left = parseInt(madDeskMover.config.xPos) + 20 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 50 + 'px';
    const options = {
        left, top, width: '380px', height: '173px',
        aot: true, unresizable: true, noIcon: true
    };
    const configWindow = madOpenWindow('apps/clock/config.html', true, options);
    configWindow.windowElement.addEventListener('load', () => {
        configWindow.windowElement.contentWindow.targetDeskMover = madDeskMover;
        configWindow.windowElement.contentWindow.init();
    });
});

settingsMenuItems[3].addEventListener('click', function () { // GMT button
    if (madDeskMover.config.clockGMT) {
        this.classList.remove('checkedItem');
        delete madDeskMover.config.clockGMT;
    } else {
        this.classList.add('checkedItem');
        madDeskMover.config.clockGMT = true;
    }
    drawClock();
});

settingsMenuItems[4].addEventListener('click', function () { // 24-Hours button
    if (!madDeskMover.config.clockDigital) {
        return;
    }

    if (madDeskMover.config.clock24H) {
        this.classList.remove('checkedItem');
        delete madDeskMover.config.clock24H;
    } else {
        this.classList.add('checkedItem');
        madDeskMover.config.clock24H = true;
    }
    updateClockOpts();
    drawClock();
});

settingsMenuItems[5].addEventListener('click', () => { // No Title button
    toggleTitle();
});

settingsMenuItems[6].addEventListener('click', function () { // Seconds button
    if (madDeskMover.config.clockHideSeconds) {
        this.classList.add('checkedItem');
        delete madDeskMover.config.clockHideSeconds;
    } else {
        this.classList.remove('checkedItem');
        madDeskMover.config.clockHideSeconds = true;
    }
    updateClockOpts();
    drawClock();
});

settingsMenuItems[7].addEventListener('click', function () { // Date button
    if (madDeskMover.config.clockHideDate) {
        this.classList.add('checkedItem');
        delete madDeskMover.config.clockHideDate;
    } else {
        this.classList.remove('checkedItem');
        madDeskMover.config.clockHideDate = true;
    }
    drawClock();
});

settingsMenuItems[8].addEventListener('click', () => { // About Clock button
    madOpenConfig('about');
});

if (madDeskMover.config.clockDigital) {
    settingsMenuItems[0].classList.remove('activeStyle');
    settingsMenuItems[1].classList.add('activeStyle');
    settingsMenuItems[4].classList.remove('disabled');
    confLabel.locId = "CLOCK_MENUITEM_SET_FONT";
    clockCanvas.style.display = 'none';
    digitalClock.style.display = 'table';

    if (madDeskMover.config.clock24H) {
        settingsMenuItems[4].classList.add('checkedItem');
    }
}

if (madDeskMover.config.clockGMT) {
    settingsMenuItems[3].classList.add('checkedItem');
}

if (madDeskMover.config.clockHideSeconds) {
    settingsMenuItems[6].classList.remove('checkedItem');
}

if (madDeskMover.config.clockHideDate) {
    settingsMenuItems[7].classList.remove('checkedItem');
}

let colors = {
    main: madDeskMover.config.clockMainColor || "#008080",
    light: madDeskMover.config.clockLightColor || "#00ffff",
    hilight: madDeskMover.config.clockHilightColor || "#ffffff",
    shadow: madDeskMover.config.clockShadowColor || "#a0a0a0",
    dkShadow: madDeskMover.config.clockDkShadowColor || "#000000",
    background: madDeskMover.config.clockBackgroundColor || getComputedStyle(document.documentElement).getPropertyValue('--button-face')
};

if (madDeskMover.config.noFrames) {
    toggleTitle();
}

updateSize();

function updateSize() {
    if (madDeskMover.config.clockDigital) {
        // Unscale this to get consistent media query results
        // It's scaled appropriately with vw/vh anyway
        digitalClock.style.zoom = 1 / madScaleFactor;
        // And CSS doesn't allow variables in media queries, damn it
        if (madDeskMover.config.clockNoOutline) {
            dynQueryStyle.textContent = '';
        } else {
            dynQueryStyle.textContent = `
                @media (min-width: ${315 * madScaleFactor}px) and (min-height: ${129 * madScaleFactor}px) {
                    #digitalClockTime {
                        color: var(--button-face);
                        text-shadow: -1px -1px 0 var(--button-hilight), 2px 2px 0 var(--button-shadow);
                    }
                }`;
        }
        if (madDeskMover.config.clockFont) {
            digitalClock.style.fontFamily = `"${madDeskMover.config.clockFont}"`;
        }
        updateClockOpts();
    } else {
        if (mainArea.offsetHeight > mainArea.offsetWidth) {
            clockCanvas.style.height = 'auto';
            clockCanvas.style.width = '100%';
        } else {
            clockCanvas.style.height = '100%';
            clockCanvas.style.width = 'auto';
        }
        const clientRect = clockCanvas.getBoundingClientRect();
        clockCanvas.height = Math.round(clientRect.height * madScaleFactor * window.devicePixelRatio);
        clockCanvas.width = Math.round(clientRect.width * madScaleFactor * window.devicePixelRatio);
        if (!madDeskMover.config.clockBackgroundColor) {
            colors.background = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
        }
    }
    drawClock();
}

function updateClockOpts() {
    timeOptions = {};
    timeOptions.hour12 = !madDeskMover.config.clock24H;
    if (madDeskMover.config.clockHideSeconds) {
        timeOptions.timeStyle = 'short';
    } else {
        timeOptions.timeStyle = 'medium';
    }
}

function drawBackground() {
    clockCtx.filter = "url(#remove-alpha)";
    const radius = clockCanvas.width / 2;
    clockCtx.beginPath();
    clockCtx.arc(radius, radius, radius, 0, 2 * Math.PI);
    clockCtx.fillStyle = colors.background;
    clockCtx.fill();
}

function drawSquare(x, y) {
    const size = Math.round(clockCanvas.width / 135);
    x -= Math.round(size / 2);
    y -= Math.round(size / 2);
    clockCtx.fillStyle = colors.light;
    clockCtx.fillRect(x - 1, y - 1, size + 1, size + 2);
    clockCtx.fillStyle = colors.dkShadow;
    clockCtx.fillRect(x, y, size + 1, size + 1);
    clockCtx.fillRect(x + size, y - 1, 1, 1);
    clockCtx.fillStyle = colors.main;
    clockCtx.fillRect(x, y, size, size);
}

function drawSmallSquare(x, y) {
    clockCtx.fillStyle = colors.shadow;
    clockCtx.fillRect(x - 1, y - 1, 2, 2);
    clockCtx.fillStyle = colors.hilight;
    clockCtx.fillRect(x, y, 2, 2);
    clockCtx.fillStyle = colors.background;
    clockCtx.fillRect(x, y, 1, 1);
}

function drawNumbers() {
    const radius = clockCanvas.width / 2;
    clockCtx.translate(radius, radius);
    for(let num = 0; num < 12 * 5; num++){
      let ang = num * Math.PI / 30;
      clockCtx.rotate(ang);
      clockCtx.translate(0, -radius * 0.97);
      clockCtx.rotate(-ang);
      if (num % 5 === 0) {
        drawSquare(0, 0);
      } else {
        drawSmallSquare(0, 0);
      }
      clockCtx.rotate(ang);
      clockCtx.translate(0, radius * 0.97);
      clockCtx.rotate(-ang);
    }
}

function drawHourHand(time) {
    clockCtx.resetTransform();
    const radius = clockCanvas.width / 2;
    let minute = time.getMinutes();
    let hour = time.getHours();
    hour = hour + minute / 60;
    let angle = (Math.PI / 6) * hour - Math.PI / 2;
    angle = angle % (2 * Math.PI);
    clockCtx.beginPath();
    const startPoint = [radius - radius * 0.15 * Math.cos(angle), radius - radius * 0.15 * Math.sin(angle)]
    const narrowSide1 = [radius - radius * 0.07 * Math.cos(angle + Math.PI / 2), radius - radius * 0.07 * Math.sin(angle + Math.PI / 2)];
    const narrowSide2 = [radius - radius * 0.07 * Math.cos(angle - Math.PI / 2), radius - radius * 0.07 * Math.sin(angle - Math.PI / 2)];
    const endPoint = [radius + radius * 0.6 * Math.cos(angle), radius + radius * 0.6 * Math.sin(angle)]
    clockCtx.moveTo(startPoint[0], startPoint[1]);
    clockCtx.lineTo(narrowSide1[0], narrowSide1[1]);
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.lineTo(narrowSide2[0], narrowSide2[1]);
    clockCtx.lineTo(startPoint[0], startPoint[1]);
    clockCtx.lineWidth = 1;
    clockCtx.stroke();
    clockCtx.fillStyle = colors.main;
    clockCtx.fill();
    clockCtx.beginPath();
    clockCtx.moveTo(endPoint[0], endPoint[1]);
    clockCtx.lineTo(narrowSide2[0], narrowSide2[1]);
    clockCtx.lineTo(startPoint[0], startPoint[1]);
    const inverted = angle > invertBegin && angle < invertEnd;
    clockCtx.strokeStyle = inverted ? colors.hilight : colors.shadow;
    clockCtx.lineWidth = 2;
    clockCtx.stroke();
    clockCtx.beginPath();
    clockCtx.moveTo(startPoint[0], startPoint[1]);
    clockCtx.lineTo(narrowSide1[0], narrowSide1[1]);
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.strokeStyle = inverted ? colors.shadow : colors.hilight;
    clockCtx.lineWidth = 2;
    clockCtx.stroke();
}

function drawMinuteHand(time) {
    clockCtx.resetTransform();
    const radius = clockCanvas.width / 2;
    let minute = time.getMinutes();
    let angle = (Math.PI / 30) * minute - Math.PI / 2;
    angle = angle % (2 * Math.PI);
    clockCtx.beginPath();
    const startPoint = [radius - radius * 0.15 * Math.cos(angle), radius - radius * 0.15 * Math.sin(angle)]
    const narrowSide1 = [radius - radius * 0.05 * Math.cos(angle + Math.PI / 2), radius - radius * 0.05 * Math.sin(angle + Math.PI / 2)];
    const narrowSide2 = [radius - radius * 0.05 * Math.cos(angle - Math.PI / 2), radius - radius * 0.05 * Math.sin(angle - Math.PI / 2)];
    const endPoint = [radius + radius * 0.8 * Math.cos(angle), radius + radius * 0.8 * Math.sin(angle)]
    clockCtx.moveTo(startPoint[0], startPoint[1]);
    clockCtx.lineTo(narrowSide1[0], narrowSide1[1]);
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.lineTo(narrowSide2[0], narrowSide2[1]);
    clockCtx.lineTo(startPoint[0], startPoint[1]);
    clockCtx.lineWidth = 1;
    clockCtx.stroke();
    clockCtx.fillStyle = colors.main;
    clockCtx.fill();
    clockCtx.beginPath();
    clockCtx.moveTo(endPoint[0], endPoint[1]);
    clockCtx.lineTo(narrowSide2[0], narrowSide2[1]);
    clockCtx.lineTo(startPoint[0], startPoint[1]);
    const inverted = angle > invertBegin && angle < invertEnd;
    clockCtx.strokeStyle = inverted ? colors.hilight : colors.shadow;
    clockCtx.lineWidth = 2;
    clockCtx.stroke();
    clockCtx.beginPath();
    clockCtx.moveTo(startPoint[0], startPoint[1]);
    clockCtx.lineTo(narrowSide1[0], narrowSide1[1]);
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.strokeStyle = inverted ? colors.shadow : colors.hilight;
    clockCtx.lineWidth = 2;
    clockCtx.stroke();
}

function drawSecondHand(time) {
    clockCtx.resetTransform();
    const radius = clockCanvas.width / 2;
    let second = time.getSeconds();
    const isMultipleOf15 = second % 15 === 0;
    let angle = (Math.PI / 30) * second - Math.PI / 2;
    clockCtx.beginPath();
    clockCtx.moveTo(radius, radius);
    const endPoint = [radius + radius * 0.8 * Math.cos(angle), radius + radius * 0.8 * Math.sin(angle)]
    if (isMultipleOf15) {
        // Issue with the antialias remover filter
        // Otherwise the second hand won't be visible
        clockCtx.translate(-0.1, -0.1);
    }
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.globalCompositeOperation = 'difference';
    clockCtx.strokeStyle = 'white';
    clockCtx.lineWidth = 1;
    clockCtx.stroke();
    clockCtx.globalCompositeOperation = 'source-over';
}

function drawClock() {
    let time;
    if (madDeskMover.config.clockGMT) {
        const now = new Date();
        const offset = now.getTimezoneOffset() / 60;
        time = new Date(now.getTime() + offset * 60 * 60 * 1000);
    } else {
        time = new Date();
    }
    if (madDeskMover.config.clockDigital) {
        digitalClockTime.textContent = time.toLocaleTimeString(window.madLang, timeOptions);
        if (madDeskMover.config.clockHideDate) {
            digitalClockDate.textContent = "";
        } else {
            digitalClockDate.textContent = time.toLocaleDateString(window.madLang);
        }
        document.title = clockTitle;
    } else {
        clockCtx.clearRect(0, 0, clockCanvas.width, clockCanvas.height);
        drawBackground();
        drawNumbers();
        drawHourHand(time);
        drawMinuteHand(time);
        if (!madDeskMover.config.clockHideSeconds) {
            drawSecondHand(time);
        }
        if (madDeskMover.config.clockHideDate) {
            document.title = clockTitle;
        } else {
            document.title = clockTitle + " - " + time.toLocaleDateString(window.madLang);
        }
    }
}

function configChanged(configColors) {
    colors = configColors;
    updateSize();
}

setInterval(drawClock, 1000);

window.addEventListener("message", (event) => {
    switch (event.data.type) {
        case "scheme-updated":
            delete madDeskMover.config.clockBackgroundColor;
            if (!madDeskMover.config.clockDigital && !['98', 'custom', 'sys', undefined].includes(localStorage.madesktopColorScheme)) {
                location.reload();
            } else {
                colors.background = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
                drawClock();
            }
            break;
        case "language-ready":
            clockTitle = madGetString("CLOCK_TITLE");
            drawClock();
            break;
    }
});

window.addEventListener('resize', updateSize);
window.addEventListener('load', function () {
    if (!madDeskMover.config.clockBackgroundColor) {
        colors.background = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
    }
    updateSize();
});

document.addEventListener('click', (event) => {
    if (dblClickPositon !== null && event.clientX === dblClickPositon.x && event.clientY === dblClickPositon.y) {
        dblClickPositon = null;
        toggleTitle();
    }
    clearTimeout(dblClickTimer);
    dblClickPositon = { x: event.clientX, y: event.clientY };
    dblClickTimer = setTimeout(() => {
        dblClickPositon = null;
    }, 500);
});

function toggleTitle() {
    if (isTitleHidden) {
        menuBar.style.display = 'flex';
        mainArea.style.marginTop = '';
        document.body.classList.remove('window');
        madChangeWndStyle('wnd');
        madExtendMoveTarget(false);
        isTitleHidden = false;
    } else {
        menuBar.style.display = 'none';
        mainArea.style.marginTop = '0';
        if (madDeskMover.config.clockDigital) {
            document.body.classList.add('window');
        }
        madChangeWndStyle('noframes');
        madExtendMoveTarget(true, toggleTitle);
        isTitleHidden = true;
    }
    updateSize();
}

// Listen for scale change
new MutationObserver(function (mutations) {
    updateSize();
}).observe(
    document.body,
    { attributes: true, attributeFilter: ["style"] }
);